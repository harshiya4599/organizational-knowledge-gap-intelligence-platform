package com.orgkgi.repository;

import com.orgkgi.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findByEmployeeCode(String employeeCode);

    boolean existsByEmployeeCode(String employeeCode);

    Optional<Employee> findByEmail(String email);

    Optional<Employee> findByUserId(Long userId);

    boolean existsByEmail(String email);
}
