package com.growkaro.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.growkaro.backend.entity.UserSchemeReedemLedger;

public interface ReedemLedgerRepository extends JpaRepository<UserSchemeReedemLedger, String> {

}
