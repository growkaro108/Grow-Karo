package com.growkaro.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "system_settings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettings {

    @Id
    private Long id;

    private BigDecimal minWithdrawal;
    private BigDecimal maxWithdrawal;
    private Double platformFee;
    private BigDecimal autoApproveLimit;
    private Boolean maintenanceMode;
    private Boolean mfaRequired;
    private Boolean emailAlerts;
    private String webhookUrl;
}
