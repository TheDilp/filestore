use serde::{Deserialize, Serialize};
use strum::{Display, EnumString};
use tokio_postgres::types::FromSql;

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Hash, Clone, EnumString, Display)]
#[serde(rename_all = "lowercase")]
#[strum(serialize_all = "lowercase")]
pub enum FileTypes {
    Png,
    Jpg,
    Jpeg,
    Webp,
    Gif,
    Svg,
    Pdf,
    Doc,
    Docx,
    Txt,
    Xls,
    Xlsx,
    Mp3,
    Wav,
    Ogg,
    Mp4,
    Mov,
    Avi,
    Webm,
    Zip,
    Rar,
    Json,
    Csv,
    Other(String),
}

impl From<String> for FileTypes {
    fn from(s: String) -> Self {
        match s.to_lowercase().as_str() {
            "png" | "image/png" => FileTypes::Png,
            "jpg" | "image/jpg" => FileTypes::Jpg,
            "jpeg" | "image/jpeg" => FileTypes::Jpeg,
            "webp" | "image/webp" => FileTypes::Webp,
            "gif" | "image/gif" => FileTypes::Gif,
            "svg" | "image/svg+xml" => FileTypes::Svg,
            "pdf" | "application/pdf" => FileTypes::Pdf,
            "doc" | "application/msword" => FileTypes::Doc,
            "docx" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => {
                FileTypes::Docx
            }
            "txt" | "text/plain" => FileTypes::Txt,
            "xls" | "application/vnd.ms-excel" => FileTypes::Xls,
            "xlsx" | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" => {
                FileTypes::Xlsx
            }
            "mp3" | "audio/mpeg" => FileTypes::Mp3,
            "wav" | "audio/wav" => FileTypes::Wav,
            "ogg" | "audio/ogg" => FileTypes::Ogg,
            "mp4" | "video/mp4" => FileTypes::Mp4,
            "mov" | "video/quicktime" => FileTypes::Mov,
            "avi" | "video/x-msvideo" => FileTypes::Avi,
            "webm" | "video/webm" => FileTypes::Webm,
            "zip" | "application/zip" => FileTypes::Zip,
            "rar" | "application/vnd.rar" => FileTypes::Rar,
            "json" | "application/json" => FileTypes::Json,
            "csv" | "text/csv" => FileTypes::Csv,
            name => FileTypes::Other(name.to_owned()),
        }
    }
}

impl FileTypes {
    pub fn content_type(&self) -> &'static str {
        match self {
            FileTypes::Png => "image/png",
            FileTypes::Jpg | FileTypes::Jpeg => "image/jpeg",
            FileTypes::Webp => "image/webp",
            FileTypes::Gif => "image/gif",
            FileTypes::Svg => "image/svg+xml",
            FileTypes::Pdf => "application/pdf",
            FileTypes::Doc => "application/msword",
            FileTypes::Docx => {
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            }
            FileTypes::Txt => "text/plain",
            FileTypes::Xls => "application/vnd.ms-excel",
            FileTypes::Xlsx => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            FileTypes::Mp3 => "audio/mpeg",
            FileTypes::Wav => "audio/wav",
            FileTypes::Ogg => "audio/ogg",
            FileTypes::Mp4 => "video/mp4",
            FileTypes::Mov => "video/quicktime",
            FileTypes::Avi => "video/x-msvideo",
            FileTypes::Webm => "video/webm",
            FileTypes::Zip => "application/zip",
            FileTypes::Rar => "application/vnd.rar",
            FileTypes::Json => "application/json",
            FileTypes::Csv => "text/csv",
            FileTypes::Other(_) => "application/octet-stream",
        }
    }
}

impl<'a> FromSql<'a> for FileTypes {
    fn from_sql(
        _ty: &tokio_postgres::types::Type,
        raw: &'a [u8],
    ) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {
        match std::str::from_utf8(raw)?.to_lowercase().as_str() {
            "png" => Ok(FileTypes::Png),
            "jpg" => Ok(FileTypes::Jpg),
            "jpeg" => Ok(FileTypes::Jpeg),
            "webp" => Ok(FileTypes::Webp),
            "gif" => Ok(FileTypes::Gif),
            "svg" => Ok(FileTypes::Svg),
            "pdf" => Ok(FileTypes::Pdf),
            "doc" => Ok(FileTypes::Doc),
            "docx" => Ok(FileTypes::Docx),
            "txt" => Ok(FileTypes::Txt),
            "xls" => Ok(FileTypes::Xls),
            "xlsx" => Ok(FileTypes::Xlsx),
            "mp3" => Ok(FileTypes::Mp3),
            "wav" => Ok(FileTypes::Wav),
            "ogg" => Ok(FileTypes::Ogg),
            "mp4" => Ok(FileTypes::Mp4),
            "mov" => Ok(FileTypes::Mov),
            "avi" => Ok(FileTypes::Avi),
            "webm" => Ok(FileTypes::Webm),
            "zip" => Ok(FileTypes::Zip),
            "rar" => Ok(FileTypes::Rar),
            "json" => Ok(FileTypes::Json),
            "csv" => Ok(FileTypes::Csv),
            other => Ok(FileTypes::Other(other.to_string())),
        }
    }

    fn accepts(ty: &tokio_postgres::types::Type) -> bool {
        ty == &tokio_postgres::types::Type::TEXT
    }
}
