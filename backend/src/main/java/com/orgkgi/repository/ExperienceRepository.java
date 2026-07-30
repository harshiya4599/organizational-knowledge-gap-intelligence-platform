package com.orgkgi.repository;

import com.orgkgi.entity.Experience;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExperienceRepository extends JpaRepository<Experience, Long> {
    List<Experience> findByEmployeeId(Long employeeId);
}
