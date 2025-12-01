-- migrate:up
CREATE TABLE
    IF NOT EXISTS tags (
        id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid (),
        title TEXT NOT NULL,
        owner_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE (title, owner_id)
    );

-- migrate:down
DROP TABLE IF EXISTS tags;