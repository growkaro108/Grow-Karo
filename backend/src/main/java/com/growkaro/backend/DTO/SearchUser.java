package com.growkaro.backend.DTO;

public record SearchUser(
        String userId,
        String fullName,
        String email,
        String phone) {
}