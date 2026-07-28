package com.orgkgi.service;

import com.orgkgi.entity.Skill;
import com.orgkgi.exception.SkillNotFoundException;
import com.orgkgi.exception.DuplicateSkillException;
import com.orgkgi.repository.SkillRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SkillService {

    private final SkillRepository skillRepository;

    public SkillService(SkillRepository skillRepository) {
        this.skillRepository = skillRepository;
    }

    // Create Skill
    public Skill addSkill(Skill skill) {

        if(skillRepository.existsBySkillName(skill.getName())) {
            throw new DuplicateSkillException("Skill already exists: " + skill.getName());
        }

        return skillRepository.save(skill);
    }

    // Get All Skills
    public List<Skill> getAllSkills() {
        return skillRepository.findAll();
    }

    // Get Skill By Id
    public Skill getSkillById(Long id) {

        return skillRepository.findById(id)
                .orElseThrow(() ->
                        new SkillNotFoundException("Skill not found with id: " + id));
    }

    // Update Skill
    public Skill updateSkill(Long id, Skill updatedSkill) {

        Skill existingSkill = skillRepository.findById(id)
                .orElseThrow(() ->
                        new SkillNotFoundException("Skill not found with id: " + id));

        existingSkill.setName(updatedSkill.getName());
        existingSkill.setCategory(updatedSkill.getCategory());

        return skillRepository.save(existingSkill);
    }

    // Delete Skill
    public void deleteSkill(Long id) {

        Skill skill = skillRepository.findById(id)
                .orElseThrow(() ->
                        new SkillNotFoundException("Skill not found with id: " + id));

        skillRepository.delete(skill);
    }
}