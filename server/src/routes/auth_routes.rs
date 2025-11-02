use std::env::var;

use argon2::Argon2;
use argon2::password_hash::{PasswordHasher, SaltString, rand_core::OsRng};
use axum::{
    Json, Router,
    extract::{Query, State},
    response::Redirect,
    routing::{get, post},
};
use axum_extra::extract::{
    PrivateCookieJar, TypedHeader,
    cookie::{Cookie, SameSite},
};

use base64::Engine;
use base64::prelude::BASE64_URL_SAFE_NO_PAD;
use deadpool_redis::redis::AsyncCommands;
use headers::Origin;
use rand::rngs::StdRng;
use rand::{Rng, SeedableRng};
use reqwest::StatusCode;

use sha2::{Digest, Sha256};
use tracing::debug;
use uuid::Uuid;
use validator::Validate;

use crate::enums::errors::AppError;
use crate::enums::server_enums::Environment;
use crate::models::auth::{
    AuthInitResponse, AuthSession, AuthUserVerifyQuery, CallbackQuery, Credentials,
};
use crate::models::response::{AppErrorResponse, AppResponse, RouteResponse};
use crate::{
    consts::AUTH_SESSION_TIME,
    models::{auth::RegisterUser, state::AppState},
};

pub fn generate_code_verifier() -> String {
    let random_bytes: Vec<u8> = (0..64).map(|_| rand::random::<u8>()).collect();
    BASE64_URL_SAFE_NO_PAD
        .encode(&random_bytes)
        .chars()
        .take(128)
        .collect()
}

pub fn generate_code_challenge(verifier: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(verifier.as_bytes());
    let result = hasher.finalize();

    BASE64_URL_SAFE_NO_PAD.encode(result)
}

async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterUser>,
) -> RouteResponse<Uuid> {
    payload.validate().map_err(|err| {
        AppError::registration_response(format!("REGISTER USER - Validation error: {}", err))
    })?;

    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    let password_hash = argon2
        .hash_password(payload.password1.as_bytes(), &salt)
        .map_err(|err| AppError::registration_response(err))?
        .to_string();

    let query = "INSERT INTO users (pw_hsh, username, first_name, last_name, is_verified) VALUES ($1, $2, $3, $4, FALSE) RETURNING id";
    let mut conn = state.get_db_conn().await?;

    let tx = conn
        .transaction()
        .await
        .map_err(|err| AppError::db_error(err))?;

    let row = tx
        .query_one(
            query,
            &[
                &password_hash,
                &payload.username,
                &payload.first_name,
                &payload.last_name,
            ],
        )
        .await
        .map_err(|err| AppError::db_error(err))?;

    let user_id: Uuid = row.get("id");

    tx.execute("INSERT INTO users_contacts (contact_type, value, user_id, is_primary) VALUES ('personal_email', $1, $2, TRUE);", &[&payload.email, &user_id])
        .await
        .map_err(|err| AppError::db_error(err))?;

    let mut code: Vec<u8> = vec![];
    let mut rng = StdRng::from_os_rng();
    for _ in 0..6 {
        code.push(rng.random_range(1..=9));
    }
    // let code_string = code
    //     .iter()
    //     .map(|n| n.to_string())
    //     .collect::<Vec<String>>()
    //     .join(" ");

    tx.commit().await.map_err(|err| AppError::db_error(err))?;

    Ok(AppResponse::default_response(user_id))
}
async fn login(
    State(state): State<AppState>,
    TypedHeader(origin): TypedHeader<Origin>,
) -> RouteResponse<AuthInitResponse> {
    let code_verifier = generate_code_verifier();
    let code_challenge = generate_code_challenge(&code_verifier);
    let state_param = Uuid::new_v4().to_string();
    let base_fe_url = var("BASE_FE_URL").expect("No ENV var `BASE_FE_URL` set");
    let mut v_conn = state.get_dfly_conn().await?;

    let redirect_uri = match state.environment {
        Environment::Development => origin.to_string(),
        Environment::Production => base_fe_url,
        Environment::Unknown => {
            return Err(AppError::critical_error(
                "UNKNOWN SERVER ENVIRONMENT - AUTH LOGIN ROUTE.",
            ));
        }
    };

    let _: () = v_conn
        .set_ex(&state_param, &code_verifier, 120)
        .await
        .map_err(|err| AppError::dfly_error(err))?;

    let auth_url = format!(
        "{:?}",
        format_args!(
            "{}?code_challenge={}&code_challenge_method=S256&redirect_uri={}&state={}",
            format!("{}/auth/login", redirect_uri),
            code_challenge,
            format!("{}/auth/callback", state.server_url),
            state_param
        )
    );
    Ok(AppResponse::default_response(AuthInitResponse {
        auth_url,
        state: state_param,
    }))
}

async fn callback(
    jar: PrivateCookieJar,
    State(state): State<AppState>,
    query: axum::extract::Query<CallbackQuery>,
) -> Result<(PrivateCookieJar, AppResponse<AuthSession>), AppErrorResponse> {
    let domain = var("DOMAIN").expect("Env var `DOMAIN` not set");
    let mut dfly_conn = state.get_dfly_conn().await?;
    let code_verifier: Option<String> = dfly_conn
        .get(&query.state)
        .await
        .map_err(|err| AppError::dfly_error(err))?;

    if code_verifier.is_none() {
        return Err(AppError::critical_error(
            "Invalid or expired state parameter",
        ));
    };

    let _: () = dfly_conn
        .del(&query.state)
        .await
        .map_err(|err| AppError::dfly_error(err))?;

    let creds = Credentials {
        username: query.username.clone(),
        password: query.password.clone(),
    };

    debug!("CREATING SESSION");
    let user_data = state.create_session(creds).await?;
    if let Some((session_id, _)) = user_data {
        debug!("CREATING DB CONNECTION");
        let mut cookie = Cookie::new("session_id", session_id.clone());
        cookie.set_same_site(match state.environment {
            Environment::Production => SameSite::Strict,
            _ => SameSite::None,
        });
        cookie.set_secure(true);
        cookie.set_http_only(true);
        cookie.set_max_age(Some(time::Duration::seconds(AUTH_SESSION_TIME.into())));
        if state.environment == Environment::Production {
            cookie.set_domain(domain);
        }
        cookie.set_path("/");
        let auth_session = state.get_session_data(&session_id).await;
        if let Ok(auth_session) = auth_session
            && auth_session.is_some()
        {
            Ok((
                jar.add(cookie),
                AppResponse::default_response(auth_session.unwrap()),
            ))
        } else {
            Err(AppError::unauthorized_response(
                "No user found OR user is not confirmed - SESSION DATA MISSING.",
            ))
        }
    } else {
        Err(AppError::unauthorized_response(
            "No user found OR user is not confirmed - SESSION ID MISSING.",
        ))
    }
}

async fn get_session_data(
    jar: PrivateCookieJar,
    State(state): State<AppState>,
) -> Result<AppResponse<AuthSession>, AppErrorResponse> {
    let session_id = jar.get("session_id");
    if session_id.is_none() {
        return Err(AppError::unauthorized_response("Cookie not found."));
    }
    let session_id = session_id.unwrap();
    let session_id = session_id.value();
    let auth_session = state.get_session_data(session_id).await?;
    if let Some(session) = auth_session {
        return Ok(AppResponse::default_response(session));
    }
    Err(AppError::unauthorized_response("No user session found."))
}

async fn verify(
    State(state): State<AppState>,
    query: Query<AuthUserVerifyQuery>,
) -> Result<Redirect, AppErrorResponse> {
    let client_url = var("CLIENT_URL").expect("No ENV var `CLIENT_URL` set");

    let mut conn = state.get_dfly_conn().await?;

    let saved_code: String = conn
        .get(query.user_id.to_string())
        .await
        .map_err(|err| AppError::dfly_error(err))?;

    let redirect_uri = match state.environment {
        Environment::Development | Environment::Production => client_url,
        Environment::Unknown => {
            return Err(AppError::critical_error(
                "UNKNOWN SERVER ENVIRONMENT - AUTH LOGIN ROUTE.",
            ));
        }
    };
    if query.code == saved_code {
        let _: () = conn
            .del(query.user_id.to_string())
            .await
            .map_err(|err| AppError::dfly_error(err))?;
        Ok(Redirect::permanent(&format!("{}/auth/login", redirect_uri)))
    } else {
        Ok(Redirect::permanent(&format!(
            "{}/auth/login?error=verify",
            &redirect_uri
        )))
    }
}

async fn logout(
    jar: PrivateCookieJar,
    State(state): State<AppState>,
) -> Result<(PrivateCookieJar, StatusCode), AppErrorResponse> {
    let mut cookie = Cookie::new("session_id", "");
    cookie.set_same_site(match state.environment {
        Environment::Production => SameSite::Strict,
        _ => SameSite::None,
    });
    cookie.set_secure(true);
    cookie.set_http_only(true);
    cookie.set_max_age(Some(time::Duration::seconds(0)));
    if state.environment == Environment::Production {
        cookie.set_domain("thearkive.app");
    }
    cookie.set_path("/");
    let session_id = jar.get("session_id");

    if session_id.is_none() {
        return Ok((jar.add(cookie), StatusCode::OK));
    }
    let session_id = session_id.unwrap().to_string();

    let data = state.get_session_data(&session_id).await?;

    if data.is_none() {
        return Ok((jar.add(cookie), StatusCode::OK));
    }
    let data = data.unwrap();
    state.invalidate_user_sessions(data.user.id).await?;

    Ok((jar.add(cookie), StatusCode::OK))
}

pub fn auth_routes() -> Router<AppState> {
    Router::new().nest(
        "/auth",
        Router::new()
            .route("/register", post(register))
            .route("/login", post(login))
            .route("/callback", get(callback))
            .route("/session", get(get_session_data))
            .route("/verify", get(verify))
            .route("/logout", get(logout)),
    )
}
