use std::{collections::HashSet, ops::Not, str::FromStr};

use convert_case::Casing;
use itertools::Itertools;
use jiff::Timestamp;
use serde_json::Value;
use tokio_postgres::types::ToSql;
use uuid::Uuid;

use crate::{
    enums::model_enums::Models,
    models::{
        request::{Conditions, FilterOperators},
        response::AppErrorResponse,
    },
};

#[derive(Debug)]
pub struct WhereBuilder<'a> {
    pub params: Vec<String>,
    counter: usize,
    pub model: &'a Models,
}

impl<'a> WhereBuilder<'a> {
    pub fn new(model: &'a Models, initial_count: Option<usize>) -> Self {
        WhereBuilder {
            params: Vec::new(),
            counter: initial_count.unwrap_or(0) + 1,
            model,
        }
    }

    pub fn build_where_clause(
        &mut self,
        value: Option<Conditions>,
    ) -> Result<(String, Vec<String>), AppErrorResponse> {
        if let Some(value) = value {
            let sql = self.parse_conditions(value)?;

            if sql.is_empty() {
                return Ok((String::from("FALSE"), vec![]));
            }
            Ok((sql, self.params.clone()))
        } else {
            Ok((String::from("TRUE"), vec![]))
        }
    }

    fn parse_conditions(&mut self, value: Conditions) -> Result<String, AppErrorResponse> {
        let mut final_and_conditions: Vec<String> = Vec::new();
        let mut final_or_conditions: Vec<String> = Vec::new();

        // Handle AND conditions
        if let Some(and_conditions) = value.and {
            for condition in and_conditions {
                let param: String = match condition.operator {
                    FilterOperators::In => {
                        format!("ANY(${})", self.counter)
                    }
                    FilterOperators::NotIn => {
                        format!("ALL(${})", self.counter)
                    }
                    FilterOperators::Is | FilterOperators::IsNot => {
                        if condition.value.is_null() {
                            final_and_conditions.push(format!(
                                "({}.{} {} NULL)",
                                self.model,
                                condition.field.to_case(convert_case::Case::Snake),
                                condition.operator
                            ));
                            continue;
                        }
                        format!("${}", self.counter)
                    }

                    _ => format!("${}", self.counter),
                };

                final_and_conditions.push(format!(
                    "({}.{} {} {})",
                    self.model,
                    condition.field.to_case(convert_case::Case::Snake),
                    condition.operator,
                    param
                ));
                self.counter += 1;
                self.params.push(condition.value.to_string());
            }
        }

        // Handle OR conditions
        if let Some(or_conditions) = value.or {
            for condition in or_conditions {
                let param: String = match condition.operator {
                    FilterOperators::In => {
                        format!("ANY(${})", self.counter)
                    }
                    FilterOperators::NotIn => {
                        format!("ALL(${})", self.counter)
                    }
                    FilterOperators::Is | FilterOperators::IsNot => {
                        if condition.value.is_null() {
                            final_or_conditions.push(format!(
                                "({}.{} {} NULL)",
                                self.model,
                                condition.field.to_case(convert_case::Case::Snake),
                                condition.operator
                            ));
                        }
                        format!("${}", self.counter)
                    }

                    _ => format!("${}", self.counter),
                };

                final_or_conditions.push(format!(
                    "({}.{} {} {})",
                    self.model,
                    condition.field.to_case(convert_case::Case::Snake),
                    condition.operator,
                    param
                ));
                self.counter += 1;
                self.params.push(condition.value.to_string());
            }
        }

        let mut initial_where_clause = String::from("");

        if final_and_conditions.is_empty().not() {
            let and_clause = format!("({})", final_and_conditions.join(" AND "));
            initial_where_clause.push_str(&and_clause);
        }
        if final_and_conditions.is_empty().not() && final_or_conditions.is_empty().not() {
            initial_where_clause.push_str(" AND ");
        }
        if final_or_conditions.is_empty().not() {
            let or_clause = format!("({})", final_or_conditions.join(" OR "));
            initial_where_clause.push_str(&or_clause);
        }

        Ok(initial_where_clause)
    }
}

pub fn get_select_string(model: &Models, fields: &HashSet<String>) -> String {
    fields
        .iter()
        .map(|s| {
            if s.contains(".") {
                s.to_owned()
            } else {
                format!("{}.{}", model, s)
            }
        })
        .collect::<Vec<String>>()
        .join(",")
}

pub fn format_hashset_select_string(fields: &HashSet<String>) -> String {
    fields.iter().join(", ")
}

pub fn convert_filter_type(input: &impl ToString) -> Option<Box<dyn ToSql + Sync + Send>> {
    let input = input.to_string();
    if let Ok(uuid) = Uuid::try_parse(&input) {
        Some(Box::new(uuid) as Box<dyn ToSql + Sync + Send>)
    } else if let Ok(number) = input.parse::<i64>() {
        Some(Box::new(number) as Box<dyn ToSql + Sync + Send>)
    } else if let Ok(number) = input.parse::<f64>() {
        Some(Box::new(number) as Box<dyn ToSql + Sync + Send>)
    } else if let Ok(bool_check) = input.parse::<bool>() {
        Some(Box::new(bool_check) as Box<dyn ToSql + Sync + Send>)
    } else if let Ok(value) = Value::from_str(input.as_str()) {
        match value {
            Value::Array(v) => {
                if v.is_empty() {
                    Some(Box::new(v) as Box<dyn ToSql + Sync + Send>)
                } else {
                    let first = v.first();
                    if first.is_none() {
                        return Some(Box::new(v) as Box<dyn ToSql + Sync + Send>);
                    }
                    let first = first.unwrap().as_str();
                    if first.is_none() {
                        return Some(Box::new(v) as Box<dyn ToSql + Sync + Send>);
                    }
                    let first = first.unwrap();
                    if Uuid::try_parse(first).is_ok() {
                        let formatted: Vec<Uuid> = v
                            .iter()
                            .map(|el| Uuid::from_str(el.as_str().unwrap()).unwrap())
                            .collect();
                        Some(Box::new(formatted) as Box<dyn ToSql + Sync + Send>)
                    } else if first.parse::<i64>().is_ok() {
                        let formatted: Vec<i64> = v
                            .iter()
                            .map(|el| el.to_string().parse::<i64>().unwrap())
                            .collect();
                        Some(Box::new(formatted) as Box<dyn ToSql + Sync + Send>)
                    } else {
                        let formatted: Vec<String> = v
                            .iter()
                            .map(|el| el.to_string().replace("\"", ""))
                            .collect();
                        Some(Box::new(formatted) as Box<dyn ToSql + Sync + Send>)
                    }
                }
            }
            Value::String(v) => convert_filter_type(&v),
            Value::Null => None,
            _ => Some(Box::new(value) as Box<dyn ToSql + Sync + Send>),
        }
    } else if let Ok(timestamp_check) = input.parse::<Timestamp>() {
        Some(Box::new(timestamp_check) as Box<dyn ToSql + Sync + Send>)
    } else {
        Some(Box::new(input.to_owned()) as Box<dyn ToSql + Sync + Send>)
    }
}
