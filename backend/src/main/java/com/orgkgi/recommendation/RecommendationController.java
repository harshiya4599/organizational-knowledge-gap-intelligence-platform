package com.orgkgi.recommendation;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.orgkgi.entity.Recommendation;
import com.orgkgi.security.EmployeeAccessService;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final EmployeeAccessService employeeAccessService;

    public RecommendationController(RecommendationService recommendationService, EmployeeAccessService employeeAccessService) {
        this.recommendationService = recommendationService;
        this.employeeAccessService = employeeAccessService;
    }

    @GetMapping("/{employeeId}")
    public ResponseEntity<List<Recommendation>> getRecommendations(@PathVariable Long employeeId, Authentication authentication) {
        employeeAccessService.requireAccess(employeeId, authentication);
        return ResponseEntity.ok(recommendationService.getRecommendationsByEmployeeId(employeeId));
    }

    @GetMapping("/history/{employeeId}")
    public ResponseEntity<List<Recommendation>> getHistory(@PathVariable Long employeeId, Authentication authentication) {
        employeeAccessService.requireAccess(employeeId, authentication);
        return ResponseEntity.ok(recommendationService.getRecommendationHistory(employeeId));
    }

    @PostMapping("/generate")
    public ResponseEntity<String> generate(@RequestBody Map<String, Long> body, Authentication authentication) {
        Long employeeId = body.get("employeeId");
        employeeAccessService.requireAccess(employeeId, authentication);
        recommendationService.generateRecommendationsForEmployee(employeeId);
        return ResponseEntity.ok("Recommendations generated for " + employeeId);
    }

    @PostMapping("/refresh")
    public ResponseEntity<String> refresh(@RequestBody Map<String, Long> body, Authentication authentication) {
        Long employeeId = body.get("employeeId");
        employeeAccessService.requireAccess(employeeId, authentication);
        recommendationService.refreshRecommendations(employeeId);
        return ResponseEntity.ok("Recommendations refreshed for " + employeeId);
    }
}
