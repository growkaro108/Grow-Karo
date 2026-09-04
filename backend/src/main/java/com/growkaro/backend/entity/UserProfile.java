package com.growkaro.backend.entity;

public record UserProfile(String id, String name, String email, String phone, String bankName, String accountNumber,
                String ifscCode, String accountHolderName, boolean securityAlerts,
                boolean schemeAlerts, String token,
                String bankDetailsId) {

        public static UserProfile fromEntity(User user, String token) {
                BankDetails bankDetails = user.getBankDetails();

                String bankName = null;
                String accountNumber = null;
                String ifscCode = null;
                String accountHolderName = null;
                String bankDetailsId = null;

                if (bankDetails != null) {
                        bankName = bankDetails.getBankName();
                        accountNumber = bankDetails.getAccountNumber();
                        ifscCode = bankDetails.getIfscCode();
                        accountHolderName = bankDetails.getAccountHolderName();
                        bankDetailsId = bankDetails.getBank_details_id();
                }

                return new UserProfile(user.getId(), user.getName(), user.getEmail(), user.getPhone(),
                                bankName,
                                accountNumber,
                                ifscCode,
                                accountHolderName,
                                user.isSecurityAlerts(), user.isSchemeAlerts(), token,
                                bankDetailsId);
        }

        public static UserProfile removeToken(UserProfile user) {
                return new UserProfile(user.id(), user.name(), user.email(), user.phone(),
                                user.bankName(),
                                user.accountNumber(),
                                user.ifscCode(),
                                user.accountHolderName(),
                                user.securityAlerts(), user.schemeAlerts(), null,
                                user.bankDetailsId());
        }

}
