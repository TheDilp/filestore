use aws_sdk_s3::primitives::ByteStream;
use axum::extract::multipart::Field;

use crate::{enums::file_enums::FileTypes, models::state::AppState};

pub async fn upload_file(
    state: &AppState,
    field: Field<'_>,
    file_path: &String,
) -> Result<(String, FileTypes), bool> {
    let content_type = field.content_type();
    let name = field.name().unwrap_or("unnamed").to_string();
    if name == "unnamed" {
        tracing::error!("Unnamed file SKIPPING - {}", file_path);
        return Err(false);
    }
    let content_type = content_type.unwrap().to_string();
    let data = field.bytes().await;
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
        Ok((name, FileTypes::from(content_type)))
    } else {
        tracing::error!("ERROR UPLOADING FILE - {}", upload.err().unwrap());
        Err(false)
    }
}
