package com.growkaro.backend.security;

import org.springframework.stereotype.Component;

/**
 * Deprecated stub — replaced by JwtAdminTokenValidator.
 */
@Component
public class NoOpAdminTokenValidator implements AdminTokenValidator {

    @Override
    public boolean isValidAdminToken(String token) {
        return true; // TODO:it must be replace on production time
    }
}
