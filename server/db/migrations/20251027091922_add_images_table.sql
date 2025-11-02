-- migrate:up
CREATE TABLE IF NOT EXISTS
    images (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid (),
        title TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        owner_id UUID REFERENCES users (id) ON DELETE CASCADE
    );

-- migrate:down
DROP TABLE IF EXISTS images;