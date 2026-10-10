package com.growkaro.backend.DTO;

public record BankDetailsResponse(
    String bankName,
    String ifscCode,
    String accountNumber,
    String accountHolderName
) {
    public static BankDetailsResponse fromEntity(com.growkaro.backend.entity.BankDetails bankDetails) {
        if (bankDetails == null) {
            return null;
        }
        return new BankDetailsResponse(
            bankDetails.getBankName(),
            bankDetails.getIfscCode(),
            bankDetails.getAccountNumber(),
            bankDetails.getAccountHolderName()
        );
    }
}
