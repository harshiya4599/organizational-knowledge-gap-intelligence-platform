package com.orgkgi.repository;

import com.orgkgi.entity.Mentorship;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MentorshipRepository extends JpaRepository<Mentorship, Long> {

    List<Mentorship> findByMentorId(Long mentorId);

    List<Mentorship> findByMenteeId(Long menteeId);

}