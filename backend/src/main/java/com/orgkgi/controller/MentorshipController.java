package com.orgkgi.controller;

import com.orgkgi.entity.Mentorship;
import com.orgkgi.service.MentorshipService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/mentorships")
public class MentorshipController {

    private final MentorshipService mentorshipService;

    public MentorshipController(MentorshipService mentorshipService) {
        this.mentorshipService = mentorshipService;
    }

    @GetMapping
    public List<Mentorship> getAllMentorships() {
        return mentorshipService.getAllMentorships();
    }

    @GetMapping("/{id}")
    public Mentorship getMentorshipById(@PathVariable Long id) {
        return mentorshipService.getMentorshipById(id);
    }

    @PostMapping
    public Mentorship addMentorship(@Valid @RequestBody Mentorship mentorship) {
        return mentorshipService.addMentorship(mentorship);
    }

    @PutMapping("/{id}")
    public Mentorship updateMentorship(@PathVariable Long id,
                                       @Valid @RequestBody Mentorship mentorship) {
        return mentorshipService.updateMentorship(id, mentorship);
    }

    @DeleteMapping("/{id}")
    public String deleteMentorship(@PathVariable Long id) {
        mentorshipService.deleteMentorship(id);
        return "Mentorship deleted successfully";
    }
}