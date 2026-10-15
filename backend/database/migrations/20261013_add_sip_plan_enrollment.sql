-- Apply before deploying the SIP plan metadata and installment ledger changes.
ALTER TABLE schemes
    ADD COLUMN IF NOT EXISTS plan_type varchar(255) NOT NULL DEFAULT 'FD',
    ADD COLUMN IF NOT EXISTS tenure_months integer;
    -- ADD COLUMN IF NOT EXISTS sip_amount numeric(19, 2),
    -- ADD COLUMN IF NOT EXISTS sip_day integer;

ALTER TABLE schemes_aud
    ADD COLUMN IF NOT EXISTS plan_type varchar(255),
    ADD COLUMN IF NOT EXISTS tenure_months integer;
    -- ADD COLUMN IF NOT EXISTS sip_amount numeric(19, 2),
    -- ADD COLUMN IF NOT EXISTS sip_day integer;

CREATE TABLE IF NOT EXISTS user_scheme_installments (
    user_scheme_id varchar(255) NOT NULL,
    position integer NOT NULL,
    installment_date date NOT NULL,
    due_date date NOT NULL,
    paid_date date,
    due_amount numeric(19, 2) NOT NULL,
    paid_amount numeric(19, 2) NOT NULL DEFAULT 0,
    PRIMARY KEY (user_scheme_id, position),
    CONSTRAINT fk_user_scheme_installment_scheme
        FOREIGN KEY (user_scheme_id)
        REFERENCES user_schemes (user_scheme_id)
        ON DELETE CASCADE
);
ALTER TABLE schemes ADD COLUMN plan_type VARCHAR(100);
UPDATE schemes SET plan_type = 'FD' WHERE plan_type IS NULL;
ALTER TABLE schemes ALTER COLUMN plan_type SET NOT NULL;