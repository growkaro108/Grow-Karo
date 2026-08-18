package com.growkaro.backend.DRO;

import java.util.Map;

public record UserRegister(
                String name,
                String email,
                String phone,
                String passwordHash,
                String dob,
                String maritalStatus,
                String aadharNo,
                Map<String, Object> guardian,
                Map<String, Object> address,
                Map<String, Object> nominee,
                String bankName,
                String accountHolderName,
                String accountNumber,
                String ifscCode) {

}
