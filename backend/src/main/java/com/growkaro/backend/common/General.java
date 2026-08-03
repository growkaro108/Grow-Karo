package com.growkaro.backend.common;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.function.Consumer;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import com.growkaro.backend.DRO.ReceiveSchemeData;
import com.growkaro.backend.DRO.UserRegister;
import com.growkaro.backend.DTO.AuthUserData;
import com.growkaro.backend.DTO.SchemeResponse;
import com.growkaro.backend.DTO.UserPortfolio;
import com.growkaro.backend.DTO.UserRequest;
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.UserProfile;
import com.growkaro.backend.entity.UserScheme;

@Component
public class General {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    @Value("${frontend.url}")
    private String baseUrl;

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
        // password should be at least 8 characters long and at most 64 characters long
        // password should contain at least one uppercase letter
        // password should contain at least one lowercase letter
        // password should contain at least one digit
        // password should contain at least one special character
        // password should not contain any whitespace
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
        // user total investment amount
        List<UserScheme> totalEnrollScheme = user.getEnrolledSchemes();
        if (totalEnrollScheme != null && !totalEnrollScheme.isEmpty()) {
            // set total scheme count
            int investedSchemeCount = totalEnrollScheme.stream()
                    .filter(us -> us.getIsApproved())
                    .map(UserScheme::getScheme)
                    .map(Scheme::getSchemeName)
                    .collect(Collectors.toSet()).size();
            authUserData.setInvestedSchemeCount(investedSchemeCount);
            // set total investment +profit pending
            BigDecimal totalInvestment = totalEnrollScheme.stream()
                    .filter(us -> us.getIsApproved())
                    .map(UserScheme::getPaidAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            authUserData.setTotalInvestmentAmount(totalInvestment);

        } else {
            authUserData.setTotalInvestmentAmount(BigDecimal.ZERO);
        }

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
        scheme.setMinimumAmount(schemeData.minimumAmount());
        scheme.setStatus(schemeData.status());
        scheme.setRiskLevel(schemeData.riskLevel());
        scheme.setProfitPercentage(schemeData.profitPercentage());
        scheme.setMaxInvestorsAllowed(schemeData.maxInvestorsAllowed());
        return scheme;
    }

    public UserPortfolio toUserPortfolio(UserScheme us) {
        Scheme scheme = us.getScheme();
        return new UserPortfolio(
                scheme.getSchemeId(),
                scheme.getSchemeName(),
                scheme.getTenure(),
                scheme.getPayoutFrequency(),
                scheme.getProfitPercentage(),
                us.getEnrollmentDate(),
                us.getBondImageURL(),
                us.getBondNumber(),
                us.getRequestDate(),
                us.getUserSchemeId(),
                us.getPaidAmount(),
                us.getIsApproved(),
                us.getProfit(),
                us.getNextPayoutDate(),
                us.getPaidDate());
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
                scheme.getMinimumAmount(),
                scheme.getProfitPercentage(),
                scheme.getMaxInvestorsAllowed(),
                scheme.getUpdatedAt(),
                scheme.getRiskLevel(),
                scheme.getJoinedUsers().stream().map(UserScheme::getUserSchemeId).toList());
    }

    public <T> void applyIfChanged(T newValue, T oldValue, Consumer<T> setter) {
        if (newValue != null && !newValue.equals(oldValue)) {
            setter.accept(newValue);
        }
    }

    public LocalDate calculateMaturityDate(LocalDate startDate, int tenure) {
        return startDate.plusDays(tenure);
    }

    public BigDecimal calculateProfit(BigDecimal paidAmount, Double profitpercentage, BigDecimal minimumAmount) {
        if (paidAmount == null || paidAmount.compareTo(minimumAmount) < 0) {
            throw new IllegalArgumentException("Paid amount must be greater than or equal to minimum amount");
        }
        if (profitpercentage == null || profitpercentage < 0) {
            throw new IllegalArgumentException("Profit percentage must be zero or greater");
        }
        BigDecimal profit = paidAmount.multiply(BigDecimal.valueOf(profitpercentage / 100));
        return profit.setScale(2, RoundingMode.HALF_UP);
    }

    public int resolvePeriodDays(String payoutFrequency) {
        if (payoutFrequency == null) {
            throw new IllegalArgumentException("Payout frequency is required");
        }

        String key = payoutFrequency.trim().toLowerCase();

        return switch (key) {
            case "21 days" -> 21;
            case "monthly" -> 30;
            case "quarterly" -> 90;
            case "half-yearly", "half yearly" -> 182;
            case "yearly" -> 365;
            default -> throw new IllegalArgumentException("Unknown payout frequency: " + payoutFrequency);
        };
    }

    public LocalDate calculateNextPayoutDate(LocalDateTime enrollmentDate, String payoutFrequency) {
        int periodDays = resolvePeriodDays(payoutFrequency);
        // convert to local date
        LocalDate enrollmentLocalDate = enrollmentDate.toLocalDate();
        return enrollmentLocalDate.plusDays(periodDays);
    }

    public UserRequest toUserRequest(UserScheme us) {
        Scheme s = us.getScheme();
        User u = us.getUser();
        return new UserRequest(us.getUserSchemeId(), us.getPaidAmount(), us.getEnrollmentDate(),
                us.getIsApproved(),
                us.getRequestDate(), us.getBondImageURL(), s.getSchemeName(), u.getName(),
                u.getEmail(), u.getPhone());
    }

    public LocalDate getCurrentDate() {
        return LocalDate.now(ZoneId.of("Asia/Kolkata"));
    }

    public LocalDateTime getCurrentDateTime() {
        return LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
    }

    public String generateResetLink(String email, String userId) {
        return baseUrl + "/reset/" + email + "-" + userId;
    }

    public boolean isValidId(String id) {
        Pattern idPattern = Pattern.compile("^GKUSID\\d{14}$");
        Pattern newidPattern = Pattern.compile("^GKUID\\d{14}$");
        if (id == null) {
            return false;
        }
        return idPattern.matcher(id).matches() || newidPattern.matcher(id).matches();
    }

    public UserProfile toUserProfile(User user) {
        return new UserProfile(user.getName(), user.getEmail(), user.getPhone(), user.getBankDetails());
    }
}
