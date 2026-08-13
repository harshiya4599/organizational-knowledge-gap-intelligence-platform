package com.orgkgi.controller;

import com.orgkgi.entity.Certification;
import com.orgkgi.service.CertificationService;
import com.orgkgi.security.EmployeeAccessService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/certifications")
public class CertificationController {

    private final CertificationService certificationService;
    private final EmployeeAccessService employeeAccessService;

    public CertificationController(CertificationService certificationService, EmployeeAccessService employeeAccessService) {
        this.certificationService = certificationService;
        this.employeeAccessService = employeeAccessService;
    }

    @PostMapping
    public Certification addCertification(@RequestBody Certification certification, Authentication authentication) {
        employeeAccessService.requireAccess(certification.getEmployee().getId(), authentication);
        return certificationService.addCertification(certification);
    }

    @GetMapping
    public List<Certification> getAllCertifications(Authentication authentication) {
        return certificationService.getCertificationsByEmployeeId(employeeAccessService.getEmployeeId(authentication));
    }

    @GetMapping("/employee/{employeeId}")
    public List<Certification> getCertificationsByEmployee(@PathVariable Long employeeId, Authentication authentication) {
        employeeAccessService.requireAccess(employeeId, authentication);
        return certificationService.getCertificationsByEmployeeId(employeeId);
    }

    @GetMapping("/{id}")
    public Certification getCertificationById(@PathVariable Long id, Authentication authentication) {
        Certification certification = certificationService.getCertificationById(id);
        employeeAccessService.requireAccess(certification.getEmployee().getId(), authentication);
        return certification;
    }

    @PutMapping("/{id}")
    public Certification updateCertification(@PathVariable Long id,
                                             @RequestBody Certification certification, Authentication authentication) {
        employeeAccessService.requireAccess(certificationService.getCertificationById(id).getEmployee().getId(), authentication);
        employeeAccessService.requireAccess(certification.getEmployee().getId(), authentication);
        return certificationService.updateCertification(id, certification);
    }

    @DeleteMapping("/{id}")
    public void deleteCertification(@PathVariable Long id, Authentication authentication) {
        employeeAccessService.requireAccess(certificationService.getCertificationById(id).getEmployee().getId(), authentication);
        certificationService.deleteCertification(id);
    }
}
