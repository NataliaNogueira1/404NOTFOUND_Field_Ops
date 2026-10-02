package com.fieldops.reviewcomment.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fieldops.reviewcomment.dto.CreateReviewCommentRequest;
import com.fieldops.reviewcomment.dto.ReviewCommentResponse;
import com.fieldops.reviewcomment.service.ReviewCommentService;
import com.fieldops.shared.security.AuthenticatedUser;
import com.fieldops.user.model.Role;
import com.fieldops.user.model.User;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ReviewCommentControllerTest {

    @Mock
    private ReviewCommentService reviewCommentService;

    @InjectMocks
    private ReviewCommentController controller;

    @Test
    void addsReviewCommentForChecklistItem() {
        CreateReviewCommentRequest request = new CreateReviewCommentRequest("Repeat the measurement.");
        ReviewCommentResponse expected = new ReviewCommentResponse(7L, 9L, "Electrical safety",
                "Cables intact?", request.comment(), Instant.parse("2026-09-26T13:00:00Z"), "Supervisor");
        when(reviewCommentService.add(12L, 9L, request.comment(), 4L)).thenReturn(expected);

        ResponseEntity<ReviewCommentResponse> response = controller.add(12L, 9L, request, principal());

        assertThat(response.getBody()).isEqualTo(expected);
        verify(reviewCommentService).add(12L, 9L, request.comment(), 4L);
    }

    private AuthenticatedUser principal() {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", 4L);
        user.setName("Supervisor");
        user.setEmail("supervisor@fieldops.com");
        user.setPassword("hash");
        user.setRole(Role.SUPERVISOR);
        return new AuthenticatedUser(user);
    }
}
