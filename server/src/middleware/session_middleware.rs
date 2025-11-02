use axum::{
    body::Body,
    extract::{Request, State},
    http::Response,
    middleware::Next,
};
use axum_extra::extract::PrivateCookieJar;

use crate::{
    enums::errors::AppError,
    models::{response::AppErrorResponse, state::AppState},
};

pub async fn session_middleware(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
    mut request: Request,
    next: Next,
) -> Result<Response<Body>, AppErrorResponse> {
    let session_id = jar.get("session_id");

    if session_id.is_none() {
        return Err(AppError::unauthorized_response(
            "No session_id cookie found.",
        ));
    }
    let session_id = session_id.unwrap();
    let session_id = session_id.value();

    let session = state.get_session_data(session_id).await?;

    if session.is_none() {
        return Err(AppError::unauthorized_response(
            "No session with session_id found.",
        ));
    }
    let session = session.unwrap();

    request.extensions_mut().insert(session);

    let response = next.run(request).await;
    Ok(response)
}
