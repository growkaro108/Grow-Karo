ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS payment_mode varchar(30),
    ADD COLUMN IF NOT EXISTS settlement_type varchar(20),
    ADD COLUMN IF NOT EXISTS transaction_reference varchar(100),
    ADD COLUMN IF NOT EXISTS payment_recipient varchar(100),
    ADD COLUMN IF NOT EXISTS settlement_remarks varchar(300);

ALTER TABLE transactions_aud
    ADD COLUMN IF NOT EXISTS payment_mode varchar(30),
    ADD COLUMN IF NOT EXISTS settlement_type varchar(20),
    ADD COLUMN IF NOT EXISTS transaction_reference varchar(100),
    ADD COLUMN IF NOT EXISTS payment_recipient varchar(100),
    ADD COLUMN IF NOT EXISTS settlement_remarks varchar(300);

ALTER TABLE transactions DROP CONSTRAINT transactions_type_check;

ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('GENERAL_WITHDRAWAL', 'AGGRESSIVE_WITHDRAWAL', 'DEPOSIT', 'MATURITY_WITHDRAWAL'));

ALTER TABLE transactions_aud DROP CONSTRAINT transactions_aud_type_check;

ALTER TABLE transactions_aud ADD CONSTRAINT transactions_aud_type_check 
CHECK (type IN ('GENERAL_WITHDRAWAL', 'AGGRESSIVE_WITHDRAWAL', 'DEPOSIT', 'MATURITY_WITHDRAWAL', 'PARTIAL'));

ALTER TABLE user_schemes DROP CONSTRAINT IF EXISTS user_schemes_status_check;

ALTER TABLE user_schemes ADD CONSTRAINT user_schemes_status_check 
CHECK (status IN (
    'ACTIVE', 
    'PENDING', 
    'APPROVED', 
    'REJECTED', 
    'WITHDRAWN', 
    'MATURED', 
    'SETTLEMENT_PENDING', 
    'SETTLED', 
    'REINVESTED'
));


ALTER TABLE user_schemes_aud DROP CONSTRAINT IF EXISTS user_schemes_aud_status_check;

ALTER TABLE user_schemes_aud ADD CONSTRAINT user_schemes_aud_status_check 
CHECK (status IN (
    'ACTIVE', 
    'PENDING', 
    'APPROVED', 
    'REJECTED', 
    'WITHDRAWN', 
    'MATURED', 
    'SETTLEMENT_PENDING', 
    'SETTLED', 
    'REINVESTED'
));