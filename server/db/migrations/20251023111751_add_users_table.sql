-- migrate:up
CREATE TABLE IF NOT EXISTS
    users (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid (),
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        pw_hsh TEXT NOT NULL
    );

-- migrate:down
DROP TABLE IF EXISTS users;