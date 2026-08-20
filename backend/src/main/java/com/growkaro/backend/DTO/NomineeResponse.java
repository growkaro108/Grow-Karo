package com.growkaro.backend.DTO;

import com.growkaro.backend.entity.Nominee;

public record NomineeResponse(
        String nomineeId,
        String name,
        String aadharNo,
        String mobileNo,
        String relation) {
    public static NomineeResponse fromEntity(Nominee nominee) {
        return new NomineeResponse(
                nominee.getNomineeId(),
                nominee.getName(),
                nominee.getAadharNo(),
                nominee.getMobileNo(),
                nominee.getRelation());
    }
}
