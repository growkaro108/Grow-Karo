package com.growkaro.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.growkaro.backend.entity.BankDetails;

@Repository
public interface BankDetailsRepository extends JpaRepository<BankDetails, String> {

}
