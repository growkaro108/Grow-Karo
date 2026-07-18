package com.growkaro.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.growkaro.backend.entity.ActivityLog;

public interface ActivityLogRepository
                extends JpaRepository<ActivityLog, Long>, JpaSpecificationExecutor<ActivityLog> {
}
