use fancy_regex::Regex;
use once_cell::sync::Lazy;

pub const DUMMY_PASSWORD: &str = "DUmMY_P@sSW0d579_0";
pub const AUTH_SESSION_TIME: i32 = 29700; // 8 hours 15 mins
pub static PASSWORD_REGEX: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$").unwrap());
pub static MAX_FILE_SIZE: Lazy<usize> = Lazy::new(|| {
    std::env::var("MAX_FILE_SIZE")
        .expect("Env var `MAX_FILE_SIZE` not found")
        .parse::<usize>()
        .expect("COULD NOT PARSE MAX_FILE_SIZE ENV VAR AS NUMBER")
});
