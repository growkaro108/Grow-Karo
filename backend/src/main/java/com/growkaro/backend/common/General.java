package com.growkaro.backend.common;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.function.Consumer;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import com.growkaro.backend.DRO.ReceiveSchemeData;
import com.growkaro.backend.DRO.UserRegister;
import com.growkaro.backend.DTO.Payee;
import com.growkaro.backend.DTO.UserRequest;
import com.growkaro.backend.entity.BankDetails;
import com.growkaro.backend.entity.Recipient;
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.Transaction;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.entity.UserSchemeProfitLedger;
import com.growkaro.backend.entity.UserSchemeReedemLedger;
import com.growkaro.backend.entity.UserSchemeReedemLedger.ReedeemStatus;
import com.growkaro.backend.repository.ReedemLedgerRepository;
import com.growkaro.backend.repository.UserRepository;
import com.growkaro.backend.security.JwtService;
import com.growkaro.backend.service.RedisService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class General {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    public static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd-MM-yyyy");
    private static final int DEFAULT_PAGE_SIZE = 5;
    @Value("${frontend.url}")
    private String baseUrl;

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private RedisService redisService;
    @Autowired
    private ReedemLedgerRepository reedemLedgerRepository;

    public boolean isValidId(String id) {
        Pattern idPattern = Pattern.compile("^GKUSID\\d{14}$");
        Pattern newidPattern = Pattern.compile("^GKUID\\d{14}$");
        if (id == null) {
            return false;
        }
        return idPattern.matcher(id).matches() || newidPattern.matcher(id).matches();
    }

    public boolean validateEmail(String email) {
        return email != null && !email.trim().isEmpty() && email.length() <= 100
                && EMAIL_PATTERN.matcher(email).matches();
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

    public boolean isValidSchemeId(String schemeId) {
        Pattern pattern = Pattern.compile("^GKSID\\d{14}$");
        return pattern.matcher(schemeId).matches();

    }

    public boolean isValidUserSchemeId(String userSchemeId) {
        Pattern pattern = Pattern.compile("^GKUSID\\d{14}$");
        return pattern.matcher(userSchemeId).matches();

    }

    // generate exactly 6 digit otp
    public String generate6DigitOTP() {
        Random rand = new Random();
        int number = 100000 + rand.nextInt(900000);
        return String.valueOf(number);
    }

    private final java.util.concurrent.atomic.AtomicLong lastIdTimestamp = new java.util.concurrent.atomic.AtomicLong(
            0);

    public synchronized String generateUserId() {
        long now = Long.parseLong(LocalDateTime.now(ZoneId.of("Asia/Kolkata"))
                .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        long idNum = lastIdTimestamp.updateAndGet(prev -> Math.max(now, prev + 1));
        return "GKUID" + idNum;
    }

    public LocalDate parseDob(String dobStr) {
        if (dobStr == null || dobStr.isBlank()) {
            return null;
        }
        dobStr = dobStr.trim();
        List<DateTimeFormatter> formatters = List.of(
                DateTimeFormatter.ISO_LOCAL_DATE, // yyyy-MM-dd
                DateTimeFormatter.ofPattern("dd-MM-yyyy"),
                DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                DateTimeFormatter.ofPattern("d-M-yyyy"),
                DateTimeFormatter.ofPattern("d/M/yyyy"));
        for (DateTimeFormatter formatter : formatters) {
            try {
                return LocalDate.parse(dobStr, formatter);
            } catch (Exception ignored) {
            }
        }
        throw new IllegalArgumentException(
                "Invalid date format for DOB: " + dobStr + ". Expected YYYY-MM-DD or DD-MM-YYYY");
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

        Map<String, Object> guardian = asMap(payload.get("guardian"));
        if (guardian == null) {
            String gName = stringValue(payload.get("guardian.name"));
            if (gName == null)
                gName = stringValue(payload.get("guardianName"));
            String gRel = stringValue(payload.get("guardian.relation"));
            if (gRel == null)
                gRel = stringValue(payload.get("guardianRelation"));
            if (gName != null || gRel != null) {
                guardian = new LinkedHashMap<>();
                if (gName != null)
                    guardian.put("name", gName);
                if (gRel != null)
                    guardian.put("relation", gRel);
            }
        }

        Map<String, Object> address = asMap(payload.get("address"));
        if (address == null) {
            String street = stringValue(payload.get("address.street"));
            if (street == null)
                street = stringValue(payload.get("street"));
            String village = stringValue(payload.get("address.village"));
            if (village == null)
                village = stringValue(payload.get("village"));
            String city = stringValue(payload.get("address.city"));
            if (city == null)
                city = stringValue(payload.get("city"));
            String state = stringValue(payload.get("address.state"));
            if (state == null)
                state = stringValue(payload.get("state"));
            String pincode = stringValue(payload.get("address.pincode"));
            if (pincode == null)
                pincode = stringValue(payload.get("pincode"));
            if (street != null || village != null || city != null || state != null || pincode != null) {
                address = new LinkedHashMap<>();
                if (street != null)
                    address.put("street", street);
                if (village != null)
                    address.put("village", village);
                if (city != null)
                    address.put("city", city);
                if (state != null)
                    address.put("state", state);
                if (pincode != null)
                    address.put("pincode", pincode);
            }
        }

        Map<String, Object> nominee = asMap(payload.get("nominee"));
        if (nominee == null) {
            String nName = stringValue(payload.get("nominee.name"));
            if (nName == null)
                nName = stringValue(payload.get("nomineeName"));
            String nAadhar = stringValue(payload.get("nominee.aadharNo"));
            if (nAadhar == null)
                nAadhar = stringValue(payload.get("nomineeAadharNo"));
            String nPhone = stringValue(payload.get("nominee.mobileNo"));
            if (nPhone == null)
                nPhone = stringValue(payload.get("nomineeMobileNo"));
            if (nPhone == null)
                nPhone = stringValue(payload.get("nominee.phone"));
            String nRel = stringValue(payload.get("nominee.relation"));
            if (nRel == null)
                nRel = stringValue(payload.get("nomineeRelation"));
            if (nName != null || nAadhar != null || nPhone != null || nRel != null) {
                nominee = new LinkedHashMap<>();
                if (nName != null)
                    nominee.put("name", nName);
                if (nAadhar != null)
                    nominee.put("aadharNo", nAadhar);
                if (nPhone != null)
                    nominee.put("mobileNo", nPhone);
                if (nRel != null)
                    nominee.put("relation", nRel);
            }
        }

        return new UserRegister(
                name,
                stringValue(payload.get("email")),
                stringValue(payload.get("phone")),
                passwordHash,
                stringValue(payload.get("dob")),
                stringValue(payload.get("maritalStatus")),
                stringValue(payload.get("aadharNo")),
                guardian,
                address,
                nominee,
                stringValue(payload.get("bankName")),
                stringValue(payload.get("accountHolderName")),
                stringValue(payload.get("accountNumber")),
                stringValue(payload.get("ifscCode")));
    }

    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> converted = new LinkedHashMap<>();
            map.forEach((key, val) -> converted.put(String.valueOf(key), val));
            return converted;
        }
        return null;
    }

    public String stringValue(Object value) {
        if (value == null) {
            return null;
        }
        String text = value.toString().trim();
        return text.isEmpty() ? null : text;
    }

    public Integer intValue(Object value) {
        if (value == null) {
            return null;
        }
        String text = value.toString().trim();
        return text.isEmpty() ? null : Integer.parseInt(text);
    }

    public Map<String, Object> response(String status, String message, Object data) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", status);
        response.put("message", message);
        response.put("data", data != null ? data : Map.of());
        return response;
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
        scheme.setMaximumAmount(schemeData.maximumAmount());
        scheme.setStatus(schemeData.status());
        scheme.setRiskLevel(schemeData.riskLevel());
        scheme.setProfitPercentage(schemeData.profitPercentage());
        scheme.setMaxInvestorsAllowed(schemeData.maxInvestorsAllowed());
        scheme.setCreatedBy(adminName());
        return scheme;
    }

    public <T> void applyIfChanged(T newValue, T oldValue, Consumer<T> setter) {
        if (newValue != null && !newValue.equals(oldValue)) {
            setter.accept(newValue);
        }
    }

    public LocalDate calculateMaturityDate(LocalDateTime startDate, int tenure) {
        LocalDate date = startDate.toLocalDate();
        return date.plusDays(tenure);
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

    public int resolvePeriodDays(String payoutFrequency, int tenure) {
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
            case "tenure-complete", "tenure complete" -> tenure;
            default -> throw new IllegalArgumentException("Unknown payout frequency: " + payoutFrequency);
        };
    }

    public LocalDate calculateNextPayoutDate(LocalDateTime enrollmentDate, String payoutFrequency, int tenure) {
        int periodDays = resolvePeriodDays(payoutFrequency, tenure);
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

    public String generateResetLink(String userId) {
        return baseUrl + "/reset/" + userId + "_user";
    }

    public String loginUrl() {
        return baseUrl + "/auth";
    }

    public String generateResetLinkForRemitter(String remitterId) {
        return baseUrl + "/reset/" + remitterId + "_rem";
    }

    public User getUserById(String userId) {
        if (userId == null || userId.isBlank()) {
            return null;
        }
        if (!isValidId(userId)) {
            throw new IllegalArgumentException("Invalid user ID");
        }
        return userRepository.findById(userId).orElse(null);
    }

    public Payee toPayee(Transaction request) {
        BankDetails bd = request.getBankDetails();
        return new Payee(
                request.getId(),
                request.getUser().getName(),
                request.getAmount().toPlainString(),
                request.getUpdatedAt().format(DATE_FORMATTER),
                request.getProofUrl() != null && !request.getProofUrl().isBlank() ? request.getProofUrl()
                        : null,
                request.getSettlementDate() != null
                        ? request.getSettlementDate().format(DATE_FORMATTER)
                        : "Not Yet Settled",
                bd.getAccountHolderName(),
                bd.getBankName(),
                bd.getAccountNumber(),
                bd.getIfscCode(),
                request.getCreatedAt().format(DATE_FORMATTER));
    }

    public Recipient toRecipient(List<Transaction> userTransactions) {
        Transaction latest = userTransactions.get(0); // newest, per the pre-sorted query
        User user = latest.getUser();

        List<Recipient.Transfer> transfers = userTransactions.stream()
                .map(t -> new Recipient.Transfer(
                        t.getId(),
                        t.getAmount(),
                        t.getCreatedAt(),
                        t.getBankDetails().getBankName(),
                        t.getBankDetails().getAccountNumber(),
                        t.getBankDetails().getIfscCode(),
                        t.getBankDetails().getAccountHolderName()))
                .toList();

        return new Recipient(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                transfers);
    }

    public String generateToken(String userId, String email, String role) {
        return jwtService.generateToken(userId, email, role);
    }

    public String adminName() {
        String name = redisService.getValue("malik").toString();
        if (name == null || name.isEmpty()) {
            return null;
        }
        return name;
    }

    public String adminId() {
        Object id = redisService.getValue("malikID");
        if (id == null || id.toString().isBlank()) {
            return "Admin";
        }
        return id.toString();
    }

    public BigDecimal countProfit(List<UserSchemeProfitLedger> profitLedger) {
        return profitLedger.stream()
                .map(UserSchemeProfitLedger::getProfitAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal countReedem(List<UserSchemeReedemLedger> reedemLedgers) {
        return reedemLedgers.stream()
                .filter(reedemLedger -> reedemLedger.getStatus() == UserSchemeReedemLedger.ReedeemStatus.COMPLETED)
                .map(UserSchemeReedemLedger::getRedeemAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public boolean changeReedemStatus(UserScheme u, BigDecimal amount, ReedeemStatus status) {
        UserSchemeReedemLedger reedemLedger = reedemLedgerRepository
                .findByUserSchemeAndRedeemAmount(u, amount).orElse(null);
        if (reedemLedger == null) {
            log.error("Error in reedem ledger : invalid reedemLedger. userSchemeId={}, amount={}",
                    u.getUserSchemeId(), amount);
            return false;
        }
        reedemLedger.setStatus(status);
        reedemLedgerRepository.save(reedemLedger);
        return true;
    }

    public Pageable pageable(String page) {
        return PageRequest.of(Math.max(parsePage(page), 1) - 1, DEFAULT_PAGE_SIZE);
    }

    private int parsePage(String page) {
        if (page == null || page.isBlank()) {
            return 1;
        }
        try {
            return Integer.parseInt(page);
        } catch (NumberFormatException ex) {
            return 1;
        }
    }
}
