-- migrate:up
CREATE TABLE IF NOT EXISTS
    files (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid (),
        title TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE,
        owner_id UUID REFERENCES users (id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        size INT8 NOT NULL DEFAULT 0,
        path TEXT NOT NULL
    );

-- migrate:down
DROP TABLE IF EXISTS files;