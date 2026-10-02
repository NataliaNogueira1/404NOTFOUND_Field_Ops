package com.fieldops.reviewcomment.dto;

import java.time.Instant;

public record ReviewCommentResponse(
        Long id,
        Long itemId,
        String section,
        String item,
        String comment,
        Instant createdAt,
        String createdBy) {
}
