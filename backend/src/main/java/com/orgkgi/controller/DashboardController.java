package com.orgkgi.controller;

import com.orgkgi.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import com.orgkgi.security.EmployeeAccessService;

import java.util.Map;

@RestController
@RequestMapping({"/dashboard", "/api/dashboard"})
public class DashboardController {

    private final DashboardService dashboardService;
    private final EmployeeAccessService employeeAccessService;

    public DashboardController(DashboardService dashboardService, EmployeeAccessService employeeAccessService) {
        this.dashboardService = dashboardService;
        this.employeeAccessService = employeeAccessService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getDashboard(Authentication authentication) {
        boolean isEmployee = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_EMPLOYEE"));
        return ResponseEntity.ok(isEmployee
                ? dashboardService.getEmployeeDashboardData(employeeAccessService.getEmployeeId(authentication))
                : dashboardService.getDashboardData());
    }
}
