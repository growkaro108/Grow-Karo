package com.growkaro.backend.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

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
import com.growkaro.backend.entity.NotificationContentBuilder.EssentialActionType;
import com.growkaro.backend.entity.Reply;
import com.growkaro.backend.entity.SupportIssue.Status;
import com.growkaro.backend.enums.ActivityType;
import com.growkaro.backend.repository.BankDetailsRepository;
import com.growkaro.backend.repository.NotificationRepository;
import com.growkaro.backend.repository.SchemeRepository;
import com.growkaro.backend.repository.SupportIssueRepository;
import com.growkaro.backend.repository.TransactionRepository;
import com.growkaro.backend.repository.UserRepository;
import com.growkaro.backend.repository.UserSchemeRepository;

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

    // @Cacheable(value = "testApis", key = "#id")
    @Transactional
    public Object testApis() {
        try {
            // User u = userRepository.findById("GKUSID20260731180215").get();
            // Page<List<IssueResponse>> issues =
            // supportIssueRepository.findUnResolvedIssue(PageRequest.of(0,
            // DEFAULT_PAGE_SIZE)).map(SupportIssue::fromEntity);
            // for(IssueResponse issue : issues) {
            // System.out.println(issue);
            // }
            // LocalDateTime time = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));

            // List<UserScheme> list = userSchemeRepository.findAll();
            // for (UserScheme userScheme : list) {
            // // userScheme.setUpdatedAt(time.minusDays(5));
            // if (userScheme.getProfitDates() == null) {
            // userScheme.setProfitDates(new HashSet<>());
            // // userSchemeRepository.save(userScheme);
            // }
            // if (userScheme.getProfit().compareTo(BigDecimal.ZERO) > 0) {
            // Set<LocalDateTime> profitDates = new HashSet<>();

            // profitDates.add(time.minusDays(30));
            // profitDates.add(time.minusDays(20));
            // profitDates.add(time.minusDays(5));
            // userScheme.setProfitDates(profitDates);
            // }
            // userSchemeRepository.save(userScheme);
            // }

            // UserScheme userSchemes = getUserSchemeById("GKUSID20260728184654");
            // System.out.println(userSchemes);
            Map<String, Object> userNotifications = userNotifications("GKUSID20260731180215", "unread", 1);

            return userNotifications;
        } catch (Exception e) {
            log.error("Failed to set user status active", e);
            return false;
        }
    }

    public boolean isUserExists(String email) {
        return userRepository.existsByEmail(email);
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

    @Transactional
    public boolean userSignup(UserRegister user) {
        String email = stringValue(user.email());
        String phone = stringValue(user.phone());
        String name = stringValue(user.name());
        String passwordHash = stringValue(user.passwordHash());
        String dob = stringValue(user.dob());
        String maritalStatus = stringValue(user.maritalStatus());
        String aadharNo = stringValue(user.aadharNo());

        if (name == null || email == null || phone == null || passwordHash == null || dob == null
                || maritalStatus == null || aadharNo == null) {
            return false;
        }

        if (isUserExists(email)) {
            return false;
        }
        User newUser = new User();
        newUser.setName(name);
        newUser.setEmail(email);
        newUser.setPhone(phone);
        newUser.setPasswordHash(apiService.makePasswordHash(passwordHash));
        newUser.setDob(LocalDate.parse(dob));
        newUser.setMaritalStatus(maritalStatus);
        newUser.setAadharNo(aadharNo);

        if (user.guardian() != null) {
            Guardian guardian = new Guardian();
            guardian.setName(stringValue(user.guardian().get("name")));
            guardian.setRelation(stringValue(user.guardian().get("relation")));
            guardian.setUser(newUser);
            newUser.setGuardian(guardian);
        }

        if (user.address() != null) {
            newUser.setStreet(stringValue(user.address().get("street")));
            newUser.setVillage(stringValue(user.address().get("village")));
            newUser.setCity(stringValue(user.address().get("city")));
            newUser.setState(stringValue(user.address().get("state")));
            newUser.setPincode(stringValue(user.address().get("pincode")));
        }

        if (user.nominee() != null) {
            Nominee nominee = new Nominee();
            nominee.setName(stringValue(user.nominee().get("name")));
            nominee.setAadharNo(stringValue(user.nominee().get("aadharNo")));
            nominee.setMobileNo(stringValue(user.nominee().get("mobileNo")));
            nominee.setRelation(stringValue(user.nominee().get("relation")));
            nominee.setUser(newUser);
            List<Nominee> nominees = new ArrayList<>();
            nominees.add(nominee);
            newUser.setNominees(nominees);
        }

        newUser.setEmailVerified(true);

        BankDetails bankDetails = new BankDetails();
        bankDetails.setBankName(stringValue(user.bankName()));
        bankDetails.setAccountHolderName(stringValue(user.accountHolderName()));
        bankDetails.setAccountNumber(stringValue(user.accountNumber()));
        bankDetails.setIfscCode(stringValue(user.ifscCode()));
        bankDetails.setUser(newUser);
        newUser.setBankDetails(bankDetails);

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
            User user = getUserByEmail(email);

            if (user == null || password == null || !BCrypt.checkpw(password, user.getPasswordHash())) {
                log.error("Invalid email or password for email={}", email);
                return general.response("error", "Invalid email or password", Map.of());
            }
            String token = "local-dev-token";
            UserProfile finalUser = general.toUserProfile(user, token);
            String nonValidPassword = password;
            if (!general.validatePassword(password)) {
                nonValidPassword = password;

            }
            // notifyUser
            crucialNotificationService.notifyUser(EssentialActionType.LOGIN, user, "", null);
            activityLogService.log(
                    user.getId(), user.getName(), "USER",
                    ActivityType.LOGIN,
                    user.getName() + " logged in",
                    "USER", user.getId(),
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
            @CacheEvict(value = "userPortfolio", key = "#userId"),
            @CacheEvict(value = "userSchemes", key = "#userId")
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

    @Cacheable(value = "userSchemes", key = "#userId")
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

    @Cacheable(value = "userPortfolio", key = "#userId")
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
                    .map(general::toUserPortfolio)
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
            @CacheEvict(value = "userPortfolio", key = "#userId"),
            @CacheEvict(value = "userSchemes", key = "#userId")
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

    @Caching(put = { @CachePut(value = "userProfile", key = "#up.id()") }, evict = {
            @CacheEvict(value = "userNominees", key = "#up.id()"),
            @CacheEvict(value = "userTransactions", key = "#up.id()")
    })
    @Transactional
    public Map<String, Object> updateUser(UserProfile up) {
        // create new token
        String token = "local-dev-token";

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
        userRepository.save(user);

        crucialNotificationService.notifyUser(EssentialActionType.BANK_DETAILS_UPDATED, user, "/dashboard/settings",
                null);

        return general.response("success", "User updated successfully", general.toUserProfile(user, token));
    }

    @CacheEvict(value = "userTransactions", key = "#wa.userId()")
    @Transactional
    public Map<String, Object> redeemAmount(WithdrawAmount wa) {

        // basic amount validation
        try {
            if (wa.amount() == null || wa.amount().compareTo(BigDecimal.ZERO) <= 0) {
                log.error("id: {},      amount: {},Invalid amount...", Map.of("amount", wa.amount()));
                return general.response("error", "Invalid amount...", null);
            }

            UserScheme us = getUserSchemeById(wa.userSchemeId());
            if (us == null) {
                log.error("userScheme not found for userSchemeId :{}", wa.userSchemeId());
                return general.response("error", "Invalid userSchemeId...", null);
            }
            User user = us.getUser();
            // ownership check: scheme must belong to this user
            if (user == null || !user.getId().equals(wa.userId())) {
                log.info("userScheme does not belong to user..., {}",
                        Map.of("userSchemeId", us.getUserSchemeId(), "userId", wa.userId()));
                return general.response("error", "userScheme does not belong to user...", null);
            }
            if (!wa.isAggressive()) { // general withdrawal and redeem profit
                // guard against re-redeeming the same profit(profit==redeemed)
                // this check is optional as user can redeem his profit multiple times
                if (us.getProfit().subtract(us.getProfitReedemed()).compareTo(BigDecimal.ZERO) == 0) {
                    log.info("profit already redeemed..., {}",
                            Map.of("userSchemeId", us.getUserSchemeId(), "profit", us.getProfit(), "profitRedeemed",
                                    us.getProfitReedemed(), "amount", wa.amount(), "userId", user.getId(),
                                    "redeemed_already",
                                    us.getProfitReedemed()));
                    return general.response("info", "profit already redeemed...", null);
                }
                if (us.getProfit() == null
                        || (us.getProfit().subtract(us.getProfitReedemed())).compareTo(wa.amount()) < 0) {
                    log.info("Insufficient Profit...",
                            Map.of("userSchemeId", us.getUserSchemeId(), "profit", us.getProfit(), "profitRedeemed",
                                    us.getProfitReedemed(), "amount", wa.amount(), "userId", user.getId()));
                    return general.response("error", "Insufficient Profit...", null);
                }

            } else { // aggressive withdrawal
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
            Transaction txn = new Transaction();
            txn.setUser(user);
            txn.setAmount(wa.amount());
            txn.setSchemeName(us.getScheme().getSchemeName());
            txn.setBankDetails(bankDetails);
            txn.setStatus(Transaction.TransactionStatus.PENDING);
            txn.setType(wa.isAggressive()
                    ? Transaction.TransactionType.AGGRESSIVE_WITHDRAWAL
                    : Transaction.TransactionType.GENERAL_WITHDRAWAL);
            txn.setUserScheme(us);
            Transaction savedTxn = transactionRepository.save(txn);

            crucialNotificationService.notifyAllForEssentialAction(
                    EssentialActionType.WITHDRAWAL_REQUESTED,
                    user,
                    List.of(),
                    null,
                    "/dashboard/requests",
                    Map.of("amount", wa.amount().toString(), "txnId",
                            savedTxn.getId() != null ? savedTxn.getId() : ""));

            // update redemption bookkeeping
            if (!wa.isAggressive()) {
                // add the redeemed amount to existing profitRedeemed
                if (us.getProfitReedemed() == null) {
                    us.setProfitReedemed(wa.amount());
                } else {
                    us.setProfitReedemed(us.getProfitReedemed().add(wa.amount()));
                }
            } else {
                // if you track aggressive redemptions separately, set that field here instead
                // e.g. us.setPaidAmountRedeemed(wa.amount());
                if (us.getProfitReedemed() == null) {
                    us.setProfitReedemed(wa.amount());
                } else {
                    us.setProfitReedemed(us.getProfitReedemed().add(wa.amount()));
                }
            }
            userSchemeRepository.save(us);

            return general.response("success", "Withdraw request placed successfully", null);
        } catch (Exception e) {
            log.error("Error in redeeming amount... {}.beacouse {}",
                    Map.of("amount", wa.amount(), "userId", wa.userId(), "userSchemeId", wa.userSchemeId()),
                    e.getMessage());
            return general.response("error", "Error in redeeming amount...", null);
        }
    }

    @Cacheable(value = "userTransactions", key = "#userId")
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

    @CacheEvict(value = "userNominees", key = "#nominee.userId()")
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

    @CacheEvict(value = "userNominees", key = "#userId")
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

    @CacheEvict(value = "userNominees", key = "#userId")
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

    @Cacheable(value = "userNotifications", key = "#userId + ':' + #tab + ':' + #page", unless = "#result.get('status') == 'error'")
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
        Pageable pageable = PageRequest.of(page - 1, 10, Sort.by(Sort.Direction.ASC, "createdAt"));
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
            log.error("Error while adding comment: " + e.getMessage());
            return general.response("error", "Failed to add comment", false);
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
