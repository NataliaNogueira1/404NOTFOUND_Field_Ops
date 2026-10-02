package com.fieldops.reviewcomment.repository;

import com.fieldops.reviewcomment.model.ReviewComment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewCommentRepository extends JpaRepository<ReviewComment, Long> {

    @Query("""
        SELECT comment FROM ReviewComment comment
        JOIN FETCH comment.itemSnapshot snapshot
        JOIN FETCH comment.createdBy
        WHERE comment.inspection.id = :inspectionId
        ORDER BY snapshot.sectionOrder, snapshot.itemOrder, comment.createdAt
    """)
    List<ReviewComment> findByInspectionIdOrdered(@Param("inspectionId") Long inspectionId);
}
