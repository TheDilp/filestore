use axum::{
    Extension, Router,
    body::Body,
    extract::{DefaultBodyLimit, Multipart, Path, Query, State},
    http::Response,
    routing::{delete, get, post},
};

use reqwest::header::{CONTENT_DISPOSITION, CONTENT_TYPE};

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    consts::MAX_FILE_SIZE,
    enums::{errors::AppError, file_enums::FileTypes},
    models::{
        auth::AuthSession,
        response::{AppErrorResponse, AppResponse, RouteResponse},
        state::AppState,
    },
    utils::file_utils::upload_file,
};

#[derive(Deserialize, Serialize)]
struct FileQuery {
    path: String,
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
        .prepare("INSERT INTO images (id, title, owner_id, size) VALUES ($1, $2, $3, $4);")
        .await
        .map_err(|err| AppError::db_error(err))?;

    while let Some(field) = payload
        .next_field()
        .await
        .map_err(|err| AppError::default_response(err))?
    {
        let file_id = Uuid::new_v4();
        let file_path = format!("{}/{}", &query.path, &file_id);

        let upload_result = upload_file(&state, field, &file_path).await;

        if let Ok((name, _)) = upload_result {
            let _ = tx
                .execute(&statement, &[&file_id, &name, &session.user.id])
                .await;
        }
    }

    Ok(AppResponse::default_response(vec![]))
}

async fn download_file(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Query(query): Query<FileQuery>,
) -> Result<Response<Body>, AppErrorResponse> {
    let conn = state.get_db_conn().await?;

    let row = conn
        .query_one(
            "SELECT id, title, type, category FROM files WHERE id = $1;",
            &[&id],
        )
        .await
        .map_err(AppError::critical_error)?;

    let id: Uuid = row.get("id");
    let title: String = row.get("title");
    let file_type: FileTypes = row.get("type");

    let bytes = state
        .s3_client
        .get_object()
        .bucket(&state.s3_name)
        .key(format!("{}/{}", query.path, id))
        .send()
        .await
        .map_err(|err| AppError::s3_error(err))?;

    let bytes = bytes
        .body
        .collect()
        .await
        .map_err(|err| AppError::critical_error(err))?
        .into_bytes()
        .to_vec();

    let response = Response::builder()
        .header(CONTENT_TYPE, file_type.content_type())
        .header(
            CONTENT_DISPOSITION,
            format!(
                "attachment; filename=\"{}\"",
                format_args!("{}.{}", title, file_type)
            ),
        )
        .body(bytes.into())
        .map_err(|err| AppError::critical_error(err))?;

    Ok(response)
}

async fn delete_file(
    Extension(session): Extension<AuthSession>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> RouteResponse<Uuid> {
    let mut conn = state.get_db_conn().await?;
    let tx = conn
        .transaction()
        .await
        .map_err(|err| AppError::db_error(err))?;

    let existing_row = tx
        .query_one("SELECT category FROM files WHERE id = $1;", &[&id])
        .await
        .map_err(|err| AppError::db_error(err))?;

    let category: String = existing_row.get("category");

    tx.execute(
        "DELETE FROM files WHERE id = $1 AND owner_id = $2;",
        &[&id, &session.user.id],
    )
    .await
    .map_err(|err| AppError::db_error(err))?;

    let key = format!("{}/{}", category, id);
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
                .route("/upload", post(upload_file_route))
                .route("/download/{id}", get(download_file))
                .route("/{id}", delete(delete_file)),
        )
        .layer(DefaultBodyLimit::max(MAX_FILE_SIZE))
}
