use serde::Deserialize;
use strum::Display;

#[derive(Debug, Deserialize, Clone, Display, Default)]
#[serde(rename_all = "lowercase")]
pub enum SortType {
    #[default]
    Asc,
    Desc,
}

impl From<String> for SortType {
    fn from(value: String) -> Self {
        match value.as_str() {
            "asc" => Self::Asc,
            "desc" => Self::Desc,
            _ => Self::Asc,
        }
    }
}
