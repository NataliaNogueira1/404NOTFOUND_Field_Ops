package com.fieldops.reviewcomment.controller;

import com.fieldops.reviewcomment.dto.CreateReviewCommentRequest;
import com.fieldops.reviewcomment.dto.ReviewCommentResponse;
import com.fieldops.reviewcomment.service.ReviewCommentService;
import com.fieldops.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/inspections")
@Tag(name = "Review comments")
@SecurityRequirement(name = "bearer-jwt")
@PreAuthorize("hasAnyAuthority('ADMINISTRATOR', 'SUPERVISOR')")
public class ReviewCommentController {

    private final ReviewCommentService reviewCommentService;

    public ReviewCommentController(ReviewCommentService reviewCommentService) {
        this.reviewCommentService = reviewCommentService;
    }

    @Operation(summary = "Add a review comment to an inspection checklist item")
    @ApiResponse(responseCode = "200", description = "Review comment recorded")
    @ApiResponse(responseCode = "404", description = "Inspection or checklist item not found")
    @PostMapping("/{id}/items/{itemId}/review-comment")
    public ResponseEntity<ReviewCommentResponse> add(@PathVariable Long id, @PathVariable Long itemId,
            @Valid @RequestBody CreateReviewCommentRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(reviewCommentService.add(id, itemId, request.comment(), user.getId()));
    }

    @Operation(summary = "List review comments for an inspection")
    @ApiResponse(responseCode = "200", description = "Comments ordered by checklist section and item")
    @ApiResponse(responseCode = "404", description = "Inspection not found")
    @GetMapping("/{id}/review-comments")
    public ResponseEntity<List<ReviewCommentResponse>> list(@PathVariable Long id) {
        return ResponseEntity.ok(reviewCommentService.list(id));
    }
}
