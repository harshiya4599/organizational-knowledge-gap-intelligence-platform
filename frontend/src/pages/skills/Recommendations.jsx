import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRole, ROLES } from '../../context/RoleContext';
import { getRecommendations, getLearningPaths } from '../../services/recommendationService';
import { subscribeToStore, getStore, recalculateGapsAndDependencies } from '../../utils/hybridStore';
import SummaryCard   from '../../components/dashboard/SummaryCard';
import LoadingScreen from '../../components/feedback/LoadingScreen';
import ErrorState    from '../../components/feedback/ErrorState';
import EmptyState    from '../../components/feedback/EmptyState';

/* ─── External Platform Badges & Icons ──────────────────────── */
const PROVIDER_CONFIG = {
  'LinkedIn Learning': {
    icon: '🔗',
    label: 'LinkedIn Learning',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    btnColor: 'bg-sky-600 hover:bg-sky-700 text-white',
    searchUrl: 'https://www.linkedin.com/learning/search?keywords=',
  },
  'Udemy': {
    icon: '🟣',
    label: 'Udemy',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    btnColor: 'bg-purple-600 hover:bg-purple-700 text-white',
    searchUrl: 'https://www.udemy.com/courses/search/?q=',
  },
  'Coursera': {
    icon: '📘',
    label: 'Coursera',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    btnColor: 'bg-blue-600 hover:bg-blue-700 text-white',
    searchUrl: 'https://www.coursera.org/search?query=',
  },
  'AWS Training': {
    icon: '🟧',
    label: 'AWS Training',
    badge: 'bg-amber-50 text-amber-800 border-amber-300',
    btnColor: 'bg-amber-600 hover:bg-amber-700 text-white',
    searchUrl: 'https://aws.amazon.com/training/search/?search-courses.q=',
  },
  'Microsoft Learn': {
    icon: '🔷',
    label: 'Microsoft Learn',
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
    btnColor: 'bg-teal-600 hover:bg-teal-700 text-white',
    searchUrl: 'https://learn.microsoft.com/en-us/training/browse/?terms=',
  },
  'Google Cloud Skills Boost': {
    icon: '☁️',
    label: 'Google Cloud',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    searchUrl: 'https://www.cloudskillsboost.google/catalog?keywords=',
  },
  'Google Cloud': {
    icon: '☁️',
    label: 'Google Cloud',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    searchUrl: 'https://www.cloudskillsboost.google/catalog?keywords=',
  },
  'IBM SkillsBuild': {
    icon: '🟦',
    label: 'IBM SkillsBuild',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    btnColor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    searchUrl: 'https://skillsbuild.org/students/course-catalog?search=',
  },
};

/* ─── Default Fallback Quiz Questions ───────────────────────── */
const DEFAULT_FALLBACK_QUIZ = [
  {
    q: 'Which architectural approach provides maximum decoupling in distributed microservices?',
    options: ['Event-driven messaging with asynchronous message brokers', 'Direct shared database access', 'Tight synchronous coupling', 'Hardcoded IP dependencies'],
    correct: 0,
  },
  {
    q: 'What is the primary benefit of declarative container configuration?',
    options: ['Deterministic, reproducible environment deployment', 'Direct manual host modification', 'Lowering network bandwidth to zero', 'Disabling log collection'],
    correct: 0,
  },
  {
    q: 'How do automated health and readiness probes improve high availability in production?',
    options: ['Route traffic only to healthy pods and automatically restart failed containers', 'Delete failed nodes instantly', 'Disable user authentication', 'Increase CPU usage to 100%'],
    correct: 0,
  },
];

/* ─── Mock Internal Training Catalog ────────────────────────── */
const INITIAL_INTERNAL_CATALOG = [
  { id: 1, title: 'Enterprise React 19 Architecture Patterns', department: 'Engineering', instructor: 'Alex Rivera (Staff UI Architect)', duration: '12 Hours', enrolled: 42, status: 'Active', url: 'https://www.linkedin.com/learning/react-design-patterns-14402636' },
  { id: 2, title: 'Docker Containerization & Kubernetes Security', department: 'DevOps', instructor: 'Ian Malcolm (Staff DevOps Architect)', duration: '16 Hours', enrolled: 35, status: 'Active', url: 'https://www.linkedin.com/learning/docker-essential-training-18104443' },
  { id: 3, title: 'Python for Data Science & Predictive Analytics', department: 'Data Science', instructor: 'Dr. Michael Chen (Lead Data Scientist)', duration: '20 Hours', enrolled: 28, status: 'Active', url: 'https://www.coursera.org/specializations/machine-learning-introduction' },
  { id: 4, title: 'Financial Modeling & Corporate Valuation', department: 'Finance', instructor: 'Robert Sterling (CFA Analyst)', duration: '10 Hours', enrolled: 22, status: 'Active', url: 'https://www.linkedin.com/learning/financial-modeling-foundations' },
];

function PriorityBadge({ priority }) {
  const STYLES = {
    Critical: 'bg-rose-100 text-rose-800 border-rose-200',
    High:     'bg-red-100 text-red-700 border-red-200',
    Medium:   'bg-amber-100 text-amber-800 border-amber-200',
    Low:      'bg-emerald-100 text-emerald-700 border-emerald-200',
    Completed:'bg-blue-100 text-blue-800 border-blue-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap inline-flex items-center gap-1 ${STYLES[priority] || 'bg-slate-100 text-slate-700'}`}>
      {priority === 'Critical' ? '🔥' : priority === 'High' ? '⚡' : '📌'} {priority} Priority
    </span>
  );
}

function DifficultyBadge({ difficulty }) {
  const STYLES = {
    Beginner:     'bg-slate-100 text-slate-700 border-slate-200',
    Intermediate: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Advanced:     'bg-violet-50 text-violet-700 border-violet-200',
    Expert:       'bg-purple-50 text-purple-700 border-purple-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${STYLES[difficulty] || 'bg-gray-100 text-gray-600'}`}>
      {difficulty || 'Intermediate'}
    </span>
  );
}

function StepStatusBadge({ status }) {
  const CONFIG = {
    Completed:   { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: '✓' },
    'In Progress':{ bg: 'bg-blue-100 text-blue-800 border-blue-200', icon: '⏳' },
    Pending:     { bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: '🕒' },
    Locked:      { bg: 'bg-gray-100 text-gray-500 border-gray-200', icon: '🔒' },
  };
  const info = CONFIG[status] || CONFIG.Locked;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${info.bg}`}>
      <span>{info.icon}</span>
      <span>{status}</span>
    </span>
  );
}

/* ─── Single Course Card Component ───────────────────────────── */
function RecommendationCard({ rec, onTakeQuiz, onOpenDetails, onOpenCourse }) {
  const providerInfo = PROVIDER_CONFIG[rec.provider] || {
    icon: '🔗',
    label: rec.provider || 'LinkedIn Learning',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    btnColor: 'bg-sky-600 hover:bg-sky-700 text-white',
    searchUrl: 'https://www.linkedin.com/learning/search?keywords=',
  };

  const courseTitle = rec.courseTitle || rec.course || rec.title || `Mastering ${rec.skill || 'Technology'}`;
  const matchScore = typeof rec.score === 'number' ? rec.score : (typeof rec.matchScore === 'number' ? rec.matchScore : 88);
  const difficultyLevel = rec.difficulty || (rec.priority === 'High' || rec.priority === 'Critical' ? 'Advanced' : 'Intermediate');
  const durationText = rec.duration || '3 Weeks';
  const expectedGain = rec.expectedGain || rec.expectedImprovement || `+${rec.gapLevel || 1}.0 Level Gain`;
  const reasonText = rec.reason || `Targeted to bridge ${rec.skill || 'competency'} deficit (Current: Level ${rec.currentLevel || 2} vs Target: Level ${rec.targetLevel || 4}).`;
  const requiredSkills = Array.isArray(rec.requiredSkills) && rec.requiredSkills.length > 0 ? rec.requiredSkills : [rec.skill || 'Technical Competency'];

  return (
    <div className="card-hover flex flex-col justify-between group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-blue-300">
      <div className="space-y-4 p-5">
        
        {/* Card Header: Platform Badge + Priority */}
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0 ${providerInfo.badge}`}>
            <span>{providerInfo.icon}</span>
            <span>{providerInfo.label}</span>
          </span>
          <PriorityBadge priority={rec.priority || 'Medium'} />
        </div>

        {/* Course Title & Instructor */}
        <div>
          <h2
            onClick={() => onOpenDetails(rec)}
            className="text-base font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors cursor-pointer line-clamp-2"
            title="Click to view detailed syllabus"
          >
            {courseTitle}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium flex items-center justify-between">
            <span>Instructor: <strong className="text-slate-800">{rec.instructor || 'Senior Specialist'}</strong></span>
            <span className="text-[11px] text-slate-400">({rec.department || 'Engineering'})</span>
          </p>
        </div>

        {/* AI Match Score Ranking Bar */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <span>✨ AI Match Score</span>
            </span>
            <span className="font-extrabold text-blue-600 whitespace-nowrap">{matchScore}% Match</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                matchScore >= 95 ? 'bg-rose-500' : matchScore >= 90 ? 'bg-emerald-500' : matchScore >= 80 ? 'bg-blue-500' : 'bg-amber-500'
              }`}
              style={{ width: `${matchScore}%` }}
            />
          </div>
        </div>

        {/* Logistics: Duration & Difficulty */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-1">
            <span>⏱️ Duration:</span>
            <span className="font-semibold text-slate-800">{durationText}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Difficulty:</span>
            <DifficultyBadge difficulty={difficultyLevel} />
          </div>
        </div>

        {/* Target Competencies */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Target Competencies
          </p>
          <div className="flex flex-wrap gap-1.5">
            {requiredSkills.map((sk, i) => (
              <span key={i} className="chip-indigo text-xs">
                {sk}
              </span>
            ))}
          </div>
        </div>

        {/* Expected Proficiency Gain Box */}
        <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-900">Expected Proficiency Gain</span>
            <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              L{rec.currentLevel || 2} &rarr; L{rec.targetLevel || 4}
            </span>
          </div>
          <span className="text-blue-800 font-semibold block">{expectedGain}</span>
          <p className="text-[11px] text-slate-600 italic pt-1 line-clamp-2">{reasonText}</p>
        </div>
      </div>

      {/* Action Footer: Knowledge Quiz, Details & Open Course */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onTakeQuiz(rec)}
          className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs py-1.5 px-3 rounded-xl transition-all flex items-center gap-1 shadow-xs shrink-0"
          title="Take interactive verification quiz"
        >
          <span>📝</span> Quiz
        </button>

        <button
          type="button"
          onClick={() => onOpenDetails(rec)}
          className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs py-1.5 px-3 rounded-xl transition-all flex items-center gap-1.5 shadow-xs hover:text-slate-900 shrink-0"
          title="View detailed course outline and syllabus"
        >
          <span className="text-slate-600">ℹ️</span> Details
        </button>

        <button
          type="button"
          onClick={() => onOpenCourse(rec)}
          className={`text-xs py-1.5 px-3.5 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0 ${providerInfo.btnColor}`}
          title={`Open on ${providerInfo.label}`}
        >
          <span>Open</span>
          <span>↗</span>
        </button>
      </div>
    </div>
  );
}

/* ─── Main Recommendations Component ─────────────────────────── */
export default function Recommendations() {
  const { user } = useAuth();
  const { currentRole, isEmployee } = useRole();

  const isEmployeeView = isEmployee || currentRole === ROLES.EMPLOYEE || (user?.role && user.role.toLowerCase() === 'employee');
  const loggedInName = user?.name || user?.username || 'Charlie Brown';
  const userDept = user?.department || 'Engineering';
  const employeeId = user?.employeeId || user?.id || 3;

  const [recommendations, setRecommendations] = useState([]);
  const [learningPaths,   setLearningPaths]   = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);

  // Active Tab: 'courses' | 'paths' | 'catalog'
  const [activeTab, setActiveTab] = useState('courses');

  // Filters & Sorting
  const [search,           setSearch]           = useState('');
  const [providerFilter,   setProviderFilter]   = useState('All');
  const [priorityFilter,   setPriorityFilter]   = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [sortBy,           setSortBy]           = useState('score_desc');

  // Internal Catalog state
  const [catalog] = useState(INITIAL_INTERNAL_CATALOG);

  // Modals state
  const [activeDetailsCourse, setActiveDetailsCourse] = useState(null);
  const [activeQuizCourse,    setActiveQuizCourse]    = useState(null);
  const [quizAnswers,         setQuizAnswers]         = useState({});
  const [quizScore,           setQuizScore]           = useState(null);

  // Toast State
  const [toast, setToast] = useState({ message: '', type: 'success' });

  function showToastMsg(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 4500);
  }

  function fetchData() {
    setLoading(true);
    setError(null);

    const isEmp = isEmployee || currentRole === ROLES.EMPLOYEE || (user?.role && user.role.toLowerCase() === 'employee');
    const targetEmpId = isEmp && employeeId ? employeeId : null;

    Promise.all([getRecommendations(targetEmpId), getLearningPaths(targetEmpId)])
      .then(([recs, paths]) => {
        setRecommendations(Array.isArray(recs) ? recs : []);
        setLearningPaths(Array.isArray(paths) ? paths : []);
        setLoading(false);
      })
      .catch((err) => {
        const msg = err?.response?.status === 403
          ? 'You do not have permission to view recommendations.'
          : err?.response?.status === 401
          ? 'Your session has expired. Please log in again.'
          : err?.message || 'Unable to load recommendations. Please try again.';
        setError(msg);
        setRecommendations([]);
        setLearningPaths([]);
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchData();
    const unsub = subscribeToStore(fetchData);
    return unsub;
  }, [employeeId, currentRole]);

  function handleTriggerAdaptiveRecommender() {
    const store = getStore();
    recalculateGapsAndDependencies(store);
    showToastMsg('⚡ Adaptive AI Engine re-calculated recommendations based on latest skill assessment scores!');
    fetchData();
  }

  function handleOpenCourse(rec) {
    if (!rec) return;
    const courseTitle = rec.courseTitle || rec.course || rec.title || rec.skill || '';
    let urlToOpen = rec.externalUrl;

    // Platform-specific direct course routing with 100% availability guarantee (NEVER 404 or Google search)
    if (rec.provider === 'LinkedIn Learning' || !rec.provider) {
      const cleanKeyword = (courseTitle || rec.skill || '').replace(/[:&]/g, ' ').replace(/\s+/g, ' ').trim();
      urlToOpen = `https://www.linkedin.com/learning/search?keywords=${encodeURIComponent(cleanKeyword)}`;
    } else if (rec.provider === 'Udemy') {
      const cleanKeyword = (courseTitle || rec.skill || '').replace(/[:&]/g, ' ').replace(/\s+/g, ' ').trim();
      urlToOpen = `https://www.udemy.com/courses/search/?q=${encodeURIComponent(cleanKeyword)}`;
    } else if (rec.provider === 'Coursera') {
      if (!urlToOpen || urlToOpen === '#' || !urlToOpen.startsWith('http')) {
        const cleanKeyword = (courseTitle || rec.skill || '').replace(/[:&]/g, ' ').replace(/\s+/g, ' ').trim();
        urlToOpen = `https://www.coursera.org/search?query=${encodeURIComponent(cleanKeyword)}`;
      }
    } else if (rec.provider === 'AWS Training') {
      if (!urlToOpen || urlToOpen === '#' || !urlToOpen.startsWith('http')) {
        urlToOpen = `https://aws.amazon.com/training/search/?search-courses.q=${encodeURIComponent(courseTitle)}`;
      }
    } else if (rec.provider === 'Microsoft Learn') {
      if (!urlToOpen || urlToOpen === '#' || !urlToOpen.startsWith('http')) {
        urlToOpen = `https://learn.microsoft.com/en-us/training/browse/?terms=${encodeURIComponent(courseTitle)}`;
      }
    } else if (rec.provider === 'Google Cloud Skills Boost' || rec.provider === 'Google Cloud') {
      if (!urlToOpen || urlToOpen === '#' || !urlToOpen.startsWith('http')) {
        urlToOpen = `https://www.cloudskillsboost.google/catalog?keywords=${encodeURIComponent(courseTitle)}`;
      }
    } else if (rec.provider === 'IBM SkillsBuild') {
      if (!urlToOpen || urlToOpen === '#' || !urlToOpen.startsWith('http')) {
        urlToOpen = `https://skillsbuild.org/students/course-catalog?search=${encodeURIComponent(courseTitle)}`;
      }
    } else if (!urlToOpen || urlToOpen === '#' || urlToOpen.startsWith('javascript')) {
      urlToOpen = `https://www.linkedin.com/learning/search?keywords=${encodeURIComponent(courseTitle)}`;
    }

    try {
      showToastMsg(`🌐 Opening "${courseTitle}" on ${rec.provider || 'LinkedIn Learning'}...`);
      window.open(urlToOpen, '_blank', 'noopener,noreferrer');
    } catch (err) {
      showToastMsg(`Unable to open external link: ${urlToOpen}`, 'error');
    }
  }

  function handleOpenDetails(rec) {
    setActiveDetailsCourse(rec);
  }

  function handleOpenQuiz(rec) {
    setActiveQuizCourse(rec);
    setQuizAnswers({});
    setQuizScore(null);
  }

  function handleQuizOptionSelect(questionIndex, optionIndex) {
    setQuizAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  }

  function handleSubmitQuiz() {
    const quizList = (activeQuizCourse && activeQuizCourse.quiz && activeQuizCourse.quiz.length > 0)
      ? activeQuizCourse.quiz
      : DEFAULT_FALLBACK_QUIZ;

    let correctCount = 0;
    quizList.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct) {
        correctCount += 1;
      }
    });
    const percentage = Math.round((correctCount / quizList.length) * 100);
    setQuizScore(percentage);

    if (percentage >= 66) {
      showToastMsg(`🎉 Knowledge Assessment Passed (${percentage}%)! Target competency score verified.`);
    } else {
      showToastMsg(`Assessment completed (${percentage}%). We recommend completing the full course modules.`, 'error');
    }
  }

  const safeRecs = Array.isArray(recommendations) ? recommendations : [];
  const safePaths = Array.isArray(learningPaths) ? learningPaths : [];

  // Scoped list - Strictly External Industry Courses (No Internal LMS in Tab 1)
  const userScopedRecs = useMemo(() => {
    const externalList = safeRecs.filter(r => r && r.provider !== 'Internal LMS');
    if (isEmployeeView) {
      const empSpecific = externalList.filter((r) => String(r.employeeId) === String(employeeId));
      return empSpecific.length > 0
        ? empSpecific
        : externalList.filter((r) => r.department === userDept || !r.department);
    }
    return externalList;
  }, [safeRecs, isEmployeeView, employeeId, userDept]);

  const userScopedPaths = useMemo(() => {
    if (isEmployeeView) {
      return safePaths.map((p, i) => ({
        ...p,
        id: p.id || i + 101,
        title: p.title || (i === 0 ? 'DevOps & Cloud Microservices Architecture Roadmap' : 'React 19 & High-Performance Frontend Mastery Roadmap'),
        employee: loggedInName,
        department: userDept,
        currentLevel: p.currentLevel || (i === 0 ? 'Level 2 - Beginner' : 'Level 3 - Intermediate'),
        targetLevel: p.targetLevel || (i === 0 ? 'Level 4 - Advanced' : 'Level 5 - Expert'),
        estimatedTime: p.estimatedTime || (i === 0 ? '12 weeks' : '8 weeks'),
        progress: typeof p.progress === 'number' ? p.progress : (i === 0 ? 60 : 45),
      }));
    }
    return safePaths;
  }, [safePaths, isEmployeeView, loggedInName, userDept]);

  const providers = [
    'All',
    'LinkedIn Learning',
    'Udemy',
    'Coursera',
    'AWS Training',
    'Google Cloud Skills Boost',
    'Microsoft Learn',
    'IBM SkillsBuild',
  ];

  const priorities = ['All', 'Critical', 'High', 'Medium', 'Low'];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredRecs = useMemo(() => {
    return userScopedRecs.filter((r) => {
      if (!r) return false;
      const courseTitle = (r.courseTitle || r.course || r.title || '').toLowerCase();
      const skillName   = (r.skill || '').toLowerCase();
      const instructor  = (r.instructor || '').toLowerCase();
      const empName     = (r.employee || '').toLowerCase();
      const searchStr   = (search || '').toLowerCase().trim();

      const matchesSearch = !searchStr ||
        courseTitle.includes(searchStr) ||
        skillName.includes(searchStr) ||
        instructor.includes(searchStr) ||
        empName.includes(searchStr);

      const matchesPriority = priorityFilter === 'All' || r.priority === priorityFilter;
      const matchesProvider = providerFilter === 'All' || r.provider === providerFilter ||
        (providerFilter === 'Google Cloud Skills Boost' && (r.provider === 'Google Cloud' || r.provider === 'Google Cloud Skills Boost'));
      const matchesDifficulty = difficultyFilter === 'All' || r.difficulty === difficultyFilter;

      return matchesSearch && matchesPriority && matchesProvider && matchesDifficulty;
    });
  }, [userScopedRecs, search, priorityFilter, providerFilter, difficultyFilter]);

  const sortedRecs = useMemo(() => {
    return [...filteredRecs].sort((a, b) => {
      if (sortBy === 'score_desc') return (b.score || b.matchScore || 0) - (a.score || a.matchScore || 0);
      if (sortBy === 'priority_desc') {
        const pOrder = { Critical: 4, High: 3, Medium: 2, Low: 1, Completed: 0 };
        return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
      }
      if (sortBy === 'gain_desc') {
        return (b.gapLevel || 0) - (a.gapLevel || 0);
      }
      return (a.courseTitle || a.title || '').localeCompare(b.courseTitle || b.title || '');
    });
  }, [filteredRecs, sortBy]);

  if (loading) return <LoadingScreen message="Loading AI Training Recommendations &amp; Learning Paths…" />;
  if (error)   return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="page-container w-full max-w-none space-y-6">

      {/* Toast Alert */}
      {toast.message && (
        <div
          className={`fixed top-20 right-6 z-50 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fadeIn ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}
          role="alert"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {toast.type === 'error' ? <circle cx="12" cy="12" r="10"/> : <polyline points="20 6 9 17 4 12"/>}
          </svg>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Page Header ─────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="page-header-title text-2xl font-extrabold">
              {isEmployeeView ? 'My Training Recommendations & Learning Roadmaps' : 'Training Recommendations & AI Upskilling'}
            </h1>
            {isEmployeeView && <span className="badge-blue text-xs font-bold">Personalized AI Engine</span>}
          </div>
          <p className="page-header-subtitle">
            {isEmployeeView
              ? `AI-matched external course recommendations across LinkedIn Learning, Udemy, Coursera, and AWS for ${loggedInName}`
              : 'Enterprise learning recommendations, multi-platform external courses (Coursera, Udemy, LinkedIn Learning, AWS), and adaptive path generation.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={handleTriggerAdaptiveRecommender}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md font-bold transition-all active:scale-95 cursor-pointer"
          >
            <span>🔄</span> Adaptive AI Recalculation
          </button>
        </div>
      </div>

      {/* ── Summary Metric Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <SummaryCard
          title={isEmployeeView ? "My Targeted Courses" : "Recommended Courses"}
          value={userScopedRecs.length}
          subtext="AI relevance matched"
          icon="📚"
          accent="blue"
        />
        <SummaryCard
          title={isEmployeeView ? "My Roadmaps" : "Personalized Roadmaps"}
          value={userScopedPaths.length}
          subtext="Skill-tailored learning tracks"
          icon="🗺️"
          accent="purple"
        />
        <SummaryCard
          title="Avg Relevance Match"
          value="94.8%"
          subtext="Precision skill gap alignment"
          icon="✨"
          accent="emerald"
        />
        <SummaryCard
          title="Supported Platforms"
          value="7 External Platforms"
          subtext="LinkedIn Learning, Udemy, Coursera, AWS"
          icon="🌐"
          accent="amber"
        />
      </div>

      {/* ── Full Width Module 5 Tabs Bar ─────────────────────── */}
      <div className="panel overflow-hidden w-full">
        <div className="w-full bg-slate-50 border-b border-slate-200 px-4 sm:px-6 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'courses', label: isEmployeeView ? 'My AI Course Recommendations' : 'AI Course Recommendations & Platforms', icon: '📚' },
              { id: 'paths',   label: isEmployeeView ? 'My Personalized Learning Roadmaps' : 'Personalized Learning Roadmaps', icon: '🗺️' },
              { id: 'catalog', label: 'Internal LMS Catalog & Training', icon: '🏢' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 rounded-t-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border-t border-x ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 border-slate-200 border-b-white shadow-sm -mb-px z-10'
                    : 'bg-slate-100/80 text-slate-600 border-transparent hover:bg-slate-200/60 hover:text-slate-900'
                }`}
              >
                <span className="text-base leading-none">{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Panel */}
        <div className="p-6 sm:p-8 w-full bg-white">

          {/* TAB 1: AI Course Recommendations */}
          {activeTab === 'courses' && (
            <div className="space-y-6 w-full">
              
              {/* Filters & Sorting Bar */}
              <div className="filter-bar flex flex-wrap items-center justify-between gap-3 w-full bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  
                  {/* Search Input */}
                  <div className="search-input-wrapper min-w-[220px]">
                    <svg className="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                      type="text"
                      placeholder="Search course title, skill, or instructor..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="search-input text-xs"
                    />
                  </div>

                  {/* Platform Filter */}
                  <select
                    value={providerFilter}
                    onChange={(e) => setProviderFilter(e.target.value)}
                    className="form-select w-auto text-xs font-medium"
                  >
                    {providers.map((pr) => (
                      <option key={pr} value={pr}>
                        Platform: {pr}
                      </option>
                    ))}
                  </select>

                  {/* Difficulty Filter */}
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="form-select w-auto text-xs font-medium"
                  >
                    {difficulties.map((d) => (
                      <option key={d} value={d}>
                        Difficulty: {d}
                      </option>
                    ))}
                  </select>

                  {/* Priority Filter */}
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="form-select w-auto text-xs font-medium"
                  >
                    {priorities.map((p) => (
                      <option key={p} value={p}>
                        Priority: {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="form-select w-auto text-xs font-bold text-blue-600"
                  >
                    <option value="score_desc">✨ AI Match Score (Highest)</option>
                    <option value="priority_desc">🔥 Priority (Critical to Low)</option>
                    <option value="gain_desc">📈 Proficiency Gain (Highest)</option>
                    <option value="name_asc">🔤 Course Title (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Grid of Course Cards */}
              {sortedRecs.length === 0 ? (
                <EmptyState
                  title="No course recommendations match your filters"
                  message="Try clearing your search query or switching platform filters."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                  {sortedRecs.map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      rec={rec}
                      onTakeQuiz={handleOpenQuiz}
                      onOpenDetails={handleOpenDetails}
                      onOpenCourse={handleOpenCourse}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Personalized Learning Path Generation */}
          {activeTab === 'paths' && (
            <div className="space-y-8 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100 shadow-sm w-full">
                <div>
                  <h3 className="text-base font-extrabold text-blue-950">
                    {isEmployeeView ? `My Personalized Learning Roadmaps` : 'Personalized Learning Roadmaps & Adaptive Engine'}
                  </h3>
                  <p className="text-xs text-blue-800 mt-1">
                    Roadmaps automatically adapt based on course completions, assessment scores, and skill progression
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTriggerAdaptiveRecommender}
                  className="btn-primary text-xs shrink-0 flex items-center justify-center gap-2 py-2.5 px-5 shadow-btn-primary font-bold"
                >
                  <span>🔄</span> Recalculate Roadmaps
                </button>
              </div>

              <div className="space-y-6 w-full">
                {userScopedPaths.map((path) => (
                  <div key={path.id} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-6 hover:shadow-card transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-extrabold text-slate-900">{path.title || `${path.employee}'s Learning Roadmap`}</h3>
                          <span className="chip-indigo text-xs">{path.department}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Assigned to: <span className="font-bold text-slate-800">{path.employee}</span> &middot; Horizon:{' '}
                          <span className="font-semibold text-slate-800">{path.currentLevel}</span> &rarr;{' '}
                          <span className="font-semibold text-emerald-700">{path.targetLevel}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-xs text-slate-400 font-medium block">Est. Completion</span>
                          <span className="text-sm font-bold text-slate-800">{path.estimatedTime}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-slate-400 font-medium block">Overall Progress</span>
                          <span className="text-sm font-extrabold text-blue-600">{path.progress}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden border border-slate-300">
                      <div
                        className="h-2.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${path.progress}%` }}
                      />
                    </div>

                    <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
                      {(path.steps || []).map((step, idx) => {
                        const providerInfo = PROVIDER_CONFIG[step.provider] || { icon: '📖', badge: 'bg-slate-100 text-slate-700' };

                        return (
                          <div key={idx} className="relative group">
                            <div
                              className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all shadow-sm ${
                                step.status === 'Completed'
                                  ? 'bg-emerald-500 ring-4 ring-emerald-50'
                                  : step.status === 'In Progress'
                                  ? 'bg-blue-500 ring-4 ring-blue-50 animate-pulse'
                                  : step.status === 'Pending'
                                  ? 'bg-amber-400 ring-4 ring-amber-50'
                                  : 'bg-slate-300 ring-4 ring-slate-50'
                              }`}
                            >
                              {step.status === 'Completed' ? '✓' : step.status === 'Locked' ? '🔒' : (idx + 1)}
                            </div>

                            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 hover:border-slate-300 transition-all">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold border ${providerInfo.badge}`}>
                                  <span>{providerInfo.icon}</span>
                                  <span>{step.provider || 'Industry Track'}</span>
                                </span>
                                <div className="flex items-center gap-2">
                                  <StepStatusBadge status={step.status} />
                                </div>
                              </div>

                              <h4 className="text-sm font-bold text-slate-900">{step.name || step.title || step.courseName}</h4>
                              <p className="text-xs text-slate-600">{step.description || 'Hands-on practical training milestone designed for competency elevation.'}</p>
                              <span className="text-[11px] text-slate-400 font-medium block">Duration: {step.duration || '2 Weeks'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Internal Training Catalog */}
          {activeTab === 'catalog' && (
            <div className="space-y-6 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Internal Enterprise LMS Training Catalog</h3>
                  <p className="text-xs text-slate-500">Corporate internal training courses, LMS modules, and enrollment programs</p>
                </div>
                <Link to="/learning-progress" className="btn-secondary text-xs px-3 py-1.5 font-bold">
                  View Active Enrollments &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {catalog.map((item) => (
                  <div key={item.id} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 flex flex-col justify-between hover:shadow-card transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="chip-indigo text-xs">{item.department}</span>
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-xs font-bold">
                          {item.status}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-500 font-medium">Instructor: {item.instructor} &middot; Duration: {item.duration}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                      <span className="text-xs font-bold text-slate-700">👥 {item.enrolled} Enrolled</span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary text-xs py-1.5 px-4 font-bold"
                      >
                        Enroll on Platform ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── MODAL 1: Course Details Modal ────────────────────── */}
      {activeDetailsCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${PROVIDER_CONFIG[activeDetailsCourse.provider]?.badge || 'bg-slate-100 text-slate-700'}`}>
                    <span>{PROVIDER_CONFIG[activeDetailsCourse.provider]?.icon || '🔗'}</span>
                    <span>{activeDetailsCourse.provider || 'LinkedIn Learning'}</span>
                  </span>
                  <PriorityBadge priority={activeDetailsCourse.priority || 'Medium'} />
                  <span className="chip-indigo text-xs">{activeDetailsCourse.skill}</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 leading-snug pt-1">
                  {activeDetailsCourse.courseTitle || activeDetailsCourse.course || activeDetailsCourse.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Instructor / Provider: <strong className="text-slate-800">{activeDetailsCourse.instructor || 'Senior Specialist'}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveDetailsCourse(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-2xl p-1 leading-none rounded-lg hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">AI Match Score</span>
                <span className="text-sm font-extrabold text-blue-600">{activeDetailsCourse.matchScore || activeDetailsCourse.score || 90}% Match</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Duration</span>
                <span className="text-sm font-bold text-slate-800">{activeDetailsCourse.duration || '3 Weeks'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Difficulty</span>
                <span className="text-sm font-bold text-slate-800">{activeDetailsCourse.difficulty || 'Intermediate'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Expected Gain</span>
                <span className="text-sm font-extrabold text-emerald-600">{activeDetailsCourse.expectedGain || '+1.0 Level'}</span>
              </div>
            </div>

            {/* Progression Visualization */}
            <div className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-xl border border-blue-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-950">Target Competency Elevation</span>
                <span className="font-extrabold text-indigo-700">
                  Level {activeDetailsCourse.currentLevel || 2} &rarr; Level {activeDetailsCourse.targetLevel || 4}
                </span>
              </div>
              <div className="w-full bg-blue-200/80 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                  style={{ width: `${Math.min(100, ((activeDetailsCourse.targetLevel || 4) / 5) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-blue-900 italic pt-1">
                {activeDetailsCourse.reason || `Targeted to bridge ${activeDetailsCourse.skill} deficit.`}
              </p>
            </div>

            {/* Course Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Course Overview &amp; Curriculum</h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                {activeDetailsCourse.description || 'Comprehensive curriculum covering real-world architectural design, hands-on production labs, and verified competency benchmarks.'}
              </p>
            </div>

            {/* Learning Outcomes Checklist */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Key Learning Outcomes</h4>
              <div className="space-y-1.5">
                {(activeDetailsCourse.learningOutcomes || [
                  `Production patterns and architecture for ${activeDetailsCourse.skill}`,
                  `Enterprise implementation, testing, and continuous delivery`,
                  `Hands-on workflows aligned with organizational benchmarks`,
                ]).map((outcome, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-800">
                    <span className="text-emerald-600 font-bold shrink-0">✓</span>
                    <span>{outcome}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
              <button
                type="button"
                onClick={() => {
                  const c = activeDetailsCourse;
                  setActiveDetailsCourse(null);
                  handleOpenQuiz(c);
                }}
                className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 hover:border-slate-400 text-xs py-2 px-4 font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
              >
                <span>📝</span> Take Knowledge Quiz
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveDetailsCourse(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs py-2 px-4 rounded-xl transition-all"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenCourse(activeDetailsCourse);
                    setActiveDetailsCourse(null);
                  }}
                  className={`text-xs py-2 px-5 rounded-xl font-bold flex items-center gap-1.5 shadow-sm text-white ${
                    PROVIDER_CONFIG[activeDetailsCourse.provider]?.btnColor || 'bg-sky-600 hover:bg-sky-700'
                  }`}
                >
                  <span>Open on {activeDetailsCourse.provider || 'LinkedIn Learning'}</span>
                  <span>↗</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL 2: Interactive Course Knowledge Quiz ────────── */}
      {activeQuizCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="chip-indigo text-[10px]">Competency Verification Quiz</span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {activeQuizCourse.courseTitle || activeQuizCourse.course || activeQuizCourse.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveQuizCourse(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl p-1 leading-none rounded-lg hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {((activeQuizCourse.quiz && activeQuizCourse.quiz.length > 0)
                ? activeQuizCourse.quiz
                : DEFAULT_FALLBACK_QUIZ
              ).map((qObj, qIdx) => (
                <div key={qIdx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <p className="font-bold text-slate-900">{qIdx + 1}. {qObj.q}</p>
                  <div className="space-y-1.5">
                    {qObj.options.map((opt, oIdx) => (
                      <label
                        key={oIdx}
                        className={`flex items-center gap-2 cursor-pointer p-2 bg-white rounded-lg border transition-colors ${
                          quizAnswers[qIdx] === oIdx
                            ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                            : 'border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`quiz-q-${qIdx}`}
                          checked={quizAnswers[qIdx] === oIdx}
                          onChange={() => handleQuizOptionSelect(qIdx, oIdx)}
                          className="text-blue-600"
                        />
                        <span className="text-slate-700 font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
              {quizScore !== null ? (
                <span className={`text-xs font-bold ${quizScore >= 66 ? 'text-emerald-600' : 'text-red-600'}`}>
                  Score: {quizScore}% ({quizScore >= 66 ? 'Passed! 🎉' : 'Needs Review ⚠️'})
                </span>
              ) : (
                <span className="text-xs text-slate-400">Select answers for all questions</span>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveQuizCourse(null)}
                  className="btn-outline text-xs py-1.5 px-3"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="btn-primary text-xs py-1.5 px-4 font-bold"
                >
                  Submit Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
