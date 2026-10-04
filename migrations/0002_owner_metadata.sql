ALTER TABLE companies ADD COLUMN metadata_json TEXT;
ALTER TABLE users ADD COLUMN metadata_json TEXT;
ALTER TABLE company_users ADD COLUMN metadata_json TEXT;
ALTER TABLE reports ADD COLUMN metadata_json TEXT;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_transactions_type_status ON transactions(type,status);