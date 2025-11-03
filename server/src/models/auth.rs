use serde::{Deserialize, Serialize};

use tokio_postgres::Row;
use tracing::debug;
use uuid::Uuid;
use validator::{Validate, ValidationError};

use crate::consts::PASSWORD_REGEX;

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct RegisterUser {
    #[validate(email)]
    pub email: String,
    #[validate(
        length(min = 12),
        must_match(other = "password2"),
        custom(function = "Self::validate_password")
    )]
    pub password1: String,
    #[validate(
        length(min = 12),
        must_match(other = "password1"),
        custom(function = "Self::validate_password")
    )]
    pub password2: String,
    #[validate(length(min = 8))]
    pub username: Option<String>,
    #[validate(length(min = 1))]
    pub first_name: String,
    #[validate(length(min = 2))]
    pub last_name: String,
}

impl RegisterUser {
    pub fn validate_password(password: &str) -> Result<(), ValidationError> {
        if PASSWORD_REGEX.is_match(password).unwrap_or(false) {
            Ok(())
        } else {
            Err(ValidationError::new("password_policy"))
        }
    }
}

#[derive(Deserialize)]
pub struct Credentials {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthUser {
    pub id: Uuid,
    pub username: String,
    pub first_name: String,
    pub last_name: String,
    // pub settings: Option<Value>,
}

impl AuthUser {
    pub fn from_row(row: &Row) -> Self {
        debug!("Mapping AuthUser from DB row");
        let id: Uuid = row.get("id");
        let username: String = row.get("username");
        let first_name: String = row.get("first_name");
        let last_name: String = row.get("last_name");

        Self {
            id,
            username,
            first_name,
            last_name,
        }
    }
}

#[derive(Deserialize, Serialize, Clone)]
pub struct AuthSession {
    pub user: AuthUser,
}

#[derive(Deserialize, Serialize)]
pub struct AuthInitResponse {
    pub auth_url: String,
    pub state: String, // We'll use this to lookup the code_verifier
}

#[derive(Deserialize)]
pub struct CallbackQuery {
    pub state: String,
    pub username: String,
    pub password: String,
}

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct AuthUserVerifyQuery {
    pub user_id: Uuid,
    pub code: String,
}
