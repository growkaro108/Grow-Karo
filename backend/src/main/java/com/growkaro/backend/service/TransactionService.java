package com.growkaro.backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.growkaro.backend.entity.Transaction.TransactionType;
import com.growkaro.backend.entity.BankDetails;
import com.growkaro.backend.entity.Transaction;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.repository.TransactionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionService {
    private final TransactionRepository transactionRepository;

    @Async
    public void createDepositTransaction(UserScheme userScheme, User user, BigDecimal amount,
            LocalDateTime settlementDate,
            TransactionType type, String note) {
        try {
            Transaction transaction = new Transaction();
            transaction.setUserScheme(userScheme);
            transaction.setUser(user);
            transaction.setAmount(amount);
            transaction.setSettlementDate(settlementDate);
            transaction.setType(type);
            transaction.setBankDetails(user.getBankDetails());
            transaction.setStatus(Transaction.TransactionStatus.SUCCESS);
            transactionRepository.save(transaction);
        } catch (Exception e) {
            log.error("Error creating transaction for user scheme {} because of :{}", userScheme.getUserSchemeId(),
                    e.getMessage());
        }
    }

    public void createPendingReedemTransaction(User u, BigDecimal amount, UserScheme us, BankDetails bankDetails,
            TransactionType type) {
        Transaction txn = new Transaction();
        txn.setUser(u);
        txn.setAmount(amount);
        txn.setSchemeName(us.getScheme().getSchemeName());
        txn.setBankDetails(bankDetails);
        txn.setStatus(Transaction.TransactionStatus.PENDING);
        txn.setType(type);
        txn.setUserScheme(us);
        transactionRepository.save(txn);
    }
}
