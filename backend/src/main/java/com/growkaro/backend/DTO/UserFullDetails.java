package com.growkaro.backend.DTO;

import com.growkaro.backend.entity.BankDetails;
import com.growkaro.backend.entity.Guardian;
import com.growkaro.backend.entity.User;

public record UserFullDetails(String name,
        String maritalStatus, String address,
        String phone, String gaurdianName,
        String dob, String email,
        String aadhaarNo,
        // String nomineeName,
        // String nomineeRelation,String nomineeMobile,

        String accountNo, String ifsc, String bankName,
        String accountHolderName) {
    public static UserFullDetails fromEntity(User u) {
        if (u == null) {
            return null;
        }
        Guardian g = u.getGuardian();
        BankDetails bkd = u.getBankDetails();

        java.util.List<String> addressParts = new java.util.ArrayList<>();
        if (u.getStreet() != null && !u.getStreet().isBlank()) addressParts.add(u.getStreet().trim());
        if (u.getVillage() != null && !u.getVillage().isBlank()) addressParts.add(u.getVillage().trim());
        if (u.getCity() != null && !u.getCity().isBlank()) addressParts.add(u.getCity().trim());
        if (u.getPincode() != null && !u.getPincode().isBlank()) addressParts.add(u.getPincode().trim());
        String fullAddress = String.join(", ", addressParts);

        String dob = "";
        if (u.getDob() != null) {
            try {
                dob = u.getDob().format(java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy"));
            } catch (Exception ignored) {
                dob = u.getDob().toString();
            }
        }

        String guardianName = (g != null && g.getName() != null) ? g.getName() : "";
        String accountNo = (bkd != null && bkd.getAccountNumber() != null) ? bkd.getAccountNumber() : "";
        String ifsc = (bkd != null && bkd.getIfscCode() != null) ? bkd.getIfscCode() : "";
        String bankName = (bkd != null && bkd.getBankName() != null) ? bkd.getBankName() : "";
        String accountHolderName = (bkd != null && bkd.getAccountHolderName() != null) ? bkd.getAccountHolderName() : "";

        return new UserFullDetails(
                u.getName() != null ? u.getName() : "",
                u.getMaritalStatus() != null ? u.getMaritalStatus() : "",
                fullAddress,
                u.getPhone() != null ? u.getPhone() : "",
                guardianName,
                dob,
                u.getEmail() != null ? u.getEmail() : "",
                u.getAadharNo() != null ? u.getAadharNo() : "",
                accountNo,
                ifsc,
                bankName,
                accountHolderName);
    }

}
