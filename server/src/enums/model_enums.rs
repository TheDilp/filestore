#[derive(strum::Display, Debug)]
#[strum(serialize_all = "snake_case")]
pub enum Models {
    Users,
    Files,
    Buckets,
}
