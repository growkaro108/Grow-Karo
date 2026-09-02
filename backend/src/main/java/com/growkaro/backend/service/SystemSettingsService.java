package com.growkaro.backend.service;

import com.growkaro.backend.entity.SystemSettings;
import com.growkaro.backend.repository.SystemSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SystemSettingsService {

    private final SystemSettingsRepository repository;

    public SystemSettings getSettings() {
        List<SystemSettings> settings = repository.findAll();
        if (settings.isEmpty()) {
            return createDefaultSettings();
        }
        return settings.get(0);
    }

    public SystemSettings updateSettings(SystemSettings newSettings) {
        newSettings.setId(1L);
        return repository.save(newSettings);
    }

    private SystemSettings createDefaultSettings() {
        SystemSettings settings = SystemSettings.builder()
                .id(1L)
                .minWithdrawal(new BigDecimal("500"))
                .maxWithdrawal(new BigDecimal("500000"))
                .platformFee(1.5)
                .autoApproveLimit(new BigDecimal("25000"))
                .maintenanceMode(false)
                .mfaRequired(true)
                .emailAlerts(true)
                .webhookUrl("https://api.grow-karo.com/v1/webhooks/admin")
                .build();
        return repository.save(settings);
    }
}
