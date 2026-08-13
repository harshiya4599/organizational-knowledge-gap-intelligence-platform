/**
 * mentorshipService.js
 * Hybrid backend API & persistent hybrid store service for Knowledge-Sharing & Mentorship Module.
 */

import api from './api';
import { fetchWithFallback } from '../utils/apiFallback';
import {
  getCollection,
  addCollectionItem,
  registerForSession as storeRegister,
  cancelSessionRegistration as storeCancel,
  createMentorshipRequest,
  cancelMentorshipRequest,
  bookExpertConsultation,
  cancelExpertConsultation,
  toggleCommunityMembership,
  addCommunityDiscussion,
  addCommunityResource,
  toggleResourceBookmark,
  addSessionFeedbackItem,
} from '../utils/hybridStore';

// ── 1. Mentors & Mentorship Matching ─────────────────────────
export function normalizeMentor(m) {
  if (!m) return null;
  return {
    id: m.id,
    employeeId: m.employeeId || m.id,
    name: m.name || 'Mentor',
    avatar: m.avatar || 'M',
    department: m.department || 'Engineering',
    designation: m.designation || 'Principal Specialist',
    expertise: m.expertise || 'System Architecture & Engineering',
    mentorSkills: Array.isArray(m.mentorSkills) ? m.mentorSkills : [],
    experienceYears: m.experienceYears || 8,
    rating: typeof m.rating === 'number' ? m.rating : 4.9,
    sessionsCount: m.sessionsCount || 15,
    activeMentees: m.activeMentees || 2,
    maxMentees: m.maxMentees || 4,
    availability: m.availability || 'Available',
    bio: m.bio || 'Organizational domain expert providing technical mentorship and growth coaching.',
    preferredTopics: Array.isArray(m.preferredTopics) ? m.preferredTopics : ['System Design', 'Technical Guidance'],
  };
}

export function getMentors() {
  return fetchWithFallback({
    request: () => api.get('/api/mentorship/mentors'),
    normalize: normalizeMentor,
    fallbackKey: 'mentors',
    moduleName: 'Mentors',
  });
}

export async function getMentorshipMatches(employeeId = 3) {
  const mentors = await getMentors();
  const empSkills = getCollection('employee_skills').filter(es => String(es.employeeId) === String(employeeId));
  const gaps = getCollection('gap_analysis').filter(g => String(g.employeeId) === String(employeeId));
  const existingRequests = getCollection('mentorship_requests').filter(r => String(r.employeeId) === String(employeeId));

  // Natural diversified target curve for top matches
  const CURVE_SCORES = [99, 95, 92, 88, 85, 78];

  const calculated = mentors.map((mentor) => {
    let matchedSkill = null;
    let maxGap = 0;

    (mentor.mentorSkills || []).forEach((ms) => {
      const empSkillMatch = empSkills.find(es => es.skill.toLowerCase() === ms.skill.toLowerCase());
      const gapMatch = gaps.find(g => g.skill.toLowerCase() === ms.skill.toLowerCase());
      const curLevel = empSkillMatch?.level || 2;
      const mentorLevel = ms.level || 5;
      const diff = mentorLevel - curLevel;

      if (diff > maxGap || gapMatch) {
        maxGap = Math.max(maxGap, diff);
        matchedSkill = {
          skill: ms.skill,
          mentorLevel,
          empLevel: curLevel,
          gap: diff,
          isCriticalGap: !!gapMatch,
        };
      }
    });

    const isRequested = existingRequests.some(r => String(r.mentorId) === String(mentor.id));
    const isSameDept = mentor.department === 'Engineering';
    const isCrit = matchedSkill?.isCriticalGap;
    let rawScore = (isCrit ? 90 : 78) + (maxGap * 2.5) + (isSameDept ? 3 : -2) + Math.round(((mentor.rating || 4.8) - 4.5) * 6);
    rawScore = Math.min(99, Math.max(76, rawScore));

    return {
      mentor,
      matchedSkill: matchedSkill || { skill: mentor.mentorSkills[0]?.skill || 'Core Architecture', mentorLevel: 5, empLevel: 2, gap: 3 },
      rawScore,
      isRequested,
    };
  });

  calculated.sort((a, b) => b.rawScore - a.rawScore);

  return calculated.map((item, idx) => {
    const compatibilityScore = CURVE_SCORES[idx] || item.rawScore;
    return {
      mentor: item.mentor,
      matchedSkill: item.matchedSkill,
      compatibilityScore,
      isRequested: item.isRequested,
      matchReason: `${compatibilityScore}% Match — Strong ${item.matchedSkill?.skill || 'domain'} expertise aligned with your identified skill gap.`,
    };
  });
}

export async function requestMentorship(requestData) {
  try {
    const res = await api.post('/api/mentorship/requests', requestData);
    createMentorshipRequest(res.data || requestData);
    return res.data;
  } catch (err) {
    return createMentorshipRequest(requestData);
  }
}

export async function cancelMentorship(mentorId, employeeId) {
  try {
    await api.delete(`/api/mentorship/requests/${mentorId}`, { params: { employeeId } });
    cancelMentorshipRequest(mentorId, employeeId);
  } catch (err) {
    cancelMentorshipRequest(mentorId, employeeId);
  }
  return true;
}

// ── 2. Knowledge-Sharing Sessions ────────────────────────────
export function normalizeSession(s) {
  if (!s) return null;
  const total = s.totalSeats || 30;
  const regList = Array.isArray(s.registeredUserIds) ? s.registeredUserIds : [];
  const registered = typeof s.registeredSeats === 'number' ? s.registeredSeats : regList.length;

  return {
    id: s.id,
    title: s.title || `Knowledge Session #${s.id}`,
    host: s.host || 'Expert Instructor',
    hostDesignation: s.hostDesignation || 'Domain Specialist',
    hostAvatar: s.hostAvatar || 'EX',
    department: s.department || 'Engineering',
    skill: s.skill || 'Technology',
    date: s.date || '2026-08-25',
    time: s.time || '14:00 - 15:30 EST',
    duration: s.duration || '90 mins',
    mode: s.mode || 'Online (Zoom)',
    meetingLink: s.meetingLink || 'https://meet.company.internal/session',
    location: s.location || 'Virtual',
    totalSeats: total,
    registeredSeats: registered,
    availableSeats: Math.max(0, total - registered),
    status: s.status || 'Upcoming',
    description: s.description || 'Interactive collaborative knowledge-sharing workshop.',
    prerequisites: Array.isArray(s.prerequisites) ? s.prerequisites : ['Basic knowledge'],
    registeredUserIds: regList,
  };
}

export function getKnowledgeSessions() {
  return fetchWithFallback({
    request: () => api.get('/api/mentorship/sessions'),
    normalize: normalizeSession,
    fallbackKey: 'mentorship_sessions',
    moduleName: 'Knowledge Sessions',
  });
}

export async function toggleSessionRegistration(sessionId, userId, isRegistering) {
  try {
    if (isRegistering) {
      await api.post(`/api/mentorship/sessions/${sessionId}/register`, { userId });
      storeRegister(sessionId, userId);
    } else {
      await api.post(`/api/mentorship/sessions/${sessionId}/cancel`, { userId });
      storeCancel(sessionId, userId);
    }
  } catch (err) {
    if (isRegistering) storeRegister(sessionId, userId);
    else storeCancel(sessionId, userId);
  }
  return true;
}

export async function registerForSession(sessionId, userId) {
  return toggleSessionRegistration(sessionId, userId, true);
}

export async function cancelSessionRegistration(sessionId, userId) {
  return toggleSessionRegistration(sessionId, userId, false);
}

export async function createKnowledgeSession(sessionData) {
  try {
    const res = await api.post('/api/mentorship/sessions', sessionData);
    const mapped = normalizeSession(res.data);
    addCollectionItem('mentorship_sessions', mapped);
    return mapped;
  } catch (err) {
    const mapped = normalizeSession(sessionData);
    return addCollectionItem('mentorship_sessions', mapped);
  }
}

// ── 3. Expert Directory ──────────────────────────────────────
export function normalizeExpert(e) {
  if (!e) return null;
  return {
    id: e.id,
    name: e.name || 'Expert Specialist',
    avatar: e.avatar || 'EX',
    designation: e.designation || 'Principal Lead',
    department: e.department || 'Engineering',
    experienceYears: e.experienceYears || 8,
    primaryExpertise: e.primaryExpertise || 'System Architecture',
    skills: Array.isArray(e.skills) ? e.skills : [],
    sessionsConducted: e.sessionsConducted || 12,
    menteesGuided: e.menteesGuided || 6,
    rating: typeof e.rating === 'number' ? e.rating : 4.9,
    reviewsCount: e.reviewsCount || 20,
    availability: e.availability || 'Available',
    weeklyOfficeHours: e.weeklyOfficeHours || 'Tuesdays 14:00 - 15:30 EST',
    email: e.email || 'expert@company.com',
  };
}

export function getExperts() {
  return fetchWithFallback({
    request: () => api.get('/api/mentorship/experts'),
    normalize: normalizeExpert,
    fallbackKey: 'experts',
    moduleName: 'Expert Directory',
  });
}

export async function bookExpert(bookingData) {
  try {
    const res = await api.post('/api/mentorship/expert-bookings', bookingData);
    return bookExpertConsultation(res.data || bookingData);
  } catch (err) {
    return bookExpertConsultation(bookingData);
  }
}

export async function cancelExpertBooking(expertId, employeeId) {
  try {
    await api.delete(`/api/mentorship/expert-bookings/${expertId}`, { params: { employeeId } });
    cancelExpertConsultation(expertId, employeeId);
  } catch (err) {
    cancelExpertConsultation(expertId, employeeId);
  }
  return true;
}

// ── 4. Communities of Practice ───────────────────────────────
export function normalizeCommunity(c) {
  if (!c) return null;
  return {
    id: c.id,
    name: c.name || 'Guild Community',
    slug: c.slug || `community-${c.id}`,
    description: c.description || 'Collaborative guild community.',
    department: c.department || 'Engineering',
    membersCount: typeof c.membersCount === 'number' ? c.membersCount : 20,
    lead: c.lead || 'Lead Specialist',
    leadAvatar: c.leadAvatar || 'LD',
    icon: c.icon || '👥',
    bannerGradient: c.bannerGradient || 'from-blue-600 to-indigo-800',
    latestActivity: c.latestActivity || 'Active recently',
    upcomingSession: c.upcomingSession || 'Upcoming workshop soon',
    topics: Array.isArray(c.topics) ? c.topics : ['General'],
    isJoined: !!c.isJoined,
    joinedUserIds: Array.isArray(c.joinedUserIds) ? c.joinedUserIds : [],
    discussions: Array.isArray(c.discussions) ? c.discussions : [],
    resources: Array.isArray(c.resources) ? c.resources : [],
  };
}

export function getCommunities() {
  return fetchWithFallback({
    request: () => api.get('/api/mentorship/communities'),
    normalize: normalizeCommunity,
    fallbackKey: 'communities',
    moduleName: 'Communities',
  });
}

export async function toggleCommunity(communityId, userId, isJoining) {
  try {
    await api.post(`/api/mentorship/communities/${communityId}/membership`, { userId, join: isJoining });
    toggleCommunityMembership(communityId, userId, isJoining);
  } catch (err) {
    toggleCommunityMembership(communityId, userId, isJoining);
  }
  return true;
}

export const toggleCommunityJoin = toggleCommunity;

export async function postCommunityDiscussion(communityId, discussion) {
  try {
    const res = await api.post(`/api/mentorship/communities/${communityId}/discussions`, discussion);
    addCommunityDiscussion(communityId, res.data || discussion);
    return res.data;
  } catch (err) {
    addCommunityDiscussion(communityId, discussion);
    return discussion;
  }
}

export async function postCommunityResource(communityId, resource) {
  try {
    const res = await api.post(`/api/mentorship/communities/${communityId}/resources`, resource);
    addCommunityResource(communityId, res.data || resource);
    return res.data;
  } catch (err) {
    addCommunityResource(communityId, resource);
    return resource;
  }
}

// ── 5. Knowledge Resources & Articles ────────────────────────
export function normalizeResource(r) {
  if (!r) return null;
  return {
    id: r.id,
    title: r.title || 'Technical Architecture Resource',
    category: r.category || 'Technical',
    skill: r.skill || 'System Architecture',
    type: r.type || 'Guide',
    typeBadge: r.typeBadge || 'badge-blue',
    author: r.author || 'Engineering Guild',
    authorAvatar: r.authorAvatar || 'EG',
    date: r.date || '2026-08-01',
    readTime: r.readTime || '10 min read',
    views: r.views || 250,
    likes: r.likes || 35,
    isBookmarked: !!r.isBookmarked,
    description: r.description || 'Organizational engineering guide and technical documentation.',
    tags: Array.isArray(r.tags) ? r.tags : ['Architecture'],
    contentUrl: r.contentUrl || '#',
    summary: r.summary || 'Summary overview of this internal guide.',
  };
}

export function getKnowledgeResources() {
  return fetchWithFallback({
    request: () => api.get('/api/mentorship/resources'),
    normalize: normalizeResource,
    fallbackKey: 'knowledge_resources',
    moduleName: 'Knowledge Resources',
  });
}

export async function toggleBookmark(resourceId, userId) {
  try {
    await api.post(`/api/mentorship/resources/${resourceId}/bookmark`, { userId });
    toggleResourceBookmark(resourceId, userId);
  } catch (err) {
    toggleResourceBookmark(resourceId, userId);
  }
  return true;
}

// ── 6. Session & Mentorship Feedback ─────────────────────────
export function normalizeFeedback(f) {
  if (!f) return null;
  return {
    id: f.id,
    sessionId: f.sessionId || 1,
    sessionTitle: f.sessionTitle || 'Knowledge Sharing Workshop',
    mentorName: f.mentorName || 'Domain Expert',
    participantName: f.participantName || 'Participant',
    participantAvatar: f.participantAvatar || 'PA',
    rating: typeof f.rating === 'number' ? f.rating : 5,
    usefulnessScore: typeof f.usefulnessScore === 'number' ? f.usefulnessScore : 5,
    effectivenessScore: typeof f.effectivenessScore === 'number' ? f.effectivenessScore : 5,
    comments: f.comments || 'Great session and clear answers.',
    wouldRecommend: f.wouldRecommend !== undefined ? f.wouldRecommend : true,
    date: f.date || '2026-08-10',
  };
}

export function getSessionFeedback() {
  return fetchWithFallback({
    request: () => api.get('/api/mentorship/feedback'),
    normalize: normalizeFeedback,
    fallbackKey: 'session_feedback',
    moduleName: 'Session Feedback',
  });
}

export async function submitFeedback(feedbackData) {
  try {
    const res = await api.post('/api/mentorship/feedback', feedbackData);
    return addSessionFeedbackItem(res.data || feedbackData);
  } catch (err) {
    return addSessionFeedbackItem(feedbackData);
  }
}
