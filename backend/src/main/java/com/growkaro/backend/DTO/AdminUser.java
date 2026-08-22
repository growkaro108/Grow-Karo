package com.growkaro.backend.DTO;

import java.util.List;

public record AdminUser(
        String userId,
        String name,
        String email,
        String phone,
        boolean isActive,
        List<UserSchemeResponse> enrolledSchemes) {

}
