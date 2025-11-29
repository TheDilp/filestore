-- migrate:up
CREATE INDEX IF NOT EXISTS files_title_trgm_index ON files USING GIN (title gin_trgm_ops);

-- migrate:down
DROP INDEX IF EXISTS files_title_trgm_index;