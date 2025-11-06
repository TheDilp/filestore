use strum::EnumString;

#[derive(EnumString)]
pub enum S3Providers {
    AWS,
    DigitalOcean,
}
