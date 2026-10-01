package com.fieldops.reviewcomment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateReviewCommentRequest(
        @NotBlank(message = "comment is required")
        @Size(max = 2000, message = "comment must be at most 2000 characters") String comment) {
}
