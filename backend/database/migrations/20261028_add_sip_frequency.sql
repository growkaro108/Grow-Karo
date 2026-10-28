ALTER TABLE schemes
    ADD COLUMN IF NOT EXISTS sip_frequency varchar(20) NOT NULL DEFAULT 'MONTHLY',
    ADD COLUMN IF NOT EXISTS sip_amount numeric(19, 2);

ALTER TABLE user_schemes 
RENAME COLUMN contract_tenure_months TO contract_tenure_days;

ALTER TABLE schemes_aud
    ADD COLUMN IF NOT EXISTS sip_frequency varchar(20),
    ADD COLUMN IF NOT EXISTS sip_amount numeric(19, 2);

ALTER TABLE user_schemes_aud 
RENAME COLUMN contract_tenure_months TO contract_tenure_days;
