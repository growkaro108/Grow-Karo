ALTER TABLE user_schemes
    ADD COLUMN IF NOT EXISTS contract_total_interest_percentage double precision,
    ADD COLUMN IF NOT EXISTS contract_tenure_months integer;

ALTER TABLE user_schemes_aud
    ADD COLUMN IF NOT EXISTS contract_total_interest_percentage double precision,
    ADD COLUMN IF NOT EXISTS contract_tenure_months integer;
