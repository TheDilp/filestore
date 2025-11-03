use convert_case::Casing;
use serde_json::Value;

pub fn camel_case_keys(value: Value) -> Value {
    match value {
        Value::Object(map) => {
            let transformed_map: serde_json::Map<String, Value> = map
                .into_iter()
                .map(|(key, val)| (key.to_case(convert_case::Case::Camel), camel_case_keys(val)))
                .collect();
            Value::Object(transformed_map)
        }
        Value::Array(arr) => Value::Array(arr.into_iter().map(camel_case_keys).collect()),
        other => other,
    }
}
