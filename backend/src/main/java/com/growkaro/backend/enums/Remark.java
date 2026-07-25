package com.growkaro.backend.enums;

public enum Remark {
    SIGNUP("signup"),
    LOGIN("login"),
    FORGOT_PASSWORD("forgotPassword"),
    RESET_PASSWORD("resetPassword");

    private final String value;

    Remark(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
