use strum::EnumString;

#[derive(Debug, Clone, PartialEq, EnumString)]
pub enum Environment {
    Unknown,
    Development,
    Production,
}
