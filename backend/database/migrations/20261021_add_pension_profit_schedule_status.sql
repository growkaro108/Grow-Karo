ALTER TABLE user_scheme_profit_ledger
    ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT true;

ALTER TABLE user_scheme_profit_ledger_aud
    ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT true;
