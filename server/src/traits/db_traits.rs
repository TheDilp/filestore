use jiff::{Timestamp, civil::DateTime, tz::TimeZone};
use serde_json::{Map, Value, json};
use std::str::FromStr;
use tokio_postgres::{Row, types::Type};
use uuid::Uuid;

use crate::utils::format_utils::camel_case_keys;

pub trait SerializeToJson {
    fn serialize_row_to_json(self) -> Value;
}

pub trait SerializeList {
    fn serialize_list(self) -> Value;
}

impl SerializeToJson for Row {
    fn serialize_row_to_json(self) -> Value {
        let mut map = Map::new();
        for (col_idx, column) in self.columns().iter().enumerate() {
            let column_name = column.name();
            let value: Value = match column.type_() {
                &Type::UUID => {
                    let uuid: Option<Uuid> = self.get(col_idx);
                    uuid.map_or(Value::Null, |u| Value::String(u.to_string()))
                }
                &Type::TEXT => {
                    let text: Option<String> = self.get(col_idx);
                    text.map_or(Value::Null, |t| Value::String(t.to_string()))
                }
                &Type::TIMESTAMPTZ => {
                    let timestamp: Option<Timestamp> = self.get(col_idx);
                    timestamp.map_or(Value::Null, |t| {
                        Value::String(t.to_zoned(TimeZone::UTC).to_string())
                    })
                }
                &Type::DATE => {
                    let date: Option<DateTime> = self.get(col_idx);
                    date.unwrap_or_default().to_string().into()
                }
                &Type::INT2 => {
                    let int: Option<i16> = self.get(col_idx);
                    int.map_or(Value::Null, |i| Value::Number(i.into()))
                }
                &Type::INT4 => {
                    let int: Option<i32> = self.get(col_idx);
                    int.map_or(Value::Null, |i| Value::Number(i.into()))
                }
                &Type::INT8 => {
                    let int: Option<i64> = self.get(col_idx);
                    int.map_or(Value::Null, |i| Value::Number(i.into()))
                }
                // &Type::NUMERIC => {
                //     let dec: Option<Decimal> = self.get(col_idx);
                //     dec.map_or(Value::Null, |i| {
                //         Value::Number(
                //             serde_json::Number::from_f64(i.to_f64().unwrap_or_default())
                //                 .unwrap_or(serde_json::Number::from_f64(0.0).unwrap()),
                //         )
                //     })
                // }
                &Type::FLOAT4 => {
                    let dec: Option<f32> = self.get(col_idx);
                    dec.map_or(Value::Null, |i| {
                        Value::Number(
                            serde_json::Number::from_str(i.to_string().as_str())
                                .unwrap_or(serde_json::Number::from_str("0").unwrap()),
                        )
                    })
                }
                &Type::FLOAT8 => {
                    let dec: Option<f64> = self.get(col_idx);
                    dec.map_or(Value::Null, |i| {
                        Value::Number(
                            serde_json::Number::from_str(i.to_string().as_str())
                                .unwrap_or(serde_json::Number::from_str("0").unwrap()),
                        )
                    })
                }
                &Type::BOOL => {
                    let bool_value: Option<bool> = self.get(col_idx);
                    bool_value.map_or(Value::Null, |b| Value::Bool(b.into()))
                }
                &Type::JSON | &Type::JSONB => {
                    let json_value: Option<Value> = self.get(col_idx);
                    json_value.map_or(Value::Null, |j| j)
                }
                _ => Value::Null,
            };
            map.insert(column_name.to_string(), value);
        }
        camel_case_keys(Value::Object(map))
    }
}

impl SerializeList for Vec<Row> {
    fn serialize_list(self) -> Value {
        let mut values = json!([]);
        let values = values.as_array_mut().unwrap();

        for row in self {
            values.push(row.serialize_row_to_json());
        }

        let values = json!(values.to_vec());

        return values;
    }
}
