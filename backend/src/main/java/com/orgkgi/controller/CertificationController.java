package com.orgkgi.controller;

import com.orgkgi.entity.Certification;
import com.orgkgi.service.CertificationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/certifications")
public class CertificationController {

    private final CertificationService certificationService;

    public CertificationController(CertificationService certificationService) {
        this.certificationService = certificationService;
    }

    @PostMapping
    public Certification addCertification(@RequestBody Certification certification) {
        return certificationService.addCertification(certification);
    }

    @GetMapping
    public List<Certification> getAllCertifications() {
        return certificationService.getCertificationsByEmployeeId(null);
    }

    @GetMapping("/employee/{employeeId}")
    public List<Certification> getCertificationsByEmployee(@PathVariable Long employeeId) {
        return certificationService.getCertificationsByEmployeeId(employeeId);
    }

    @GetMapping("/{id}")
    public Certification getCertificationById(@PathVariable Long id) {
        return certificationService.getCertificationById(id);
    }

    @PutMapping("/{id}")
    public Certification updateCertification(@PathVariable Long id,
                                             @RequestBody Certification certification) {
        return certificationService.updateCertification(id, certification);
    }

    @DeleteMapping("/{id}")
    public void deleteCertification(@PathVariable Long id) {
        certificationService.deleteCertification(id);
    }
}
