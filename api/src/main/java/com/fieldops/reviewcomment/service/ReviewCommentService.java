package com.fieldops.reviewcomment.service;

import com.fieldops.audit.model.AuditAction;
import com.fieldops.audit.service.AuditService;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.inspection.repository.InspectionItemSnapshotRepository;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.reviewcomment.dto.ReviewCommentResponse;
import com.fieldops.reviewcomment.model.ReviewComment;
import com.fieldops.reviewcomment.repository.ReviewCommentRepository;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewCommentService {

    private final InspectionRepository inspectionRepository;
    private final InspectionItemSnapshotRepository inspectionItemSnapshotRepository;
    private final ReviewCommentRepository reviewCommentRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public ReviewCommentService(InspectionRepository inspectionRepository,
            InspectionItemSnapshotRepository inspectionItemSnapshotRepository,
            ReviewCommentRepository reviewCommentRepository, UserRepository userRepository,
            AuditService auditService) {
        this.inspectionRepository = inspectionRepository;
        this.inspectionItemSnapshotRepository = inspectionItemSnapshotRepository;
        this.reviewCommentRepository = reviewCommentRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    /** Adds immutable reviewer guidance for an item in an inspection checklist snapshot. */
    @Transactional
    public ReviewCommentResponse add(Long inspectionId, Long itemSnapshotId, String comment, Long reviewerId) {
        Inspection inspection = findInspection(inspectionId);
        InspectionItemSnapshot snapshot = findSnapshot(itemSnapshotId, inspectionId);
        User reviewer = findReviewer(reviewerId);
        ReviewComment saved = reviewCommentRepository.save(
                ReviewComment.create(inspection, snapshot, comment.trim(), reviewer));
        auditService.recordInspection(reviewerId, AuditAction.REVIEW_COMMENT_ADDED, inspectionId,
                "itemSnapshotId=" + itemSnapshotId);
        return toResponse(saved);
    }

    /** Lists reviewer guidance ordered by the frozen checklist structure and creation time. */
    @Transactional(readOnly = true)
    public List<ReviewCommentResponse> list(Long inspectionId) {
        findInspection(inspectionId);
        return reviewCommentRepository.findByInspectionIdOrdered(inspectionId).stream()
                .map(this::toResponse)
                .toList();
    }

    private Inspection findInspection(Long id) {
        return inspectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection not found: " + id));
    }

    private InspectionItemSnapshot findSnapshot(Long itemSnapshotId, Long inspectionId) {
        return inspectionItemSnapshotRepository.findByIdAndInspectionId(itemSnapshotId, inspectionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Inspection item snapshot not found: " + itemSnapshotId));
    }

    private User findReviewer(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    private ReviewCommentResponse toResponse(ReviewComment comment) {
        return new ReviewCommentResponse(comment.getId(), comment.getItemSnapshot().getId(),
                comment.getItemSnapshot().getSectionTitle(), comment.getItemSnapshot().getItemTitle(),
                comment.getComment(), comment.getCreatedAt(), comment.getCreatedBy().getName());
    }
}
