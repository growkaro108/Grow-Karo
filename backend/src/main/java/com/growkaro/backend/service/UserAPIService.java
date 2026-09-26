package com.growkaro.backend.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;

import com.growkaro.backend.DRO.NewNominee;
import com.growkaro.backend.DRO.RaiseIssue;
import com.growkaro.backend.DRO.UserRegister;
import com.growkaro.backend.DRO.WithdrawAmount;
import com.growkaro.backend.DTO.IssueResponse;
import com.growkaro.backend.DTO.NearMaturityUserSchemeResponse;
import com.growkaro.backend.DTO.NomineeResponse;
import com.growkaro.backend.DTO.NotificationView;
import com.growkaro.backend.DTO.PagedResponse;
import com.growkaro.backend.DTO.TransactionResponse;
import com.growkaro.backend.DTO.TransactionSummary;
import com.growkaro.backend.DTO.UserPortfolio;
import com.growkaro.backend.common.General;
import com.growkaro.backend.entity.BankDetails;
import com.growkaro.backend.entity.Guardian;
import com.growkaro.backend.entity.Nominee;
import com.growkaro.backend.entity.Notification;
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.SupportIssue;
import com.growkaro.backend.entity.Transaction;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.UserProfile;
import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.entity.UserSchemeReedemLedger;
import com.growkaro.backend.entity.NotificationContentBuilder.EssentialActionType;
import com.growkaro.backend.entity.Reply;
import com.growkaro.backend.entity.SupportIssue.Status;
import com.growkaro.backend.entity.User.Role;
import com.growkaro.backend.entity.UserSchemeReedemLedger.ReedeemStatus;
import com.growkaro.backend.enums.ActivityType;
import com.growkaro.backend.repository.BankDetailsRepository;
import com.growkaro.backend.repository.NotificationRepository;
import com.growkaro.backend.repository.ReedemLedgerRepository;
import com.growkaro.backend.repository.SchemeRepository;
import com.growkaro.backend.repository.SupportIssueRepository;
import com.growkaro.backend.repository.TransactionRepository;
import com.growkaro.backend.repository.UserRepository;
import com.growkaro.backend.repository.UserSchemeRepository;
import com.growkaro.backend.security.AdminPolicy;
import com.growkaro.backend.security.JwtService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserAPIService {

    private static final Logger log = LoggerFactory.getLogger(UserAPIService.class);
    private static final int DEFAULT_PAGE_SIZE = 20;

    private final ApiService apiService;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationRepository notificationRepository;
    private final SchemeRepository schemeRepository;
    private final UserSchemeRepository userSchemeRepository;
    private final ActivityLogService activityLogService;
    private final BankDetailsRepository bankDetailsRepository;
    private final General general;
    private final CrucialNotificationService crucialNotificationService;
    private final EmailService emailService;
    private final SupportIssueRepository supportIssueRepository;
    private final JwtService jwtService;
    private final AdminPolicy adminPolicy;
    private final RedisService redisService;
    private final ReedemLedgerRepository reedemLedgerRepository;
    private final TransactionService transactionService;

    // @Cacheable(value = "testApis", key = "#id")
    @Transactional
    public Object testApis() {
        try {
            // User u =
            // userRepository.findByEmail("vikaskumar01997@gmail.com").orElse(null);
            // if (u != null) {
            // u.setRole(Role.ADMIN);
            // userRepository.save(u);
            // System.out.println("updated successfully");
            // return true;
            // }
            Pageable pageable = PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "requestDate"));
            var rawUsers = userSchemeRepository.findNearMaturityUsers("", 15, pageable);
            var mapped = rawUsers.map(NearMaturityUserSchemeResponse::fromUserScheme);
            return PagedResponse.from(mapped, pageable.getPageNumber(), pageable.getPageSize());

        } catch (Exception e) {
            log.error("Failed to set user status active", e.getMessage());
            return e.getMessage();
        }
    }

    public boolean isUserExists(String email) {
        return findAllUsersEmail().contains(email);
    }

    @Cacheable(value = "AllUsersEmail")
    public List<String> findAllUsersEmail() {
        return userRepository.findAllEmail();
    }

    public boolean existByUserId(String id) {
        return userRepository.existsById(id);
    }

    public boolean existUserSchemeId(String userSchemeId) {
        return userSchemeRepository.existsById(userSchemeId);
    }

    @Cacheable(value = "getUserSchemeById", key = "#userSchemeId")
    public UserScheme getUserSchemeById(String userSchemeId) {
        if (userSchemeId == null || userSchemeId.isBlank()) {
            return null;
        }
        Optional<UserScheme> userScheme = userSchemeRepository.findByUserSchemeId(userSchemeId);
        return userScheme.isPresent() ? userScheme.get() : null;
    }

    public Scheme getSchemeById(String schemeId) {
        if (schemeId == null || schemeId.isBlank()) {
            return null;
        }
        Optional<Scheme> scheme = schemeRepository.findById(schemeId);
        return scheme.isPresent() ? scheme.get() : null;
    }

    public User getUserById(String userId) {
        if (userId == null || userId.isBlank() || !(general.isValidId(userId))) {
            return null;
        }
        Optional<User> user = userRepository.findById(userId);
        return user.isPresent() ? user.get() : null;
    }

    public User getUserByEmail(String email) {
        if (email == null || email.isBlank() || !general.validateEmail(email)) {
            return null;
        }
        Optional<User> user = userRepository.findByEmail(email);
        return user.isPresent() ? user.get() : null;
    }

    public List<Transaction> getAllUsersTransactions(String userId) {
        if (userId == null || userId.isBlank() || !(general.isValidId(userId))) {
            return null;
        }
        return transactionRepository.findByUser_IdOrderByCreatedAtDesc(userId);
    }

    public Transaction getTransactionById(String txnId) {
        if (txnId == null || txnId.isBlank() || !(general.isValidId(txnId))) {
            return null;
        }
        Optional<Transaction> txn = transactionRepository.findById(txnId);
        return txn.isEmpty() ? null : txn.get();
    }

    @CacheEvict(value = "AllUsersEmail")
    @Transactional
    public boolean userSignup(UserRegister user) {
        String email = stringValue(user.email());
        String phone = stringValue(user.phone());
        String name = stringValue(user.name());
        String passwordHash = stringValue(user.passwordHash());
        String dob = stringValue(user.dob());
        String maritalStatus = stringValue(user.maritalStatus());
        String aadharNo = stringValue(user.aadharNo());

        if (name == null || email == null || phone == null || passwordHash == null) {
            return false;
        }

        if (isUserExists(email)) {
            return false;
        }

        LocalDate parsedDob = null;
        if (dob != null) {
            try {
                parsedDob = general.parseDob(dob);
            } catch (Exception e) {
                log.warn("Invalid DOB provided during signup for email={}", email, e);
                return false;
            }
        }

        User newUser = new User();
        newUser.setId(general.generateUserId());
        newUser.setName(name);
        newUser.setEmail(email);
        newUser.setPhone(phone);
        newUser.setPasswordHash(apiService.makePasswordHash(passwordHash));
        newUser.setDob(parsedDob);
        newUser.setMaritalStatus(maritalStatus);
        newUser.setAadharNo(aadharNo);

        if (user.guardian() != null) {
            String guardianName = stringValue(user.guardian().get("name"));
            String guardianRelation = stringValue(user.guardian().get("relation"));
            if (guardianName != null || guardianRelation != null) {
                Guardian guardian = new Guardian();
                guardian.setName(guardianName);
                guardian.setRelation(guardianRelation);
                guardian.setUser(newUser);
                newUser.setGuardian(guardian);
            }
        }

        if (user.address() != null) {
            String street = stringValue(user.address().get("street"));
            String village = stringValue(user.address().get("village"));
            String city = stringValue(user.address().get("city"));
            String state = stringValue(user.address().get("state"));
            String pincode = stringValue(user.address().get("pincode"));

            if (street != null || village != null || city != null || state != null || pincode != null) {
                newUser.setStreet(street);
                newUser.setVillage(village);
                newUser.setCity(city);
                newUser.setState(state);
                newUser.setPincode(pincode);
            }
        }

        if (user.nominee() != null) {
            String nomineeName = stringValue(user.nominee().get("name"));
            String nomineeAadhaar = stringValue(user.nominee().get("aadharNo"));
            String mobileNo = stringValue(user.nominee().get("mobileNo"));
            String relation = stringValue(user.nominee().get("relation"));
            if (nomineeName != null || nomineeAadhaar != null || mobileNo != null || relation != null) {
                Nominee nominee = new Nominee();
                nominee.setName(nomineeName);
                nominee.setAadharNo(nomineeAadhaar);
                nominee.setMobileNo(mobileNo);
                nominee.setRelation(relation);
                nominee.setUser(newUser);
                List<Nominee> nominees = new ArrayList<>();
                nominees.add(nominee);
                newUser.setNominees(nominees);
            }
        }

        newUser.setEmailVerified(true);

        String bankName = stringValue(user.bankName());
        String accountHolderName = stringValue(user.accountHolderName());
        String accountNumber = stringValue(user.accountNumber());
        String ifscCode = stringValue(user.ifscCode());
        if (bankName != null || accountHolderName != null || accountNumber != null || ifscCode != null) {
            BankDetails bankDetails = new BankDetails();
            bankDetails.setBankName(bankName);
            bankDetails.setAccountHolderName(accountHolderName);
            bankDetails.setAccountNumber(accountNumber);
            bankDetails.setIfscCode(ifscCode);
            bankDetails.setUser(newUser);
            newUser.setBankDetails(bankDetails);
        }

        try {
            userRepository.save(newUser);
            activityLogService.log(
                    newUser.getId(), newUser.getName(), "USER",
                    ActivityType.ACCOUNT_CREATED,
                    newUser.getName() + " created an account",
                    "USER", newUser.getId(),
                    Map.of("email", newUser.getEmail()));
            return true;
        } catch (DataIntegrityViolationException e) {
            log.warn("Signup failed due to data integrity violation for email={}", email, e);
            return false;
        }
    }

    @Transactional
    public Map<String, Object> login(String email, String password) {
        try {
            if (!isUserExists(email)) {
                return general.response("error", "User not found", Map.of());
            }
            User user = getUserByEmail(email);

            if (user == null || password == null || !BCrypt.checkpw(password, user.getPasswordHash())) {
                log.error("Invalid email or password for email={}", email);
                return general.response("error", "Invalid email or password", Map.of());
            }
            boolean isAdmin = adminPolicy.isAdminEmail(email);
            String role = isAdmin ? "ROLE_ADMIN" : "ROLE_GRAHAK";
            String token = jwtService.generateToken(user.getId(), user.getEmail(), role);
            UserProfile finalUser = UserProfile.fromEntity(user, token);

            String nonValidPassword = null;
            if (!general.validatePassword(password)) {
                nonValidPassword = password;
            }
            // set admin token into redis
            if (isAdmin) {
                redisService.setValue("malik", user.getName());
                redisService.setValue("malikID", user.getId());
            }
            // notifyUser
            crucialNotificationService.notifyUser(EssentialActionType.LOGIN, user, "", null);
            activityLogService.log(
                    isAdmin ? null : user.getId(), user.getName(), isAdmin ? "Admin" : "USER",
                    ActivityType.LOGIN,
                    (isAdmin ? "Admin" : user.getName()) + " logged in",
                    isAdmin ? "Admin" : "USER", user.getId(),
                    Map.of("email", user.getEmail()));
            if (nonValidPassword != null)
                log.info("user login with email: {} and nonvalid password: {}", email, password);
            return general.response("success", "Login successful", finalUser);
        } catch (Exception e) {
            log.error("user login with email: {} failed", email, e);
            return general.response("error", "Something went wrong.", null);

        }
    }

    public Map<String, Object> logout(String userId, String userName) {

        try {
            if (userId.contentEquals(general.adminId())) {
                redisService.delete("malik");
            }
            activityLogService.log(
                    userId, userName, "USER",
                    ActivityType.LOGOUT,
                    userName + " logged out",
                    "USER", "",
                    Map.of());
            return general.response("success", "Logout successful", Map.of());
        } catch (Exception e) {
            return general.response("error", "Logout failed", Map.of());
        }
    }

    @Caching(evict = {
            @CacheEvict(value = "userPortfolio", key = "#p1"),
            @CacheEvict(value = "userSchemes", key = "#p1"),
            @CacheEvict(value = "userTransactions", key = "#p1")
    })
    @Transactional
    public Map<String, Object> enrollInScheme(String schemeId, String userId, BigDecimal amount, String nomineId) {
        try {
            if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
                return general.response("error", "Invalid request...", null);
            }

            User user = getUserById(userId);
            Scheme scheme = getSchemeById(schemeId);

            // check nominee is related to user
            boolean isNomineeRelated = false;
            Nominee selectedNominee = null;
            List<Nominee> nominees = user.getNominees();
            for (Nominee nominee : nominees) {
                if (nominee.getNomineeId().equals(nomineId)) {
                    isNomineeRelated = true;
                    selectedNominee = nominee;
                    break;
                }
            }

            if (!isNomineeRelated) {
                return general.response("error", "Nominee not related to user", null);
            }

            if (user == null || scheme == null || amount.compareTo(scheme.getMinimumAmount()) < 0) {
                return general.response("error", "Invalid request...", null);
            }
            // retrn if slot full
            if (scheme.getMaxInvestorsAllowed() - scheme.getJoinedUsers().size() < 0) {
                return general.response("error", "Scheme is full...", null);
            }

            UserScheme newUserScheme = new UserScheme();
            newUserScheme.setUser(user);
            newUserScheme.setPaidAmount(amount); // <-- was validated but never persisted
            scheme.enrollUserInScheme(newUserScheme); // sets scheme + adds to scheme's joinedUsers
            user.enrollInScheme(newUserScheme); // if you keep this method, make sure it doesn't create a second
            newUserScheme.setNominee(selectedNominee);
            userSchemeRepository.save(newUserScheme);

            activityLogService.log(
                    user.getId(), user.getName(), "USER",
                    ActivityType.SCHEME_ENROLLED,
                    user.getName() + " enrolled in scheme " + scheme.getSchemeName(),
                    "USER", user.getId(),
                    Map.of("schemeId", schemeId));

            return general.response("success", "Scheme enrolled successfully", null);
        } catch (Exception e) {
            log.error("Error enrolling scheme {} for user {}", schemeId, userId, e);
            return general.response("error", "Scheme enrollment failed. Please try again.", null);
        }
    }

    @Cacheable(value = "userSchemes", key = "#p0")
    @Transactional(readOnly = true)
    public Map<String, Object> getMyScheme(String userId) {
        try {
            User user = getUserById(userId);
            if (user == null) {
                return general.response("error", "Invalid Data...", Map.of("id", userId));
            }
            List<String> userSchemesIds = userSchemeRepository.findAllJoinedSchemeId(user);
            return general.response("success", "User schemes fetched", userSchemesIds);
        } catch (Exception e) {
            log.error("Failed to fetch schemes for user {} because {}", userId, e.getMessage());
            return general.response("error", "Failed to fetch user schemes. Please try again.", null);
        }
    }

    @Cacheable(value = "userPortfolio", key = "#p0")
    @Transactional(readOnly = true)
    public Map<String, Object> getUserPortfolio(String userId) {
        try {
            User user = getUserById(userId);
            if (user == null) {
                return general.response("error", "Invalid Data...", null);
            }
            List<UserPortfolio> portfolios = user.getEnrolledSchemes()
                    .stream()
                    .sorted((a, b) -> b.getRequestDate().compareTo(a.getRequestDate()))
                    // .filter(us -> us.getIsApproved())
                    .map(UserPortfolio::fromEntity)
                    .toList();

            TransactionSummary summary = transactionRepository.getTransactionSummaryByUser(user.getId());
            BigDecimal pendingSum = summary.getPendingSum();
            BigDecimal successSum = summary.getSuccessSum();

            return general.response("success", "User portfolios fetched",
                    Map.of("holdings", portfolios, "pendingSum", pendingSum, "successSum", successSum));
        } catch (Exception e) {
            log.error("Failed to fetch portfolio for user {}", userId, e);
            return general.response("error", "Something went wrong. Please try again.", null);
        }
    }

    @Caching(evict = {
            @CacheEvict(value = "userPortfolio", key = "#p1"),
            @CacheEvict(value = "userSchemes", key = "#p1")
    })
    @Transactional
    public Map<String, Object> schemeWithdrawal(String userSchemeId, String userId) {
        User user = getUserById(userId);
        if (user == null) {
            return general.response("error", "Invalid data", null);
        }
        try {
            Optional<UserScheme> userSchemeOpt = userSchemeRepository.findById(userSchemeId);
            if (userSchemeOpt.isEmpty()) {
                return general.response("error", "Request record not found", null);
            }
            UserScheme userScheme = userSchemeOpt.get();
            if (!user.getId().equals(userId)) {
                return general.response("info", "User not enrolled in this scheme", null);
            }

            Scheme scheme = userScheme.getScheme();
            String schemeName = (scheme != null) ? scheme.getSchemeName() : null;

            // Actually perform the withdrawal
            if (scheme != null) {
                scheme.removeUserFromScheme(userScheme); // removes from joinedUsers, nulls scheme ref
            }
            user.getEnrolledSchemes().remove(userScheme); // keep in-memory side consistent, if this collection exists

            userSchemeRepository.delete(userScheme);

            activityLogService.log(
                    user.getId(), user.getName(), "USER",
                    ActivityType.SCHEME_WITHDRAWAL,
                    user.getName() + " withdraw from scheme " + schemeName,
                    "USER", user.getId() + "with ₹ " + userScheme.getPaidAmount(),
                    Map.of("userSchemeId", userSchemeId));

            return general.response("success", "Application withdrawn successfully", null);

        } catch (Exception e) {
            log.error("Error withdrawing userScheme {} for user {}", userSchemeId, userId, e);
            return general.response("error", e.getMessage() != null ? e.getMessage()
                    : "Something went wrong while processing your cancellation request", null);
        }
    }

    public Map<String, Object> changePassword(String userId, String password) {
        User user = null;
        try {
            user = getUserById(userId);
            if (user == null) {
                log.error("User not found for user id :{}", userId);
                return general.response("error", "Invalid Data...", null);
            }
            if (BCrypt.checkpw(password, user.getPasswordHash())) {
                return general.response("success", "Redirecting to login page...", null);
            }

            user.setPasswordHash(apiService.makePasswordHash(password));
            userRepository.save(user);

            crucialNotificationService.notifyUser(EssentialActionType.PASSWORD_CHANGED, user, "/auth", null);

            activityLogService.log(
                    user.getId(), user.getName(), "USER",
                    ActivityType.PASSWORD_CHANGED,
                    "Password changed successfully", "USER", user.getId(),
                    Map.of("userId", userId));
            return general.response("success", "Password reset successfully", null);
        } catch (Exception e) {
            log.error("Error changing password for user {}", userId, e);
            return general.response("error", "Failed to change password. Please try again.", null);
        }
    }

    @Caching(put = { @CachePut(value = "userProfile", key = "#p0.id()") }, evict = {
            @CacheEvict(value = "userNominees", key = "#p0.id()"),
            @CacheEvict(value = "userTransactions", key = "#p0.id()")
    })
    @Transactional
    public Map<String, Object> updateUser(UserProfile up) {
        // create new token

        User user = getUserById(up.id());
        if (user == null) {
            return general.response("error", "Invalid requests...", Map.of("id", up.id()));
        }

        if (!up.bankName().trim().isEmpty()
                && !up.accountHolderName().trim().isEmpty()
                && !up.accountNumber().trim().isEmpty()
                && !up.ifscCode().trim().isEmpty()) {

            // Reuse the existing bank_details row if the user already has one —
            // user_id is unique, so always creating `new BankDetails()` would
            // violate that constraint on the second save.
            BankDetails bankDetails = user.getBankDetails();
            if (bankDetails == null) {
                bankDetails = new BankDetails();
                bankDetails.setUser(user); // add new bank details
            }

            bankDetails.setBankName(up.bankName());
            bankDetails.setAccountHolderName(up.accountHolderName());
            bankDetails.setAccountNumber(up.accountNumber());
            bankDetails.setIfscCode(up.ifscCode());

            user.setBankDetails(bankDetails);
        }

        user.setName(up.name());
        user.setPhone(up.phone());
        user.setEmail(up.email());
        user.setSchemeAlerts(up.schemeAlerts());
        user.setSecurityAlerts(up.securityAlerts());
        user = userRepository.save(user);

        crucialNotificationService.notifyUser(EssentialActionType.BANK_DETAILS_UPDATED, user, "/dashboard/settings",
                null);

        return general.response("success", "User updated successfully",
                UserProfile.fromEntity(user, general.generateToken(user.getId(), user.getEmail(), "ROLE_GRAHAK")));
    }

    /**
     * Handles a withdrawal/redemption request for a user's scheme.
     * Supports two modes:
     * - General withdrawal: redeem profit up to the un-redeemed profit balance
     * (calculated live from the profit and redeem ledgers).
     * - Aggressive withdrawal: full payout of the scheme's paidAmount.
     */
    @Caching(evict = {
            @CacheEvict(value = "userTransactions", key = "#p0.userId()"),
            @CacheEvict(value = "userPortfolio", key = "#p0.userId()") })
    @Transactional
    public Map<String, Object> redeemAmount(WithdrawAmount wa) {

        // basic amount validation
        try {
            if (wa.amount() == null || wa.amount().compareTo(BigDecimal.ZERO) <= 0) {
                log.error("id: {}, amount: {},Invalid amount...", wa.userId(), wa.amount());
                return general.response("error", "Invalid amount...", null);
            }

            UserScheme us = userSchemeRepository.findByUserSchemeIdWithUser(wa.userSchemeId()).orElse(null);
            if (us == null) {
                log.error("userScheme not found for userSchemeId :{}", wa.userSchemeId());
                return general.response("error", "Invalid userSchemeId...", null);
            }

            // check if user have already pending reddem then return
            List<UserSchemeReedemLedger> reedemLedger = us.getReedemLedger();
            for (UserSchemeReedemLedger ledger : reedemLedger) {
                if (ledger.getStatus().equals(ReedeemStatus.REQUESTED)) {
                    return general.response("error",
                            "You have already pending reedem of amount : " + ledger.getRedeemAmount(), null);
                }
            }
            // Compute totals live from the ledgers (source of truth) instead of
            // relying on cached fields on UserScheme.
            BigDecimal totalProfit = general.countProfit(us.getProfitLedger());

            BigDecimal totalRedeemed = general.countReedem(reedemLedger);

            User user = us.getUser();
            // ownership check: scheme must belong to this user
            if (user == null || !user.getId().equals(wa.userId())) {
                log.info("userScheme does not belong to user..., {}",
                        Map.of("userSchemeId", us.getUserSchemeId(), "userId", wa.userId()));
                return general.response("error", "userScheme does not belong to user...", null);
            }

            // Amount still available to redeem = total profit accrued - total profit
            // already redeemed.
            BigDecimal availableToRedeem = totalProfit.subtract(totalRedeemed);

            if (!wa.isAggressive()) { // general withdrawal and redeem profit

                // guard against re-redeeming when everything has already been redeemed
                // this check is optional as user can redeem his profit multiple times
                if (availableToRedeem.compareTo(BigDecimal.ZERO) == 0) {
                    log.info("profit already redeemed..., {}",
                            Map.of("userSchemeId", us.getUserSchemeId(), "totalProfit", totalProfit,
                                    "totalRedeemed", totalRedeemed, "amount", wa.amount(), "userId", user.getId()));
                    return general.response("info", "profit already redeemed...", null);
                }

                // ensure the requested amount does not exceed what's actually available
                if (availableToRedeem.compareTo(wa.amount()) < 0) {
                    log.info("Insufficient Profit...",
                            Map.of("userSchemeId", us.getUserSchemeId(), "totalProfit", totalProfit,
                                    "totalRedeemed", totalRedeemed, "amount", wa.amount(), "userId", user.getId()));
                    return general.response("error", "Insufficient Profit...", null);
                }

            } else { // aggressive withdrawal — must redeem the full paid amount at once
                if (us.getPaidAmount() == null || us.getPaidAmount().compareTo(wa.amount()) != 0) {
                    log.info("paidAmount and amount doesn't match..., {}", Map.of("userSchemeId", us.getUserSchemeId(),
                            "paidAmount", us.getPaidAmount(), "amount", wa.amount(), "userId", user.getId()));
                    return general.response("error", "paidAmount and amount doesn't match...", null);
                }
            }

            // is valid bank details
            BankDetails bankDetails;
            if (wa.bankDetailsId() == null) {
                if (wa.bankDetails() == null) {
                    return general.response("error", "Invalid bankDetails...", null);
                }
                bankDetails = wa.bankDetails();
                bankDetails.setUser(null); // ensure new bank details are tied to the requesting user
                bankDetails = bankDetailsRepository.save(bankDetails);
            } else {
                bankDetails = bankDetailsRepository.findById(wa.bankDetailsId()).orElse(null);
                if (bankDetails == null) {
                    return general.response("error", "Invalid bankDetailsId...", null);
                }
                // ownership check: bank details must belong to this user
                if (bankDetails.getUser() == null || !bankDetails.getUser().getId().equals(user.getId())) {
                    return general.response("error", "bankDetails does not belong to user...", null);
                }
            }

            // create the pending withdrawal transaction
            transactionService.createPendingReedemTransaction(user, wa.amount(), us, bankDetails, wa.isAggressive()
                    ? Transaction.TransactionType.AGGRESSIVE_WITHDRAWAL
                    : Transaction.TransactionType.GENERAL_WITHDRAWAL);

            crucialNotificationService.notifyAllForEssentialAction(
                    EssentialActionType.WITHDRAWAL_REQUESTED,
                    user,
                    List.of(),
                    null,
                    "/dashboard/requests",
                    Map.of("amount", wa.amount().toString(), "txnId",
                            "check transaction for status."));

            // record this redemption in the ledger so future totalRedeemed
            // calculations correctly include this amount
            if (!wa.isAggressive()) {
                UserSchemeReedemLedger usrl = new UserSchemeReedemLedger();
                usrl.setRedeemAmount(wa.amount());
                usrl.setUserScheme(us);
                usrl.setRedeemDate(general.getCurrentDate());
                usrl.setStatus(UserSchemeReedemLedger.ReedeemStatus.REQUESTED);

                reedemLedgerRepository.save(usrl);
            }

            return general.response("success", "Withdraw request placed successfully", null);
        } catch (Exception e) {
            log.error("Error in redeeming amount... {}.beacouse {}",
                    Map.of("amount", wa.amount(), "userId", wa.userId(), "userSchemeId", wa.userSchemeId()),
                    e.getMessage());
            return general.response("error", "Error in redeeming amount...", null);
        }
    }

    @Cacheable(value = "userTransactions", key = "#p0")
    public Map<String, Object> getTransactionsofUser(String userId) {
        List<Transaction> transactions = getAllUsersTransactions(userId);
        if (transactions == null) {
            return general.response("error", "Invalid requests...", Map.of("id", userId));
        }
        return general.response("success", "Transactions fetched", transactions.stream()
                .map(TransactionResponse::fromEntity)
                .toList());
    }

    public List<NomineeResponse> getNominees(String userId) {
        if (userId == null || userId.isEmpty() || !general.isValidId(userId)) {
            return null;
        }
        User user = getUserById(userId);
        if (user == null) {
            return null;
        }
        List<Nominee> nominees = user.getNominees();
        return nominees == null ? null
                : nominees.stream()
                        .map(NomineeResponse::fromEntity)
                        .toList();
    }

    @CacheEvict(value = "userNominees", key = "#p0.userId()")
    public NomineeResponse addNominee(NewNominee nominee) {
        try {
            User user = getUserById(nominee.userId());
            if (user == null) {
                return null;
            }
            List<Nominee> nominees = user.getNominees();
            if (nominees == null) {
                nominees = new ArrayList<>();
            }
            Nominee newNominee = new Nominee();
            newNominee.setUser(user);
            newNominee.setName(nominee.name());
            newNominee.setRelation(nominee.relation());
            newNominee.setAadharNo(nominee.aadhaarNo());
            newNominee.setMobileNo(nominee.phone());
            nominees.add(newNominee);
            user.setNominees(nominees);
            userRepository.save(user);
            return NomineeResponse.fromEntity(newNominee);
        } catch (Exception e) {
            log.error("Error adding nominee for user {}", nominee.userId(), e);
            return null;
        }
    }

    @CacheEvict(value = "userNominees", key = "#p0")
    @Transactional
    public Map<String, Object> deleteNominee(String userId, String nomineeId) {
        User user = getUserById(userId);
        if (user == null || nomineeId == null || nomineeId.isBlank()) {
            return general.response("error", "Invalid nominee request", null);
        }

        Nominee nominee = user.getNominees().stream()
                .filter(item -> nomineeId.equals(item.getNomineeId()))
                .findFirst()
                .orElse(null);
        if (nominee == null) {
            return general.response("error", "Nominee not found", null);
        }
        if (userSchemeRepository.existsByNomineeNomineeId(nomineeId)) {
            return general.response("error", "This nominee is linked to an investment and cannot be deleted", null);
        }

        user.getNominees().remove(nominee);
        userRepository.save(user);
        return general.response("success", "Nominee deleted successfully", null);
    }

    @CacheEvict(value = "userNominees", key = "#p0")
    @Transactional
    public Map<String, Object> updateNominee(String userId, String nomineeId, NewNominee details) {
        User user = getUserById(userId);
        if (user == null || nomineeId == null || nomineeId.isBlank()
                || details == null || !userId.equals(details.userId())) {
            return general.response("error", "Invalid nominee request", null);
        }

        Nominee nominee = user.getNominees().stream()
                .filter(item -> nomineeId.equals(item.getNomineeId()))
                .findFirst()
                .orElse(null);
        if (nominee == null) {
            return general.response("error", "Nominee not found", null);
        }

        nominee.setName(details.name().trim());
        nominee.setRelation(details.relation().trim());
        nominee.setAadharNo(details.aadhaarNo().trim());
        nominee.setMobileNo(details.phone().trim());
        userRepository.save(user);
        return general.response("success", "Nominee updated successfully", NomineeResponse.fromEntity(nominee));
    }

    @Cacheable(value = "userNotifications", key = "#p0 + ':' + #p1 + ':' + #p2", unless = "#result.get('status') == 'error'")
    @Transactional(readOnly = true)
    public Map<String, Object> userNotifications(String userId, String tab, int page) {
        User user = getUserById(userId);
        if (user == null) {
            return general.response("error", "Invalid requests...", Map.of("id", userId));
        }
        boolean isRead = false;
        if (tab.equalsIgnoreCase("read")) {
            isRead = true;
        }
        // The API exposes one-based page numbers, whereas Spring Data uses zero-based
        // indexes.
        Pageable pageable = PageRequest.of(page - 1, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Notification> notifications;
        notifications = notificationRepository.findByReceiverIdAndReceiverTypeAndRead(
                user.getId(), Notification.ReceiverType.User, isRead, pageable);
        Map<String, Object> data = paginatedMeta(notifications);
        data.put("userId", user.getId());
        data.put("unreadCount",
                notificationRepository.countByReceiverIdAndReceiverTypeAndRead(user.getId(),
                        Notification.ReceiverType.User, false));
        data.put("items", notifications.getContent().stream().map(NotificationView::fromEntity).toList());
        return general.response("success", "User notifications fetched", data);
    }

    @CacheEvict(value = "userNotifications", allEntries = true)
    @Transactional
    public Map<String, Object> markNotificationsAsRead(String userId, List<String> notificationIds) {
        User user = getUserById(userId);
        if (user == null) {
            return general.response("error", "Invalid requests...", Map.of("id", userId));
        }

        int updated = (notificationIds == null || notificationIds.isEmpty())
                ? notificationRepository.markAllAsRead(user.getId(), Notification.ReceiverType.User)
                : notificationRepository.markAsRead(user.getId(), Notification.ReceiverType.User, notificationIds);
        return general.response("success", "Notifications marked as read", Map.of("updatedCount", updated));
    }

    public Map<String, Object> updateNotificationSettings(String userId, Map<String, Boolean> settings) {
        return general.response("success", "Notification preferences updated",
                Map.of("userId", userId, "settings", settings));
    }

    @CacheEvict(value = "userIssues", key = "#userId", condition = "'success'.equals(#result?.get('status'))")
    @Transactional
    public Map<String, Object> submitIssue(String userId, RaiseIssue issue) {
        try {
            if (!general.isValidId(userId) || !existByUserId(userId)) {
                return general.response("error", "Invalid requests...", Map.of("id", userId));
            }
            SupportIssue newIssue = new SupportIssue();
            newIssue.setSubmitterId(userId);
            newIssue.setTitle(issue.title());
            newIssue.setDescription(issue.description());
            if (issue.priority().equalsIgnoreCase("high")) {
                newIssue.setPriority(SupportIssue.Priority.HIGH);
            } else if (issue.priority().equalsIgnoreCase("medium")) {
                newIssue.setPriority(SupportIssue.Priority.MEDIUM);
            } else {
                newIssue.setPriority(SupportIssue.Priority.LOW);
            }
            newIssue.setStatus(SupportIssue.Status.OPEN);
            supportIssueRepository.save(newIssue);

            return general.response("success", "Issue submitted successfully", true);
        } catch (Exception e) {
            // Ensure the transaction is rolled back even though we're catching here.
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            log.error("Error submitting issue for user {}", userId, e);
            return general.response("error", "Failed to submit issue", null);
        }
    }

    @Cacheable(value = "userIssues", key = "#userId + ':' + #status + ':' + #page")
    @Transactional(readOnly = true)
    public PagedResponse<IssueResponse> issues(String userId, Status status, Pageable pageable) {
        try {
            var issuesPage = supportIssueRepository.findBySubmitterIdAndStatus(userId, status, pageable);
            var mapped = issuesPage.map(IssueResponse::fromEntity);
            return PagedResponse.from(mapped, pageable.getPageNumber(), pageable.getPageSize());
        } catch (Exception e) {
            log.error("Error fetching issues for user {}", userId, e);
            return null;
        }
    }

    public Map<String, Object> addComment(String issueId, String reply) {
        try {
            SupportIssue issue = supportIssueRepository.findById(issueId)
                    .orElseThrow(() -> new IllegalArgumentException("Issue not found with id " + issueId));
            Reply r = new Reply();
            r.setSupportIssue(issue);
            r.setSenderType(Reply.SenderType.USER);
            r.setText(reply);
            issue.addReply(r);
            supportIssueRepository.save(issue);
            return general.response("success", "Comment added successfully", true);
        } catch (Exception e) {
            log.error("Error while adding comment: {}", e.getMessage());
            return general.response("error", "Failed to add comment", false);
        }
    }

    @CacheEvict(value = "userPortfolio", key = "#userId")
    @Transactional
    public Map<String, Object> reinvest(String userId, String userSchemeId, String nomineeId, String schemeId) {
        try {
            UserScheme existingUserScheme = userSchemeRepository.findByUserSchemeId(userSchemeId)
                    .orElse(null);

            if (existingUserScheme == null) {
                log.error("Reinvest failed: UserScheme not found for ID: {}", userSchemeId);
                return general.response("error", "User scheme not found", Map.of("id", userSchemeId));
            }

            // 1. Calculate profit & redemptions cleanly
            BigDecimal totalProfit = general.countProfit(existingUserScheme.getProfitLedger());

            BigDecimal totalRedeemed = general.countReedem(existingUserScheme.getReedemLedger());

            BigDecimal netProfit = totalProfit.subtract(totalRedeemed);
            BigDecimal reinvestmentAmount = existingUserScheme.getPaidAmount().add(netProfit);

            // // 2. Resolve Target Scheme
            Scheme targetScheme = existingUserScheme.getScheme();
            if (schemeId != null && !schemeId.isBlank() &&
                    !targetScheme.getSchemeId().equals(schemeId)) {
                targetScheme = schemeRepository.findById(schemeId).orElse(null);
                if (targetScheme == null) {
                    log.error("Reinvest failed: Target Scheme not found for ID: {}", schemeId);
                    return general.response("error", "Target scheme not found",
                            Map.of("schemeId", schemeId));
                }
            }

            // // 3. Amount Validation
            if (reinvestmentAmount.compareTo(targetScheme.getMinimumAmount()) < 0) {
                log.error("Reinvest failed: Amount {} below minimum {}", reinvestmentAmount,
                        targetScheme.getMinimumAmount());
                return general.response("error", "Reinvestment amount is less than minimum required",
                        Map.of("id", userSchemeId));
            }

            if (reinvestmentAmount.compareTo(targetScheme.getMaximumAmount()) > 0) {
                log.error("Reinvest failed: Amount {} exceeds maximum {}",
                        reinvestmentAmount,
                        targetScheme.getMaximumAmount());
                return general.response("error", "Reinvestment amount exceeds maximum limit",
                        Map.of("userSchemeId", userSchemeId));
            }

            // // 4. Resolve Nominee
            User user = existingUserScheme.getUser();
            Nominee nominee = user.getNominees().stream()
                    .filter(n -> n.getNomineeId().equals(nomineeId))
                    .findFirst()
                    .orElse(null);

            if (nominee == null) {
                log.error("Reinvest failed: Nominee not found for ID: {}", nomineeId);
                return general.response("error", "Invalid nominee selected",
                        Map.of("nomineeId", nomineeId));
            }

            // 5. Create New Reinvestment Scheme
            UserScheme newUserScheme = new UserScheme();
            newUserScheme.setUser(user);
            newUserScheme.setPaidAmount(reinvestmentAmount);
            newUserScheme.setNominee(nominee);

            targetScheme.enrollUserInScheme(newUserScheme);
            user.enrollInScheme(newUserScheme);

            newUserScheme = userSchemeRepository.save(newUserScheme);

            // 6. Link Old Scheme to New Scheme
            existingUserScheme.setReinvestedIntoUserSchemeId(newUserScheme.getUserSchemeId());
            userSchemeRepository.save(existingUserScheme);
            Map<String, Object> result = getUserPortfolio(userId);
            if (result.get("status").equals("error")) {
                return general.response("error", "Internal server error...", Map.of());
            }
            // notify user
            crucialNotificationService.notifyUser(EssentialActionType.FUND_TRANSFER_INITIATED,
                    user, "/dashboard",
                    Map.of("name", user.getName(), "amount", reinvestmentAmount.toString(), "schemeName",
                            targetScheme.getSchemeName(), "date",
                            general.getCurrentDate().format(general.DATE_FORMATTER)));
            // log to admin
            activityLogService.log(user.getId(), user.getName(), user.getRole().name(), ActivityType.SCHEME_REINVESTED,
                    user.getName() + " is reinvest in " + targetScheme.getSchemeName(), "User Scheme", user.getId(),
                    Map.of("reinvestedAmount", reinvestmentAmount.toString(), "schemeId", targetScheme.getSchemeId(),
                            "schemeName", targetScheme.getSchemeName(), "date",
                            general.getCurrentDate().format(general.DATE_FORMATTER)));

            return general.response("success", "Reinvestment successful", result.get("data"));

        } catch (Exception e) {
            log.error("Error occurred while processing reinvestment for user {}: {}", userId, e.getMessage(), e);
            return general.response("error", "Internal server error...", Map.of());
        }
    }

    //// pending
    @Caching(evict = {
            @CacheEvict(value = "userProfile", key = "#userId"),
            @CacheEvict(value = "userPortfolio", key = "#userId"),
            @CacheEvict(value = "userSchemes", key = "#userId"),
            @CacheEvict(value = "userNominees", key = "#userId"),
            @CacheEvict(value = "userTransactions", key = "#userId"),
            @CacheEvict(value = "userNotifications", allEntries = true)
    })
    @Transactional
    public Map<String, Object> deleteUser(String userId) {
        User user = getUserById(userId);
        if (user == null) {
            return general.response("error", "Invalid requests...", Map.of("id", userId));
        }
        user.setActive(false);
        userRepository.save(user);
        return general.response("ok", "User deactivated", Map.of("id", user.getId()));
    }

    // @Cacheable(value = "userTransactions", key = "#userId + ':' + (#page != null
    // ? #page : '1')")
    // @Transactional(readOnly = true)
    // public Map<String, Object> userTransactions(String userId, String page) {
    // User user = getUserById(userId);
    // if (user == null) {
    // return general.response("error", "Invalid requests...", Map.of("id",
    // userId));
    // }

    // Page<Transaction> transactions =
    // transactionRepository.findByUserId(user.getId(), pageable(page));
    // return general.response("ok", "User transactions fetched",
    // paginatedTransactions(transactions, "clientId", user.getId()));
    // }

    // private Map<String, Object> paginatedTransactions(Page<Transaction> page,
    // String ownerKey, String ownerId) {
    // Map<String, Object> data = paginatedMeta(page);
    // data.put(ownerKey, ownerId);
    // data.put("items",
    // page.getContent().stream().map(this::toTransactionView).toList());
    // return data;
    // }

    // private Map<String, Object> toTransactionView(Transaction transaction) {
    // Map<String, Object> data = new LinkedHashMap<>();
    // data.put("id", transaction.getId());
    // data.put("amount", transaction.getAmount());
    // data.put("status", transaction.getStatus());
    // data.put("referenceId", transaction.getReferenceId());
    // data.put("description", transaction.getRemarks());
    // data.put("remarks", transaction.getRemarks());
    // data.put("date", transaction.getCreatedAt());
    // data.put("createdAt", transaction.getCreatedAt());
    // data.put("updatedAt", transaction.getUpdatedAt());
    // if (transaction.getRemitter() != null) {
    // data.put("remitterId", transaction.getRemitter().getId());
    // data.put("remitterName", transaction.getRemitter().getOrganizationName());
    // }
    // if (transaction.getRecipient() != null) {
    // data.put("recipientId", transaction.getRecipient().getId());
    // data.put("recipientName", transaction.getRecipient().getName());
    // }
    // return data;
    // }

    // private Map<String, Object> toNotificationView(Notification notification) {
    // Map<String, Object> data = new LinkedHashMap<>();
    // data.put("id", notification.getId());
    // data.put("message", notification.getMessage());
    // data.put("type", notification.getType());
    // data.put("read", notification.isRead());
    // data.put("actionUrl", notification.getActionUrl());
    // data.put("createdAt", notification.getCreatedAt());
    // return data;
    // }

    private Map<String, Object> paginatedMeta(Page<?> page) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("currentPage", page.getNumber() + 1);
        data.put("totalPages", page.getTotalPages());
        data.put("totalItems", page.getTotalElements());
        return data;
    }

    private Pageable pageable(String page) {
        return PageRequest.of(Math.max(parsePage(page), 1) - 1, DEFAULT_PAGE_SIZE);
    }

    private int parsePage(String page) {
        if (page == null || page.isBlank()) {
            return 1;
        }
        try {
            return Integer.parseInt(page);
        } catch (NumberFormatException nfe) {
            log.error(" parse int function Invalid page number", nfe);
            return 1;
        }
    }

    private String stringValue(Object value) {
        if (value == null) {
            return null;
        }
        String text = value.toString().trim();
        return text.isEmpty() ? null : text;
    }

}
