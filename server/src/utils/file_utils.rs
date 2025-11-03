use aws_sdk_s3::primitives::ByteStream;
use axum::extract::multipart::Field;

use crate::{
    enums::{errors::AppError, file_enums::FileTypes},
    models::state::AppState,
};

pub async fn upload_file(
    state: &AppState,
    field: Field<'_>,
    file_path: &String,
) -> Result<(String, FileTypes, i64), bool> {
    let mut size: i64 = 0;
    let mut stream = field;
    while let Some(chunk) = stream.chunk().await.map_err(|err| {
        AppError::critical_error(format!(
            "CANNOT READ FILE CHUNK | STATUS:{} | TEXT:{}",
            err.status(),
            err.body_text()
        ));
        false
    })? {
        size += chunk.len() as i64;
    }

    let content_type = stream.content_type();
    let name = stream.name().unwrap_or("unnamed").to_string();
    if name == "unnamed" {
        tracing::error!("Unnamed file SKIPPING - {}", file_path);
        return Err(false);
    }

    let content_type = content_type.unwrap().to_string();
    let data = stream.bytes().await;
    if data.is_err() {
        tracing::error!("ERROR GETTING FILE DATA - {}", data.err().unwrap());
        return Err(false);
    }

    let data = data.unwrap().to_vec();

    let body = ByteStream::from(data);

    let upload = state
        .s3_client
        .put_object()
        .bucket(&state.s3_name)
        .key(file_path)
        .body(body)
        .acl(aws_sdk_s3::types::ObjectCannedAcl::Private)
        .content_type(&content_type)
        .send()
        .await;

    if upload.is_ok() {
        Ok((name, FileTypes::from(content_type), size))
    } else {
        tracing::error!("ERROR UPLOADING FILE - {}", upload.err().unwrap());
        Err(false)
    }
}
