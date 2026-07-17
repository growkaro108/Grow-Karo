package com.growkaro.backend.common;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Random;
import java.util.function.Consumer;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;
import com.growkaro.backend.DRO.ReceiveSchemeData;
import com.growkaro.backend.DRO.UserRegister;
import com.growkaro.backend.DTO.AuthUserData;
import com.growkaro.backend.DTO.SchemeResponse;
import com.growkaro.backend.DTO.UserPortfolio;
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.UserScheme;

@Component
public class General {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    public boolean validateEmail(String email) {
        return email != null && EMAIL_PATTERN.matcher(email).matches();
    }

    // generate exactly 6 digit otp
    public String generate6DigitOTP() {
        Random rand = new Random();
        int number = 100000 + rand.nextInt(900000);
        return String.valueOf(number);
    }

    public UserRegister toUserRegister(Map<String, Object> payload) {
        String name = stringValue(payload.get("name"));
        if (name == null) {
            String firstName = stringValue(payload.get("firstName"));
            String lastName = stringValue(payload.get("lastName"));
            name = String.join(" ", firstName == null ? "" : firstName, lastName == null ? "" : lastName).trim();
            if (name.isBlank()) {
                name = null;
            }
        }

        String passwordHash = stringValue(payload.get("passwordHash"));
        if (passwordHash == null) {
            passwordHash = stringValue(payload.get("password"));
        }

        return new UserRegister(
                name,
                stringValue(payload.get("email")),
                stringValue(payload.get("phone")),
                passwordHash,
                stringValue(payload.get("bankName")),
                stringValue(payload.get("accountHolderName")),
                stringValue(payload.get("accountNumber")),
                stringValue(payload.get("ifscCode")));
    }

    public String stringValue(Object value) {
        if (value == null) {
            return null;
        }
        String text = value.toString().trim();
        return text.isEmpty() ? null : text;
    }

    public boolean validatePassword(String password) {
        Pattern PASSWORD_PATTERN = Pattern
                .compile("^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[!@#$%^&*(),.?\":{}|<>])(?=\\S+$).{8,64}$");
        return password != null && PASSWORD_PATTERN.matcher(password).matches();
    }

    public Map<String, Object> response(String status, String message, Object data) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", status);
        response.put("message", message);
        response.put("data", data != null ? data : Map.of());
        return response;
    }

    public AuthUserData toAuthUserData(User user) {
        AuthUserData authUserData = new AuthUserData();
        authUserData.setId(user.getId());
        authUserData.setName(user.getName());
        authUserData.setEmail(user.getEmail());
        authUserData.setPhone(user.getPhone());
        return authUserData;
    }

    public Scheme toScheme(ReceiveSchemeData schemeData) {
        Scheme scheme = new Scheme();
        scheme.setSchemeName(schemeData.schemeName());
        scheme.setSchemeCategory(schemeData.schemeCategory());
        scheme.setSchemeDetails(schemeData.schemeDetails());
        scheme.setPayoutFrequency(schemeData.payoutFrequency());
        scheme.setTenure(schemeData.tenure());
        scheme.setStartDate(schemeData.startDate());
        scheme.setEndDate(schemeData.endDate());
        scheme.setStatus(schemeData.status());
        scheme.setInvestmentAmount(schemeData.investmentAmount());
        scheme.setProfitPercentage(schemeData.profitPercentage());
        scheme.setMaturityValue(schemeData.maturityValue());
        scheme.setMaxInvestorsAllowed(schemeData.maxInvestorsAllowed());
        return scheme;
    }

    public UserPortfolio toUserPortfolio(UserScheme us) {
        Scheme scheme = us.getScheme();
        return new UserPortfolio(
                scheme.getSchemeId(),
                scheme.getSchemeName(),
                scheme.getInvestmentAmount(),
                scheme.getTenure(),
                scheme.getPayoutFrequency(),
                scheme.getProfitPercentage(),
                scheme.getMaturityValue(),
                us.getEnrollmentDate(),
                us.getBondImageURL(),
                us.getBondNumber(),
                us.getRequestDate(),
                us.getUserSchemeId(),
                us.getPaidAmount(),
                us.getIsApproved(),
                us.getStatus());
    }

    public SchemeResponse toSchemeResponse(Scheme scheme) {
        return new SchemeResponse(
                scheme.getSchemeId(),
                scheme.getSchemeName(),
                scheme.getSchemeCategory(),
                scheme.getSchemeDetails(),
                scheme.getPayoutFrequency(),
                scheme.getTenure(),
                scheme.getStartDate(),
                scheme.getEndDate(),
                scheme.getStatus(),
                scheme.getInvestmentAmount(),
                scheme.getProfitPercentage(),
                scheme.getMaturityValue(),
                scheme.getMaxInvestorsAllowed());
    }

    public <T> void applyIfChanged(T newValue, T oldValue, Consumer<T> setter) {
        if (newValue != null && !newValue.equals(oldValue)) {
            setter.accept(newValue);
        }
    }

    public LocalDate calculateMaturityDate(LocalDate startDate, int tenure) {
        return startDate.plusDays(tenure);
    }
}
