package com.growkaro.backend.DRO;

public record UserRegister(String name,
        String email,
        String phone,
        String passwordHash,
        String bankName,
        String accountHolderName,
        String accountNumber,
        String ifscCode) {

}
