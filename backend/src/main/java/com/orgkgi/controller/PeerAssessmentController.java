package com.orgkgi.controller;

import com.orgkgi.entity.PeerAssessment;
import com.orgkgi.service.PeerAssessmentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/peer-assessments")
public class PeerAssessmentController {

    private final PeerAssessmentService peerAssessmentService;

    public PeerAssessmentController(PeerAssessmentService peerAssessmentService) {
        this.peerAssessmentService = peerAssessmentService;
    }

    @PostMapping
    public PeerAssessment addPeerAssessment(@RequestBody PeerAssessment peerAssessment) {
        return peerAssessmentService.addPeerAssessment(peerAssessment);
    }

    @GetMapping("/employee/{employeeId}")
    public List<PeerAssessment> getPeerAssessmentsByEmployee(@PathVariable Long employeeId) {
        return peerAssessmentService.getPeerAssessmentsByEmployeeId(employeeId);
    }

    @GetMapping("/assessor/{assessorId}")
    public List<PeerAssessment> getPeerAssessmentsByAssessor(@PathVariable Long assessorId) {
        return peerAssessmentService.getPeerAssessmentsByAssessorId(assessorId);
    }

    @GetMapping("/{id}")
    public PeerAssessment getPeerAssessmentById(@PathVariable Long id) {
        return peerAssessmentService.getPeerAssessmentById(id);
    }

    @PutMapping("/{id}")
    public PeerAssessment updatePeerAssessment(@PathVariable Long id,
                                               @RequestBody PeerAssessment peerAssessment) {
        return peerAssessmentService.updatePeerAssessment(id, peerAssessment);
    }

    @DeleteMapping("/{id}")
    public void deletePeerAssessment(@PathVariable Long id) {
        peerAssessmentService.deletePeerAssessment(id);
    }
}
