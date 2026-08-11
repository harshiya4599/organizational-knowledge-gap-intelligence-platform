package com.orgkgi.service;

import com.orgkgi.entity.Mentorship;
import com.orgkgi.exception.MentorshipNotFoundException;
import com.orgkgi.repository.MentorshipRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MentorshipService {

    private final MentorshipRepository mentorshipRepository;

    public MentorshipService(MentorshipRepository mentorshipRepository) {
        this.mentorshipRepository = mentorshipRepository;
    }

    // Create Mentorship
    public Mentorship addMentorship(Mentorship mentorship) {
        return mentorshipRepository.save(mentorship);
    }

    // Get All Mentorships
    public List<Mentorship> getAllMentorships() {
        return mentorshipRepository.findAll();
    }

    // Get Mentorship By Id
    public Mentorship getMentorshipById(Long id) {
        return mentorshipRepository.findById(id)
                .orElseThrow(() ->
                        new MentorshipNotFoundException(
                                "Mentorship not found with id: " + id));
    }

    // Update Mentorship
    public Mentorship updateMentorship(Long id, Mentorship updatedMentorship) {

        Mentorship existingMentorship = mentorshipRepository.findById(id)
                .orElseThrow(() ->
                        new MentorshipNotFoundException(
                                "Mentorship not found with id: " + id));

        existingMentorship.setMentor(updatedMentorship.getMentor());
        existingMentorship.setMentee(updatedMentorship.getMentee());
        existingMentorship.setStatus(updatedMentorship.getStatus());

        return mentorshipRepository.save(existingMentorship);
    }

    // Delete Mentorship
    public void deleteMentorship(Long id) {

        Mentorship mentorship = mentorshipRepository.findById(id)
                .orElseThrow(() ->
                        new MentorshipNotFoundException(
                                "Mentorship not found with id: " + id));

        mentorshipRepository.delete(mentorship);
    }
}