-- Enforce one reward release and one reward claim per report at the database layer.
-- Checked production data before adding these indexes; no duplicate rows were found.
CREATE UNIQUE INDEX IF NOT EXISTS uq_transactions_one_reward_claim_per_report
  ON transactions(report_id)
  WHERE type = 'claim_reward' AND report_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_transactions_one_reward_release_per_report
  ON transactions(report_id)
  WHERE type = 'reward_release' AND report_id IS NOT NULL;
