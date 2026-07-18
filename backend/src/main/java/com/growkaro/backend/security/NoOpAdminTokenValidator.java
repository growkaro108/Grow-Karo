package com.growkaro.backend.security;

import org.springframework.stereotype.Component;

/**
 * TEMPORARY stub — always allows the connection.
 *
 * ⚠️ Replace with a real implementation before production. This feed
 * exposes user names, withdrawal amounts, KYC status, etc. — anyone with
 * the URL can watch it live while this is active.
 */
@Component
public class NoOpAdminTokenValidator implements AdminTokenValidator {

    @Override
    public boolean isValidAdminToken(String token) {
        return true; // TODO:it must be replace on production time
    }
}
