package com.orgkgi.repository;

import com.orgkgi.entity.EducationHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EducationHistoryRepository extends JpaRepository<EducationHistory, Long> {
    List<EducationHistory> findByEmployeeId(Long employeeId);
}
