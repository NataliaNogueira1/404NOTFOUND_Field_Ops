package com.fieldops.reviewcomment.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fieldops.audit.model.AuditAction;
import com.fieldops.audit.service.AuditService;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.inspection.repository.InspectionItemSnapshotRepository;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.reviewcomment.model.ReviewComment;
import com.fieldops.reviewcomment.repository.ReviewCommentRepository;
import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ReviewCommentServiceTest {

    @Mock
    private InspectionRepository inspectionRepository;

    @Mock
    private InspectionItemSnapshotRepository inspectionItemSnapshotRepository;

    @Mock
    private ReviewCommentRepository reviewCommentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ReviewCommentService reviewCommentService;

    @Test
    void savesCommentForInspectionItemAndRecordsAuditEvent() {
        Inspection inspection = new Inspection();
        InspectionItemSnapshot snapshot = org.mockito.Mockito.mock(InspectionItemSnapshot.class);
        User reviewer = new User();
        ReflectionTestUtils.setField(reviewer, "id", 4L);
        when(inspectionRepository.findById(12L)).thenReturn(Optional.of(inspection));
        when(inspectionItemSnapshotRepository.findByIdAndInspectionId(9L, 12L))
                .thenReturn(Optional.of(snapshot));
        when(userRepository.findById(4L)).thenReturn(Optional.of(reviewer));
        when(reviewCommentRepository.save(any(ReviewComment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        reviewCommentService.add(12L, 9L, "Repeat the measurement with a calibrated device.", 4L);

        verify(reviewCommentRepository).save(any(ReviewComment.class));
        verify(auditService).recordInspection(4L, AuditAction.REVIEW_COMMENT_ADDED, 12L,
                "itemSnapshotId=9");
    }
}
