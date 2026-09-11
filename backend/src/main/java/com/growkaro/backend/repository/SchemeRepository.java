package com.growkaro.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.history.RevisionRepository;
import org.springframework.stereotype.Repository;

import com.growkaro.backend.entity.Scheme;

@Repository
public interface SchemeRepository extends JpaRepository<Scheme, String>, RevisionRepository<Scheme, String, Integer> {
}
