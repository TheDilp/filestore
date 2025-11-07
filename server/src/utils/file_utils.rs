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
    is_public: &bool,
) -> Result<(String, FileTypes, i64), bool> {
    let mut size: i64 = 0;
    let mut data = Vec::new();
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
        data.extend_from_slice(&chunk);
    }

    let content_type = stream.content_type();

    tracing::debug!("UPLOADING FILE TYPE ========> {:?}", content_type);

    let name = stream.file_name().unwrap_or("unnamed").to_string();
    if name == "unnamed" {
        tracing::error!("Unnamed file SKIPPING - {}", file_path);
        return Err(false);
    }

    let content_type = content_type.unwrap().to_string();
    let body = ByteStream::from(data);

    let upload = state
        .s3_client
        .put_object()
        .bucket(&state.s3_name)
        .key(file_path)
        .body(body)
        .acl(match is_public {
            true => aws_sdk_s3::types::ObjectCannedAcl::PublicRead,
            false => aws_sdk_s3::types::ObjectCannedAcl::Private,
        })
        .content_type(&content_type)
        .send()
        .await;

    if upload.is_ok() {
        Ok((name, FileTypes::from_mime(content_type.as_str()), size))
    } else {
        tracing::error!("ERROR UPLOADING FILE - {}", upload.err().unwrap());
        Err(false)
    }
}
