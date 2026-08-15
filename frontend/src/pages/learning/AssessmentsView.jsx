import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import {
  getAssessments,
  getAssessmentTemplates,
  getAssessmentQuestions,
  getPeerReviews,
  getAssessmentSchedules,
  submitAssessment,
  requestPeerReview,
  cancelPeerReview,
  submitPeerReviewResponse,
  saveAssessmentTemplate,
  duplicateAssessmentTemplate,
  archiveAssessmentTemplate,
  deleteAssessmentTemplate,
  saveAssessmentQuestion,
  deleteAssessmentQuestion,
  saveAssessmentSchedule,
  deleteAssessmentSchedule,
  sendAssessmentReminder,
} from '../../services/assessmentService';
import { subscribeToStore, getStore } from '../../utils/hybridStore';
import SummaryCard from '../../components/dashboard/SummaryCard';
import LoadingScreen from '../../components/feedback/LoadingScreen';
import ErrorState from '../../components/feedback/ErrorState';

export default function AssessmentsView() {
  const { user } = useAuth();
  const { roleBadge, isManager, isAdmin } = useRole();
  const navigate = useNavigate();
  const employeeId = user?.employeeId || user?.id || 3;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Core Datasets
  const [assessments, setAssessments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [peerReviews, setPeerReviews] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [employeeGaps, setEmployeeGaps] = useState([]);

  // Toast
  const [toast, setToast] = useState(null);
  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  // ── Modals State ──────────────────────────────────────────────────
  // 1. Self-Assessment Questionnaire Taker
  const [activeQuestionnaire, setActiveQuestionnaire] = useState(null);
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [submissionResult, setSubmissionResult] = useState(null);

  // 2. Peer Review Request Modal
  const [peerModalOpen, setPeerModalOpen] = useState(false);
  const [peerForm, setPeerForm] = useState({ reviewerName: 'Alice Smith', reviewerRole: 'Lead Systems Architect', relationship: 'Technical Mentor' });

  // 3. View Peer Review Feedback Modal (Completed Reviews)
  const [selectedPeerDetails, setSelectedPeerDetails] = useState(null);

  // 4. Peer Review Response Taker Modal (Pending Reviews)
  const [activePeerResponse, setActivePeerResponse] = useState(null);
  const [peerResponseForm, setPeerResponseForm] = useState({
    rating: 4.5,
    awsRating: 4,
    k8sRating: 3,
    reactRating: 5,
    archRating: 4,
    strengths: 'Strong React 19 architecture expertise, clean component design, and collaborative mindset.',
    areasForImprovement: 'Needs further hands-on experience with Kubernetes multi-cluster ingress routing and AWS cloud automation.',
    comments: 'Consistently delivers high quality code and helps teammates troubleshoot architecture issues.',
    recommendation: 'Focus on AWS Certified Solutions Architect credential and container orchestration.',
  });

  // 5. Manager Evaluation Modal
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [selectedEvalEmp, setSelectedEvalEmp] = useState({ id: 3, name: 'Charlie Brown', role: 'Full-Stack Software Engineer', department: 'Engineering' });
  const [evalRatings, setEvalRatings] = useState({
    'AWS Cloud': 4,
    'Docker & Kubernetes': 3,
    'React': 5,
    'System Architecture': 4,
  });

  // 6. Send Reminder Modal
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderTarget, setReminderTarget] = useState(null);

  // 7. Schedule Assessment Program Modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ title: '', targetGroup: 'Engineering Department', templateTitle: 'Quarterly Engineering & Cloud Review', startDate: '2026-09-01', dueDate: '2026-09-25', reminderFrequency: 'Weekly' });

  // 8. Multi-Section Create / Edit Question Template Modal
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    id: null,
    title: '',
    category: 'Cloud Architecture',
    description: '',
    assessmentType: 'Technical Assessment',
    status: 'Published',
    estimatedTimeMinutes: 15,
    scoringMethod: '1–5 Rating Scale',
    passingScore: '4.0',
    allowRetakes: 'Yes',
    showResults: 'Immediately',
    mappedSkills: ['AWS Cloud', 'Docker & Kubernetes'],
    questions: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateError, setTemplateError] = useState(null);

  // 9. Question Builder Sub-Modal (Add / Edit Question to Template)
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    index: null,
    questionText: '',
    questionType: 'Multiple Choice',
    mappedSkill: 'AWS Cloud',
    difficulty: 'Intermediate',
    weight: 10,
    required: 'Yes',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    minRatingDesc: '1 - Needs Improvement',
    maxRatingDesc: '5 - Expert Mastery',
    scenarioGuidance: '',
  });

  // 10. Delete Template Confirmation Modal
  const [deleteTargetTemplate, setDeleteTargetTemplate] = useState(null);

  // ── Dynamic Comparison State (History & Delta) ────────────────────
  const [compareFirstId, setCompareFirstId] = useState('');
  const [compareSecondId, setCompareSecondId] = useState('');

  // ── Derived Employee Metrics (Filtered to logged-in user) ──────────
  const myAssessments = useMemo(() => {
    if (!Array.isArray(assessments)) return [];
    if (isManager || isAdmin) return assessments;
    return assessments.filter(a => a && Number(a.employeeId) === Number(employeeId));
  }, [assessments, employeeId, isManager, isAdmin]);

  const openPendingCount = useMemo(() => {
    return myAssessments.filter(a => a && (a.status === 'Open' || a.status === 'Pending')).length;
  }, [myAssessments]);

  const inProgressCount = useMemo(() => {
    return myAssessments.filter(a => a && a.status === 'In Progress').length;
  }, [myAssessments]);

  const completedCount = useMemo(() => {
    return myAssessments.filter(a => a && a.status === 'Completed').length;
  }, [myAssessments]);

  const myPeerReviews = useMemo(() => {
    if (!Array.isArray(peerReviews)) return [];
    return peerReviews.filter(p => p && (Number(p.employeeId) === Number(employeeId) || Number(p.reviewerId) === Number(employeeId)));
  }, [peerReviews, employeeId]);

  const pendingPeerCount = useMemo(() => {
    return myPeerReviews.filter(p => p && p.status === 'Pending').length;
  }, [myPeerReviews]);

  const validScores = useMemo(() => {
    return myAssessments.filter(a => a && typeof a.overallScore === 'number' && a.overallScore > 0);
  }, [myAssessments]);

  const avgScore = useMemo(() => {
    if (validScores.length === 0) return '3.8';
    return (validScores.reduce((acc, a) => acc + (a.overallScore || 0), 0) / validScores.length).toFixed(1);
  }, [validScores]);

  const totalGapsCount = useMemo(() => {
    if (!Array.isArray(employeeGaps)) return 0;
    return employeeGaps.filter(g => g && (g.gapLevel ?? g.gapDiff ?? g.gapScore ?? 0) > 0).length;
  }, [employeeGaps]);

  // Active Assessment Cycle for Banner
  const activeAssessmentForBanner = useMemo(() => {
    return myAssessments.find(a => a && a.status === 'In Progress') ||
           myAssessments.find(a => a && (a.status === 'Open' || a.status === 'Pending')) ||
           myAssessments[0] || null;
  }, [myAssessments]);

  // ── Dynamic History & Delta Calculation Engine ──────────────────────
  const completedAssessmentsForScope = useMemo(() => {
    return myAssessments.filter(a => a && a.status === 'Completed');
  }, [myAssessments]);

  const assA = useMemo(() => {
    return completedAssessmentsForScope.find(a => String(a.id) === String(compareFirstId)) || completedAssessmentsForScope[0] || null;
  }, [completedAssessmentsForScope, compareFirstId]);

  const assB = useMemo(() => {
    return completedAssessmentsForScope.find(a => String(a.id) === String(compareSecondId)) || completedAssessmentsForScope[1] || completedAssessmentsForScope[0] || null;
  }, [completedAssessmentsForScope, compareSecondId]);

  const dynamicComparisonRows = useMemo(() => {
    const skillsMap = {};
    if (assA && Array.isArray(assA.assessedSkills)) {
      assA.assessedSkills.forEach(s => {
        if (s && s.skill) {
          skillsMap[s.skill] = { prev: s.afterLevel ?? s.beforeLevel ?? 2, current: null, target: s.targetLevel ?? 4 };
        }
      });
    }
    if (assB && Array.isArray(assB.assessedSkills)) {
      assB.assessedSkills.forEach(s => {
        if (s && s.skill) {
          if (!skillsMap[s.skill]) {
            skillsMap[s.skill] = { prev: null, current: s.afterLevel ?? s.beforeLevel ?? 3, target: s.targetLevel ?? 4 };
          } else {
            skillsMap[s.skill].current = s.afterLevel ?? s.beforeLevel ?? 3;
            if (s.targetLevel) skillsMap[s.skill].target = s.targetLevel;
          }
        }
      });
    }

    return Object.keys(skillsMap).map(skillName => {
      const data = skillsMap[skillName];
      const prevVal = data.prev !== null ? `Lvl ${data.prev.toFixed(1)}` : 'Not Assessed';
      const currVal = data.current !== null ? `Lvl ${data.current.toFixed(1)}` : 'Not Assessed';

      let deltaText = 'N/A';
      let deltaClass = 'text-slate-400 font-normal';
      let statusText = 'Unchanged';
      let statusClass = 'badge-neutral bg-slate-50 text-slate-500 border-slate-200';

      if (data.prev !== null && data.current !== null) {
        const diff = data.current - data.prev;
        if (diff > 0) {
          deltaText = `+${diff.toFixed(1)} Levels`;
          deltaClass = 'text-emerald-700 font-bold';
          if (data.current >= data.target) {
            statusText = `Closed (Benchmark Level ${data.target})`;
            statusClass = 'badge-success bg-emerald-50 text-emerald-700 border-emerald-200';
          } else {
            const rem = data.target - data.current;
            statusText = `Narrowed (-${rem.toFixed(1)} remaining)`;
            statusClass = 'badge-warning bg-amber-50 text-amber-700 border-amber-200';
          }
        } else if (diff < 0) {
          deltaText = `${diff.toFixed(1)} Levels`;
          deltaClass = 'text-red-700 font-bold';
          statusText = 'Regressed';
          statusClass = 'badge-danger bg-red-50 text-red-700 border-red-200';
        } else {
          deltaText = '0.0 Levels';
          statusText = 'Optimal / Maintained';
          statusClass = 'badge-blue bg-blue-50 text-blue-700 border-blue-200';
        }
      } else if (data.prev === null && data.current !== null) {
        deltaText = 'New';
        deltaClass = 'text-blue-700 font-bold';
        statusText = 'Newly Assessed';
        statusClass = 'badge-blue bg-blue-50 text-blue-700 border-blue-200';
      }

      return {
        skill: skillName,
        prevVal,
        currVal,
        deltaText,
        deltaClass,
        statusText,
        statusClass,
      };
    });
  }, [assA, assB]);

  // ── Role-Specific Tab Configurations (STRICT & CLEAN) ─────────────
  const roleTabs = useMemo(() => {
    if (isAdmin) {
      return [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'programs-and-templates', label: 'Assessment Programs & Templates', icon: '📋' },
        { id: 'workflows', label: 'Evaluation Workflows', icon: '🔀' },
        { id: 'schedule', label: 'Schedule & Reminders', icon: '📅' },
        { id: 'history-delta', label: 'History & Delta', icon: '📉' },
      ];
    }
    if (isManager) {
      return [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'team-assessments', label: 'Team Assessments', icon: '👥' },
        { id: 'evaluations', label: 'Manager Evaluation', icon: '📝' },
        { id: 'peer-reviews', label: '360° Peer Review', icon: '🤝' },
        { id: 'schedule', label: 'Schedule & Reminders', icon: '📅' },
        { id: 'history-delta', label: 'History & Delta', icon: '📉' },
      ];
    }
    // Employee View (STRICT USER-CENTRIC TABS ONLY)
    return [
      { id: 'overview', label: 'Overview', icon: '📊' },
      { id: 'my-assessments', label: 'My Assessments', icon: '📋' },
      { id: 'self-assessment', label: 'Self Assessment', icon: '📝' },
      { id: 'peer-reviews', label: '360° Peer Review', icon: '🤝' },
      { id: 'history-delta', label: 'History & Delta', icon: '📉' },
    ];
  }, [isManager, isAdmin]);

  // Fallback tab correction when role switches
  useEffect(() => {
    const validIds = roleTabs.map(t => t.id);
    if (!validIds.includes(activeTab)) {
      setActiveTab(validIds[0] || 'overview');
    }
  }, [roleTabs, activeTab]);

  // Data Loading with Failproof Store Fallback
  const loadData = useCallback(async () => {
    setError(null);
    try {
      const store = getStore();
      const empIdNum = Number(employeeId);

      const [assList, tplList, qList, prList, schList] = await Promise.all([
        getAssessments(isManager || isAdmin ? null : empIdNum).catch(() => store.assessments || []),
        getAssessmentTemplates().catch(() => store.assessment_templates || []),
        getAssessmentQuestions().catch(() => store.assessment_questions || []),
        getPeerReviews(isManager || isAdmin ? null : empIdNum).catch(() => store.peer_reviews || []),
        getAssessmentSchedules().catch(() => store.assessment_schedules || []),
      ]);

      const allGaps = (store.gap_analysis || []).filter(g => Number(g.employeeId) === empIdNum);

      setAssessments(Array.isArray(assList) && assList.length > 0 ? assList : (store.assessments || []));
      setTemplates(Array.isArray(tplList) && tplList.length > 0 ? tplList : (store.assessment_templates || []));
      setQuestions(Array.isArray(qList) && qList.length > 0 ? qList : (store.assessment_questions || []));
      setPeerReviews(Array.isArray(prList) && prList.length > 0 ? prList : (store.peer_reviews || []));
      setSchedules(Array.isArray(schList) && schList.length > 0 ? schList : (store.assessment_schedules || []));
      setEmployeeGaps(allGaps);
      setLoading(false);
    } catch (err) {
      console.warn('[AssessmentsView] API Error fallback:', err);
      const store = getStore();
      setAssessments(store.assessments || []);
      setTemplates(store.assessment_templates || []);
      setQuestions(store.assessment_questions || []);
      setPeerReviews(store.peer_reviews || []);
      setSchedules(store.assessment_schedules || []);
      setLoading(false);
    }
  }, [employeeId, isManager, isAdmin]);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToStore(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  // ── Handlers ──────────────────────────────────────────────────────
  function handleStartSelfAssessment(assessment) {
    let tplQuestions = questions.filter(q => Number(q.templateId) === Number(assessment.templateId || 1));
    if (tplQuestions.length === 0) {
      tplQuestions = [
        { id: 101, questionText: 'Evaluate your practical proficiency in AWS Cloud Infrastructure, Lambda & S3 architecture.', category: 'AWS Cloud', type: 'Rating' },
        { id: 102, questionText: 'Rate your mastery of Docker containerization, Helm charts, and Kubernetes pod ingress.', category: 'Docker & Kubernetes', type: 'Rating' },
        { id: 103, questionText: 'Evaluate your frontend execution in React 19, TypeScript state management, and custom hooks.', category: 'React', type: 'Rating' },
        { id: 104, questionText: 'Rate your capability in microservice system architecture design and high-availability caching.', category: 'System Architecture', type: 'Rating' },
      ];
    }
    const initialAnswers = {};
    tplQuestions.forEach(q => {
      initialAnswers[q.id] = 3;
    });

    setActiveQuestionnaire({
      assessment,
      template: { title: assessment.title || 'Technical Self Assessment' },
      questions: tplQuestions,
    });
    setQuestionAnswers(initialAnswers);
    setCurrentQuestionIdx(0);
  }

  async function handleQuestionnaireSubmit() {
    if (!activeQuestionnaire) return;
    try {
      const qAnswersList = activeQuestionnaire.questions.map(q => ({
        questionId: q.id,
        skill: q.category || 'AWS Cloud',
        score: questionAnswers[q.id] || 3,
      }));

      const res = await submitAssessment({
        assessmentId: activeQuestionnaire.assessment.id,
        employeeId: Number(employeeId),
        answers: qAnswersList,
      });

      setActiveQuestionnaire(null);
      setSubmissionResult(res);
      showToast('✓ Assessment submitted successfully! Skill ratings & gap analysis updated.');
      loadData();
    } catch (err) {
      showToast('Failed to submit assessment', 'error');
    }
  }

  async function handleRequestPeerReviewSubmit(e) {
    e.preventDefault();
    try {
      await requestPeerReview({
        employeeId: Number(employeeId),
        employeeName: user?.name || 'Charlie Brown',
        ...peerForm,
      });
      setPeerModalOpen(false);
      showToast('✓ 360° peer review invitation sent!');
      loadData();
    } catch (err) {
      showToast('Failed to send peer review request', 'error');
    }
  }

  function handleOpenProvideFeedback(review) {
    setActivePeerResponse(review);
    setPeerResponseForm({
      rating: 4.5,
      awsRating: 4,
      k8sRating: 3.5,
      reactRating: 5,
      archRating: 4,
      strengths: 'Strong React 19 architecture expertise, clean component design, and collaborative mindset.',
      areasForImprovement: 'Needs further hands-on experience with Kubernetes multi-cluster ingress routing and AWS cloud automation.',
      comments: 'Consistently delivers high quality code and helps teammates troubleshoot architecture issues.',
      recommendation: 'Focus on AWS Certified Solutions Architect credential and container orchestration.',
    });
  }

  async function handleProvidePeerReviewSubmit(e) {
    e.preventDefault();
    if (!activePeerResponse) return;
    try {
      await submitPeerReviewResponse(activePeerResponse.id, peerResponseForm);
      setActivePeerResponse(null);
      showToast('✓ Peer review response submitted and recorded!');
      loadData();
    } catch (err) {
      showToast('Failed to record feedback', 'error');
    }
  }

  async function handleSaveManagerEval(e) {
    e.preventDefault();
    try {
      const qAnswersList = Object.keys(evalRatings).map(skillName => ({
        skill: skillName,
        score: evalRatings[skillName] || 4,
      }));

      await submitAssessment({
        assessmentId: 1,
        employeeId: Number(selectedEvalEmp.id),
        evaluatorId: Number(user?.employeeId || 2),
        evaluatorType: 'Manager',
        answers: qAnswersList,
      });

      setEvalModalOpen(false);
      showToast(`✓ Official manager evaluation saved for ${selectedEvalEmp.name}! Gaps recalculated.`);
      loadData();
    } catch (err) {
      showToast('Failed to save evaluation', 'error');
    }
  }

  function handleTriggerReminder(target) {
    setReminderTarget(target);
    setReminderModalOpen(true);
  }

  async function handleConfirmSendReminder() {
    if (!reminderTarget) return;
    try {
      await sendAssessmentReminder({
        employeeId: reminderTarget.employeeId || 3,
        employeeName: reminderTarget.employeeName || reminderTarget.title,
        assessmentTitle: reminderTarget.title || 'Technical Assessment',
        dueDate: reminderTarget.dueDate || '2026-08-25',
      });
      setReminderModalOpen(false);
      showToast(`🔔 Reminder alert sent to ${reminderTarget.employeeName || 'employee'}!`);
    } catch (err) {
      showToast('Failed to send reminder', 'error');
    }
  }

  function handleOpenCreateSchedule() {
    setScheduleForm({
      id: null,
      title: '',
      targetGroup: 'Engineering Department',
      templateTitle: 'Quarterly Engineering & Cloud Review',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: '2026-09-25',
      reminderFrequency: 'Weekly',
      status: 'Open',
    });
    setScheduleModalOpen(true);
  }

  function handleOpenEditSchedule(sch) {
    setScheduleForm({
      id: sch.id,
      title: sch.title || '',
      targetGroup: sch.targetGroup || 'Engineering Department',
      templateTitle: sch.templateTitle || 'Quarterly Engineering & Cloud Review',
      startDate: sch.startDate || '2026-09-01',
      dueDate: sch.dueDate || '2026-09-25',
      reminderFrequency: sch.reminderFrequency || 'Weekly',
      status: sch.status || 'Open',
      assignedCount: sch.assignedCount || 14,
      completedCount: sch.completedCount || 3,
    });
    setScheduleModalOpen(true);
  }

  async function handleDeleteSchedule(sch) {
    if (!window.confirm(`Are you sure you want to remove the assessment program "${sch.title}"?`)) return;
    try {
      await deleteAssessmentSchedule(sch.id);
      showToast(`🗑️ Removed assessment program "${sch.title}"`);
      await loadData();
    } catch (err) {
      showToast('Failed to remove program schedule', 'error');
    }
  }

  async function handleScheduleSubmit(e) {
    e.preventDefault();
    if (!scheduleForm.title.trim() || scheduleForm.title.trim().length < 2) {
      showToast('Please enter a valid program title.', 'error');
      return;
    }
    try {
      await saveAssessmentSchedule({
        id: scheduleForm.id || undefined,
        title: scheduleForm.title.trim(),
        targetGroup: scheduleForm.targetGroup,
        templateTitle: scheduleForm.templateTitle,
        startDate: scheduleForm.startDate,
        dueDate: scheduleForm.dueDate,
        reminderFrequency: scheduleForm.reminderFrequency || 'Weekly',
        status: scheduleForm.status || 'Open',
        assignedCount: scheduleForm.assignedCount || 14,
        completedCount: scheduleForm.completedCount || 3,
      });
      setScheduleModalOpen(false);
      showToast(`✓ Assessment program "${scheduleForm.title}" ${scheduleForm.id ? 'updated' : 'created'} successfully!`);
      await loadData();
    } catch (err) {
      showToast('Failed to save schedule', 'error');
    }
  }

  // ── Template & Question Builder Handlers (Full Real CRUD) ───────────
  function handleOpenCreateTemplate() {
    setTemplateError(null);
    setTemplateForm({
      id: null,
      title: '',
      category: 'Cloud Architecture',
      description: '',
      assessmentType: 'Technical Assessment',
      status: 'Published',
      estimatedTimeMinutes: 15,
      scoringMethod: '1–5 Rating Scale',
      passingScore: '4.0',
      allowRetakes: 'Yes',
      showResults: 'Immediately',
      mappedSkills: ['AWS Cloud', 'Docker & Kubernetes'],
      questions: [
        {
          id: `q-${Date.now()}-1`,
          questionText: 'How do you evaluate multi-region container failover and AWS Route53 routing strategies?',
          questionType: 'Multiple Choice',
          mappedSkill: 'AWS Cloud',
          difficulty: 'Advanced',
          weight: 10,
          required: 'Yes',
          optionA: 'Use Route53 latency-based routing with active-passive health checks.',
          optionB: 'Manually update DNS records during regional outage window.',
          optionC: 'Deploy all microservices into a single availability zone.',
          optionD: 'Rely solely on client-side retry logic.',
          correctAnswer: 'A',
        },
        {
          id: `q-${Date.now()}-2`,
          questionText: 'Rate your proficiency in writing custom Helm charts and managing Kubernetes ingress controllers.',
          questionType: 'Rating Scale',
          mappedSkill: 'Docker & Kubernetes',
          difficulty: 'Intermediate',
          weight: 10,
          required: 'Yes',
          minRatingDesc: '1 - Novice (Basic kubectl usage)',
          maxRatingDesc: '5 - Expert (Production Helm charts & Custom CRDs)',
        }
      ],
    });
    setTemplateModalOpen(true);
  }

  function handleOpenEditTemplate(tpl) {
    setTemplateError(null);
    const tplQuestions = questions.filter(q => String(q.templateId) === String(tpl.id));
    const rawSkills = Array.isArray(tpl.mappedSkills) && tpl.mappedSkills.length > 0
      ? tpl.mappedSkills
      : (Array.isArray(tpl.skillsCovered) && tpl.skillsCovered.length > 0
      ? tpl.skillsCovered
      : (Array.isArray(tpl.skillsMapped) && tpl.skillsMapped.length > 0
      ? tpl.skillsMapped
      : ['AWS Cloud', 'Docker & Kubernetes']));

    setTemplateForm({
      id: tpl.id,
      title: tpl.title || tpl.name || '',
      category: tpl.category || 'Cloud Architecture',
      description: tpl.description || '',
      assessmentType: tpl.type || tpl.assessmentType || 'Technical Assessment',
      status: tpl.status || 'Published',
      estimatedTimeMinutes: Number(tpl.estimatedTimeMinutes || tpl.duration || 15),
      scoringMethod: tpl.scoringMethod || '1–5 Rating Scale',
      passingScore: tpl.passingScore || '4.0',
      allowRetakes: tpl.allowRetakes || 'Yes',
      showResults: tpl.showResults || tpl.resultVisibility || 'Immediately',
      mappedSkills: rawSkills,
      questions: tplQuestions.length > 0 ? tplQuestions : [],
      createdAt: tpl.createdAt,
    });
    setTemplateModalOpen(true);
  }

  async function handleDuplicateTemplate(tpl) {
    try {
      await duplicateAssessmentTemplate(tpl.id);
      showToast(`✓ Duplicated template "${tpl.title}" as Draft!`);
      await loadData();
    } catch (err) {
      showToast('Failed to duplicate template', 'error');
    }
  }

  async function handleArchiveTemplate(tpl) {
    try {
      await archiveAssessmentTemplate(tpl.id);
      showToast(`📦 Archived template "${tpl.title}"`);
      await loadData();
    } catch (err) {
      showToast('Failed to archive template', 'error');
    }
  }

  async function handleConfirmDeleteTemplate() {
    if (!deleteTargetTemplate) return;
    try {
      await deleteAssessmentTemplate(deleteTargetTemplate.id);
      setDeleteTargetTemplate(null);
      showToast(`🗑️ Deleted template "${deleteTargetTemplate.title}"`);
      await loadData();
    } catch (err) {
      showToast('Failed to delete template', 'error');
    }
  }

  // Question Builder Sub-Modal Handlers
  function handleOpenAddQuestion() {
    setQuestionForm({
      index: null,
      questionText: '',
      questionType: 'Multiple Choice',
      mappedSkill: templateForm.mappedSkills[0] || 'AWS Cloud',
      difficulty: 'Intermediate',
      weight: 10,
      required: 'Yes',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      minRatingDesc: '1 - Needs Improvement',
      maxRatingDesc: '5 - Expert Mastery',
      scenarioGuidance: '',
    });
    setQuestionModalOpen(true);
  }

  function handleOpenEditQuestion(qItem, idx) {
    setQuestionForm({
      index: idx,
      questionText: qItem.questionText || '',
      questionType: qItem.questionType || 'Multiple Choice',
      mappedSkill: qItem.mappedSkill || qItem.category || 'AWS Cloud',
      difficulty: qItem.difficulty || 'Intermediate',
      weight: qItem.weight || 10,
      required: qItem.required || 'Yes',
      optionA: qItem.optionA || '',
      optionB: qItem.optionB || '',
      optionC: qItem.optionC || '',
      optionD: qItem.optionD || '',
      correctAnswer: qItem.correctAnswer || 'A',
      minRatingDesc: qItem.minRatingDesc || '1 - Needs Improvement',
      maxRatingDesc: qItem.maxRatingDesc || '5 - Expert Mastery',
      scenarioGuidance: qItem.scenarioGuidance || '',
    });
    setQuestionModalOpen(true);
  }

  function handleSaveQuestionSubForm(e) {
    e.preventDefault();
    if (!questionForm.questionText.trim() || questionForm.questionText.trim().length < 5) {
      showToast('Question text must be a valid sentence (at least 5 characters).', 'error');
      return;
    }

    const newQ = {
      id: questionForm.index !== null ? templateForm.questions[questionForm.index]?.id || `q-${Date.now()}` : `q-${Date.now()}`,
      ...questionForm,
    };

    const updatedQuestions = [...templateForm.questions];
    if (questionForm.index !== null) {
      updatedQuestions[questionForm.index] = newQ;
    } else {
      updatedQuestions.push(newQ);
    }

    setTemplateForm({
      ...templateForm,
      questions: updatedQuestions,
    });
    setQuestionModalOpen(false);
    setTemplateError(null);
    showToast('✓ Question saved to template builder!');
  }

  function handleDeleteQuestionFromTemplate(idx) {
    const updated = templateForm.questions.filter((_, i) => i !== idx);
    setTemplateForm({ ...templateForm, questions: updated });
    showToast('Question removed from builder');
  }

  async function handleTemplateSubmit(e, targetStatus = 'Published') {
    if (e && e.preventDefault) e.preventDefault();
    setTemplateError(null);

    const titleClean = (templateForm.title || '').trim();
    const descClean = (templateForm.description || '').trim();

    // 1. Validation for Save as Draft
    if (targetStatus === 'Draft') {
      if (!titleClean || titleClean.length < 2) {
        setTemplateError('Please enter a valid Template Name (at least 2 characters) before saving as draft.');
        return;
      }
    } else {
      // 2. Validation for Publish / Save Changes
      if (!titleClean || titleClean.length < 2) {
        setTemplateError('Please enter a valid Template Name (at least 2 characters).');
        return;
      }
      if (!descClean || descClean.length < 5) {
        setTemplateError('Please enter a detailed description for the assessment template (at least 5 characters).');
        return;
      }
      if (!templateForm.mappedSkills || templateForm.mappedSkills.length === 0) {
        setTemplateError('Select at least one skill to map this assessment to.');
        return;
      }
      if (!templateForm.questions || templateForm.questions.length === 0) {
        setTemplateError('Add at least one question before publishing this template.');
        return;
      }

      // Check each question
      for (let i = 0; i < templateForm.questions.length; i++) {
        const q = templateForm.questions[i];
        if (!q.questionText || q.questionText.trim().length < 5) {
          setTemplateError(`Question #${i + 1} is missing valid question text (at least 5 characters).`);
          return;
        }
        if (q.questionType === 'Multiple Choice') {
          if (!q.optionA || !q.optionA.trim() || !q.optionB || !q.optionB.trim()) {
            setTemplateError(`Question #${i + 1} (Multiple Choice) requires at least Option A and Option B.`);
            return;
          }
        }
      }
    }

    setIsSubmitting(true);

    try {
      const nowIso = new Date().toISOString();
      const payload = {
        id: templateForm.id || undefined,
        title: titleClean,
        name: titleClean,
        category: templateForm.category || 'Cloud Architecture',
        description: descClean,
        type: templateForm.assessmentType || 'Technical Assessment',
        assessmentType: templateForm.assessmentType || 'Technical Assessment',
        status: targetStatus,
        estimatedTimeMinutes: Number(templateForm.estimatedTimeMinutes || 15),
        duration: Number(templateForm.estimatedTimeMinutes || 15),
        questionsCount: templateForm.questions.length,
        mappedSkills: templateForm.mappedSkills,
        skillsCovered: templateForm.mappedSkills,
        skillsMapped: templateForm.mappedSkills,
        scoringMethod: templateForm.scoringMethod || '1–5 Rating Scale',
        passingScore: templateForm.passingScore || '4.0',
        allowRetakes: templateForm.allowRetakes || 'Yes',
        showResults: templateForm.showResults || 'Immediately',
        resultVisibility: templateForm.showResults || 'Immediately',
        createdAt: templateForm.createdAt || nowIso,
        updatedAt: nowIso,
      };

      const savedTpl = await saveAssessmentTemplate(payload);

      // Save mapped questions
      if (Array.isArray(templateForm.questions)) {
        for (const q of templateForm.questions) {
          await saveAssessmentQuestion({
            ...q,
            templateId: savedTpl.id,
          });
        }
      }

      setTemplateModalOpen(false);
      const actionMsg = templateForm.id
        ? 'Assessment template updated successfully.'
        : targetStatus === 'Draft'
        ? 'Assessment template saved as draft.'
        : 'Assessment template published successfully.';
      showToast(`✓ ${actionMsg}`);
      setActiveTab('programs-and-templates');
      await loadData();
    } catch (err) {
      console.error('[handleTemplateSubmit] Save error:', err);
      setTemplateError('Unable to save assessment template. Please try again.');
      showToast('Unable to save assessment template. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) return <LoadingScreen message="Loading Assessment &amp; Survey Engine…" />;

  return (
    <div className="page-container space-y-6">

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border animate-fadeIn ${
          toast.type === 'error' ? 'bg-red-950 border-red-700 text-white' :
          toast.type === 'info' ? 'bg-slate-700 border-slate-600 text-white' :
          'bg-slate-900 border-slate-700 text-white'
        }`}>
          <span className={toast.type === 'error' ? 'text-red-400' : 'text-emerald-400'}>
            {toast.type === 'error' ? '⚠️' : '✓'}
          </span>
          <span className="text-xs font-semibold">{toast.msg}</span>
        </div>
      )}

      {/* ── Page Header (Clean: No "Module 8" badge!) ───────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="page-header-title text-2xl font-extrabold">Assessments &amp; Surveys</h1>
            <span className={roleBadge.badgeClass}>{roleBadge.label} View</span>
          </div>
          <p className="page-header-subtitle">
            Measure skills, collect structured 360° feedback, identify knowledge gaps, and track capability growth over time.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {!isManager && !isAdmin && (
            <button
              type="button"
              onClick={() => setPeerModalOpen(true)}
              className="btn-outline text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <span>🤝</span> Request 360° Review
            </button>
          )}

          {(isManager || isAdmin) && (
            <button
              type="button"
              onClick={() => setScheduleModalOpen(true)}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
            >
              <span>📅</span> Schedule Assessment
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenCreateTemplate}
              className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <span>⚙️</span> Create Question Template
            </button>
          )}
        </div>
      </div>

      {/* ── Dynamic Multi-State KPI Summary Cards ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <SummaryCard title="Assessments Due" value={`${openPendingCount} Pending`} subtext="Action required soon" icon="⏳" accent="amber" />
        <SummaryCard title="In Progress" value={`${inProgressCount} Active`} subtext="Draft questionnaire open" icon="📝" accent="blue" />
        <SummaryCard title="Completed" value={`${completedCount} Done`} subtext="Evaluated &amp; verified" icon="✅" accent="emerald" />
        <SummaryCard title="Avg Score" value={`${avgScore} / 5.0`} subtext="Overall proficiency index" icon="⭐" accent="purple" />
        <SummaryCard title="Gaps Identified" value={`${totalGapsCount} Gaps`} subtext="Auto-synced with Gap Analysis" icon="⚠️" accent="amber" />
        <SummaryCard title="Peer Reviews" value={`${pendingPeerCount} Pending`} subtext="360° feedback workflow" icon="👥" accent="indigo" />
      </div>

      {/* ── Active Skill Assessment Banner (Employee Hub CTA) ─────────── */}
      {!isManager && !isAdmin && activeAssessmentForBanner && (
        <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h3 className="text-sm font-extrabold text-blue-950">
                Active Skill Assessment Cycle Open: {activeAssessmentForBanner.title}
              </h3>
              <p className="text-xs text-blue-800">
                {activeAssessmentForBanner.status === 'In Progress'
                  ? `Your diagnostic questionnaire is currently ${activeAssessmentForBanner.progress || 60}% in progress. Continue to complete evaluation.`
                  : 'Complete your technical self-assessment to update your official proficiency scores and close critical skill gaps.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleStartSelfAssessment(activeAssessmentForBanner)}
            className="btn-primary text-xs py-2.5 px-4 bg-blue-600 hover:bg-blue-700 shrink-0 whitespace-nowrap"
          >
            {activeAssessmentForBanner.status === 'In Progress'
              ? `Continue Self Assessment (${activeAssessmentForBanner.progress || 60}%) \u2192`
              : 'Start Self Assessment \u2192'}
          </button>
        </div>
      )}

      {/* ── Main Tabbed Panel ────────────────────────────────────────── */}
      <div className="panel overflow-hidden">

        {/* Dynamic Role Navigation Bar */}
        <div className="w-full bg-slate-50 border-b border-slate-200 px-4 sm:px-6 pt-2">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2">
            {roleTabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-800'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">

          {/* ================================================================ */}
          {/* TAB: OVERVIEW (Employee / Manager / Admin)                      */}
          {/* ================================================================ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">

              {/* Employee Overview Content */}
              {!isManager && !isAdmin && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-extrabold text-slate-900">Your Active &amp; Upcoming Assessment Cycles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {myAssessments.map(ass => (
                        <div key={ass.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="chip-indigo text-xs font-bold">{ass.type || 'Self Assessment'}</span>
                              <span className={`text-[10px] font-bold py-0.5 px-2 rounded-full border ${
                                ass.status === 'Completed' ? 'badge-success bg-emerald-50 text-emerald-700 border-emerald-200' :
                                ass.status === 'In Progress' ? 'badge-warning bg-amber-50 text-amber-700 border-amber-200' :
                                'badge-blue bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                {ass.status} {ass.progress ? `(${ass.progress}%)` : ''}
                              </span>
                            </div>
                            <h4 className="text-sm font-extrabold text-slate-900">{ass.title}</h4>
                            <p className="text-xs text-slate-500 mt-1">Due: {ass.dueDate || '2026-08-25'} &bull; Evaluator: {ass.managerEvaluator || 'Self Assessment'}</p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <span className="text-xs font-bold text-slate-700">
                              {ass.overallScore ? `Score: ${ass.overallScore}/5.0 (${ass.scorePct}%)` : ass.status === 'In Progress' ? 'Draft Questionnaire Active' : 'Assigned / Pending'}
                            </span>
                            {ass.status === 'Completed' ? (
                              <button
                                type="button"
                                onClick={() => setActiveTab('history-delta')}
                                className="btn-outline text-xs py-1.5 px-3"
                              >
                                View Results &rarr;
                              </button>
                            ) : ass.status === 'In Progress' ? (
                              <button
                                type="button"
                                onClick={() => handleStartSelfAssessment(ass)}
                                className="btn-primary text-xs py-1.5 px-3 bg-amber-600 hover:bg-amber-700"
                              >
                                Continue ({ass.progress}%) &rarr;
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStartSelfAssessment(ass)}
                                className="btn-primary text-xs py-1.5 px-3 bg-blue-600 hover:bg-blue-700"
                              >
                                Start Assessment &rarr;
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Manager & Admin Overview Summary */}
              {(isManager || isAdmin) && (
                <div className="space-y-6">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">Enterprise Evaluation Program Dashboard</h3>
                      <p className="text-xs text-slate-500">Monitor completion rates, skill proficiency updates, and evaluation schedules.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab(isAdmin ? 'programs-and-templates' : 'team-assessments')}
                        className="btn-primary text-xs py-2 px-4"
                      >
                        Manage Programs &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ================================================================ */}
          {/* TAB: MY ASSESSMENTS & SELF ASSESSMENT (Employee View)           */}
          {/* ================================================================ */}
          {(activeTab === 'my-assessments' || activeTab === 'self-assessment') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900">Assigned Skill Assessments &amp; Self Diagnostic Cycles</h3>
                <span className="text-xs text-slate-400 font-semibold">{myAssessments.length} Total Programs</span>
              </div>

              <div className="table-container">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th className="table-th">ASSESSMENT PROGRAM</th>
                      <th className="table-th">TYPE</th>
                      <th className="table-th">STATUS</th>
                      <th className="table-th">DUE DATE</th>
                      <th className="table-th">SCORE / OVERALL</th>
                      <th className="table-th text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myAssessments.map(ass => (
                      <tr key={ass.id} className="table-row">
                        <td className="table-td">
                          <p className="font-bold text-slate-900 text-xs">{ass.title}</p>
                          <p className="text-[11px] text-slate-500">{ass.department || 'Engineering'} &bull; Evaluator: {ass.managerEvaluator || 'Self Assessment'}</p>
                        </td>
                        <td className="table-td">
                          <span className="chip-indigo text-xs font-bold">{ass.type || 'Self Assessment'}</span>
                        </td>
                        <td className="table-td">
                          <span className={`text-xs font-bold py-0.5 px-2.5 rounded-full border ${
                            ass.status === 'Completed' ? 'badge-success bg-emerald-50 text-emerald-700 border-emerald-200' :
                            ass.status === 'In Progress' ? 'badge-warning bg-amber-50 text-amber-700 border-amber-200' :
                            'badge-blue bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {ass.status} {ass.progress ? `(${ass.progress}%)` : ''}
                          </span>
                        </td>
                        <td className="table-td text-xs text-slate-600">{ass.dueDate || '2026-08-25'}</td>
                        <td className="table-td text-xs font-bold text-slate-900">
                          {ass.overallScore ? `${ass.overallScore} / 5.0 (${ass.scorePct}%)` : '—'}
                        </td>
                        <td className="table-td text-right">
                          {ass.status === 'Completed' ? (
                            <button
                              type="button"
                              onClick={() => setActiveTab('history-delta')}
                              className="btn-outline text-xs py-1 px-3"
                            >
                              View Results &rarr;
                            </button>
                          ) : ass.status === 'In Progress' ? (
                            <button
                              type="button"
                              onClick={() => handleStartSelfAssessment(ass)}
                              className="btn-primary text-xs py-1 px-3 bg-amber-600 hover:bg-amber-700"
                            >
                              Continue ({ass.progress}%) &rarr;
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartSelfAssessment(ass)}
                              className="btn-primary text-xs py-1 px-3 bg-blue-600 hover:bg-blue-700"
                            >
                              Start Assessment &rarr;
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB: 360° PEER REVIEW                                           */}
          {/* ================================================================ */}
          {activeTab === 'peer-reviews' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">360° Peer &amp; Mentor Feedback Workflow</h3>
                  <p className="text-xs text-slate-500">Collect structured multi-rater feedback from teammates and technical mentors.</p>
                </div>
                {!isManager && !isAdmin && (
                  <button
                    type="button"
                    onClick={() => setPeerModalOpen(true)}
                    className="btn-primary text-xs py-2 px-3.5"
                  >
                    + Request Peer Review
                  </button>
                )}
              </div>

              <div className="table-container">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th className="table-th">REVIEWER</th>
                      <th className="table-th">RELATIONSHIP</th>
                      <th className="table-th">STATUS</th>
                      <th className="table-th">COMPLETED DATE</th>
                      <th className="table-th text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myPeerReviews.map(pr => (
                      <tr key={pr.id} className="table-row">
                        <td className="table-td">
                          <p className="font-bold text-slate-900 text-xs">{pr.reviewerName}</p>
                          <p className="text-[11px] text-slate-500">{pr.reviewerRole}</p>
                        </td>
                        <td className="table-td text-xs text-slate-600">{pr.relationship}</td>
                        <td className="table-td">
                          <span className={`text-xs font-bold py-0.5 px-2.5 rounded-full border ${
                            pr.status === 'Completed' ? 'badge-success bg-emerald-50 text-emerald-700 border-emerald-200' : 'badge-warning bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {pr.status}
                          </span>
                        </td>
                        <td className="table-td text-xs text-slate-500">{pr.completedDate || pr.requestedDate || 'Pending'}</td>
                        <td className="table-td text-right">
                          {pr.status === 'Completed' ? (
                            <button
                              type="button"
                              onClick={() => setSelectedPeerDetails(pr)}
                              className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 ml-auto whitespace-nowrap"
                            >
                              👁 View Feedback &rarr;
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenProvideFeedback(pr)}
                              className="btn-primary text-xs py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 ml-auto whitespace-nowrap"
                            >
                              ✏️ Provide Feedback &rarr;
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB: HISTORY & DELTA (DYNAMIC COMPARISON ENGINE)                */}
          {/* ================================================================ */}
          {(activeTab === 'history-delta' || activeTab === 'history' || activeTab === 'team-history') && (
            <div className="space-y-5">
              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-purple-950">Side-by-Side Skill Delta &amp; Historical Comparison</h3>
                    <p className="text-xs text-purple-800">Compare score improvement over time to measure capability growth and skill gap resolution.</p>
                  </div>
                  <span className="badge-purple text-xs font-bold px-3 py-1 rounded-full border border-purple-300 shrink-0">
                    Auto-Synced with Gap Analysis
                  </span>
                </div>

                {/* Dynamic Assessment Dropdown Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="form-label text-purple-900 text-xs">Baseline Assessment A (Previous):</label>
                    <select
                      value={compareFirstId}
                      onChange={e => setCompareFirstId(e.target.value)}
                      className="form-select text-xs w-full bg-white font-semibold"
                    >
                      {completedAssessmentsForScope.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.title} ({a.submittedAt || 'Baseline'}) &bull; Score: {a.overallScore}/5.0
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label text-purple-900 text-xs">Comparison Assessment B (Current):</label>
                    <select
                      value={compareSecondId}
                      onChange={e => setCompareSecondId(e.target.value)}
                      className="form-select text-xs w-full bg-white font-semibold"
                    >
                      {completedAssessmentsForScope.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.title} ({a.submittedAt || 'Current'}) &bull; Score: {a.overallScore}/5.0
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Dynamic Comparison Table */}
              <div className="table-container">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th className="table-th">ASSESSED SKILL</th>
                      <th className="table-th">PREVIOUS LEVEL</th>
                      <th className="table-th">CURRENT LEVEL</th>
                      <th className="table-th">NET DELTA (+LEVELS)</th>
                      <th className="table-th">GAP RESOLUTION STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dynamicComparisonRows.map(row => (
                      <tr key={row.skill} className="table-row">
                        <td className="table-td font-bold text-slate-900 text-xs">
                          <span className="chip-indigo text-xs">{row.skill}</span>
                        </td>
                        <td className="table-td text-xs font-mono text-slate-600">{row.prevVal}</td>
                        <td className="table-td text-xs font-mono text-slate-900 font-bold">{row.currVal}</td>
                        <td className={`table-td text-xs ${row.deltaClass}`}>{row.deltaText}</td>
                        <td className="table-td">
                          <span className={`text-xs font-bold py-0.5 px-2.5 rounded-full border ${row.statusClass}`}>
                            {row.statusText}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB: TEAM ASSESSMENTS (Manager View)                            */}
          {/* ================================================================ */}
          {activeTab === 'team-assessments' && isManager && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900">Direct Team Member Assessments</h3>
                <span className="text-xs text-slate-400 font-semibold">3 Direct Reports</span>
              </div>

              <div className="table-container">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th className="table-th">EMPLOYEE</th>
                      <th className="table-th">ROLE &amp; DEPARTMENT</th>
                      <th className="table-th">STATUS</th>
                      <th className="table-th">CURRENT SCORE</th>
                      <th className="table-th text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: 3, name: 'Charlie Brown', role: 'Full-Stack Software Engineer', department: 'Engineering', status: 'Completed', score: '4.4 / 5.0' },
                      { id: 2, name: 'Bob Jones', role: 'Engineering Manager', department: 'Engineering', status: 'In Progress', score: '4.0 / 5.0' },
                      { id: 4, name: 'Diana Prince', role: 'Senior Data Scientist', department: 'Data Science', status: 'Completed', score: '4.8 / 5.0' },
                    ].map(emp => (
                      <tr key={emp.id} className="table-row">
                        <td className="table-td font-bold text-slate-900 text-xs">{emp.name}</td>
                        <td className="table-td text-xs text-slate-600">{emp.role} &bull; {emp.department}</td>
                        <td className="table-td">
                          <span className={`text-xs font-bold py-0.5 px-2.5 rounded-full border ${
                            emp.status === 'Completed' ? 'badge-success bg-emerald-50 text-emerald-700 border-emerald-200' : 'badge-warning bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {emp.status}
                          </span>
                        </td>
                        <td className="table-td text-xs font-bold text-slate-900">{emp.score}</td>
                        <td className="table-td text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEvalEmp(emp);
                              setEvalModalOpen(true);
                            }}
                            className="btn-primary text-xs py-1 px-3 bg-purple-600 hover:bg-purple-700"
                          >
                            Evaluate &rarr;
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTriggerReminder({ employeeId: emp.id, employeeName: emp.name, title: 'Quarterly Technical Review', dueDate: '2026-08-25' })}
                            className="btn-outline text-xs py-1 px-2.5"
                          >
                            🔔 Remind
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB: MANAGER EVALUATION / WORKFLOWS                             */}
          {/* ================================================================ */}
          {(activeTab === 'evaluations' || activeTab === 'workflows') && (isManager || isAdmin) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Manager &amp; HR Team Evaluations</h3>
                  <p className="text-xs text-slate-500">Provide official performance ratings and update employee skill gap profiles.</p>
                </div>
              </div>

              <div className="table-container">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th className="table-th">EMPLOYEE</th>
                      <th className="table-th">ROLE &amp; DEPARTMENT</th>
                      <th className="table-th">LAST EVALUATION</th>
                      <th className="table-th">CURRENT SCORE</th>
                      <th className="table-th text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: 3, name: 'Charlie Brown', role: 'Full-Stack Software Engineer', department: 'Engineering', lastEval: '2026-08-05', score: '4.4 / 5.0' },
                      { id: 2, name: 'Bob Jones', role: 'Engineering Manager', department: 'Engineering', lastEval: '2026-07-20', score: '4.0 / 5.0' },
                      { id: 4, name: 'Diana Prince', role: 'Senior Data Scientist', department: 'Data Science', lastEval: '2026-07-15', score: '4.8 / 5.0' },
                    ].map(emp => (
                      <tr key={emp.id} className="table-row">
                        <td className="table-td font-bold text-slate-900 text-xs">{emp.name}</td>
                        <td className="table-td text-xs text-slate-600">{emp.role} &bull; {emp.department}</td>
                        <td className="table-td text-xs text-slate-500">{emp.lastEval}</td>
                        <td className="table-td text-xs font-bold text-emerald-700">{emp.score}</td>
                        <td className="table-td text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEvalEmp(emp);
                              setEvalModalOpen(true);
                            }}
                            className="btn-primary text-xs py-1.5 px-3 bg-purple-600 hover:bg-purple-700"
                          >
                            Evaluate Employee &rarr;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB: SCHEDULE & REMINDERS                                        */}
          {/* ================================================================ */}
          {activeTab === 'schedule' && (isManager || isAdmin) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Scheduled Assessment Cycles &amp; Reminders</h3>
                  <p className="text-xs text-slate-500">Automated reminder triggers and team evaluation schedules.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(true)}
                  className="btn-primary text-xs py-2 px-3.5"
                >
                  + Schedule New Cycle
                </button>
              </div>

              <div className="space-y-3">
                {schedules.map(sch => (
                  <div key={sch.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold py-0.5 px-2 rounded-full border ${
                          sch.status === 'Open' ? 'badge-success bg-emerald-50 text-emerald-700 border-emerald-200' :
                          sch.status === 'Overdue' ? 'badge-danger bg-red-50 text-red-700 border-red-200' :
                          'badge-blue bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {sch.status}
                        </span>
                        <span className="chip-indigo text-xs font-bold">{sch.targetGroup}</span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900">{sch.title}</h4>
                      <p className="text-xs text-slate-500">Window: {sch.startDate} to {sch.dueDate} &bull; Reminders: {sch.reminderFrequency}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right text-xs">
                        <span className="text-slate-500 font-bold block">Assigned: {sch.assignedCount} Staff</span>
                        <span className="text-emerald-600 font-bold">{sch.completedCount} Completed</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTriggerReminder({ employeeId: 3, employeeName: sch.targetGroup, title: sch.title, dueDate: sch.dueDate })}
                        className="btn-outline text-xs py-2 px-3"
                      >
                        🔔 Send Reminder
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* MERGED TAB: ASSESSMENT PROGRAMS & TEMPLATES (ADMINISTRATOR)      */}
          {/* ================================================================ */}
          {activeTab === 'programs-and-templates' && isAdmin && (
            <div className="space-y-8">

              {/* ASSESSMENT PROGRAMS & CYCLES */}
              <div className="space-y-4 border-b border-slate-200 pb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Enterprise Assessment Programs &amp; Active Cycles</h3>
                    <p className="text-xs text-slate-500">Organization-wide assessment schedules, active evaluation windows, and department targets.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenCreateSchedule}
                    className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 self-start md:self-auto"
                  >
                    <span>📅</span> Schedule Assessment Program
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {schedules.map(sch => (
                    <div key={sch.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="chip-indigo text-xs font-bold">{sch.targetGroup}</span>
                          <span className={`text-[10px] font-bold py-0.5 px-2 rounded-full border ${
                            sch.status === 'Open' ? 'badge-success bg-emerald-50 text-emerald-700 border-emerald-200' : 'badge-blue bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {sch.status || 'Open'}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900">{sch.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">Window: {sch.startDate} to {sch.dueDate} &bull; Template: {sch.templateTitle || 'Standard Diagnostic'}</p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                        <span className="text-slate-600 font-semibold">{sch.assignedCount || 14} Assigned &bull; {sch.completedCount || 3} Completed</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSchedule(sch)}
                            className="btn-outline text-xs py-1 px-2.5"
                            title="Edit Program Schedule"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTriggerReminder({ employeeId: 3, employeeName: sch.targetGroup, title: sch.title, dueDate: sch.dueDate })}
                            className="btn-outline text-xs py-1 px-2.5"
                            title="Send Reminder Alert"
                          >
                            🔔 Remind
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSchedule(sch)}
                            className="btn-outline text-xs py-1 px-2 text-red-600 hover:bg-red-50 hover:border-red-300"
                            title="Remove Program Schedule"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* QUESTION TEMPLATES CATALOG */}
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Assessment Question Templates Catalog</h3>
                    <p className="text-xs text-slate-500">Configure reusable question banks, multi-section forms, scoring methods, and skill mappings.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenCreateTemplate}
                    className="btn-secondary text-xs py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 self-start md:self-auto"
                  >
                    <span>⚙️</span> + Create Question Template
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(tpl => {
                    const tplQuestions = questions.filter(q => String(q.templateId) === String(tpl.id));
                    const qCount = tplQuestions.length || tpl.questionsCount || 4;
                    const mappedSkills = Array.isArray(tpl.mappedSkills) ? tpl.mappedSkills : (tpl.category === 'Cloud Architecture' ? ['AWS Cloud', 'Docker & Kubernetes'] : ['React', 'System Architecture']);

                    return (
                      <div key={tpl.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="chip-indigo text-xs font-bold">{tpl.category || 'Engineering'}</span>
                            <span className={`text-[10px] font-bold py-0.5 px-2 rounded-full border ${
                              tpl.status === 'Archived' ? 'bg-slate-100 text-slate-600 border-slate-300' :
                              tpl.status === 'Draft' ? 'badge-warning bg-amber-50 text-amber-700 border-amber-200' :
                              'badge-success bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {tpl.status || 'Published'}
                            </span>
                          </div>
                          <h4 className="text-sm font-extrabold text-slate-900">{tpl.title}</h4>
                          <p className="text-xs text-slate-600 leading-relaxed">{tpl.description}</p>

                          {/* Mapped Skills Chips */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[11px] font-bold text-slate-500">Skills Mapped:</span>
                            {mappedSkills.map(sk => (
                              <span key={sk} className="badge-purple text-[10px] py-0.5 px-2 font-bold">{sk}</span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                          <span className="text-slate-500 font-semibold">{tpl.estimatedTimeMinutes || 15} mins &bull; {qCount} Questions</span>

                          {/* Action Controls */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditTemplate(tpl)}
                              className="btn-outline text-xs py-1 px-2.5"
                              title="Edit Template"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateTemplate(tpl)}
                              className="btn-outline text-xs py-1 px-2.5"
                              title="Duplicate Template"
                            >
                              📋 Copy
                            </button>
                            {tpl.status !== 'Archived' ? (
                              <button
                                type="button"
                                onClick={() => handleArchiveTemplate(tpl)}
                                className="btn-outline text-xs py-1 px-2.5"
                                title="Archive Template"
                              >
                                📦 Archive
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => setDeleteTargetTemplate(tpl)}
                              className="btn-outline text-xs py-1 px-2 text-red-600 hover:bg-red-50 hover:border-red-300"
                              title="Delete Template"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL 1: INTERACTIVE SELF-ASSESSMENT QUESTIONNAIRE TAKER              */}
      {/* ==================================================================== */}
      {activeQuestionnaire && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200">Interactive Diagnostic Taker &bull; Self Assessment</span>
                <h3 className="text-lg font-extrabold">{activeQuestionnaire.template.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveQuestionnaire(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>Question {currentQuestionIdx + 1} of {activeQuestionnaire.questions.length}</span>
                  <span>{Math.round(((currentQuestionIdx + 1) / activeQuestionnaire.questions.length) * 100)}% Completed</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${((currentQuestionIdx + 1) / activeQuestionnaire.questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {activeQuestionnaire.questions[currentQuestionIdx] && (
                <div className="space-y-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="chip-indigo text-xs font-bold">
                    Skill: {activeQuestionnaire.questions[currentQuestionIdx].category || activeQuestionnaire.questions[currentQuestionIdx].mappedSkill || 'AWS Cloud'}
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900">
                    {activeQuestionnaire.questions[currentQuestionIdx].questionText}
                  </h4>

                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-slate-600">Select your self-evaluated proficiency level:</label>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map(lvl => {
                        const qId = activeQuestionnaire.questions[currentQuestionIdx].id;
                        const isSelected = questionAnswers[qId] === lvl;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setQuestionAnswers({ ...questionAnswers, [qId]: lvl })}
                            className={`p-3 rounded-xl border text-center font-bold transition-all ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400'
                            }`}
                          >
                            <span className="block text-sm">Level {lvl}</span>
                            <span className="text-[10px] font-normal opacity-80">
                              {lvl === 1 ? 'Novice' : lvl === 2 ? 'Basic' : lvl === 3 ? 'Proficient' : lvl === 4 ? 'Advanced' : 'Expert'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                disabled={currentQuestionIdx === 0}
                onClick={() => setCurrentQuestionIdx(currentQuestionIdx - 1)}
                className="btn-outline text-xs py-2 px-4 disabled:opacity-40"
              >
                &larr; Previous
              </button>

              {currentQuestionIdx < activeQuestionnaire.questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
                  className="btn-primary text-xs py-2 px-5 bg-blue-600 hover:bg-blue-700"
                >
                  Next Question &rarr;
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleQuestionnaireSubmit}
                  className="btn-primary text-xs py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 font-extrabold"
                >
                  Submit Final Assessment ✓
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: SUBMISSION RESULT & GAP CLOSURE CONFIRMATION                */}
      {/* ==================================================================== */}
      {submissionResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden p-6 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 text-3xl flex items-center justify-center mx-auto">
              🏆
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Assessment Submitted Successfully!</h3>
              <p className="text-xs text-slate-500 mt-1">Your proficiency scores were recorded and synced with Gap Analysis.</p>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950">Overall Evaluation Score:</span>
                <span className="text-sm font-extrabold text-emerald-700">{submissionResult.assessment?.overallScore} / 5.0 ({submissionResult.assessment?.scorePct}%)</span>
              </div>
              <div className="border-t border-emerald-200/60 pt-2 space-y-1">
                <p className="text-[11px] font-bold text-emerald-900">Skill Level Deltas Applied:</p>
                {submissionResult.assessment?.assessedSkills?.map(as => (
                  <div key={as.skill} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700">{as.skill}:</span>
                    <span className="font-bold text-emerald-700">Lvl {as.beforeLevel} &rarr; Lvl {as.afterLevel} ({as.status})</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSubmissionResult(null)}
              className="btn-primary text-xs py-2.5 px-6 bg-blue-600 hover:bg-blue-700 w-full"
            >
              Done &amp; Return to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: REQUEST 360° PEER REVIEW                                    */}
      {/* ==================================================================== */}
      {peerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <form onSubmit={handleRequestPeerReviewSubmit} className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Request 360° Peer Feedback</h3>
              <button type="button" onClick={() => setPeerModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="form-label">Reviewer Name</label>
                <input
                  type="text"
                  required
                  value={peerForm.reviewerName}
                  onChange={e => setPeerForm({ ...peerForm, reviewerName: e.target.value })}
                  className="form-input text-xs w-full"
                />
              </div>

              <div>
                <label className="form-label">Reviewer Role</label>
                <input
                  type="text"
                  required
                  value={peerForm.reviewerRole}
                  onChange={e => setPeerForm({ ...peerForm, reviewerRole: e.target.value })}
                  className="form-input text-xs w-full"
                />
              </div>

              <div>
                <label className="form-label">Working Relationship</label>
                <select
                  value={peerForm.relationship}
                  onChange={e => setPeerForm({ ...peerForm, relationship: e.target.value })}
                  className="form-select text-xs w-full"
                >
                  <option value="Technical Mentor">Technical Mentor</option>
                  <option value="Peer Engineer">Peer Engineer</option>
                  <option value="Project Lead">Project Lead</option>
                  <option value="Cross-Functional Teammate">Cross-Functional Teammate</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setPeerModalOpen(false)} className="btn-outline text-xs py-2 px-4">
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs py-2 px-5 bg-blue-600 hover:bg-blue-700">
                Send Peer Request &rarr;
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: VIEW PEER REVIEW DETAILS (Completed Reviews)                */}
      {/* ==================================================================== */}
      {selectedPeerDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">360° Peer Feedback Report</span>
                <h3 className="text-base font-extrabold">{selectedPeerDetails.reviewerName}</h3>
                <p className="text-xs text-slate-300">{selectedPeerDetails.reviewerRole} &bull; {selectedPeerDetails.relationship}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPeerDetails(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <span className="font-bold text-emerald-950">Overall Rating Score:</span>
                <span className="text-sm font-extrabold text-emerald-700">{selectedPeerDetails.ratingScore || 4.5} / 5.0</span>
              </div>

              {selectedPeerDetails.skillRatings && (
                <div className="space-y-2">
                  <h4 className="font-extrabold text-slate-900">Rated Skill Competencies:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedPeerDetails.skillRatings).map(([sk, val]) => (
                      <div key={sk} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                        <span className="text-slate-700 font-semibold">{sk}:</span>
                        <span className="font-bold text-blue-700">Lvl {val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900">Key Strengths &amp; Accomplishments:</h4>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 leading-relaxed">
                  {selectedPeerDetails.strengths || selectedPeerDetails.comments}
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900">Areas for Growth &amp; Recommendations:</h4>
                <p className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-950 leading-relaxed">
                  {selectedPeerDetails.areasForImprovement || selectedPeerDetails.recommendation}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setSelectedPeerDetails(null)}
                className="btn-primary text-xs py-2 px-5 bg-slate-800 hover:bg-slate-900"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 5: PROVIDE PEER REVIEW RESPONSE (Pending Reviews)              */}
      {/* ==================================================================== */}
      {activePeerResponse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <form onSubmit={handleProvidePeerReviewSubmit} className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-gradient-to-r from-purple-600 to-indigo-700 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">Submit 360° Peer Feedback</span>
                <h3 className="text-base font-extrabold">Evaluating Teammate: {activePeerResponse.employeeName || 'Charlie Brown'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePeerResponse(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div>
                <label className="form-label">Overall Peer Performance Rating (1 to 5):</label>
                <select
                  value={peerResponseForm.rating}
                  onChange={e => setPeerResponseForm({ ...peerResponseForm, rating: Number(e.target.value) })}
                  className="form-select text-xs w-full bg-white"
                >
                  <option value={5}>5.0 — Exceptional (Exceeds expectations consistently)</option>
                  <option value={4.5}>4.5 — Outstanding Competency</option>
                  <option value={4}>4.0 — High Proficiency</option>
                  <option value={3.5}>3.5 — Solid Performer</option>
                  <option value={3}>3.0 — Meets Basic Requirements</option>
                </select>
              </div>

              <div>
                <label className="form-label">Key Strengths &amp; Technical Contributions:</label>
                <textarea
                  rows={3}
                  required
                  value={peerResponseForm.strengths}
                  onChange={e => setPeerResponseForm({ ...peerResponseForm, strengths: e.target.value })}
                  className="form-textarea text-xs w-full"
                />
              </div>

              <div>
                <label className="form-label">Areas for Skill Growth &amp; Development Advice:</label>
                <textarea
                  rows={3}
                  required
                  value={peerResponseForm.areasForImprovement}
                  onChange={e => setPeerResponseForm({ ...peerResponseForm, areasForImprovement: e.target.value })}
                  className="form-textarea text-xs w-full"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActivePeerResponse(null)}
                className="btn-outline text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary text-xs py-2 px-5 bg-purple-600 hover:bg-purple-700"
              >
                Submit Peer Feedback ✓
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 6: MANAGER EVALUATION MODAL                                    */}
      {/* ==================================================================== */}
      {evalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <form onSubmit={handleSaveManagerEval} className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Manager Skill Evaluation</h3>
                <p className="text-xs text-slate-500">Employee: {selectedEvalEmp.name} &bull; {selectedEvalEmp.role}</p>
              </div>
              <button type="button" onClick={() => setEvalModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-600">Set verified manager ratings for key department competencies:</p>
              {Object.keys(evalRatings).map(skillName => (
                <div key={skillName} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="font-bold text-slate-800">{skillName}:</span>
                  <select
                    value={evalRatings[skillName]}
                    onChange={e => setEvalRatings({ ...evalRatings, [skillName]: Number(e.target.value) })}
                    className="form-select text-xs w-32 bg-white"
                  >
                    <option value={1}>Level 1 (Novice)</option>
                    <option value={2}>Level 2 (Basic)</option>
                    <option value={3}>Level 3 (Proficient)</option>
                    <option value={4}>Level 4 (Advanced)</option>
                    <option value={5}>Level 5 (Expert)</option>
                  </select>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setEvalModalOpen(false)} className="btn-outline text-xs py-2 px-4">
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs py-2 px-5 bg-purple-600 hover:bg-purple-700">
                Save &amp; Recalculate Gaps ✓
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 7: SEND REMINDER MODAL                                         */}
      {/* ==================================================================== */}
      {reminderModalOpen && reminderTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Send Assessment Reminder</h3>
              <button type="button" onClick={() => setReminderModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Send an in-app notification and email reminder for <strong>"{reminderTarget.title}"</strong> due on {reminderTarget.dueDate || '2026-08-25'}.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setReminderModalOpen(false)} className="btn-outline text-xs py-2 px-4">
                Cancel
              </button>
              <button type="button" onClick={handleConfirmSendReminder} className="btn-primary text-xs py-2 px-5 bg-amber-600 hover:bg-amber-700">
                🔔 Send Reminder Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 8: SCHEDULE ASSESSMENT PROGRAM CYCLE MODAL                     */}
      {/* ==================================================================== */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <form onSubmit={handleScheduleSubmit} className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Schedule Assessment Cycle Program</h3>
              <button type="button" onClick={() => setScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="form-label">Program Cycle Title</label>
                <input
                  type="text"
                  required
                  value={scheduleForm.title}
                  onChange={e => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                  placeholder="e.g. Q4 2026 Engineering Cloud Benchmark"
                  className="form-input text-xs w-full"
                />
              </div>

              <div>
                <label className="form-label">Target Group / Department</label>
                <input
                  type="text"
                  required
                  value={scheduleForm.targetGroup}
                  onChange={e => setScheduleForm({ ...scheduleForm, targetGroup: e.target.value })}
                  className="form-input text-xs w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.startDate}
                    onChange={e => setScheduleForm({ ...scheduleForm, startDate: e.target.value })}
                    className="form-input text-xs w-full"
                  />
                </div>
                <div>
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.dueDate}
                    onChange={e => setScheduleForm({ ...scheduleForm, dueDate: e.target.value })}
                    className="form-input text-xs w-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setScheduleModalOpen(false)} className="btn-outline text-xs py-2 px-4">
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs py-2 px-5 bg-blue-600 hover:bg-blue-700">
                Save &amp; Publish Schedule &rarr;
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 9: MULTI-SECTION CREATE / EDIT QUESTION TEMPLATE FORM (ADMIN)  */}
      {/* ==================================================================== */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <form onSubmit={handleTemplateSubmit} className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-purple-700 to-indigo-800 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-purple-200 uppercase tracking-widest">Assessment Question Bank Builder</span>
                <h3 className="text-lg font-extrabold">{templateForm.id ? 'Edit Assessment Template' : 'Create Assessment Template'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">

              {/* Inline Validation Error Banner */}
              {templateError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs text-red-700 font-bold animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚠️</span>
                    <span>{templateError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTemplateError(null)}
                    className="text-red-400 hover:text-red-600 font-extrabold text-sm"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* BASIC INFORMATION */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="font-extrabold text-slate-900 text-sm">Basic Information</h4>
                  <span className="badge-purple text-[10px]">Required</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Template Name *</label>
                    <input
                      type="text"
                      required
                      value={templateForm.title}
                      onChange={e => {
                        setTemplateForm({ ...templateForm, title: e.target.value });
                        if (templateError) setTemplateError(null);
                      }}
                      placeholder="e.g. Cloud Infrastructure Security Assessment"
                      className="form-input text-xs w-full"
                    />
                  </div>

                  <div>
                    <label className="form-label">Category *</label>
                    <select
                      value={templateForm.category}
                      onChange={e => setTemplateForm({ ...templateForm, category: e.target.value })}
                      className="form-select text-xs w-full"
                    >
                      <option value="Cloud Architecture">Cloud Architecture</option>
                      <option value="Frontend Engineering">Frontend Engineering</option>
                      <option value="Data Science">Data Science</option>
                      <option value="DevOps & Systems">DevOps &amp; Systems</option>
                      <option value="Leadership & Soft Skills">Leadership &amp; Soft Skills</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Description *</label>
                  <textarea
                    rows={2}
                    required
                    value={templateForm.description}
                    onChange={e => {
                      setTemplateForm({ ...templateForm, description: e.target.value });
                      if (templateError) setTemplateError(null);
                    }}
                    placeholder="Brief summary of what capabilities this assessment evaluates..."
                    className="form-textarea text-xs w-full"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Assessment Type *</label>
                    <select
                      value={templateForm.assessmentType}
                      onChange={e => setTemplateForm({ ...templateForm, assessmentType: e.target.value })}
                      className="form-select text-xs w-full"
                    >
                      <option value="Skill Self Assessment">Skill Self Assessment</option>
                      <option value="360° Peer Assessment">360° Peer Assessment</option>
                      <option value="Manager Evaluation">Manager Evaluation</option>
                      <option value="Technical Assessment">Technical Assessment</option>
                      <option value="Competency Benchmark">Competency Benchmark</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Status</label>
                    <select
                      value={templateForm.status}
                      onChange={e => setTemplateForm({ ...templateForm, status: e.target.value })}
                      className="form-select text-xs w-full"
                    >
                      <option value="Published">Published</option>
                      <option value="Draft">Draft</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ASSESSMENT CONFIGURATION & SETTINGS */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-200 pb-2">Assessment Configuration &amp; Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">Estimated Duration (Mins) *</label>
                    <input
                      type="number"
                      required
                      min={5}
                      max={120}
                      value={templateForm.estimatedTimeMinutes}
                      onChange={e => setTemplateForm({ ...templateForm, estimatedTimeMinutes: Number(e.target.value) })}
                      className="form-input text-xs w-full"
                    />
                  </div>

                  <div>
                    <label className="form-label">Scoring Method</label>
                    <select
                      value={templateForm.scoringMethod}
                      onChange={e => setTemplateForm({ ...templateForm, scoringMethod: e.target.value })}
                      className="form-select text-xs w-full"
                    >
                      <option value="1–5 Rating Scale">1–5 Rating Scale</option>
                      <option value="Percentage">Percentage</option>
                      <option value="Skill Level">Skill Level</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Passing Benchmark Score</label>
                    <input
                      type="text"
                      value={templateForm.passingScore}
                      onChange={e => setTemplateForm({ ...templateForm, passingScore: e.target.value })}
                      placeholder="e.g. 4.0 / 80%"
                      className="form-input text-xs w-full"
                    />
                  </div>
                </div>
              </div>

              {/* MAPPED APPLICATION SKILLS */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-200 pb-2">Mapped Application Skills</h4>
                <p className="text-slate-500">Select which centralized enterprise skills this template evaluates:</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['AWS Cloud', 'Docker & Kubernetes', 'React', 'System Architecture', 'Python & Data Engineering', 'Agile Leadership'].map(sk => {
                    const isMapped = templateForm.mappedSkills.includes(sk);
                    return (
                      <button
                        key={sk}
                        type="button"
                        onClick={() => {
                          const updated = isMapped
                            ? templateForm.mappedSkills.filter(s => s !== sk)
                            : [...templateForm.mappedSkills, sk];
                          setTemplateForm({ ...templateForm, mappedSkills: updated });
                          if (templateError) setTemplateError(null);
                        }}
                        className={`py-1.5 px-3 rounded-xl border font-bold text-xs transition-all ${
                          isMapped
                            ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300'
                        }`}
                      >
                        {isMapped ? '✓ ' : '+ '}{sk}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* QUESTION BUILDER */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Question Builder ({templateForm.questions.length})</h4>
                    <p className="text-slate-500">Add, edit, or reorder questions for this assessment template.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddQuestion}
                    className="btn-primary text-xs py-1.5 px-3 bg-purple-600 hover:bg-purple-700"
                  >
                    + Add Question
                  </button>
                </div>

                {templateForm.questions.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                    <p className="text-slate-500 font-semibold">No questions added yet to this template.</p>
                    <button
                      type="button"
                      onClick={handleOpenAddQuestion}
                      className="btn-outline text-xs py-1.5 px-3"
                    >
                      + Click to Add First Question
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {templateForm.questions.map((q, idx) => (
                      <div key={q.id || idx} className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">Q{idx + 1}.</span>
                            <span className="chip-indigo text-[10px] font-bold">{q.questionType || 'Multiple Choice'}</span>
                            <span className="badge-purple text-[10px] font-bold">{q.mappedSkill || q.category || 'AWS Cloud'}</span>
                          </div>
                          <p className="font-semibold text-slate-900 text-xs">{q.questionText}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditQuestion(q, idx)}
                            className="btn-outline text-xs py-1 px-2.5"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestionFromTemplate(idx)}
                            className="btn-outline text-xs py-1 px-2 text-red-600 hover:bg-red-50 hover:border-red-300"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setTemplateModalOpen(false)}
                className="btn-outline text-xs py-2 px-4 disabled:opacity-50"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={(e) => handleTemplateSubmit(e, 'Draft')}
                  className="btn-outline text-xs py-2 px-4 text-amber-700 border-amber-300 hover:bg-amber-50 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : templateForm.id ? 'Save Draft' : 'Save as Draft'}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={(e) => handleTemplateSubmit(e, templateForm.id ? templateForm.status || 'Published' : 'Published')}
                  className="btn-primary text-xs py-2.5 px-6 bg-purple-600 hover:bg-purple-700 font-extrabold disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : templateForm.id ? 'Save Changes ✓' : 'Publish Template ✓'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-MODAL: QUESTION BUILDER SUB-FORM MODAL                           */}
      {/* ==================================================================== */}
      {questionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <form onSubmit={handleSaveQuestionSubForm} className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                {questionForm.index !== null ? 'Edit Question' : 'Add Question to Builder'}
              </h3>
              <button type="button" onClick={() => setQuestionModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="form-label">Question Text *</label>
                <textarea
                  rows={2}
                  required
                  value={questionForm.questionText}
                  onChange={e => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                  placeholder="Enter clear assessment question text..."
                  className="form-textarea text-xs w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Question Type *</label>
                  <select
                    value={questionForm.questionType}
                    onChange={e => setQuestionForm({ ...questionForm, questionType: e.target.value })}
                    className="form-select text-xs w-full"
                  >
                    <option value="Multiple Choice">Multiple Choice</option>
                    <option value="Rating Scale">Rating Scale</option>
                    <option value="Scenario Based">Scenario Based</option>
                    <option value="Single Choice">Single Choice</option>
                    <option value="Yes/No">Yes/No</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Mapped Skill *</label>
                  <select
                    value={questionForm.mappedSkill}
                    onChange={e => setQuestionForm({ ...questionForm, mappedSkill: e.target.value })}
                    className="form-select text-xs w-full"
                  >
                    <option value="AWS Cloud">AWS Cloud</option>
                    <option value="Docker & Kubernetes">Docker &amp; Kubernetes</option>
                    <option value="React">React</option>
                    <option value="System Architecture">System Architecture</option>
                    <option value="Python & Data Engineering">Python &amp; Data Engineering</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Options for Multiple Choice */}
              {questionForm.questionType === 'Multiple Choice' && (
                <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="form-label font-bold text-slate-800">Multiple Choice Options &amp; Correct Answer:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Option A"
                      value={questionForm.optionA}
                      onChange={e => setQuestionForm({ ...questionForm, optionA: e.target.value })}
                      className="form-input text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Option B"
                      value={questionForm.optionB}
                      onChange={e => setQuestionForm({ ...questionForm, optionB: e.target.value })}
                      className="form-input text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Option C"
                      value={questionForm.optionC}
                      onChange={e => setQuestionForm({ ...questionForm, optionC: e.target.value })}
                      className="form-input text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Option D"
                      value={questionForm.optionD}
                      onChange={e => setQuestionForm({ ...questionForm, optionD: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="form-label text-[11px]">Correct Answer:</label>
                    <select
                      value={questionForm.correctAnswer}
                      onChange={e => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                      className="form-select text-xs w-full bg-white"
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Difficulty</label>
                  <select
                    value={questionForm.difficulty}
                    onChange={e => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                    className="form-select text-xs w-full"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Points / Weight</label>
                  <input
                    type="number"
                    value={questionForm.weight}
                    onChange={e => setQuestionForm({ ...questionForm, weight: Number(e.target.value) })}
                    className="form-input text-xs w-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setQuestionModalOpen(false)} className="btn-outline text-xs py-2 px-4">
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs py-2 px-5 bg-purple-600 hover:bg-purple-700">
                Save Question ✓
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 10: CONFIRM DELETE TEMPLATE MODAL                              */}
      {/* ==================================================================== */}
      {deleteTargetTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-base font-extrabold text-slate-900">Delete Assessment Template?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will permanently remove <strong>"{deleteTargetTemplate.title}"</strong> and all its mapped questions from available templates. Active historical assessment submissions will be preserved.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteTargetTemplate(null)}
                className="btn-outline text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleArchiveTemplate(deleteTargetTemplate)}
                className="btn-outline text-xs py-2 px-4 text-purple-700 border-purple-300 hover:bg-purple-50"
              >
                Archive Instead
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTemplate}
                className="btn-primary text-xs py-2 px-4 bg-red-600 hover:bg-red-700"
              >
                Delete Template
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
