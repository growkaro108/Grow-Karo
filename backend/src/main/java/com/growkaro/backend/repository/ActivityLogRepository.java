package com.growkaro.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import com.growkaro.backend.entity.ActivityLog;
import com.growkaro.backend.enums.ActivityType;

public interface ActivityLogRepository
        extends JpaRepository<ActivityLog, Long>, JpaSpecificationExecutor<ActivityLog> {

    // get all stored values of enum ActivityType
    @Query("SELECT DISTINCT type FROM ActivityLog")
    List<ActivityType> findDistinctTypes();
}
