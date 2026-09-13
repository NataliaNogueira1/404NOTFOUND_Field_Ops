package com.fieldops.inspection.dto;

import com.fieldops.inspection.model.InspectionStatus;

/**
 * Result of a mobile status transition. {@code applied} is false when the operation had
 * already been processed (idempotent resend): the body then reports the current state and
 * {@code result = ALREADY_APPLIED}.
 */
public record MobileStatusUpdateResponse(
        Long inspectionId,
        InspectionStatus status,
        String result,
        boolean applied) {

    public static MobileStatusUpdateResponse applied(Long id, InspectionStatus status) {
        return new MobileStatusUpdateResponse(id, status, "APPLIED", true);
    }

    public static MobileStatusUpdateResponse alreadyApplied(Long id, InspectionStatus status) {
        return new MobileStatusUpdateResponse(id, status, "ALREADY_APPLIED", false);
    }
}
