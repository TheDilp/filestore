use axum::{
    Extension, Router,
    extract::{Path, Query, State},
    routing::{delete, get},
};

use serde_json::Value;
use tokio_postgres::types::ToSql;
use uuid::Uuid;

use crate::{
    enums::{errors::AppError, model_enums::Models},
    models::{
        auth::AuthSession,
        request::QueryParams,
        response::{AppResponse, RouteResponse},
        state::AppState,
    },
    traits::db_traits::SerializeList,
    utils::db_utils::{WhereBuilder, convert_filter_type},
};

async fn list_buckets(
    State(state): State<AppState>,
    Extension(session): Extension<AuthSession>,
    Query(query): Query<QueryParams>,
) -> RouteResponse<Value> {
    let conn = state.get_db_conn().await?;
    let filters = query.filter_conditions();
    let query_sort = query.to_query_sort(&crate::enums::model_enums::Models::Buckets);

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
        SELECT id, title
        FROM buckets
        WHERE
            owner_id = $1
                AND
            {where_clause}
        {sort}
        LIMIT 25
        OFFSET 0;",
        where_clause = filter_where,
        sort = query_sort
    );

    let rows = conn
        .query(&stmt, &inputs_dyn)
        .await
        .map_err(|err| AppError::db_error(err))?;

    Ok(AppResponse::default_response(rows.serialize_list()))
}

async fn delete_bucket(
    Extension(session): Extension<AuthSession>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> RouteResponse<Uuid> {
    let mut conn = state.get_db_conn().await?;
    let tx = conn
        .transaction()
        .await
        .map_err(|err| AppError::db_error(err))?;

    tx.execute(
        "DELETE FROM buckets WHERE id = $1 AND owner_id = $2;",
        &[&id, &session.user.id],
    )
    .await
    .map_err(|err| AppError::db_error(err))?;

    state
        .s3_client
        .delete_bucket()
        .bucket(&state.s3_name)
        .send()
        .await
        .map_err(|err| AppError::s3_error(err))?;

    tx.commit().await.map_err(|err| AppError::db_error(err))?;

    Ok(AppResponse::default_response(id))
}

pub fn bucket_routes() -> Router<AppState> {
    Router::new().nest(
        "/buckets",
        Router::new()
            // .route("/create", post())
            // .route("/upload", post(upload_file_route))
            // .route("/read/{id}/link", get(generate_link))
            // .route("/download/{id}", get(download_file))
            .route("/list", get(list_buckets))
            .route("/delete/{id}", delete(delete_bucket)),
    )
}
