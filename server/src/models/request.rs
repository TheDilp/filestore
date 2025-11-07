use convert_case::Casing;
use serde::Deserialize;
use serde_json::Value;

use crate::enums::{model_enums::Models, request_enums::SortType};

use std::{
    collections::{HashMap, HashSet},
    str::FromStr,
};

use serde::Serialize;

#[derive(Serialize, Deserialize, PartialEq, Eq, Clone, Debug)]
#[serde(rename_all = "lowercase")]
pub enum FilterOperators {
    Eq,
    Neq,
    Gt,
    Lt,
    Gte,
    Lte,
    Is,
    #[serde(rename = "is not")]
    IsNot,
    Like,
    ILike,
    In,
    #[serde(rename = "not in")]
    NotIn,
}
impl std::fmt::Display for FilterOperators {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Eq => write!(f, "="),
            Self::Neq => write!(f, "!="),
            Self::Gt => write!(f, ">"),
            Self::Lt => write!(f, "<"),
            Self::Gte => write!(f, ">="),
            Self::Lte => write!(f, "<="),
            Self::Is => write!(f, "IS NOT DISTINCT FROM"),
            Self::IsNot => write!(f, "IS DISTINCT FROM"),
            Self::Like => write!(f, "LIKE"),
            Self::ILike => write!(f, "ILIKE"),
            Self::In => write!(f, "="), // * syntax is "... WHERE X = ANY(...)"
            Self::NotIn => write!(f, "!="), // * syntax is "... WHERE X != ANY(...)"
        }
    }
}

impl FromStr for FilterOperators {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "eq" => Ok(Self::Eq),
            "neq" => Ok(Self::Neq),
            "gt" => Ok(Self::Gt),
            "lt" => Ok(Self::Lt),
            "gte" => Ok(Self::Gte),
            "lte" => Ok(Self::Lte),
            "is" => Ok(Self::Is),
            "is not" => Ok(Self::IsNot),
            "like" => Ok(Self::Like),
            "ilike" => Ok(Self::ILike),
            "in" => Ok(Self::In),
            "not in" => Ok(Self::NotIn),
            _ => Err(format!("Invalid filter operator: {}", s)),
        }
    }
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Condition {
    pub field: String,
    pub operator: FilterOperators, // consider enum for operators later
    pub value: Value,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Conditions {
    #[serde(default)]
    pub and: Option<Vec<Condition>>,
    #[serde(default)]
    pub or: Option<Vec<Condition>>,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct QueryParams {
    #[serde(default = "default_page")]
    pub page: Option<i64>,
    #[serde(default = "default_limit")]
    pub limit: Option<i64>,
    #[serde(default = "default_none")]
    pub fields: Option<String>,
    #[serde(default = "default_none")]
    pub filters: Option<String>,
    #[serde(default = "default_none")]
    pub sort_field: Option<String>,
    #[serde(default = "default_sort_type")]
    pub sort_type: Option<SortType>,
    #[serde(default = "default_none")]
    pub relations: Option<String>,
    #[serde(default = "default_path")]
    pub path: String,
}

fn default_path() -> String {
    String::from("")
}

fn default_page() -> Option<i64> {
    Some(0)
}

fn default_limit() -> Option<i64> {
    Some(30)
}

fn default_none() -> Option<String> {
    None
}
fn default_sort_type() -> Option<SortType> {
    Some(SortType::Asc)
}

impl QueryParams {
    pub fn to_query_sort(&self, model: &Models) -> String {
        if self.sort_field.is_some() {
            let sort_field = self.sort_field.as_ref().unwrap();
            if sort_field.contains(".") {
                return format!(
                    "ORDER BY {} {}",
                    sort_field,
                    self.sort_type.as_ref().unwrap_or(&SortType::Asc)
                )
                .to_owned();
            } else {
                return format!(
                    "ORDER BY {}.{} {}",
                    model.to_string().to_lowercase(),
                    sort_field,
                    self.sort_type.as_ref().unwrap_or(&SortType::Asc)
                )
                .to_owned();
            }
        }
        String::from("")
    }
    pub fn filter_conditions(&self) -> Option<Conditions> {
        if let Some(filters) = &self.filters {
            let conditions = serde_json::from_str::<Conditions>(filters);
            if conditions.is_err() {
                tracing::error!(
                    "ERROR PARSING FILTER CONDITION: {}",
                    conditions.err().unwrap()
                );
                return None;
            }
            return Some(conditions.unwrap());
        }
        return None;
    }
    pub fn relations(&self) -> HashMap<String, HashSet<String>> {
        if self.relations.is_none() {
            return HashMap::new();
        }
        let relations = match &self.relations {
            Some(f) => serde_json::from_str(f.as_str()).unwrap_or(None::<Value>),
            None => None,
        };

        if relations.is_none() {
            return HashMap::new();
        }
        let blank_map = serde_json::Map::new();
        let relations = relations.unwrap();
        let relations = relations.as_object().unwrap_or(&blank_map);
        let result: HashMap<String, HashSet<String>> = relations
            .iter()
            .map(|f| {
                let values: HashSet<String> =
                    f.1.as_array()
                        .unwrap_or(&Vec::new())
                        .to_owned()
                        .iter()
                        .map(|i| i.to_string().to_case(convert_case::Case::Snake))
                        .collect::<HashSet<String>>();

                return (f.0.to_case(convert_case::Case::Snake), values);
            })
            .collect::<HashMap<String, HashSet<String>>>();

        return result;
    }
}
