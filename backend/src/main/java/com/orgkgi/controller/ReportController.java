package com.orgkgi.controller;

import com.orgkgi.repository.DepartmentRepository;
import com.orgkgi.repository.EmployeeRepository;
import com.orgkgi.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/reports", "/api/reports"})
public class ReportController {

    private final ReportService reportService;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;

    public ReportController(ReportService reportService,
                            EmployeeRepository employeeRepository,
                            DepartmentRepository departmentRepository) {
        this.reportService = reportService;
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getReports() {
        Long employeeId = employeeRepository.findAll().stream().findFirst().map(employee -> employee.getId()).orElse(1L);
        Long departmentId = departmentRepository.findAll().stream().findFirst().map(department -> department.getId()).orElse(1L);

        return ResponseEntity.ok(Map.of(
                "employeeReport", reportService.generateEmployeeReport(employeeId),
                "departmentReport", reportService.generateDepartmentReport(departmentId),
                "trainingEffectivenessReport", reportService.generateTrainingEffectivenessReport(),
                "workforceAnalyticsReport", reportService.generateWorkforceAnalyticsReport()
        ));
    }

    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateReport(@RequestBody Map<String, Object> payload) {
        if (payload == null || payload.get("type") == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Report type is required"));
        }

        String type = payload.get("type").toString();
        Long id = payload.get("id") == null ? null : Long.valueOf(payload.get("id").toString());

        return switch (type.toLowerCase()) {
            case "employee" -> ResponseEntity.ok(reportService.generateEmployeeReport(id != null ? id : employeeRepository.findAll().stream().findFirst().map(employee -> employee.getId()).orElse(1L)));
            case "department" -> ResponseEntity.ok(reportService.generateDepartmentReport(id != null ? id : departmentRepository.findAll().stream().findFirst().map(department -> department.getId()).orElse(1L)));
            case "training" -> ResponseEntity.ok(reportService.generateTrainingEffectivenessReport());
            case "workforce" -> ResponseEntity.ok(reportService.generateWorkforceAnalyticsReport());
            default -> ResponseEntity.badRequest().body(Map.of("error", "Unknown report type"));
        };
    }
}
