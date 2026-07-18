package com.growkaro.backend.DRO;

import lombok.Builder;
import lombok.Data;

/**
 * Use this for recipients that are NOT rows in your User table
 * (e.g. a partner bank / remitter desk you only have an email for).
 * If your Remitter IS a User in the system, just pass the User entity
 * directly to CrucialNotificationService instead of building this.
 */
@Data
@Builder
public class RecipientContact {
    private String name;
    private String email;
}
