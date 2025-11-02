use strum::EnumString;

#[derive(Debug, Clone, PartialEq, EnumString)]
#[strum(serialize_all = "lowercase")]
pub enum Environment {
    Unknown,
    Development,
    Production,
}
