use axum::{
    body::Body,
    http::{Response, StatusCode},
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};

use crate::enums::errors::AppError;

#[derive(Deserialize, Serialize, Debug)]
pub struct AppResponse<T> {
    pub data: Option<T>,
    pub ok: bool,
    pub message: String,
    #[serde(skip_serializing, skip_deserializing)]
    pub status_code: StatusCode,
}

impl<T> AppResponse<T> {
    pub fn default_response(data: T) -> Self {
        Self {
            data: Some(data),
            ok: true,
            message: String::from("Success."),
            status_code: StatusCode::OK,
        }
    }
}

impl<T> IntoResponse for AppResponse<T>
where
    T: Serialize + Send + 'static,
{
    fn into_response(self) -> axum::response::Response {
        let json_body = serde_json::to_string(&self)
            .map_err(|err| AppError::critical_error(err))
            .unwrap();

        Response::builder()
            .status(self.status_code)
            .header("Content-Type", "application/json")
            .body(Body::from(json_body))
            .map_err(AppError::default_response)
            .unwrap()
    }
}

#[derive(Serialize, Debug)]
pub struct AppErrorResponse {
    pub ok: bool,
    pub message: String,
    #[serde(skip_serializing)]
    pub status_code: StatusCode,
}

impl IntoResponse for AppErrorResponse {
    fn into_response(self) -> axum::response::Response {
        let json_body = serde_json::to_string(&self)
            .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)
            .unwrap();

        Response::builder()
            .status(self.status_code)
            .header("Content-Type", "application/json")
            .body(Body::from(json_body))
            .map_err(AppError::default_response)
            .unwrap()
    }
}

pub type RouteResponse<T> = Result<AppResponse<T>, AppErrorResponse>;
