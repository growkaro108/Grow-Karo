CREATE TABLE IF NOT EXISTS user_scheme_daily_deposits (
    user_scheme_id varchar(255) NOT NULL,
    position integer NOT NULL,
    deposit_date date NOT NULL,
    deposit_amount numeric(19, 2) NOT NULL,
    PRIMARY KEY (user_scheme_id, position),
    CONSTRAINT fk_user_scheme_daily_deposits_user_scheme
        FOREIGN KEY (user_scheme_id) REFERENCES user_schemes (user_scheme_id) ON DELETE CASCADE
);
