package com.orgkgi.repository;

import com.orgkgi.entity.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssessmentRepository extends JpaRepository<Assessment, Long> {
    List<Assessment> findByEmployeeId(Long employeeId);
}
