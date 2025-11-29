-- migrate:up
ALTER TABLE IF EXISTS files
ADD CONSTRAINT unique_file_per_user_constraint UNIQUE (path, title, owner_id);

-- migrate:down
ALTER TABLE IF EXISTS files
DROP CONSTRAINT;