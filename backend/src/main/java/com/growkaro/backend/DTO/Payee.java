package com.growkaro.backend.DTO;

public record Payee(String txnId, String username, String amount, String time,
        String accountHolderName, String bankName, String accountNumber, String ifscCode) {

}
