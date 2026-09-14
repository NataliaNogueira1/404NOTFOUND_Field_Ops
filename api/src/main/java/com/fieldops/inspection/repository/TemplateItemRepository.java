package com.fieldops.inspection.repository;

import com.fieldops.inspection.model.TemplateItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TemplateItemRepository extends JpaRepository<TemplateItem, Long> {
}
