use std::{str::FromStr, time::Duration};

use aws_sdk_s3::presigning::PresigningConfig;
use axum::{
    Extension, Json, Router,
    body::Body,
    extract::{DefaultBodyLimit, Multipart, Path, Query, State},
    http::Response,
    routing::{delete, get, post},
};

use reqwest::header::{CONTENT_DISPOSITION, CONTENT_LENGTH, CONTENT_TYPE};

use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio_postgres::types::ToSql;
use tokio_util::io::ReaderStream;
use tracing::debug;
use uuid::Uuid;

use crate::{
    consts::MAX_FILE_SIZE,
    enums::{
        errors::AppError, file_enums::FileTypes, model_enums::Models, storage_enums::S3Providers,
    },
    models::{
        auth::AuthSession,
        request::QueryParams,
        response::{AppErrorResponse, AppResponse, RouteResponse},
        state::AppState,
    },
    traits::db_traits::SerializeList,
    utils::{
        db_utils::{WhereBuilder, convert_filter_type},
        file_utils::upload_file,
    },
};

fn default_path() -> String {
    String::from("")
}

fn default_public() -> bool {
    false
}

#[derive(Deserialize, Serialize)]
struct FileQuery {
    #[serde(default = "default_path")]
    path: String,
    #[serde(default = "default_public")]
    is_public: bool,
    #[serde(default = "default_public")]
    is_folder: bool,
}

impl FileQuery {
    fn format_path(&self) -> String {
        if self.path.is_empty() {
            String::from("")
        } else {
            format!("{}/", self.path)
        }
    }
}

#[derive(Deserialize)]
struct InsertFolder {
    title: String,
}

async fn upload_file_route(
    State(state): State<AppState>,
    Extension(session): Extension<AuthSession>,
    Query(query): Query<FileQuery>,
    mut payload: Multipart,
) -> RouteResponse<Vec<Uuid>> {
    let mut conn = state.get_db_conn().await?;
    let tx = conn
        .transaction()
        .await
        .map_err(|err| AppError::db_error(err))?;

    let statement = tx
        .prepare(
            "INSERT INTO files (id, title, owner_id, size, type, path, is_public)
        VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (path, title, owner_id) DO NOTHING;",
        )
        .await
        .map_err(|err| AppError::db_error(err))?;

    debug!("WHILE LOOP FOR FIELDS");

    while let Some(field) = payload
        .next_field()
        .await
        .map_err(|err| AppError::default_response(err))?
    {
        debug!("ENTERED WHILE LOOP FOR FIELDS");
        let field_name = field.name().unwrap_or_default();
        if field_name.is_empty() {
            continue;
        }
        let file_id = Uuid::new_v4();
        let title = field
            .file_name()
            .map(|s| s.to_string())
            .unwrap_or(file_id.to_string());

        if field_name.ends_with(".tags") {
            let mut tag_statement = String::from("INSERT INTO tags (owner_id, title) VALUES ");
            let tags = field.text().await;

            if let Ok(tags) = tags {
                if tags.is_empty() {
                    continue;
                }
                let tags: Result<Vec<String>, serde_json::Error> = serde_json::from_str(&tags);

                if tags.is_err() {
                    tracing::error!("ERROR PARSING TAGS - {}", tags.err().unwrap());
                    continue;
                }

                let tags = tags.unwrap();
                let tag_count = tags.len();
                let mut inputs = vec![session.user.id.to_string()];
                for (idx, tag) in tags.into_iter().enumerate() {
                    tag_statement.push_str(&format!("($1, ${})", idx + 2));
                    if idx < tag_count - 1 {
                        tag_statement.push_str(", ");
                    }
                    if idx == tag_count - 1 {
                        tag_statement.push_str(" ON CONFLICT (title, owner_id) DO NOTHING;");
                    }
                    inputs.push(String::from(tag.trim()));
                }

                let inputs_dyn: Vec<Box<dyn ToSql + Sync + Send>> = inputs
                    .iter()
                    .filter_map(convert_filter_type)
                    .collect::<Vec<_>>();

                let inputs_dyn = inputs_dyn
                    .iter()
                    .map(|input| input.as_ref() as &(dyn ToSql + Sync))
                    .collect::<Vec<_>>();

                tx.execute(&tag_statement, &inputs_dyn)
                    .await
                    .map_err(|err| AppError::db_error(err))?;
                continue;
            } else if tags.is_err() {
                tracing::error!("ERROR PARSING TAGS - {}", tags.err().unwrap());
                continue;
            }
            continue;
        }

        let file_path = format!("{}{}", &query.format_path(), &title);

        debug!("BEGIN FILE UPLOAD");
        let upload_result = upload_file(&state, field, &title, &file_path, &query.is_public).await;
        debug!("END FILE UPLOAD");
        if let Ok((file_type, size)) = upload_result {
            //TODO: Optimize by using batch insert
            let db_result = tx
                .execute(
                    &statement,
                    &[
                        &file_id,
                        &title,
                        &session.user.id,
                        &size,
                        &file_type.to_string(),
                        &query.path,
                        &query.is_public,
                    ],
                )
                .await;

            if db_result.is_err() {
                AppError::db_error(db_result.err().unwrap());

                let upload = state
                    .s3_client
                    .delete_object()
                    .bucket(&state.s3_name)
                    .key(file_path)
                    .send()
                    .await
                    .map_err(|err| AppError::s3_error(err));
                if upload.is_err() {
                    continue;
                }
            }
        } else {
            continue;
        }
    }

    tx.commit().await.map_err(|err| AppError::db_error(err))?;
    Ok(AppResponse::default_response(vec![]))
}

async fn create_folder_route(
    State(state): State<AppState>,
    Extension(session): Extension<AuthSession>,
    Query(query): Query<FileQuery>,
    Json(payload): Json<InsertFolder>,
) -> RouteResponse<Uuid> {
    let conn = state.get_db_conn().await?;

    let statement = "INSERT INTO files (id, title, owner_id, size, type, path, is_public)
        VALUES ($1, $2, $3, 0, 'folder', $4, $5);";
    let folder_id = Uuid::new_v4();
    let _ = conn
        .execute(
            statement,
            &[
                &folder_id,
                &payload.title,
                &session.user.id,
                &query.path,
                &query.is_public,
            ],
        )
        .await
        .map_err(|err| AppError::db_error(err));
    Ok(AppResponse::default_response(folder_id))
}

async fn download_file(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Query(query): Query<FileQuery>,
) -> Result<Response<Body>, AppErrorResponse> {
    let conn = state.get_db_conn().await?;

    let row = conn
        .query_one(
            "SELECT id, created_at, title, type FROM files WHERE id = $1;",
            &[&id],
        )
        .await
        .map_err(|err| AppError::db_error(err))?;

    let title: String = row.get("title");
    let file_type: FileTypes = row.get("type");

    let resp = state
        .s3_client
        .get_object()
        .bucket(&state.s3_name)
        .key(format!("{}{}", &query.format_path(), title))
        .send()
        .await
        .map_err(|err| AppError::s3_error(err))?;

    let content_length = resp.content_length().unwrap_or(0);
    let stream = resp.body.into_async_read();
    let reader_stream = ReaderStream::new(stream);

    let body = Body::from_stream(reader_stream);

    let response = Response::builder()
        .header(CONTENT_TYPE, file_type.content_type())
        .header(CONTENT_LENGTH, content_length)
        .header(
            CONTENT_DISPOSITION,
            format!("attachment; filename=\"{}.{}\"", title, file_type),
        )
        .body(body)
        .map_err(|err| AppError::critical_error(err))?;
    Ok(response)
}

async fn generate_link(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> RouteResponse<String> {
    let conn = state.get_db_conn().await?;

    let row = conn
        .query_one("SELECT title, path FROM files WHERE id = $1;", &[&id])
        .await
        .map_err(|err| AppError::db_error(err))?;
    let path: Option<String> = row.get("path");
    let title: String = row.get("title");

    let provider =
        S3Providers::from_str(&state.s3_provider).map_err(|err| AppError::critical_error(err))?;
    let link = match provider {
        S3Providers::DigitalOcean => format!(
            "https://{bucket}.{region}.cdn.digitaloceanspaces.com/{path}{id}",
            bucket = state.s3_name,
            region = state.s3_region,
            path = path
                .map(|p| match p.is_empty() {
                    true => p,
                    false => format!("{}/", p),
                })
                .unwrap_or_default(),
            id = title
        ),
        S3Providers::AWS => {
            let p = state
                .s3_client
                .get_object()
                .bucket(state.s3_name)
                .presigned(PresigningConfig::expires_in(Duration::from_secs(3600)).unwrap())
                .await
                .map_err(|err| AppError::s3_error(err))?;

            p.uri().to_owned()
        }
    };

    Ok(AppResponse::default_response(link))
}

async fn list_files(
    State(state): State<AppState>,
    Extension(session): Extension<AuthSession>,
    Query(query): Query<QueryParams>,
) -> RouteResponse<Value> {
    let conn = state.get_db_conn().await?;
    let filters = query.filter_conditions();
    let query_sort = query.to_query_sort(&crate::enums::model_enums::Models::Files);

    let sort = match query_sort.is_empty() {
        true => "ORDER BY type = 'folder' desc",
        false => &query_sort.replace("ORDER BY", "ORDER BY type = 'folder' desc, "),
    };
    let mut sql_params = vec![query.path, session.user.id.to_string()];

    let mut builder = WhereBuilder::new(&Models::Files, Some(sql_params.len()));
    let (filter_where, filter_params) = builder.build_where_clause(filters)?;
    sql_params.extend(filter_params);
    let inputs_dyn: Vec<Box<dyn ToSql + Sync + Send>> = sql_params
        .iter()
        .filter_map(convert_filter_type)
        .collect::<Vec<_>>();

    let inputs_dyn = inputs_dyn
        .iter()
        .map(|input| input.as_ref() as &(dyn ToSql + Sync))
        .collect::<Vec<_>>();

    let stmt = format!(
        "
        SELECT id, created_at, title, type, size, is_public, path
        FROM files
        WHERE
            path = $1
                AND
            owner_id = $2
                AND
            {where_clause}
        {sort}
        LIMIT 25
        OFFSET 0;",
        where_clause = filter_where,
        sort = sort
    );

    let rows = conn
        .query(&stmt, &inputs_dyn)
        .await
        .map_err(|err| AppError::db_error(err))?;

    Ok(AppResponse::default_response(rows.serialize_list()))
}

async fn delete_file(
    Extension(session): Extension<AuthSession>,
    State(state): State<AppState>,
    Query(query): Query<FileQuery>,
    Path(id): Path<Uuid>,
) -> RouteResponse<Uuid> {
    let mut conn = state.get_db_conn().await?;
    let tx = conn
        .transaction()
        .await
        .map_err(|err| AppError::db_error(err))?;

    tx.execute(
        "DELETE FROM files WHERE id = $1 AND owner_id = $2;",
        &[&id, &session.user.id],
    )
    .await
    .map_err(|err| AppError::db_error(err))?;

    let key = format!("{}{}", &query.format_path(), id);
    state
        .s3_client
        .delete_object()
        .bucket(&state.s3_name)
        .key(&key)
        .send()
        .await
        .map_err(|err| AppError::s3_error(err))?;

    tx.commit().await.map_err(|err| AppError::db_error(err))?;

    Ok(AppResponse::default_response(id))
}

pub fn file_routes() -> Router<AppState> {
    Router::new()
        .nest(
            "/files",
            Router::new()
                .route("/create/folder", post(create_folder_route))
                .route("/upload", post(upload_file_route))
                .route("/read/{id}/link", get(generate_link))
                .route("/download/{id}", get(download_file))
                .route("/list", get(list_files))
                .route("/delete/{id}", delete(delete_file)),
        )
        .layer(DefaultBodyLimit::max(*MAX_FILE_SIZE))
}
