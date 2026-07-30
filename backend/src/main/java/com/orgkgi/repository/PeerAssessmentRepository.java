package com.orgkgi.repository;

import com.orgkgi.entity.PeerAssessment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PeerAssessmentRepository extends JpaRepository<PeerAssessment, Long> {
    List<PeerAssessment> findByEmployeeId(Long employeeId);
    List<PeerAssessment> findByAssessorId(Long assessorId);
}
