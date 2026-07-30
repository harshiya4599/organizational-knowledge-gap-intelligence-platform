package com.orgkgi.service;

import com.orgkgi.entity.PeerAssessment;
import com.orgkgi.exception.PeerAssessmentNotFoundException;
import com.orgkgi.repository.PeerAssessmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PeerAssessmentService {

    private final PeerAssessmentRepository peerAssessmentRepository;

    public PeerAssessmentService(PeerAssessmentRepository peerAssessmentRepository) {
        this.peerAssessmentRepository = peerAssessmentRepository;
    }

    public PeerAssessment addPeerAssessment(PeerAssessment peerAssessment) {
        return peerAssessmentRepository.save(peerAssessment);
    }

    public List<PeerAssessment> getPeerAssessmentsByEmployeeId(Long employeeId) {
        return peerAssessmentRepository.findByEmployeeId(employeeId);
    }

    public List<PeerAssessment> getPeerAssessmentsByAssessorId(Long assessorId) {
        return peerAssessmentRepository.findByAssessorId(assessorId);
    }

    public PeerAssessment getPeerAssessmentById(Long id) {
        return peerAssessmentRepository.findById(id)
                .orElseThrow(() -> new PeerAssessmentNotFoundException("Peer assessment not found with id: " + id));
    }

    public PeerAssessment updatePeerAssessment(Long id, PeerAssessment updatedPeerAssessment) {
        PeerAssessment peerAssessment = peerAssessmentRepository.findById(id)
                .orElseThrow(() -> new PeerAssessmentNotFoundException("Peer assessment not found with id: " + id));

        peerAssessment.setEmployee(updatedPeerAssessment.getEmployee());
        peerAssessment.setAssessor(updatedPeerAssessment.getAssessor());
        peerAssessment.setSkill(updatedPeerAssessment.getSkill());
        peerAssessment.setScore(updatedPeerAssessment.getScore());
        peerAssessment.setComments(updatedPeerAssessment.getComments());

        return peerAssessmentRepository.save(peerAssessment);
    }

    public void deletePeerAssessment(Long id) {
        PeerAssessment peerAssessment = peerAssessmentRepository.findById(id)
                .orElseThrow(() -> new PeerAssessmentNotFoundException("Peer assessment not found with id: " + id));

        peerAssessmentRepository.delete(peerAssessment);
    }
}
