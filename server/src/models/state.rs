use argon2::{Argon2, PasswordHash, PasswordVerifier};
use aws_sdk_s3::Client as S3Client;
use axum::extract::FromRef;
use axum_extra::extract::cookie::Key;

use deadpool_postgres::{Object, Pool};
use deadpool_redis::redis::AsyncCommands;
use deadpool_redis::{Connection, Pool as DflyPool};
use rand::Rng;
use rand::distr::Alphanumeric;
use reqwest::Client as ReqwestClient;
use tracing::debug;
use uuid::Uuid;

use crate::consts::{AUTH_SESSION_TIME, DUMMY_PASSWORD};
use crate::enums::errors::AppError;
use crate::enums::server_enums::Environment;
use crate::models::auth::{AuthSession, AuthUser, Credentials};
use crate::models::response::AppErrorResponse;

#[derive(Clone)]
pub struct AppState {
    pub server_url: String,
    pub db_pool: Pool,
    pub rqw_client: ReqwestClient,
    pub dfly: DflyPool,
    pub cookie_key: Key,
    pub s3_client: S3Client,
    pub s3_name: String,
    pub environment: Environment,
}

impl AppState {
    pub async fn get_dfly_conn(&self) -> Result<Connection, AppErrorResponse> {
        tracing::debug!("ESTABLISHING DRAGONFLY CONNECTION");
        let conn = self
            .dfly
            .get()
            .await
            .map_err(|e| AppError::critical_error(e))?;

        Ok(conn)
    }

    pub async fn get_db_conn(&self) -> Result<Object, AppErrorResponse> {
        tracing::debug!("ESTABLISH POSTGRES DB CONNECTION");
        let connection = self
            .db_pool
            .get()
            .await
            .map_err(|e| AppError::critical_error(e))?;

        Ok(connection)
    }

    pub async fn create_session(
        &self,
        creds: Credentials,
    ) -> Result<Option<(String, AuthUser)>, AppErrorResponse> {
        let mut v_conn = self.get_dfly_conn().await?;

        let pg_conn = self.get_db_conn().await?;

        debug!("QUERYING USER BY USERNAME");
        let result = pg_conn
            .query_opt(
                "SELECT
                    users.id, users.username, users.first_name,
                    users.last_name, users.image_id, users.pw_hsh,
                    users.is_verified
                FROM
                    users
                WHERE
                    username = $1;",
                &[&creds.username],
            )
            .await
            .map_err(|err| AppError::unauthorized_response(err))?;

        if let Some(row) = result {
            let is_verified: bool = row.get("is_verified");
            if !is_verified {
                let parsed_hash = PasswordHash::new(DUMMY_PASSWORD).map_err(|e| {
                    tracing::error!("ERROR CREATING PASSWORD HASH - {}", e.to_string());
                    AppError::default_response(e.to_string())
                })?;

                let _ = Argon2::default()
                    .verify_password(creds.password.as_bytes(), &parsed_hash)
                    .is_ok();

                return Ok(None);
            }
            let pw_hash: String = row.get("pw_hsh");
            let parsed_hash = PasswordHash::new(&pw_hash).map_err(|e| {
                tracing::error!("ERROR CREATING PASSWORD HASH - {}", e.to_string());
                AppError::default_response(e.to_string())
            })?;

            let pass_verified = Argon2::default()
                .verify_password(creds.password.as_bytes(), &parsed_hash)
                .is_ok();
            if pass_verified {
                let user = AuthUser::from_row(&row);

                let session_id: String = rand::rng()
                    .sample_iter(&Alphanumeric)
                    .take(32) // 32-character random session ID
                    .map(char::from)
                    .collect();

                let _: () = v_conn
                    .set_ex(
                        &session_id,
                        serde_json::json!({"user":user}).to_string(),
                        AUTH_SESSION_TIME as u64,
                    )
                    .await
                    .map_err(|err| AppError::unauthorized_response(err))?;

                let user_key = format!("user_sessions:{}", user.id);
                let _: () = v_conn
                    .sadd(user_key, &session_id)
                    .await
                    .map_err(|err| AppError::dfly_error(err))?;

                Ok(Some((session_id, user)))
            } else {
                Ok(None)
            }
        } else {
            tracing::error!("USER NOT FOUND");
            let parsed_hash = PasswordHash::new(DUMMY_PASSWORD).map_err(|e| {
                tracing::error!("ERROR CREATING PASSWORD HASH - {}", e.to_string());
                AppError::default_response(e.to_string())
            })?;

            let _ = Argon2::default()
                .verify_password(creds.password.as_bytes(), &parsed_hash)
                .is_ok();

            Ok(None)
        }
    }

    pub async fn invalidate_user_sessions(&self, user_id: Uuid) -> Result<(), AppErrorResponse> {
        let mut conn = self.get_dfly_conn().await?;
        let user_key = format!("user_sessions:{}", user_id);

        let session_ids: Vec<String> = conn
            .smembers(&user_key)
            .await
            .map_err(|err| AppError::dfly_error(err))?;

        for session_id in session_ids {
            let key = format!("sessions:{}", session_id);
            let _: () = conn
                .del(key)
                .await
                .map_err(|err| AppError::dfly_error(err))?;
        }

        let _: () = conn
            .del(user_key)
            .await
            .map_err(|err| AppError::dfly_error(err))?;

        Ok(())
    }

    pub async fn get_session_data(
        &self,
        id: &str,
    ) -> Result<Option<AuthSession>, AppErrorResponse> {
        let mut v_conn = self.get_dfly_conn().await?;

        let data: Option<String> = v_conn
            .get(id)
            .await
            .map_err(|err| AppError::unauthorized_response(err))?;

        if let Some(session) = data {
            let auth_session = serde_json::from_str::<AuthSession>(&session)
                .map_err(|err| AppError::unauthorized_response(err))?;

            return Ok(Some(auth_session));
        }

        Ok(None)
    }

    pub async fn delete_session_data(&self, id: String) -> Result<bool, AppErrorResponse> {
        let mut v_conn = self.get_dfly_conn().await?;

        let _: () = v_conn
            .del(id)
            .await
            .map_err(AppError::unauthorized_response)?;

        Ok(true)
    }
}

// this impl tells `PrivateCookieJar` how to access the key from our state
impl FromRef<AppState> for Key {
    fn from_ref(state: &AppState) -> Self {
        state.cookie_key.clone()
    }
}
