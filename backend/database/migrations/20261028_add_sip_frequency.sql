ALTER TABLE schemes
    ADD COLUMN IF NOT EXISTS sip_frequency varchar(20) NOT NULL DEFAULT 'MONTHLY',
    ADD COLUMN IF NOT EXISTS sip_amount numeric(19, 2);

ALTER TABLE user_schemes ADD COLUMN contract_tenure_days INTEGER;

ALTER TABLE schemes_aud
    ADD COLUMN IF NOT EXISTS sip_frequency varchar(20),
    ADD COLUMN IF NOT EXISTS sip_amount numeric(19, 2);

ALTER TABLE user_schemes_aud ADD COLUMN contract_tenure_days INTEGER;
