import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import {
  getMentors,
  getMentorshipMatches,
  requestMentorship,
  cancelMentorship,
  getKnowledgeSessions,
  createKnowledgeSession,
  registerForSession,
  cancelSessionRegistration,
  getExperts,
  bookExpert,
  cancelExpertBooking,
  getCommunities,
  toggleCommunityJoin,
  postCommunityDiscussion,
  postCommunityResource,
  getKnowledgeResources,
  toggleBookmark,
  getSessionFeedback,
  submitFeedback,
} from '../../services/mentorshipService';
import { subscribeToStore, getCollection } from '../../utils/hybridStore';
import LoadingScreen from '../../components/feedback/LoadingScreen';
import ErrorState from '../../components/feedback/ErrorState';
import EmptyState from '../../components/feedback/EmptyState';

export default function KnowledgeSharingHub() {
  const { user } = useAuth();
  const { currentRole, roleBadge } = useRole();

  const employeeId = user?.employeeId || user?.id || 3;
  const userName = user?.name || user?.username || 'Charlie Brown';

  const [activeTab, setActiveTab] = useState('mentors');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Core Datasets
  const [mentorshipMatches, setMentorshipMatches] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [experts, setExperts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [resources, setResources] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [userBookings, setUserBookings] = useState([]);

  // Search & Filter States
  const [mentorSearch, setMentorSearch] = useState('');
  const [mentorDeptFilter, setMentorDeptFilter] = useState('All');
  const [mentorSkillFilter, setMentorSkillFilter] = useState('All');
  const [mentorSort, setMentorSort] = useState('match_desc');

  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionStatusFilter, setSessionStatusFilter] = useState('All');
  const [sessionModeFilter, setSessionModeFilter] = useState('All');

  const [expertSearch, setExpertSearch] = useState('');
  const [expertDeptFilter, setExpertDeptFilter] = useState('All');
  const [expertAvailabilityFilter, setExpertAvailabilityFilter] = useState('All');

  const [resourceSearch, setResourceSearch] = useState('');
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState('All');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('All');
  const [resourceBookmarksOnly, setResourceBookmarksOnly] = useState(false);

  // Modals & Drawers
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [mentorshipForm, setMentorshipForm] = useState({ topic: '', goals: '', message: '', preferredTime: 'Bi-weekly 45 min 1:1' });

  const [mentorBioModal, setMentorBioModal] = useState(null); // Selected mentor for full Bio Drawer/Modal

  const [selectedSessionDetails, setSelectedSessionDetails] = useState(null); // Selected session for Details Modal
  const [createSessionOpen, setCreateSessionOpen] = useState(false);
  const [newSessionForm, setNewSessionForm] = useState({
    title: '', host: userName, department: user?.department || 'Engineering',
    skill: 'Docker & Kubernetes', date: '2026-09-05', time: '14:00 - 15:30 EST',
    duration: '90 mins', mode: 'Online (Zoom)', totalSeats: 30, description: '',
  });

  const [selectedExpertProfile, setSelectedExpertProfile] = useState(null); // Selected expert for Profile Modal
  const [selectedExpertForBooking, setSelectedExpertForBooking] = useState(null);
  const [bookOfficeHoursOpen, setBookOfficeHoursOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({ slot: 'Tuesday 14:00 - 15:00 EST', topic: '', notes: '' });

  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [communityModalTab, setCommunityModalTab] = useState('overview');
  const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
  const [newDiscussionBody, setNewDiscussionBody] = useState('');
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceType, setNewResourceType] = useState('Guide');

  const [selectedResource, setSelectedResource] = useState(null);
  const [readerModalOpen, setReaderModalOpen] = useState(false);

  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackSession, setFeedbackSession] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5, usefulnessScore: 5, effectivenessScore: 5, comments: '', wouldRecommend: true,
  });

  const [actionSuccessToast, setActionSuccessToast] = useState(null);

  function showToast(msg) {
    setActionSuccessToast(msg);
    setTimeout(() => setActionSuccessToast(null), 4000);
  }

  async function loadAllData() {
    setLoading(true);
    setError(null);
    try {
      const [matches, sessList, expList, commList, resList, fbList] = await Promise.all([
        getMentorshipMatches(employeeId),
        getKnowledgeSessions(),
        getExperts(),
        getCommunities(),
        getKnowledgeResources(),
        getSessionFeedback(),
      ]);

      const bookings = getCollection('expert_bookings').filter(b => String(b.employeeId) === String(employeeId));

      setMentorshipMatches(Array.isArray(matches) ? matches : []);
      setSessions(Array.isArray(sessList) ? sessList : []);
      setExperts(Array.isArray(expList) ? expList : []);
      setCommunities(Array.isArray(commList) ? commList : []);
      setResources(Array.isArray(resList) ? resList : []);
      setFeedbackList(Array.isArray(fbList) ? fbList : []);
      setUserBookings(bookings);
      setLoading(false);
    } catch (err) {
      console.warn('[KnowledgeSharingHub] Error loading datasets:', err);
      setError('Unable to fetch knowledge-sharing datasets. Please retry.');
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllData();
    const unsub = subscribeToStore(loadAllData);
    return unsub;
  }, [employeeId]);

  if (loading) return <LoadingScreen message="Loading Enterprise Knowledge Sharing & Mentorship Hub…" />;
  if (error) return <ErrorState message={error} onRetry={loadAllData} />;

  // ── FILTER LOGIC ──────────────────────────────────────────────
  const filteredMatches = mentorshipMatches.filter(item => {
    const mentor = item.mentor;
    const matchesSearch = mentor.name.toLowerCase().includes(mentorSearch.toLowerCase()) ||
      mentor.expertise.toLowerCase().includes(mentorSearch.toLowerCase()) ||
      item.matchedSkill.skill.toLowerCase().includes(mentorSearch.toLowerCase());
    const matchesDept = mentorDeptFilter === 'All' || mentor.department === mentorDeptFilter;
    const matchesSkill = mentorSkillFilter === 'All' || item.matchedSkill.skill === mentorSkillFilter;
    return matchesSearch && matchesDept && matchesSkill;
  }).sort((a, b) => {
    if (mentorSort === 'match_desc') return b.compatibilityScore - a.compatibilityScore;
    if (mentorSort === 'rating_desc') return (b.mentor.rating || 0) - (a.mentor.rating || 0);
    if (mentorSort === 'exp_desc') return (b.mentor.experienceYears || 0) - (a.mentor.experienceYears || 0);
    return 0;
  });

  const filteredSessions = sessions.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(sessionSearch.toLowerCase()) ||
      s.host.toLowerCase().includes(sessionSearch.toLowerCase()) ||
      s.skill.toLowerCase().includes(sessionSearch.toLowerCase());
    const matchesStatus = sessionStatusFilter === 'All' || s.status === sessionStatusFilter;
    const matchesMode = sessionModeFilter === 'All' || (sessionModeFilter === 'Online' ? s.mode.includes('Online') : s.mode.includes('In-Person'));
    return matchesSearch && matchesStatus && matchesMode;
  });

  const filteredExperts = experts.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(expertSearch.toLowerCase()) ||
      e.primaryExpertise.toLowerCase().includes(expertSearch.toLowerCase()) ||
      (e.skills || []).some(sk => sk.name.toLowerCase().includes(expertSearch.toLowerCase()));
    const matchesDept = expertDeptFilter === 'All' || e.department === expertDeptFilter;
    const matchesAvail = expertAvailabilityFilter === 'All' || e.availability === expertAvailabilityFilter;
    return matchesSearch && matchesDept && matchesAvail;
  });

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(resourceSearch.toLowerCase()) ||
      r.description.toLowerCase().includes(resourceSearch.toLowerCase()) ||
      (r.tags || []).some(t => t.toLowerCase().includes(resourceSearch.toLowerCase()));
    const matchesCat = resourceCategoryFilter === 'All' || r.category === resourceCategoryFilter;
    const matchesType = resourceTypeFilter === 'All' || r.type === resourceTypeFilter;
    const matchesBm = !resourceBookmarksOnly || r.isBookmarked;
    return matchesSearch && matchesCat && matchesType && matchesBm;
  });

  // User-submitted feedback reviews
  const mySubmittedFeedback = feedbackList.filter(f =>
    f.participantName === userName ||
    String(f.participantId || f.employeeId) === String(employeeId)
  );

  // Helper to check if feedback is already submitted for a session
  function getFeedbackForSession(sessionId) {
    return feedbackList.find(f =>
      String(f.sessionId) === String(sessionId) &&
      (f.participantName === userName || String(f.participantId || f.employeeId) === String(employeeId))
    );
  }

  // Summary Metrics
  const activeMentorsCount = mentorshipMatches.length;
  const scheduledSessionsCount = sessions.filter(s => s.status === 'Upcoming' || s.status === 'Live').length;
  const activeGuildsCount = communities.length;
  const avgFeedbackScore = feedbackList.length > 0
    ? (feedbackList.reduce((acc, f) => acc + (f.rating || 5), 0) / feedbackList.length).toFixed(2)
    : '4.85';
  const effectivenessRate = feedbackList.length > 0
    ? Math.round((feedbackList.filter(f => (f.usefulnessScore || 5) >= 4).length / feedbackList.length) * 100)
    : 95;

  // ── ACTION HANDLERS ───────────────────────────────────────────
  async function handleSessionToggle(session) {
    const isRegistered = (session.registeredUserIds || []).includes(employeeId);
    if (isRegistered) {
      await cancelSessionRegistration(session.id, employeeId);
      showToast(`Cancelled registration for "${session.title}".`);
    } else {
      await registerForSession(session.id, employeeId);
      showToast(`✓ Registered for "${session.title}"! Added to your schedule.`);
    }
  }

  async function handleCommunityToggle(community) {
    const isJoined = community.isJoined;
    await toggleCommunityJoin(community.id, employeeId, !isJoined);
    showToast(isJoined ? `Left ${community.name}` : `Welcome to ${community.name}!`);
  }

  async function handleBookmark(resourceId, e) {
    if (e) e.stopPropagation();
    await toggleBookmark(resourceId, employeeId);
    showToast('Bookmark updated in knowledge library.');
  }

  async function handleMentorshipSubmit(e) {
    e.preventDefault();
    await requestMentorship({
      mentorId: selectedMentor.mentor.id,
      mentorName: selectedMentor.mentor.name,
      employeeId,
      employeeName: userName,
      matchedSkill: selectedMentor.matchedSkill?.skill || 'Technical Growth',
      ...mentorshipForm,
    });
    setRequestModalOpen(false);
    showToast(`✓ Mentorship request dispatched to ${selectedMentor.mentor.name}!`);
  }

  async function handleCancelMentorship(mentorId, mentorName) {
    await cancelMentorship(mentorId, employeeId);
    showToast(`Cancelled mentorship request with ${mentorName}.`);
  }

  async function handleBookingSubmit(e) {
    e.preventDefault();
    const expert = selectedExpertForBooking;
    if (!expert) return;
    await bookExpert({
      expertId: expert.id,
      expertName: expert.name,
      employeeId,
      employeeName: userName,
      selectedSlot: bookingForm.slot,
      topic: bookingForm.topic,
      notes: bookingForm.notes,
    });
    setBookOfficeHoursOpen(false);
    showToast(`✓ 1:1 Consultation booked with ${expert.name} for ${bookingForm.slot}!`);
  }

  async function handleCancelBooking(expertId, expertName) {
    await cancelExpertBooking(expertId, employeeId);
    showToast(`Cancelled consultation with ${expertName}.`);
  }

  async function handleAddDiscussion(e) {
    e.preventDefault();
    if (!newDiscussionTitle.trim() || !newDiscussionBody.trim()) return;
    await postCommunityDiscussion(selectedCommunity.id, {
      title: newDiscussionTitle,
      body: newDiscussionBody,
      author: userName,
    });
    setNewDiscussionTitle('');
    setNewDiscussionBody('');
    showToast('Discussion topic published to guild community forum!');
  }

  async function handleAddResource(e) {
    e.preventDefault();
    if (!newResourceTitle.trim()) return;
    await postCommunityResource(selectedCommunity.id, {
      title: newResourceTitle,
      type: newResourceType,
      author: userName,
    });
    setNewResourceTitle('');
    showToast('Resource shared with guild community members!');
  }

  async function handleFeedbackSubmit(e) {
    e.preventDefault();
    await submitFeedback({
      sessionId: feedbackSession?.id || 1,
      sessionTitle: feedbackSession?.title || 'Knowledge Workshop',
      mentorName: feedbackSession?.host || 'Host',
      participantName: userName,
      employeeId,
      participantAvatar: userName.split(' ').map(n => n[0]).join('').slice(0, 2),
      ...feedbackForm,
    });
    setFeedbackModalOpen(false);
    showToast('Thank you! Your quality review has been recorded & mentor rating updated.');
  }

  async function handleCreateSessionSubmit(e) {
    e.preventDefault();
    await createKnowledgeSession(newSessionForm);
    setCreateSessionOpen(false);
    showToast(`Knowledge Session "${newSessionForm.title}" published!`);
  }

  return (
    <div className="page-container space-y-6">

      {/* Toast Notification */}
      {actionSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-fadeIn">
          <span className="text-emerald-400 text-base">✓</span>
          <span className="text-xs font-semibold">{actionSuccessToast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-header-title">Knowledge Sharing, Mentorship &amp; Communities</h1>
            <span className="badge-purple">Module 5</span>
            <span className={roleBadge.badgeClass}>{roleBadge.label} View</span>
          </div>
          <p className="page-header-subtitle">
            Algorithmic peer mentorship matching, expert office hours, guild communities, and interactive knowledge sessions.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {(currentRole === 'ROLE_ADMIN' || currentRole === 'ROLE_MANAGER') && (
            <button
              type="button"
              onClick={() => setCreateSessionOpen(true)}
              className="btn-primary text-xs py-2 px-4 gap-2"
            >
              <span>+</span> Host Knowledge Session
            </button>
          )}
          <span className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-card text-xs font-bold text-slate-700">
            {activeMentorsCount} Compatible Mentors
          </span>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="panel p-5 border-l-4 border-l-blue-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Peer Mentors Available</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{activeMentorsCount} Active</h3>
            <p className="text-[11px] text-blue-600 mt-0.5">Skill-matched to personal gaps</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">🤝</div>
        </div>

        <div className="panel p-5 border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Knowledge Sessions</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{scheduledSessionsCount} Scheduled</h3>
            <p className="text-[11px] text-emerald-600 mt-0.5">Interactive live workshops</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">🗓️</div>
        </div>

        <div className="panel p-5 border-l-4 border-l-purple-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Guild Communities</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{activeGuildsCount} Communities</h3>
            <p className="text-[11px] text-purple-600 mt-0.5">Active cross-functional hubs</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg">👥</div>
        </div>

        <div className="panel p-5 border-l-4 border-l-amber-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mentorship Quality Score</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{avgFeedbackScore} / 5.0</h3>
            <p className="text-[11px] text-amber-600 mt-0.5">{effectivenessRate}% Knowledge utility rate</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">⭐</div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="panel p-0 overflow-hidden">
        <div className="flex flex-wrap items-center border-b border-slate-200 bg-slate-50/80 px-4 text-xs font-bold gap-1">
          {[
            { id: 'mentors',     label: 'Peer Mentorship',       icon: '🤝' },
            { id: 'sessions',    label: 'Knowledge Sessions',    icon: '🗓️' },
            { id: 'experts',     label: 'Expert Directory',      icon: '🌟' },
            { id: 'communities', label: 'Communities of Practice', icon: '👥' },
            { id: 'resources',   label: 'Knowledge Library',     icon: '📚' },
            { id: 'feedback',    label: 'Feedback & Ratings',    icon: '⭐' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-3.5 px-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-6">

          {/* ================================================================ */}
          {/* TAB 1: PEER MENTORSHIP MATCHING                                  */}
          {/* ================================================================ */}
          {activeTab === 'mentors' && (
            <div className="space-y-6">
              {/* Header Description */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Algorithmic Peer Mentorship Matching</h3>
                  <p className="text-xs text-slate-500">
                    Matches your active skill deficits with proven senior mentors &amp; domain leads.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge-success text-xs font-bold">Live Gap Diagnostic Active</span>
                </div>
              </div>

              {/* Filters & Sorting */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  <input
                    type="text"
                    value={mentorSearch}
                    onChange={(e) => setMentorSearch(e.target.value)}
                    placeholder="Search mentors by name, expertise, or skill..."
                    className="form-input text-xs flex-1 max-w-xs"
                  />
                  <select
                    value={mentorDeptFilter}
                    onChange={(e) => setMentorDeptFilter(e.target.value)}
                    className="form-select text-xs w-auto"
                  >
                    {['All', 'Engineering', 'Data Science', 'Operations', 'Finance'].map(d => (
                      <option key={d} value={d}>{d} Department</option>
                    ))}
                  </select>
                  <select
                    value={mentorSkillFilter}
                    onChange={(e) => setMentorSkillFilter(e.target.value)}
                    className="form-select text-xs w-auto"
                  >
                    {['All', 'Docker & Kubernetes', 'System Architecture', 'AWS Cloud', 'Python', 'Agile Management'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-500">Sort by:</label>
                  <select
                    value={mentorSort}
                    onChange={(e) => setMentorSort(e.target.value)}
                    className="form-select text-xs w-auto"
                  >
                    <option value="match_desc">Highest Compatibility %</option>
                    <option value="rating_desc">Mentor Rating</option>
                    <option value="exp_desc">Years of Experience</option>
                  </select>
                </div>
              </div>

              {/* Mentor Match Cards Grid */}
              {filteredMatches.length === 0 ? (
                <EmptyState title="No Mentors Found" message="Try relaxing your search terms or department filters." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredMatches.map(({ mentor, matchedSkill, compatibilityScore, isRequested, matchReason }) => (
                    <div
                      key={mentor.id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header with avatar and match badge (NON-WRAPPING, PROPERLY ALIGNED) */}
                        <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                              {mentor.avatar}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-slate-900 leading-tight truncate">{mentor.name}</h4>
                              <p className="text-[11px] text-slate-500 truncate">{mentor.designation}</p>
                              <span className="badge-neutral text-[10px] mt-0.5 inline-block">{mentor.department}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0 flex flex-col items-end">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap inline-flex items-center">
                              {compatibilityScore}% Match
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold justify-end mt-1 whitespace-nowrap">
                              <span>⭐</span> {mentor.rating} <span className="text-slate-400 font-normal">({mentor.reviewsCount || mentor.sessionsCount || 18})</span>
                            </div>
                          </div>
                        </div>

                        {/* Skill Gap Comparison Box */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-3">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-bold text-slate-700">{matchedSkill.skill} Gap</span>
                            <span className="badge-danger text-[10px] font-bold">+{matchedSkill.gap || 3} Level Gain</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                              <p className="text-slate-400 text-[10px]">Your Current Level</p>
                              <p className="font-bold text-amber-600">Level {matchedSkill.empLevel} / 5.0</p>
                            </div>
                            <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                              <p className="text-slate-400 text-[10px]">Mentor Proficiency</p>
                              <p className="font-bold text-emerald-600">Level {matchedSkill.mentorLevel} / 5.0</p>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 italic mt-2">
                            "{matchReason}"
                          </p>
                        </div>

                        {/* Mentor Skills Badges */}
                        <div className="space-y-1 mb-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Verified Skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(mentor.mentorSkills || []).map((sk, idx) => (
                              <span key={idx} className="chip-indigo text-[10px] py-0.5 px-2">
                                {sk.skill} &middot; Lvl {sk.level}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                        {isRequested ? (
                          <button
                            type="button"
                            onClick={() => handleCancelMentorship(mentor.id, mentor.name)}
                            className="text-xs py-2 px-3 flex-1 rounded-xl font-bold bg-amber-50 text-amber-700 border border-amber-300 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all"
                          >
                            ✓ Requested (Cancel)
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMentor({ mentor, matchedSkill, compatibilityScore });
                              setRequestModalOpen(true);
                            }}
                            className="btn-primary text-xs flex-1 justify-center py-2"
                          >
                            🤝 Request Mentorship
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setMentorBioModal({ mentor, matchedSkill, compatibilityScore, isRequested })}
                          className="btn-outline text-xs px-3 py-2"
                          title="View Mentor Profile"
                        >
                          View Bio
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: INTERNAL KNOWLEDGE-SHARING SESSIONS                      */}
          {/* ================================================================ */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              {/* Header description */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Live &amp; Upcoming Knowledge Workshops</h3>
                  <p className="text-xs text-slate-500">Peer-led architectural deep dives, code walkthroughs, and interactive hands-on masterclasses.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge-info text-xs">{sessions.filter(s => (s.registeredUserIds || []).includes(employeeId)).length} Registered by you</span>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <input
                  type="text"
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                  placeholder="Search session title, expert, or topic..."
                  className="form-input text-xs flex-1 max-w-sm"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={sessionStatusFilter}
                    onChange={(e) => setSessionStatusFilter(e.target.value)}
                    className="form-select text-xs w-auto"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Live">Live Now</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <select
                    value={sessionModeFilter}
                    onChange={(e) => setSessionModeFilter(e.target.value)}
                    className="form-select text-xs w-auto"
                  >
                    <option value="All">All Modes</option>
                    <option value="Online">Online (Zoom / Meet)</option>
                    <option value="In-Person">In-Person (HQ)</option>
                  </select>
                </div>
              </div>

              {/* Sessions List */}
              <div className="space-y-4">
                {filteredSessions.map((session) => {
                  const isRegistered = (session.registeredUserIds || []).includes(employeeId);
                  const isFull = session.availableSeats <= 0;
                  const userFeedback = getFeedbackForSession(session.id);

                  const statusBadges = {
                    Upcoming: 'badge-blue',
                    Live: 'badge-danger animate-pulse font-extrabold',
                    Completed: 'badge-neutral',
                    Cancelled: 'badge-neutral',
                  };

                  return (
                    <div
                      key={session.id}
                      className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                    >
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={statusBadges[session.status] || 'badge-neutral'}>
                            {session.status === 'Live' ? '🔴 LIVE NOW' : session.status}
                          </span>
                          <span className="chip-indigo text-xs font-bold">{session.skill}</span>
                          <span className="text-xs text-slate-400">&bull;</span>
                          <span className="text-xs text-slate-600 font-medium">{session.mode}</span>
                          <span className="text-xs text-slate-400">&bull;</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                            session.availableSeats <= 5
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {session.availableSeats} Seats Available ({session.registeredSeats} / {session.totalSeats} Taken)
                          </span>
                        </div>

                        <h4
                          className="text-base font-bold text-slate-900 hover:text-blue-600 cursor-pointer"
                          onClick={() => setSelectedSessionDetails(session)}
                        >
                          {session.title}
                        </h4>

                        <p className="text-xs text-slate-600 line-clamp-2">{session.description}</p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <strong>Host:</strong> {session.host} ({session.hostDesignation})
                          </span>
                          <span>&bull;</span>
                          <span>📅 {session.date}</span>
                          <span>&bull;</span>
                          <span>⏰ {session.time} ({session.duration})</span>
                        </div>
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {session.status === 'Completed' ? (
                          userFeedback ? (
                            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <span>✓ Feedback Given</span>
                              <span className="text-amber-500">({userFeedback.rating}.0 ★)</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setFeedbackSession(session);
                                setFeedbackModalOpen(true);
                              }}
                              className="btn-outline text-xs py-2 px-3 border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100"
                            >
                              ⭐ Leave Feedback
                            </button>
                          )
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSessionToggle(session)}
                            disabled={isFull && !isRegistered}
                            className={`text-xs py-2 px-4 rounded-xl font-bold transition-all ${
                              isRegistered
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-red-50 hover:text-red-700 hover:border-red-300'
                                : isFull
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'btn-primary'
                            }`}
                          >
                            {isRegistered ? '✓ Registered (Cancel)' : isFull ? 'Session Full' : 'Register Now'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedSessionDetails(session)}
                          className="btn-outline text-xs py-2 px-3"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 3: EXPERT DIRECTORY                                         */}
          {/* ================================================================ */}
          {activeTab === 'experts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Subject Matter Expert Directory</h3>
                  <p className="text-xs text-slate-500">Connect with organization technical fellows, chapter leads, and domain specialists.</p>
                </div>
                <span className="badge-purple text-xs">{experts.length} Verified Domain Specialists</span>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <input
                  type="text"
                  value={expertSearch}
                  onChange={(e) => setExpertSearch(e.target.value)}
                  placeholder="Search experts by skill, domain, or name..."
                  className="form-input text-xs flex-1 max-w-sm"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={expertDeptFilter}
                    onChange={(e) => setExpertDeptFilter(e.target.value)}
                    className="form-select text-xs w-auto"
                  >
                    <option value="All">All Departments</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                  </select>
                  <select
                    value={expertAvailabilityFilter}
                    onChange={(e) => setExpertAvailabilityFilter(e.target.value)}
                    className="form-select text-xs w-auto"
                  >
                    <option value="All">All Availabilities</option>
                    <option value="Available">Available</option>
                    <option value="Limited Hours">Limited Hours</option>
                  </select>
                </div>
              </div>

              {/* Experts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredExperts.map((expert) => {
                  const existingBooking = userBookings.find(b => String(b.expertId) === String(expert.id));

                  return (
                    <div
                      key={expert.id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                              {expert.avatar}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-slate-900 leading-tight truncate">{expert.name}</h4>
                              <p className="text-[11px] text-slate-500 truncate">{expert.designation}</p>
                              <span className="badge-neutral text-[10px] mt-0.5">{expert.department}</span>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${
                            expert.availability === 'Available'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {expert.availability}
                          </span>
                        </div>

                        {/* Primary Expertise */}
                        <div className="mb-3">
                          <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span>🌟</span> {expert.primaryExpertise}
                          </p>
                        </div>

                        {/* Stats Box */}
                        <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl mb-3 text-center text-xs">
                          <div>
                            <p className="text-slate-400 text-[10px]">Experience</p>
                            <p className="font-bold text-slate-800">{expert.experienceYears} Years</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-[10px]">Rating</p>
                            <p className="font-bold text-amber-600">⭐ {expert.rating}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-[10px]">Sessions</p>
                            <p className="font-bold text-blue-600">{expert.sessionsConducted || expert.sessionsCount || 16}</p>
                          </div>
                        </div>

                        {/* Office Hours */}
                        <div className="p-2.5 bg-blue-50/50 border border-blue-100 rounded-xl mb-3 text-[11px]">
                          <p className="font-bold text-blue-900">Weekly Office Hours:</p>
                          <p className="text-blue-700">{expert.weeklyOfficeHours}</p>
                        </div>

                        {/* Verified Proficiencies */}
                        <div className="space-y-1 mb-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Verified Proficiencies</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(expert.skills || []).map((sk, idx) => (
                              <span key={idx} className="chip-indigo text-[10px] py-0.5 px-2">
                                {sk.name || sk.skill} (Lvl {sk.level})
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                        {existingBooking ? (
                          <button
                            type="button"
                            onClick={() => handleCancelBooking(expert.id, expert.name)}
                            className="text-xs py-2 px-3 flex-1 rounded-xl font-bold bg-amber-50 text-amber-700 border border-amber-300 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all truncate"
                            title="Click to cancel booking"
                          >
                            ✓ Booked ({existingBooking.selectedSlot?.split(' ')[0] || 'Confirmed'}) &middot; Cancel
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedExpertForBooking(expert);
                              setBookOfficeHoursOpen(true);
                            }}
                            className="btn-primary text-xs flex-1 justify-center py-2"
                          >
                            📅 Book 1:1 Consultation
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedExpertProfile(expert)}
                          className="btn-outline text-xs px-3 py-2"
                        >
                          Profile
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 4: COMMUNITIES OF PRACTICE / GUILDS                          */}
          {/* ================================================================ */}
          {activeTab === 'communities' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Communities of Practice &amp; Engineering Guilds</h3>
                  <p className="text-xs text-slate-500">Autonomous technical chapters sharing code conventions, RFC proposals, and cross-squad architecture.</p>
                </div>
                <span className="badge-purple text-xs">{communities.length} Active Guilds</span>
              </div>

              {/* Guild Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {communities.map((comm) => (
                  <div
                    key={comm.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Banner header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-800 text-white font-bold flex items-center justify-center text-xl shadow-sm">
                            {comm.icon || '👥'}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 leading-tight">{comm.name}</h4>
                            <p className="text-[11px] text-slate-500">{comm.department} Guild</p>
                          </div>
                        </div>
                        <span className="badge-neutral text-[10px] font-bold">{comm.membersCount} Members</span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-3 mb-3">{comm.description}</p>

                      {/* Guild Details Box */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 mb-3 text-xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Guild Lead:</span>
                          <span className="font-bold text-slate-800">{comm.lead}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Next Workshop:</span>
                          <span className="font-bold text-blue-700">{comm.upcomingSession}</span>
                        </div>
                      </div>

                      {/* Topic Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {(comm.topics || []).map((top, idx) => (
                          <span key={idx} className="chip-indigo text-[10px] py-0.5 px-2">
                            #{top}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCommunity(comm);
                          setCommunityModalTab('overview');
                        }}
                        className="btn-outline text-xs flex-1 justify-center py-2"
                      >
                        Community Hub &rarr;
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCommunityToggle(comm)}
                        className={`text-xs py-2 px-4 rounded-xl font-bold transition-all ${
                          comm.isJoined
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-red-50 hover:text-red-700 hover:border-red-300'
                            : 'btn-primary'
                        }`}
                      >
                        {comm.isJoined ? '✓ Joined' : 'Join Guild'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 5: KNOWLEDGE ARTICLES & RESOURCE LIBRARY                    */}
          {/* ================================================================ */}
          {activeTab === 'resources' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Engineering &amp; Architecture Resource Library</h3>
                  <p className="text-xs text-slate-500">Curated internal guides, RFC whitepapers, masterclass videos, and standardized production templates.</p>
                </div>
                <span className="badge-purple text-xs">{resources.length} Verified Publications</span>
              </div>

              {/* Resource Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <input
                  type="text"
                  value={resourceSearch}
                  onChange={(e) => setResourceSearch(e.target.value)}
                  placeholder="Search articles, guides, RFCs, or tags..."
                  className="form-input text-xs flex-1 max-w-sm"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={resourceCategoryFilter}
                    onChange={(e) => setResourceCategoryFilter(e.target.value)}
                    className="form-select text-xs w-auto"
                  >
                    <option value="All">All Categories</option>
                    <option value="Technical">Technical</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Security">Security</option>
                    <option value="Management">Management</option>
                  </select>
                  <select
                    value={resourceTypeFilter}
                    onChange={(e) => setResourceTypeFilter(e.target.value)}
                    className="form-select text-xs w-auto"
                  >
                    <option value="All">All Resource Types</option>
                    <option value="Guide">Guides</option>
                    <option value="Article">Articles</option>
                    <option value="Tutorial">Tutorials</option>
                    <option value="Whitepaper">Whitepapers</option>
                    <option value="Video Tutorial">Video Masterclasses</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setResourceBookmarksOnly(!resourceBookmarksOnly)}
                    className={`text-xs py-1.5 px-3 rounded-xl border font-bold transition-all ${
                      resourceBookmarksOnly
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    ★ My Bookmarks
                  </button>
                </div>
              </div>

              {/* Resource Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredResources.map((res) => (
                  <div
                    key={res.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`${res.typeBadge || 'badge-blue'} text-[10px] font-extrabold uppercase`}>
                          {res.type}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleBookmark(res.id, e)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            res.isBookmarked
                              ? 'bg-amber-50 text-amber-600 border-amber-300'
                              : 'bg-white text-slate-400 border-slate-200 hover:text-amber-500'
                          }`}
                          title={res.isBookmarked ? 'Bookmarked' : 'Save bookmark'}
                        >
                          {res.isBookmarked ? '★' : '☆'}
                        </button>
                      </div>

                      <h4
                        className="text-sm font-bold text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-2 mb-2"
                        onClick={() => {
                          setSelectedResource(res);
                          setReaderModalOpen(true);
                        }}
                      >
                        {res.title}
                      </h4>

                      <p className="text-xs text-slate-600 line-clamp-3 mb-3">{res.description}</p>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {(res.tags || []).map((tag, idx) => (
                          <span key={idx} className="chip-indigo text-[10px] py-0.5 px-2">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                          {res.authorAvatar}
                        </div>
                        <span className="font-semibold text-slate-700 truncate max-w-[100px]">{res.author}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span>👁️ {res.views}</span>
                        <span>❤️ {res.likes}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedResource(res);
                            setReaderModalOpen(true);
                          }}
                          className="font-bold text-blue-600 hover:text-blue-700 ml-1"
                        >
                          Read &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 6: MENTORSHIP & SESSION FEEDBACK                            */}
          {/* ================================================================ */}
          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Session &amp; Mentorship Quality Feedback</h3>
                  <p className="text-xs text-slate-500">Continuous feedback loops to evaluate knowledge transfer efficacy and instructor impact.</p>
                </div>
                <span className="badge-emerald text-xs font-bold">{effectivenessRate}% Recommendation Rate</span>
              </div>

              {/* Metrics Header */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl">
                  <p className="text-xs font-semibold text-amber-800">Overall Rating</p>
                  <p className="text-2xl font-black text-amber-900 mt-1">⭐ {avgFeedbackScore} / 5.0</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">Based on {feedbackList.length} verified participant reviews</p>
                </div>
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
                  <p className="text-xs font-semibold text-emerald-800">Knowledge Efficacy</p>
                  <p className="text-2xl font-black text-emerald-900 mt-1">{effectivenessRate}%</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Immediate workplace problem solving impact</p>
                </div>
                <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl">
                  <p className="text-xs font-semibold text-blue-800">Top-Rated Domains</p>
                  <p className="text-sm font-bold text-blue-950 mt-1">SQL Optimization, Distributed K8s</p>
                  <p className="text-[11px] text-blue-700 mt-0.5">Highest requested peer workshops</p>
                </div>
              </div>

              {/* SECTION: MY SUBMITTED FEEDBACK */}
              <div className="panel p-5 bg-gradient-to-r from-blue-50/50 to-indigo-50/40 border border-blue-200/80 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✍️</span>
                    <h4 className="text-sm font-bold text-slate-900">My Submitted Feedback ({mySubmittedFeedback.length})</h4>
                  </div>
                  <span className="text-xs text-slate-500">Reviews written by you ({userName})</span>
                </div>

                {mySubmittedFeedback.length === 0 ? (
                  <div className="p-6 text-center bg-white border border-slate-200 rounded-xl space-y-1">
                    <p className="text-xs font-bold text-slate-700">You haven't submitted any feedback yet.</p>
                    <p className="text-[11px] text-slate-400">Complete a knowledge session or mentorship workshop to leave a review!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mySubmittedFeedback.map((fb) => (
                      <div key={fb.id} className="p-4 bg-white border border-blue-200 rounded-xl shadow-xs space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h5 className="text-xs font-bold text-slate-900">{fb.sessionTitle}</h5>
                            <p className="text-[11px] text-blue-700 font-semibold">Instructor: {fb.mentorName}</p>
                          </div>
                          <span className="badge-warning text-xs font-bold shrink-0">
                            ⭐ {fb.rating}.0
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          "{fb.comments}"
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                          <span>Knowledge Utility: {fb.usefulnessScore || 5}/5</span>
                          <span>Submitted on {fb.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION: ALL PLATFORM FEEDBACK LOG */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3">All Organization Reviews &amp; Feedback</h4>
                <div className="table-container">
                  <table className="table-base">
                    <thead>
                      <tr>
                        <th className="table-th">SESSION / WORKSHOP</th>
                        <th className="table-th">MENTOR / HOST</th>
                        <th className="table-th">PARTICIPANT</th>
                        <th className="table-th text-center">RATING</th>
                        <th className="table-th text-center">RECOMMENDED</th>
                        <th className="table-th min-w-[300px]">COMMENTS &amp; IMPACT</th>
                        <th className="table-th">DATE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedbackList.map((fb) => (
                        <tr key={fb.id} className="table-row">
                          <td className="table-td font-bold text-slate-900">{fb.sessionTitle}</td>
                          <td className="table-td font-semibold text-blue-700">{fb.mentorName}</td>
                          <td className="table-td text-slate-600">
                            {fb.participantName}
                            {fb.participantName === userName && (
                              <span className="ml-1.5 chip-indigo text-[9px] py-0 px-1.5 font-bold">You</span>
                            )}
                          </td>
                          <td className="table-td text-center">
                            <span className="badge-warning text-xs font-bold">
                              ⭐ {fb.rating}.0
                            </span>
                          </td>
                          <td className="table-td text-center">
                            {fb.wouldRecommend ? (
                              <span className="badge-success text-xs">✓ Yes</span>
                            ) : (
                              <span className="badge-neutral text-xs">No</span>
                            )}
                          </td>
                          <td className="table-td text-xs text-slate-600 leading-relaxed italic">
                            "{fb.comments}"
                          </td>
                          <td className="table-td text-xs text-slate-400">{fb.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* MODAL: MENTOR FULL BIO & PROFILE DRAWER (Interactive)            */}
      {/* ================================================================ */}
      {mentorBioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center text-xl shadow-md shrink-0">
                  {mentorBioModal.mentor.avatar}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">{mentorBioModal.mentor.name}</h3>
                  <p className="text-xs text-blue-200">{mentorBioModal.mentor.designation}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                      {mentorBioModal.mentor.department}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                      {mentorBioModal.compatibilityScore}% Compatibility
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMentorBioModal(null)}
                className="text-white/70 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* About / Bio */}
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Professional Bio &amp; Background</h4>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {mentorBioModal.mentor.bio}
                </p>
              </div>

              {/* Key Mentor Stats */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-slate-400 text-[10px]">Experience</p>
                  <p className="font-bold text-slate-900 mt-0.5">{mentorBioModal.mentor.experienceYears} Years</p>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-slate-400 text-[10px]">Rating</p>
                  <p className="font-bold text-amber-600 mt-0.5">⭐ {mentorBioModal.mentor.rating}</p>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-slate-400 text-[10px]">Active Mentees</p>
                  <p className="font-bold text-blue-600 mt-0.5">{mentorBioModal.mentor.activeMentees || 3} / {mentorBioModal.mentor.maxMentees || 4}</p>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-slate-400 text-[10px]">Sessions Run</p>
                  <p className="font-bold text-purple-600 mt-0.5">{mentorBioModal.mentor.sessionsCount || 28}</p>
                </div>
              </div>

              {/* Skill Deficit Alignment Box */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1.5">
                <p className="font-bold text-blue-950">Why This Mentor Matches Your Skills:</p>
                <p className="text-blue-800 leading-relaxed">
                  Based on your skill gap in <strong>{mentorBioModal.matchedSkill?.skill}</strong> (Your Level: {mentorBioModal.matchedSkill?.empLevel || 2}), {mentorBioModal.mentor.name} has verified Level {mentorBioModal.matchedSkill?.mentorLevel || 5} proficiency with a proven track record of guiding engineering peers.
                </p>
              </div>

              {/* Verified Proficiencies */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Verified Technical &amp; Domain Proficiencies</h4>
                <div className="grid grid-cols-2 gap-2">
                  {(mentorBioModal.mentor.mentorSkills || []).map((sk, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <span className="font-bold text-slate-800">{sk.skill}</span>
                      <span className="badge-info text-[10px] font-bold">Level {sk.level} / 5.0</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preferred Mentorship Topics */}
              <div>
                <h4 className="font-bold text-slate-900 mb-1.5">Relevant Topics for Mentorship</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(mentorBioModal.mentor.preferredTopics || ['System Design', 'Code Reviews', 'Career Growth', 'Cloud Architecture']).map((t, idx) => (
                    <span key={idx} className="chip-indigo text-xs py-1 px-3">
                      ✓ {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setMentorBioModal(null)}
                className="btn-outline py-2 px-4 text-xs"
              >
                Close Profile
              </button>
              {mentorBioModal.isRequested ? (
                <button
                  type="button"
                  onClick={() => {
                    handleCancelMentorship(mentorBioModal.mentor.id, mentorBioModal.mentor.name);
                    setMentorBioModal(null);
                  }}
                  className="btn-danger py-2 px-5 text-xs font-bold"
                >
                  Cancel Request
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMentor(mentorBioModal);
                    setMentorBioModal(null);
                    setRequestModalOpen(true);
                  }}
                  className="btn-primary py-2 px-5 text-xs font-bold"
                >
                  🤝 Request Mentorship
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL: KNOWLEDGE SESSION DETAILS (Interactive)                   */}
      {/* ================================================================ */}
      {selectedSessionDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="badge-purple text-[10px]">{selectedSessionDetails.skill}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                    {selectedSessionDetails.status}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-white leading-tight">{selectedSessionDetails.title}</h3>
                <p className="text-xs text-blue-200 mt-1">
                  Host: {selectedSessionDetails.host} ({selectedSessionDetails.hostDesignation})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSessionDetails(null)}
                className="text-white/70 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Description */}
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Session Overview &amp; Abstract</h4>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {selectedSessionDetails.description}
                </p>
              </div>

              {/* Logistics Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-slate-400 text-[10px]">Date &amp; Schedule</p>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedSessionDetails.date}</p>
                  <p className="text-slate-500 text-[10px]">{selectedSessionDetails.time}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-slate-400 text-[10px]">Mode &amp; Location</p>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedSessionDetails.mode}</p>
                  <p className="text-slate-500 text-[10px]">{selectedSessionDetails.location}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-slate-400 text-[10px]">Seat Capacity</p>
                  <p className="font-bold text-emerald-600 mt-0.5">{selectedSessionDetails.availableSeats} Available</p>
                  <p className="text-slate-500 text-[10px]">{selectedSessionDetails.registeredSeats} / {selectedSessionDetails.totalSeats} Taken</p>
                </div>
              </div>

              {/* What You Will Learn */}
              <div>
                <h4 className="font-bold text-slate-900 mb-1.5">Key Learning Outcomes</h4>
                <ul className="space-y-1.5 text-slate-600 list-disc list-inside bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <li>Master production deployment and observability patterns in {selectedSessionDetails.skill}.</li>
                  <li>Live code review and refactoring demonstrations solving common architectural bottlenecks.</li>
                  <li>Interactive Q&amp;A directly with {selectedSessionDetails.host}.</li>
                </ul>
              </div>

              {/* Prerequisites */}
              {(selectedSessionDetails.prerequisites || []).length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-1.5">Recommended Prerequisites</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSessionDetails.prerequisites.map((p, idx) => (
                      <span key={idx} className="chip-indigo text-xs py-1 px-3">
                        ✓ {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                {(selectedSessionDetails.registeredUserIds || []).includes(employeeId)
                  ? '✓ You are registered for this workshop'
                  : selectedSessionDetails.availableSeats <= 0
                  ? '⚠️ Session at maximum capacity'
                  : `${selectedSessionDetails.availableSeats} seats remaining`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSessionDetails(null)}
                  className="btn-outline py-2 px-4 text-xs"
                >
                  Close
                </button>
                {selectedSessionDetails.status === 'Completed' ? (
                  getFeedbackForSession(selectedSessionDetails.id) ? (
                    <span className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Feedback Submitted
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setFeedbackSession(selectedSessionDetails);
                        setSelectedSessionDetails(null);
                        setFeedbackModalOpen(true);
                      }}
                      className="btn-primary py-2 px-5 text-xs font-bold bg-amber-600 hover:bg-amber-700 border-amber-600"
                    >
                      ⭐ Leave Feedback
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleSessionToggle(selectedSessionDetails);
                      setSelectedSessionDetails(null);
                    }}
                    disabled={selectedSessionDetails.availableSeats <= 0 && !(selectedSessionDetails.registeredUserIds || []).includes(employeeId)}
                    className={`py-2 px-5 rounded-xl text-xs font-bold transition-all ${
                      (selectedSessionDetails.registeredUserIds || []).includes(employeeId)
                        ? 'bg-red-50 text-red-700 border border-red-300 hover:bg-red-100'
                        : selectedSessionDetails.availableSeats <= 0
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'btn-primary'
                    }`}
                  >
                    {(selectedSessionDetails.registeredUserIds || []).includes(employeeId)
                      ? 'Cancel Registration'
                      : 'Register Now'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL: EXPERT PROFILE DRAWER (Interactive)                       */}
      {/* ================================================================ */}
      {selectedExpertProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white font-bold flex items-center justify-center text-xl shadow-md shrink-0">
                  {selectedExpertProfile.avatar}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">{selectedExpertProfile.name}</h3>
                  <p className="text-xs text-purple-200">{selectedExpertProfile.designation}</p>
                  <p className="text-[11px] text-white/80 mt-0.5">{selectedExpertProfile.department} &middot; {selectedExpertProfile.primaryExpertise}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedExpertProfile(null)}
                className="text-white/70 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Expert Stats */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-slate-400 text-[10px]">Experience</p>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedExpertProfile.experienceYears} Years</p>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-slate-400 text-[10px]">Rating</p>
                  <p className="font-bold text-amber-600 mt-0.5">⭐ {selectedExpertProfile.rating}</p>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-slate-400 text-[10px]">Consultations</p>
                  <p className="font-bold text-blue-600 mt-0.5">{selectedExpertProfile.sessionsConducted || 18}</p>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-slate-400 text-[10px]">Reviews</p>
                  <p className="font-bold text-purple-600 mt-0.5">{selectedExpertProfile.reviewsCount || 24}</p>
                </div>
              </div>

              {/* Weekly Office Hours */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                <p className="font-bold text-blue-900">Office Hours &amp; Availability:</p>
                <p className="text-blue-700 text-xs mt-0.5">{selectedExpertProfile.weeklyOfficeHours} ({selectedExpertProfile.availability})</p>
              </div>

              {/* Verified Proficiencies */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Verified Subject Matter Proficiencies</h4>
                <div className="grid grid-cols-2 gap-2">
                  {(selectedExpertProfile.skills || []).map((sk, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <span className="font-bold text-slate-800">{sk.name || sk.skill}</span>
                      <span className="badge-info text-[10px] font-bold">Level {sk.level} / 5.0</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consultation Format */}
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Consultation Topics &amp; Format</h4>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  1:1 architectural reviews, PR deep dives, system scalability blockers, and career mentorship roadmaps via private 45-minute virtual syncs.
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedExpertProfile(null)}
                className="btn-outline py-2 px-4 text-xs"
              >
                Close
              </button>
              {userBookings.some(b => String(b.expertId) === String(selectedExpertProfile.id)) ? (
                <button
                  type="button"
                  onClick={() => {
                    handleCancelBooking(selectedExpertProfile.id, selectedExpertProfile.name);
                    setSelectedExpertProfile(null);
                  }}
                  className="btn-danger py-2 px-5 text-xs font-bold"
                >
                  Cancel Booking
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedExpertForBooking(selectedExpertProfile);
                    setSelectedExpertProfile(null);
                    setBookOfficeHoursOpen(true);
                  }}
                  className="btn-primary py-2 px-5 text-xs font-bold"
                >
                  📅 Book 1:1 Consultation
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL: REQUEST MENTORSHIP                                        */}
      {/* ================================================================ */}
      {requestModalOpen && selectedMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center">
                  {selectedMentor.mentor.avatar}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Request Mentorship with {selectedMentor.mentor.name}</h3>
                  <p className="text-xs text-slate-500">{selectedMentor.mentor.designation} &middot; {selectedMentor.mentor.department}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRequestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleMentorshipSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                <p className="font-bold text-blue-900">Focus Skill Target:</p>
                <p className="text-blue-800 text-[11px]">{selectedMentor.matchedSkill?.skill || 'Technical Growth'} (Your Level: {selectedMentor.matchedSkill?.empLevel || 2} &rarr; Target Level: {selectedMentor.matchedSkill?.mentorLevel || 5})</p>
              </div>

              <div>
                <label className="form-label">Mentorship Goals &amp; Outcomes</label>
                <textarea
                  required
                  rows={3}
                  value={mentorshipForm.goals}
                  onChange={(e) => setMentorshipForm({ ...mentorshipForm, goals: e.target.value })}
                  placeholder="What specific architectural concepts or codebase blockers would you like guidance on?"
                  className="form-textarea w-full"
                />
              </div>

              <div>
                <label className="form-label">Preferred Meeting Frequency</label>
                <select
                  value={mentorshipForm.preferredTime}
                  onChange={(e) => setMentorshipForm({ ...mentorshipForm, preferredTime: e.target.value })}
                  className="form-select w-full"
                >
                  <option value="Bi-weekly 45 min 1:1">Bi-weekly 45 min 1:1</option>
                  <option value="Weekly 30 min sprint sync">Weekly 30 min sprint sync</option>
                  <option value="Monthly Architecture Review">Monthly Architecture Review</option>
                  <option value="Async Code Review / Q&A">Async Code Review / Q&amp;A</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRequestModalOpen(false)}
                  className="btn-outline py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2 px-5"
                >
                  Send Mentorship Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL: BOOK EXPERT 1:1 OFFICE HOURS                              */}
      {/* ================================================================ */}
      {bookOfficeHoursOpen && selectedExpertForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Book 1:1 Expert Office Hours</h3>
                <p className="text-xs text-slate-500">With {selectedExpertForBooking.name} ({selectedExpertForBooking.primaryExpertise})</p>
              </div>
              <button
                type="button"
                onClick={() => setBookOfficeHoursOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-3 text-xs">
              <div>
                <label className="form-label">Available Slot</label>
                <select
                  value={bookingForm.slot}
                  onChange={(e) => setBookingForm({ ...bookingForm, slot: e.target.value })}
                  className="form-select w-full"
                >
                  <option value="Tuesday 14:00 - 14:45 EST">Tuesday 14:00 - 14:45 EST</option>
                  <option value="Tuesday 15:00 - 15:45 EST">Tuesday 15:00 - 15:45 EST</option>
                  <option value="Thursday 16:00 - 16:45 EST">Thursday 16:00 - 16:45 EST</option>
                </select>
              </div>

              <div>
                <label className="form-label">Discussion Topic</label>
                <input
                  type="text"
                  required
                  value={bookingForm.topic}
                  onChange={(e) => setBookingForm({ ...bookingForm, topic: e.target.value })}
                  placeholder="e.g. Microservices event sourcing design review"
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="form-label">Context / Architecture Notes</label>
                <textarea
                  rows={2}
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  placeholder="Include any PR links, RFC drafts, or error logs..."
                  className="form-textarea w-full"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBookOfficeHoursOpen(false)}
                  className="btn-outline py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2 px-5"
                >
                  Confirm Consultation Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL: COMMUNITY HUB DETAILS & DISCUSSIONS                       */}
      {/* ================================================================ */}
      {selectedCommunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Banner */}
            <div className={`p-6 bg-gradient-to-r ${selectedCommunity.bannerGradient} text-white flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedCommunity.icon}</span>
                <div>
                  <h3 className="text-lg font-extrabold text-white">{selectedCommunity.name}</h3>
                  <p className="text-xs text-white/80">{selectedCommunity.department} &middot; Lead: {selectedCommunity.lead} &middot; {selectedCommunity.membersCount} Members</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCommunity(null)}
                className="text-white/80 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-4 px-6 border-b border-slate-200 bg-slate-50 text-xs font-bold">
              {['overview', 'discussions', 'resources'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setCommunityModalTab(tab)}
                  className={`py-3 capitalize border-b-2 transition-all ${
                    communityModalTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {communityModalTab === 'overview' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Guild Charter &amp; Purpose</h4>
                    <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">{selectedCommunity.description}</p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="font-bold text-blue-900">Upcoming Guild Workshop</p>
                    <p className="text-blue-700 mt-0.5">{selectedCommunity.upcomingSession}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-2">Core Topics &amp; Standards</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedCommunity.topics || []).map((t, idx) => (
                        <span key={idx} className="chip-indigo text-xs py-1 px-3">#{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {communityModalTab === 'discussions' && (
                <div className="space-y-4">
                  {/* Add Discussion Form */}
                  <form onSubmit={handleAddDiscussion} className="p-4 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-2">
                    <h5 className="font-bold text-blue-950">Post New Technical Discussion</h5>
                    <input
                      type="text"
                      required
                      value={newDiscussionTitle}
                      onChange={(e) => setNewDiscussionTitle(e.target.value)}
                      placeholder="Discussion topic title..."
                      className="form-input text-xs w-full bg-white"
                    />
                    <textarea
                      required
                      rows={2}
                      value={newDiscussionBody}
                      onChange={(e) => setNewDiscussionBody(e.target.value)}
                      placeholder="Share questions, architecture patterns, or code snippets..."
                      className="form-textarea text-xs w-full bg-white"
                    />
                    <div className="flex justify-end">
                      <button type="submit" className="btn-primary text-xs py-1.5 px-4">
                        Post to Guild Forum
                      </button>
                    </div>
                  </form>

                  {/* Discussions List */}
                  <div className="space-y-3">
                    {(selectedCommunity.discussions || []).map((disc) => (
                      <div key={disc.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{disc.title}</span>
                          <span className="text-slate-400 text-[10px]">{disc.timestamp}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{disc.body}</p>
                        <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                          <span>Author: <strong>{disc.author}</strong></span>
                          <span>💬 {disc.repliesCount} replies</span>
                          <span>👍 {disc.likesCount} upvotes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {communityModalTab === 'resources' && (
                <div className="space-y-4">
                  {/* Share Resource Form */}
                  <form onSubmit={handleAddResource} className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-2">
                    <h5 className="font-bold text-emerald-950">Share Whitepaper or Code Standard</h5>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        required
                        value={newResourceTitle}
                        onChange={(e) => setNewResourceTitle(e.target.value)}
                        placeholder="Resource title..."
                        className="form-input text-xs col-span-2 bg-white"
                      />
                      <select
                        value={newResourceType}
                        onChange={(e) => setNewResourceType(e.target.value)}
                        className="form-select text-xs bg-white"
                      >
                        <option value="Guide">Guide</option>
                        <option value="Whitepaper">Whitepaper</option>
                        <option value="Template">Template</option>
                        <option value="RFC Draft">RFC Draft</option>
                      </select>
                    </div>
                    <div className="flex justify-end">
                      <button type="submit" className="btn-primary text-xs py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 border-emerald-600">
                        Share Document
                      </button>
                    </div>
                  </form>

                  {/* Resource List */}
                  <div className="space-y-2">
                    {(selectedCommunity.resources || []).map((res) => (
                      <div key={res.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{res.title}</p>
                          <p className="text-slate-400 text-[10px]">{res.type} &middot; {res.size} &middot; Author: {res.author}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => showToast(`Downloaded "${res.title}"`)}
                          className="btn-outline text-xs py-1.5 px-3"
                        >
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedCommunity(null)}
                className="btn-primary py-2 px-5 text-xs"
              >
                Close Hub
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL: RESOURCE READER (Interactive Full Document)               */}
      {/* ================================================================ */}
      {readerModalOpen && selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className={`${selectedResource.typeBadge || 'badge-blue'} text-[10px] font-bold`}>
                  {selectedResource.type} &middot; {selectedResource.readTime}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedResource.title}</h3>
                <p className="text-xs text-slate-500">By {selectedResource.author} &middot; Published {selectedResource.date}</p>
              </div>
              <button
                type="button"
                onClick={() => setReaderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed pr-2">
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                <p className="font-bold text-blue-950 mb-1">Executive Summary &amp; Architecture Guidelines:</p>
                <p className="text-blue-900">{selectedResource.summary}</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">1. Core Technical Fundamentals</h4>
                <p className="text-slate-600">{selectedResource.description}</p>

                <h4 className="font-bold text-slate-900 text-sm">2. Implementation Blueprint &amp; Enterprise Standards</h4>
                <p className="text-slate-600">
                  When deploying to production, follow the zero-trust ingress verification and telemetry instrumentation standards established in RFC-2026. Verify that distributed traces propagate traceparent HTTP headers across all downstream gRPC and REST endpoints.
                </p>

                <h4 className="font-bold text-slate-900 text-sm">3. Key Takeaways &amp; Verification</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <li>Enforce automated linting and static analysis checks on all pull requests.</li>
                  <li>Monitor p99 latency SLAs and error budgets in real-time dashboards.</li>
                  <li>Schedule regular architecture review sessions with chapter leads.</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2">
                {(selectedResource.tags || []).map((t, idx) => (
                  <span key={idx} className="chip-indigo text-xs py-0.5 px-2">#{t}</span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={(e) => handleBookmark(selectedResource.id, e)}
                className="btn-outline text-xs py-2 px-4 flex items-center gap-1.5"
              >
                {selectedResource.isBookmarked ? '★ Bookmarked' : '☆ Bookmark Resource'}
              </button>
              <button
                type="button"
                onClick={() => setReaderModalOpen(false)}
                className="btn-primary text-xs py-2 px-5"
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL: SESSION FEEDBACK                                          */}
      {/* ================================================================ */}
      {feedbackModalOpen && feedbackSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Submit Workshop Feedback</h3>
                <p className="text-xs text-slate-500">{feedbackSession.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
              <div>
                <label className="form-label">Overall Rating (1 - 5 Stars)</label>
                <select
                  value={feedbackForm.rating}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, rating: Number(e.target.value) })}
                  className="form-select w-full"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5/5) Exceptional Quality</option>
                  <option value={4}>⭐⭐⭐⭐ (4/5) Very Good</option>
                  <option value={3}>⭐⭐⭐ (3/5) Average / Met Expectations</option>
                  <option value={2}>⭐⭐ (2/5) Needs Improvement</option>
                  <option value={1}>⭐ (1/5) Poor</option>
                </select>
              </div>

              <div>
                <label className="form-label">Knowledge Usefulness &amp; Practical Value</label>
                <select
                  value={feedbackForm.usefulnessScore}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, usefulnessScore: Number(e.target.value) })}
                  className="form-select w-full"
                >
                  <option value={5}>5/5 — Highly Applicable to Daily Engineering</option>
                  <option value={4}>4/5 — Very Useful</option>
                  <option value={3}>3/5 — Moderate Utility</option>
                </select>
              </div>

              <div>
                <label className="form-label">Comments, Takeaways &amp; Suggestions</label>
                <textarea
                  required
                  rows={3}
                  value={feedbackForm.comments}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, comments: e.target.value })}
                  placeholder="What was the most valuable takeaway from this session?"
                  className="form-textarea w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recommend-chk"
                  checked={feedbackForm.wouldRecommend}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, wouldRecommend: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <label htmlFor="recommend-chk" className="font-semibold text-slate-700 cursor-pointer">
                  I would recommend this workshop to my peers
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFeedbackModalOpen(false)}
                  className="btn-outline py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2 px-5"
                >
                  Submit Quality Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL: HOST NEW KNOWLEDGE SESSION (Admin/Manager)                */}
      {/* ================================================================ */}
      {createSessionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Host Knowledge-Sharing Session</h3>
              <button
                type="button"
                onClick={() => setCreateSessionOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSessionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="form-label">Session Title</label>
                <input
                  required
                  type="text"
                  value={newSessionForm.title}
                  onChange={(e) => setNewSessionForm({ ...newSessionForm, title: e.target.value })}
                  placeholder="e.g. Microservices Fault Tolerance with Resilience4j"
                  className="form-input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Associated Skill</label>
                  <select
                    value={newSessionForm.skill}
                    onChange={(e) => setNewSessionForm({ ...newSessionForm, skill: e.target.value })}
                    className="form-select w-full"
                  >
                    {['Docker & Kubernetes', 'System Architecture', 'AWS Cloud', 'React', 'Python', 'Cybersecurity', 'Agile Management'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Mode</label>
                  <select
                    value={newSessionForm.mode}
                    onChange={(e) => setNewSessionForm({ ...newSessionForm, mode: e.target.value })}
                    className="form-select w-full"
                  >
                    <option value="Online (Zoom / Meet)">Online (Zoom / Meet)</option>
                    <option value="In-Person (HQ Room A)">In-Person (HQ Room A)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    value={newSessionForm.date}
                    onChange={(e) => setNewSessionForm({ ...newSessionForm, date: e.target.value })}
                    className="form-input w-full"
                  />
                </div>
                <div>
                  <label className="form-label">Total Seats</label>
                  <input
                    type="number"
                    value={newSessionForm.totalSeats}
                    onChange={(e) => setNewSessionForm({ ...newSessionForm, totalSeats: Number(e.target.value) })}
                    className="form-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Description &amp; Agenda</label>
                <textarea
                  rows={3}
                  value={newSessionForm.description}
                  onChange={(e) => setNewSessionForm({ ...newSessionForm, description: e.target.value })}
                  placeholder="Summary of topics, live coding exercises, and takeaways..."
                  className="form-textarea w-full"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateSessionOpen(false)}
                  className="btn-outline py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2 px-5"
                >
                  Publish Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
