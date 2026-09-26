package com.fieldops.answer.repository;

import com.fieldops.answer.model.InspectionAnswer;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InspectionAnswerRepository extends JpaRepository<InspectionAnswer, Long> {

    @Query("""
        SELECT a FROM InspectionAnswer a
        JOIN FETCH a.itemSnapshot snapshot
        JOIN FETCH a.answeredBy
        WHERE a.inspection.id = :inspectionId
        ORDER BY snapshot.sectionOrder, snapshot.itemOrder, a.answeredAt
    """)
    List<InspectionAnswer> findHistoryByInspectionId(@Param("inspectionId") Long inspectionId);
}
