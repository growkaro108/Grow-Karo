package com.growkaro.backend.DRO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Setter
@Getter
@ToString
public class RemitterCredentials {
    @NotEmpty(message = "Login ID is required...")
    private String loginId;

    @NotEmpty(message = "Password is required...")
    private String password;

    @NotEmpty(message = "Email is required...")
    @Email(message = "Enter valid Email..")
    private String email;

    @NotEmpty(message = "Remitter Id is required...")
    private String remitterId;

}