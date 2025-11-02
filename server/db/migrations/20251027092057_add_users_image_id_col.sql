-- migrate:up
ALTER TABLE IF EXISTS users
ADD COLUMN image_id UUID REFERENCES images (id) ON DELETE SET NULL;

-- migrate:down
ALTER TABLE IF EXISTS users
DROP COLUMN IF EXISTS image_id;