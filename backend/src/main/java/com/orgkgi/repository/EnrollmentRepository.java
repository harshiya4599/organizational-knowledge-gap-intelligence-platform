package com.orgkgi.repository;

import com.orgkgi.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    List<Enrollment> findByEmployeeId(Long employeeId);

}