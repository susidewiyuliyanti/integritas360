PRAGMA foreign_keys = ON;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_transactions_type_status ON transactions(type,status);
