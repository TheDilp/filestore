-- migrate:up
CREATE TABLE
    IF NOT EXISTS tags (
        id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid (),
        title TEXT NOT NULL,
        color TEXT NOT NULL,
        owner_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE
    );

-- migrate:down
DROP TABLE IF EXISTS tags;