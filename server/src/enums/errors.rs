use axum::http::StatusCode;
use deadpool_redis::redis::RedisError;
use thiserror::Error;
use tokio_postgres::Error as DBError;
use tracing::{error, warn};
use uuid::Uuid;

use crate::models::response::AppErrorResponse;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("There was an error with your request.")]
    ErrorWithRequest,
    #[error("Unauthorized.")]
    Unauthorized,
    #[error("You are not permitted to perform this action.")]
    Forbidden,
    #[error("There was an error registering your account.")]
    RegistrationError,
}

impl AppError {
    #[track_caller]
    pub fn default_response(err: impl ToString) -> AppErrorResponse {
        let location = std::panic::Location::caller();
        error!(
            message = err.to_string(),
            kind = "DEFAULT ERROR RESPONSE",
            call_path = format!("{} -> {}", location.file(), location.line()),
            log_id = Uuid::new_v4().to_string()
        );

        AppErrorResponse {
            status_code: StatusCode::INTERNAL_SERVER_ERROR,
            ok: false,
            message: AppError::ErrorWithRequest.to_string(),
        }
    }
    #[track_caller]
    pub fn unauthorized_response(err: impl ToString) -> AppErrorResponse {
        let location = std::panic::Location::caller();

        warn!(
            message = err.to_string(),
            kind = "UNAUTHORIZED RESPONSE",
            call_path = format!("{} -> {}", location.file(), location.line()),
            log_id = Uuid::new_v4().to_string()
        );
        AppErrorResponse {
            status_code: StatusCode::UNAUTHORIZED,
            ok: false,
            message: AppError::Unauthorized.to_string(),
        }
    }
    #[track_caller]
    pub fn forbidden_response(err: impl ToString) -> AppErrorResponse {
        let location = std::panic::Location::caller();

        warn!(
            message = err.to_string(),
            kind = "FORBIDDEN RESPONSE",
            call_path = format!("{} -> {}", location.file(), location.line()),
            log_id = Uuid::new_v4().to_string()
        );
        AppErrorResponse {
            status_code: StatusCode::FORBIDDEN,
            ok: false,
            message: AppError::Forbidden.to_string(),
        }
    }
    #[track_caller]
    pub fn registration_response(err: impl ToString) -> AppErrorResponse {
        let location = std::panic::Location::caller();

        warn!(
            message = err.to_string(),
            kind = "REGISTRATION ERROR RESPONSE",
            call_path = format!("{} -> {}", location.file(), location.line()),
            log_id = Uuid::new_v4().to_string()
        );
        AppErrorResponse {
            status_code: StatusCode::BAD_REQUEST,
            ok: false,
            message: AppError::RegistrationError.to_string(),
        }
    }
    #[track_caller]
    pub fn db_error(err: DBError) -> AppErrorResponse {
        let location = std::panic::Location::caller();
        let db_error = err.as_db_error();
        let err_str = match db_error {
            Some(db_err) => format!("{} - {}", err, db_err),
            None => format!("{}", err),
        };
        error!(
            message = err_str,
            kind = "DATABASE ERROR",
            call_path = format!("{} -> {}", location.file(), location.line()),
            log_id = Uuid::new_v4().to_string()
        );
        AppErrorResponse {
            status_code: StatusCode::INTERNAL_SERVER_ERROR,
            ok: false,
            message: AppError::ErrorWithRequest.to_string(),
        }
    }
    #[track_caller]
    pub fn s3_error(err: impl ToString) -> AppErrorResponse {
        let location: &'static std::panic::Location<'static> = std::panic::Location::caller();
        let err_str = err.to_string();
        error!(
            message = err_str,
            kind = "S3 ERROR",
            call_path = format!("{} -> {}", location.file(), location.line()),
            log_id = Uuid::new_v4().to_string()
        );
        AppErrorResponse {
            status_code: StatusCode::INTERNAL_SERVER_ERROR,
            ok: false,
            message: AppError::ErrorWithRequest.to_string(),
        }
    }
    #[track_caller]
    pub fn dfly_error(err: RedisError) -> AppErrorResponse {
        let location = std::panic::Location::caller();
        error!(
            message = err.to_string(),
            kind = "DRAGONFLY DB ERROR",
            call_path = format!("{} -> {}", location.file(), location.line()),
            log_id = Uuid::new_v4().to_string()
        );
        AppErrorResponse {
            status_code: StatusCode::INTERNAL_SERVER_ERROR,
            ok: false,
            message: AppError::ErrorWithRequest.to_string(),
        }
    }
    #[track_caller]
    pub fn queue_error(err: impl ToString) -> AppErrorResponse {
        let location = std::panic::Location::caller();

        error!(
            message = err.to_string(),
            kind = "QUEUE ERROR",
            call_path = format!("{} -> {}", location.file(), location.line()),
            log_id = Uuid::new_v4().to_string()
        );
        AppErrorResponse {
            status_code: StatusCode::INTERNAL_SERVER_ERROR,
            ok: false,
            message: AppError::ErrorWithRequest.to_string(),
        }
    }
    #[track_caller]
    pub fn critical_error(err: impl ToString) -> AppErrorResponse {
        let location = std::panic::Location::caller();

        error!(
            message = err.to_string(),
            kind = "CRITICAL ERROR",
            call_path = format!("{} -> {}", location.file(), location.line()),
            log_id = Uuid::new_v4().to_string()
        );
        AppErrorResponse {
            status_code: StatusCode::INTERNAL_SERVER_ERROR,
            ok: false,
            message: AppError::ErrorWithRequest.to_string(),
        }
    }
}
