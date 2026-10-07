package com.growkaro.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.growkaro.backend.entity.Nominee;

public interface NomineeRepository extends JpaRepository<Nominee, String> {
    // Custom query methods can be defined here if needed

    boolean existsByNomineeIdAndUser_Id(String nomineeId, String userId);
}
