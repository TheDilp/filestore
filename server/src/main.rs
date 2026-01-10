use std::{env::var, str::FromStr};

use aws_sdk_s3::config::{BehaviorVersion, Credentials, Region};
use axum::{
    Router,
    extract::{MatchedPath, Request},
    http::HeaderValue,
    middleware::from_fn_with_state,
};
use axum_extra::extract::cookie::Key;

use deadpool_postgres::ManagerConfig;
use deadpool_redis::{Config as DflyConfig, Runtime};
use reqwest::{
    Client, Method,
    header::{
        ACCEPT_ENCODING, ACCESS_CONTROL_ALLOW_ORIGIN, AUTHORIZATION, CACHE_CONTROL, CONNECTION,
        CONTENT_SECURITY_POLICY, CONTENT_SECURITY_POLICY_REPORT_ONLY, CONTENT_TYPE,
        SEC_WEBSOCKET_EXTENSIONS, SEC_WEBSOCKET_KEY, SEC_WEBSOCKET_PROTOCOL, SET_COOKIE, UPGRADE,
    },
};
use tokio_postgres::NoTls;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{EnvFilter, fmt, layer::SubscriberExt, util::SubscriberInitExt};

use crate::{
    enums::server_enums::Environment,
    middleware::session_middleware::session_middleware,
    models::state::AppState,
    routes::{auth_routes::auth_routes, file_routes::file_routes},
    utils::db_utils::db_init_setup,
};
mod consts;
mod enums;
mod middleware;
mod models;
mod routes;
mod traits;
mod utils;
#[tokio::main]
async fn main() {
    //* ENV vars
    let environment_env_var = var("ENVIRONMENT").expect("Env var `ENVIRONMENT` not set");
    let environment = Environment::from_str(&environment_env_var).unwrap_or(Environment::Unknown);

    //* Tracing setup
    let log_level = var("LOG_LEVEL").unwrap_or("error".to_owned());
    let filter = EnvFilter::new(log_level);
    tracing_subscriber::registry()
        .with(filter)
        .with(fmt::layer())
        .init();
    let port = var("PORT").unwrap_or(String::from("3000"));

    let server_url = var("SERVER_URL").expect("Env var `SERVER_URL` not set");
    let db_url = var("DATABASE_URL").expect("Env var `DATABASE_URL` not set");
    let client_url = var("CLIENT_URL").expect("Env var `CLIENT_URL` not set");

    let dfly_url = var("DFLY_URL").expect("Env var `DFLY_URL` not set");

    let cookie_encryption_key =
        var("COOKIE_ENCRYPTION_KEY").expect("Env var `COOKIE_ENCRYPTION_KEY` not set");

    let s3_endpoint = var("S3_ENDPOINT").expect("Env var `S3_ENDPOINT` not set");
    let s3_access_key = var("S3_ACCESS_KEY").expect("Env var `S3_ACCESS_KEY` not set");
    let s3_secret = var("S3_SECRET").expect("Env var `S3_SECRET` not set");
    let s3_name = var("S3_NAME").expect("Env var `S3_SECRET` not set");
    let s3_region = var("S3_REGION").expect("Env var `S3_REGION` not set");
    let s3_provider = var("S3_PROVIDER").expect("Env var `S3_PROVIDER` not set");
    let cdn_endpoint = var("CDN_ENDPOINT").unwrap_or(String::from(""));
    //* PG DB Config
    let mut cfg = deadpool_postgres::Config::new();
    cfg.url = Some(db_url.to_string());
    cfg.manager = Some(ManagerConfig {
        recycling_method: deadpool_postgres::RecyclingMethod::Fast,
    });
    let db_pool = cfg
        .create_pool(Some(deadpool_postgres::Runtime::Tokio1), NoTls)
        .unwrap();

    //* DFLY DB Config
    let dfly_config = DflyConfig::from_url(dfly_url);
    let dfly = dfly_config.create_pool(Some(Runtime::Tokio1)).unwrap();

    //* Auth Config
    let cookie_key = Key::from(cookie_encryption_key.as_bytes());

    //* S3 Config
    let s3_credentials = Credentials::new(s3_access_key, s3_secret, None, None, "");
    let config = aws_sdk_s3::config::Builder::new()
        .behavior_version(BehaviorVersion::latest())
        .force_path_style(true)
        .region(Region::new(s3_region.clone()))
        .endpoint_url(s3_endpoint)
        .credentials_provider(s3_credentials)
        .build();

    let s3_client = aws_sdk_s3::Client::from_conf(config);

    //* Server Config

    // Server setup

    let mut cors = CorsLayer::new()
        .allow_credentials(true)
        .allow_headers([
            AUTHORIZATION,
            ACCEPT_ENCODING,
            CONTENT_TYPE,
            SET_COOKIE,
            CACHE_CONTROL,
            CONNECTION,
            UPGRADE,
            SEC_WEBSOCKET_KEY,
            SEC_WEBSOCKET_PROTOCOL,
            SEC_WEBSOCKET_EXTENSIONS,
        ])
        .expose_headers([
            ACCESS_CONTROL_ALLOW_ORIGIN,
            SET_COOKIE,
            CONTENT_SECURITY_POLICY,
            CONTENT_SECURITY_POLICY_REPORT_ONLY,
            CACHE_CONTROL,
        ])
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::OPTIONS,
            Method::DELETE,
            Method::PATCH,
        ]);

    if environment == Environment::Production {
        cors = cors.allow_origin([HeaderValue::from_str(&client_url).unwrap()]);
    } else if environment == Environment::Development {
        let dev_origins = [
            HeaderValue::from_str(&client_url).unwrap(),
            HeaderValue::from_str("http://localhost:5173").unwrap(),
            HeaderValue::from_str("ws://localhost:5173").unwrap(),
        ];

        cors = cors.allow_origin(dev_origins);
    }
    let rqw_client = Client::new();

    let state = AppState {
        server_url,
        db_pool,
        rqw_client,
        dfly,
        cookie_key,
        s3_client,
        s3_name,
        s3_region,
        s3_provider,
        cdn_endpoint,
        environment,
    };

    let _ = db_init_setup(&state).await;

    let base_router = Router::new()
        .merge(file_routes())
        .layer(from_fn_with_state(state.clone(), session_middleware));

    let app = Router::new()
        .merge(auth_routes())
        .nest("/api/v1", base_router)
        .with_state(state)
        .layer(
            TraceLayer::new_for_http().make_span_with(|request: &Request<_>| {
                let matched_path = request
                    .extensions()
                    .get::<MatchedPath>()
                    .map(MatchedPath::as_str);

                tracing::debug_span!(
                    "REQUEST SPAN",
                    method = ?request.method(),
                    matched_path,
                    stage = tracing::field::Empty,
                    kind = tracing::field::Empty,
                    message = tracing::field::Empty,
                    call_path = tracing::field::Empty
                )
            }),
        )
        .layer(cors);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port))
        .await
        .expect("LISTENER NOT BOUND.");
    axum::serve(listener, app)
        .await
        .expect("APP COULD NOT BE SERVED.")
}
