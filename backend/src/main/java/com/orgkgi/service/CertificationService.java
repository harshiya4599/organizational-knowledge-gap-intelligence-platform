package com.orgkgi.service;

import com.orgkgi.entity.Certification;
import com.orgkgi.exception.CertificationNotFoundException;
import com.orgkgi.repository.CertificationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CertificationService {

    private final CertificationRepository certificationRepository;

    public CertificationService(CertificationRepository certificationRepository) {
        this.certificationRepository = certificationRepository;
    }

    public Certification addCertification(Certification certification) {
        return certificationRepository.save(certification);
    }

    public List<Certification> getCertificationsByEmployeeId(Long employeeId) {
        return certificationRepository.findByEmployeeId(employeeId);
    }

    public Certification getCertificationById(Long id) {
        return certificationRepository.findById(id)
                .orElseThrow(() -> new CertificationNotFoundException("Certification not found with id: " + id));
    }

    public Certification updateCertification(Long id, Certification updatedCertification) {
        Certification certification = certificationRepository.findById(id)
                .orElseThrow(() -> new CertificationNotFoundException("Certification not found with id: " + id));

        certification.setName(updatedCertification.getName());
        certification.setProvider(updatedCertification.getProvider());
        certification.setCredentialId(updatedCertification.getCredentialId());
        certification.setEmployee(updatedCertification.getEmployee());

        return certificationRepository.save(certification);
    }

    public void deleteCertification(Long id) {
        Certification certification = certificationRepository.findById(id)
                .orElseThrow(() -> new CertificationNotFoundException("Certification not found with id: " + id));

        certificationRepository.delete(certification);
    }
}
