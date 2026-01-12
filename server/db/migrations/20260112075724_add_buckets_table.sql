-- migrate:up
CREATE TABLE IF NOT EXISTS
    buckets (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid (),
        title TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        owner_id UUID NOT NULL REFERENCES users (id) ON DELETE SET NULL
    );

-- migrate:down
DROP TABLE IF EXISTS buckets;