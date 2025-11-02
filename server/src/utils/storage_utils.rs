use aws_sdk_s3::{
    Client,
    types::{
        BucketLifecycleConfiguration, LifecycleExpiration, LifecycleRule, LifecycleRuleFilter, Tag,
    },
};

pub async fn configure_lifecycle_rules(s3: &Client, bucket: &str) -> Result<(), aws_sdk_s3::Error> {
    let ttl_days = [1, 3, 5, 7, 14, 21, 30];

    let rules = ttl_days
        .iter()
        .map(|&days| {
            let tag = Tag::builder()
                .key("ttl")
                .value(days.to_string())
                .build()
                .unwrap();

            let filter = LifecycleRuleFilter::builder().tag(tag).build();

            LifecycleRule::builder()
                .id(format!("delete-after-{}-days", days))
                .status(aws_sdk_s3::types::ExpirationStatus::Enabled)
                .filter(filter)
                .expiration(LifecycleExpiration::builder().days(days).build())
                .build()
                .unwrap()
        })
        .collect();

    let config = BucketLifecycleConfiguration::builder()
        .set_rules(Some(rules))
        .build()?;

    s3.put_bucket_lifecycle_configuration()
        .bucket(bucket)
        .lifecycle_configuration(config)
        .send()
        .await?;

    Ok(())
}
