package com.orgkgi.repository;

import com.orgkgi.entity.GapAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GapAnalysisRepository extends JpaRepository<GapAnalysis, Long> {

    List<GapAnalysis> findByEmployeeId(Long employeeId);

    void deleteByEmployeeId(Long employeeId);

}
