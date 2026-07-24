package com.growkaro.backend.common;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Year;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.function.Consumer;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;
import com.growkaro.backend.DRO.ReceiveSchemeData;
import com.growkaro.backend.DRO.UserRegister;
import com.growkaro.backend.DTO.AuthUserData;
import com.growkaro.backend.DTO.SchemeResponse;
import com.growkaro.backend.DTO.UserPortfolio;
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.entity.UserScheme.UserSchemeStatus;

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
        // user total investment amount
        List<UserScheme> totalEnrollScheme = user.getEnrolledSchemes();
        if (totalEnrollScheme != null && !totalEnrollScheme.isEmpty()) {
            // set total scheme count
            int investedSchemeCount = totalEnrollScheme.stream()
                    .filter(us -> us.getStatus() == UserSchemeStatus.ACTIVE)
                    .map(UserScheme::getScheme)
                    .map(Scheme::getSchemeName)
                    .collect(Collectors.toSet()).size();
            authUserData.setInvestedSchemeCount(investedSchemeCount);
            // set total investment
            long totalInvestment = totalEnrollScheme.stream()
                    .filter(us -> us.getStatus() == UserSchemeStatus.ACTIVE)
                    .mapToLong(UserScheme::getPaidAmount)
                    .sum();
            authUserData.setTotalInvestmentAmount(totalInvestment);

            // remaining payments
            BigDecimal remainingPayments = totalEnrollScheme.stream()
                    .filter(us -> us.getStatus() == UserSchemeStatus.ACTIVE)
                    .map(us -> {
                        BigDecimal investmentAmount = us.getScheme().getInvestmentAmount(); // BigDecimal
                        BigDecimal paidAmount = BigDecimal.valueOf(us.getPaidAmount()); // long -> BigDecimal
                        return investmentAmount.subtract(paidAmount);
                    })
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            authUserData.setRemainingPayments(remainingPayments);
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
                us.getStatus(),
                us.getBondMaturityDate(),
                us.getPaymentDates());
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
                scheme.getMaxInvestorsAllowed(),
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

    private static int daysInYear() {
        return Year.now().isLeap() ? 366 : 365;
    }

    public BigDecimal calculateMaturityAmount(Long investmentAmount, Double profitPercentage, int tenure,
            String payoutFrequency) {

        if (investmentAmount == null || investmentAmount <= 0) {
            throw new IllegalArgumentException("Investment amount must be greater than zero");
        }
        if (profitPercentage == null || profitPercentage < 0) {
            throw new IllegalArgumentException("Profit percentage must be zero or greater");
        }
        if (tenure <= 0) {
            throw new IllegalArgumentException("Tenure must be greater than zero days");
        }

        int periodDays = resolvePeriodDays(payoutFrequency);

        BigDecimal principal = BigDecimal.valueOf(investmentAmount);
        // Annual rate as a fraction, e.g. 12.0 -> 0.12
        BigDecimal annualRate = BigDecimal.valueOf(profitPercentage)
                .divide(BigDecimal.valueOf(100), MathContext.DECIMAL64);

        int daysInYear = daysInYear();

        // Rate earned over exactly one full payout period.
        BigDecimal periodRate = annualRate
                .multiply(BigDecimal.valueOf(periodDays))
                .divide(BigDecimal.valueOf(daysInYear), MathContext.DECIMAL64);
        BigDecimal growthFactor = BigDecimal.ONE.add(periodRate);

        int fullPeriods = tenure / periodDays;
        int remainderDays = tenure % periodDays;

        BigDecimal amount = principal;

        // Compound once per full payout period elapsed in the tenure.
        for (int i = 0; i < fullPeriods; i++) {
            amount = amount.multiply(growthFactor, MathContext.DECIMAL64);
        }

        // Tenure isn't always an exact multiple of the payout period — prorate
        // the leftover days at the same annual rate rather than dropping them
        // or rounding up to a full extra period.
        if (remainderDays > 0) {
            BigDecimal remainderRate = annualRate
                    .multiply(BigDecimal.valueOf(remainderDays))
                    .divide(BigDecimal.valueOf(daysInYear), MathContext.DECIMAL64);
            amount = amount.multiply(BigDecimal.ONE.add(remainderRate), MathContext.DECIMAL64);
        }

        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private int resolvePeriodDays(String payoutFrequency) {
        if (payoutFrequency == null) {
            throw new IllegalArgumentException("Payout frequency is required");
        }
        String key = payoutFrequency.trim().toLowerCase();
        if (key.equals("21 days")) {
            return 21;
        } else if (key.equals("monthly")) {
            return 30;
        } else if (key.equals("half-yearly") || key.equals("half yearly")) {
            return 182;
        } else if (key.equals("yearly")) {
            return 365;
        } else {
            throw new IllegalArgumentException("Unknown payout frequency: " + payoutFrequency);
        }
    }
}
