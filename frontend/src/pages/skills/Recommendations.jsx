import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRole, ROLES } from '../../context/RoleContext';
import { getRecommendations, getLearningPaths } from '../../services/recommendationService';
import SummaryCard   from '../../components/dashboard/SummaryCard';
import LoadingScreen from '../../components/feedback/LoadingScreen';
import ErrorState    from '../../components/feedback/ErrorState';
import EmptyState    from '../../components/feedback/EmptyState';

/* ─── External Platform Links Mapping ─────────────────────── */
const PROVIDER_CONFIG = {
  'Coursera':          { icon: '📘', badge: 'bg-blue-50 text-blue-700 border-blue-200', url: 'https://www.coursera.org/search?query=' },
  'Udemy':             { icon: '🟣', badge: 'bg-purple-50 text-purple-700 border-purple-200', url: 'https://www.udemy.com/courses/search/?q=' },
  'LinkedIn Learning': { icon: '🔗', badge: 'bg-sky-50 text-sky-700 border-sky-200', url: 'https://www.linkedin.com/learning/search?keywords=' },
  'Internal LMS':      { icon: '🏢', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', url: '#' },
  'Google Cloud':      { icon: '☁️', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', url: 'https://cloud.google.com/training' },
  'Linux Foundation':  { icon: '🐧', badge: 'bg-amber-50 text-amber-700 border-amber-200', url: 'https://training.linuxfoundation.org' },
};

/* ─── Mock Course Knowledge Quizzes ──────────────────────── */
const COURSE_QUIZZES = {
  default: [
    {
      q: 'Which tool is used to containerize applications with all dependencies?',
      options: ['Docker', 'Babel', 'Webpack', 'Nginx'],
      correct: 0,
    },
    {
      q: 'What is the main benefit of declarative UI components in React?',
      options: ['Direct DOM mutation', 'Predictable state-driven rendering', 'Slower compile time', 'Manual memory management'],
      correct: 1,
    },
    {
      q: 'How does container orchestration with Kubernetes improve system reliability?',
      options: ['By removing load balancers', 'Through automated scaling, self-healing, and failover', 'By running on single servers only', 'By disabling logs'],
      correct: 1,
    },
  ],
};

/* ─── Mock Internal Training Catalog ──────────────────────── */
const INITIAL_INTERNAL_CATALOG = [
  { id: 1, title: 'Enterprise React 19 Architecture Patterns', department: 'Engineering', instructor: 'Tech Lead', duration: '12 Hours', enrolled: 42, status: 'Active', url: 'https://www.coursera.org/search?query=React' },
  { id: 2, title: 'Docker Containerization & Kubernetes Security', department: 'DevOps', instructor: 'Cloud Architect', duration: '16 Hours', enrolled: 35, status: 'Active', url: 'https://www.udemy.com/courses/search/?q=Docker' },
  { id: 3, title: 'Python for Data Science & Predictive Analytics', department: 'Data Science', instructor: 'Lead Scientist', duration: '20 Hours', enrolled: 28, status: 'Active', url: 'https://www.linkedin.com/learning/search?keywords=Python+Data+Science' },
  { id: 4, title: 'Financial Modeling & Power BI Reporting', department: 'Finance', instructor: 'Financial Analyst', duration: '10 Hours', enrolled: 22, status: 'Active', url: 'https://www.coursera.org/search?query=Financial+Modeling' },
];

function PriorityBadge({ priority }) {
  const STYLES = {
    High:   'bg-red-100 text-red-700 border-red-200',
    Medium: 'bg-amber-100 text-amber-800 border-amber-200',
    Low:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STYLES[priority] || 'bg-slate-100 text-slate-700'}`}>
      {priority} Priority
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

function DifficultyBadge({ difficulty }) {
  const STYLES = {
    Beginner:     'bg-slate-100 text-slate-700',
    Intermediate: 'bg-indigo-100 text-indigo-700',
    Advanced:     'bg-violet-100 text-violet-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STYLES[difficulty] || 'bg-gray-100 text-gray-600'}`}>
      {difficulty}
    </span>
  );
}

function RecommendationCard({ rec, onTakeQuiz }) {
  const providerInfo = PROVIDER_CONFIG[rec.provider] || { icon: '🎓', badge: 'bg-slate-100 text-slate-700 border-slate-200', url: 'https://www.coursera.org' };
  
  const externalLink = providerInfo.url !== '#' 
    ? `${providerInfo.url}${encodeURIComponent(rec.course)}`
    : '#';

  return (
    <div className="card-hover flex flex-col justify-between group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${providerInfo.badge}`}>
            <span>{providerInfo.icon}</span>
            <span>{rec.provider}</span>
          </span>
          <PriorityBadge priority={rec.priority} />
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
            {rec.course}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Assigned to: <span className="text-slate-900 font-semibold">{rec.employee}</span> ({rec.department})
          </p>
        </div>

        {/* AI Match Score Ranking Bar */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <span>✨ AI Match Score</span>
            </span>
            <span className="font-extrabold text-blue-600">{rec.score}% Match</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                rec.score >= 90 ? 'bg-emerald-500' : rec.score >= 75 ? 'bg-blue-500' : 'bg-amber-500'
              }`}
              style={{ width: `${rec.score}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-1">
            <span>⏱️ Duration:</span>
            <span className="font-semibold text-slate-800">{rec.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Difficulty:</span>
            <DifficultyBadge difficulty={rec.difficulty} />
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Target Competencies
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(rec.requiredSkills || []).map((sk, i) => (
              <span key={i} className="chip-indigo text-xs">
                {sk}
              </span>
            ))}
          </div>
        </div>

        <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs space-y-1">
          <span className="font-bold text-blue-900 block">Expected Proficiency Gain</span>
          <span className="text-blue-800 font-medium block">{rec.expectedImprovement}</span>
          <p className="text-[11px] text-slate-600 italic pt-1 line-clamp-2">{rec.reason}</p>
        </div>
      </div>

      {/* Action Footer with working external links & knowledge quiz */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onTakeQuiz(rec)}
          className="btn-outline text-xs py-1.5 px-3 font-semibold text-slate-700 hover:text-blue-600 flex items-center gap-1"
        >
          <span>📝</span> Knowledge Quiz
        </button>

        {externalLink !== '#' ? (
          <a
            href={externalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 shadow-sm"
          >
            <span>Open</span>
            <span>↗</span>
          </a>
        ) : (
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
            Internal LMS
          </span>
        )}
      </div>
    </div>
  );
}

export default function Recommendations() {
  const { user } = useAuth();
  const { currentRole, isEmployee } = useRole();

  const isEmployeeView = isEmployee || currentRole === ROLES.EMPLOYEE || (user?.role && user.role.toLowerCase() === 'employee');
  const loggedInName = user?.name || user?.username || 'Shanthan Kodipyaka';
  const userDept = user?.department || 'Software Development';

  const [recommendations, setRecommendations] = useState([]);
  const [learningPaths,   setLearningPaths]   = useState([]);
  const [loading,           setLoading]         = useState(true);
  const [error,             setError]           = useState(null);

  // Active Tab: 'courses' | 'paths' | 'catalog'
  const [activeTab, setActiveTab] = useState('courses');

  // Filters & Sorting
  const [search,         setSearch]         = useState('');
  const [providerFilter, setProviderFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy,         setSortBy]         = useState('score_desc');

  // Internal Catalog state
  const [catalog, setCatalog] = useState(INITIAL_INTERNAL_CATALOG);

  // Quiz Modal State
  const [activeQuizCourse, setActiveQuizCourse] = useState(null);
  const [quizAnswers,      setQuizAnswers]      = useState({});
  const [quizScore,        setQuizScore]        = useState(null);

  // Toast State
  const [toast, setToast] = useState({ message: '', type: 'success' });

  function fetchData() {
    setLoading(true);
    setError(null);
    Promise.all([getRecommendations(), getLearningPaths()])
      .then(([recs, paths]) => {
        setRecommendations(Array.isArray(recs) ? recs : []);
        setLearningPaths(Array.isArray(paths) ? paths : []);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Error loading recommendations, using fallback:', err);
        setRecommendations([]);
        setLearningPaths([]);
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchData();
  }, []);

  function showToastMsg(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 4000);
  }

  function handleTriggerAdaptiveRecommender() {
    showToastMsg('⚡ Adaptive AI Engine re-calculated recommendations based on latest skill assessment scores!');
    fetchData();
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
    const questions = COURSE_QUIZZES.default;
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct) {
        correctCount += 1;
      }
    });
    const percentage = Math.round((correctCount / questions.length) * 100);
    setQuizScore(percentage);

    if (percentage >= 66) {
      showToastMsg(`🎉 Assessment Passed (${percentage}%)! Target skill competency score updated.`);
    } else {
      showToastMsg(`Assessment completed (${percentage}%). Review recommended course modules.`, 'error');
    }
  }

  if (loading) return <LoadingScreen message="Loading AI Training Recommendations &amp; Learning Paths…" />;
  if (error)   return <ErrorState message={error} onRetry={fetchData} />;

  const safeRecs  = Array.isArray(recommendations) ? recommendations : [];
  const safePaths = Array.isArray(learningPaths) ? learningPaths : [];

  // Personalize recommendations & learning paths for Employee View
  let userScopedRecs = safeRecs;
  if (isEmployeeView) {
    userScopedRecs = safeRecs.map((r) => ({
      ...r,
      employee: loggedInName,
      department: userDept,
    }));
  }

  let userScopedPaths = safePaths;
  if (isEmployeeView) {
    userScopedPaths = safePaths.map((p, i) => ({
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

  const providers  = ['All', ...new Set(userScopedRecs.map((r) => r.provider).filter(Boolean))];
  const priorities = ['All', 'High', 'Medium', 'Low'];

  const filteredRecs = userScopedRecs.filter((r) => {
    if (!r) return false;
    const courseTitle = (r.course || '').toLowerCase();
    const empName     = (r.employee || '').toLowerCase();
    const searchStr   = (search || '').toLowerCase();

    const matchesSearch   = courseTitle.includes(searchStr) || empName.includes(searchStr);
    const matchesPriority = priorityFilter === 'All' || r.priority === priorityFilter;
    const matchesProvider = providerFilter === 'All' || r.provider === providerFilter;
    return matchesSearch && matchesPriority && matchesProvider;
  });

  const sortedRecs = [...filteredRecs].sort((a, b) => {
    if (sortBy === 'score_desc') return (b.score || 0) - (a.score || 0);
    if (sortBy === 'priority_desc') {
      const pOrder = { High: 3, Medium: 2, Low: 1 };
      return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
    }
    return (a.course || '').localeCompare(b.course || '');
  });

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
          <div className="flex items-center gap-2">
            <h1 className="page-header-title text-2xl font-extrabold">
              {isEmployeeView ? 'My Training Recommendations & Learning Roadmaps' : 'Training Recommendation Module'}
            </h1>
            <span className="badge-purple text-xs font-bold">Module 5</span>
            {isEmployeeView && <span className="badge-blue text-xs font-bold">Personalized AI Recommendations</span>}
          </div>
          <p className="page-header-subtitle">
            {isEmployeeView
              ? `AI-matched course recommendations, LinkedIn Learning & Coursera roadmaps, and adaptive upskilling for ${loggedInName}`
              : 'Personalized learning paths, external course linking (Coursera, Udemy, LinkedIn Learning), LMS catalog & adaptive re-recommendations.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={handleTriggerAdaptiveRecommender}
            className="btn-secondary text-xs flex items-center gap-1.5 px-4 py-2"
          >
            <span>🔄</span> Adaptive Re-Recommendation
          </button>
        </div>
      </div>

      {/* ── Summary Metric Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <SummaryCard
          title={isEmployeeView ? "My Courses" : "Recommended Courses"}
          value={userScopedRecs.length}
          subtext="AI relevance matched"
          icon="📚"
          accent="blue"
        />
        <SummaryCard
          title={isEmployeeView ? "My Roadmaps" : "Personalized Roadmaps"}
          value={userScopedPaths.length}
          subtext="Role-tailored learning paths"
          icon="🗺️"
          accent="purple"
        />
        <SummaryCard
          title="Avg Relevance Match"
          value="92.4%"
          subtext="High-precision alignment"
          icon="✨"
          accent="emerald"
        />
        <SummaryCard
          title="Internal LMS Catalog"
          value={catalog.length}
          subtext="Active training programs"
          icon="🏢"
          accent="amber"
        />
      </div>

      {/* ── Full Width Module 5 Tabs Bar ─────────────────────── */}
      <div className="panel overflow-hidden w-full">
        <div className="w-full bg-slate-50 border-b border-slate-200 px-4 sm:px-6 pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {[
              { id: 'courses', label: isEmployeeView ? 'My AI Course Recommendations' : 'AI Course Recommendations & External Links', icon: '📚' },
              { id: 'paths',   label: isEmployeeView ? 'My Personalized Learning Roadmaps' : 'Personalized Learning Paths & Adaptive Engine', icon: '🗺️' },
              { id: 'catalog', label: 'Internal Training Catalog Management', icon: '🏢' },
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

          {/* TAB 1: AI Course Recommendations & External Resource Links */}
          {activeTab === 'courses' && (
            <div className="space-y-6 w-full">
              {/* Filters & Sorting Bar */}
              <div className="filter-bar flex flex-wrap items-center justify-between gap-3 w-full">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  <div className="search-input-wrapper min-w-[220px]">
                    <svg className="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                      type="text"
                      placeholder="Search course title..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="search-input text-xs"
                    />
                  </div>

                  <select
                    value={providerFilter}
                    onChange={(e) => setProviderFilter(e.target.value)}
                    className="form-select w-auto text-xs"
                  >
                    {providers.map((pr) => <option key={pr}>{pr}</option>)}
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="form-select w-auto text-xs"
                  >
                    {priorities.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="form-select w-auto text-xs font-bold text-blue-600"
                  >
                    <option value="score_desc">✨ AI Match Score (Highest First)</option>
                    <option value="priority_desc">Priority (High to Low)</option>
                    <option value="name_asc">Course Title (A-Z)</option>
                  </select>
                </div>
              </div>

              {sortedRecs.length === 0 ? (
                <EmptyState title="No course recommendations found" message="Adjust search or filters." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                  {sortedRecs.map((rec) => (
                    <RecommendationCard key={rec.id} rec={rec} onTakeQuiz={handleOpenQuiz} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Personalized Learning Path Generation & Adaptive Engine */}
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
                  className="btn-primary text-xs shrink-0 flex items-center justify-center gap-2 py-2.5 px-5 shadow-btn-primary"
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
                          Assigned to: <span className="font-bold text-slate-800">{path.employee}</span> &middot; Path Horizon:{' '}
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
                        const providerInfo = PROVIDER_CONFIG[step.provider] || { icon: '📖', badge: 'bg-slate-100 text-slate-700', url: 'https://www.coursera.org' };
                        const extUrl = providerInfo.url !== '#' ? `${providerInfo.url}${encodeURIComponent(step.title || step.courseName)}` : '#';

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
                              {step.status === 'Completed' ? '✓' : step.status === 'Locked' ? '🔒' : step.stepNumber}
                            </div>

                            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 hover:border-slate-300 transition-all">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold border ${providerInfo.badge}`}>
                                  <span>{providerInfo.icon}</span>
                                  <span>{step.provider}</span>
                                </span>
                                <div className="flex items-center gap-2">
                                  <StepStatusBadge status={step.status} />
                                  {extUrl !== '#' && (
                                    <a
                                      href={extUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5"
                                    >
                                      <span>Open</span>
                                      <span>↗</span>
                                    </a>
                                  )}
                                </div>
                              </div>

                              <h4 className="text-sm font-bold text-slate-900">{step.title || step.courseName}</h4>
                              <p className="text-xs text-slate-600">{step.description}</p>
                              <span className="text-[11px] text-slate-400 font-medium block">Duration: {step.duration}</span>
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

          {/* TAB 3: Internal Training Catalog Management */}
          {activeTab === 'catalog' && (
            <div className="space-y-6 w-full">
              <div>
                <h3 className="text-base font-bold text-slate-900">Internal Enterprise LMS Training Catalog</h3>
                <p className="text-xs text-slate-500">Corporate internal training courses, LMS modules, and enrollment programs</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {catalog.map((item) => (
                  <div key={item.id} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 flex flex-col justify-between">
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
                        className="btn-primary text-xs py-1.5 px-4"
                      >
                        Enroll Now ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── MODAL: Interactive Course Knowledge Quiz ──────────── */}
      {activeQuizCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="chip-indigo text-[10px]">Competency Verification Quiz</span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{activeQuizCourse.course}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveQuizCourse(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {COURSE_QUIZZES.default.map((qObj, qIdx) => (
                <div key={qIdx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <p className="font-bold text-slate-900">{qIdx + 1}. {qObj.q}</p>
                  <div className="space-y-1.5">
                    {qObj.options.map((opt, oIdx) => (
                      <label key={oIdx} className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded border border-slate-200 hover:border-blue-300 transition-colors">
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

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              {quizScore !== null ? (
                <span className={`text-xs font-bold ${quizScore >= 66 ? 'text-emerald-600' : 'text-red-600'}`}>
                  Score: {quizScore}% ({quizScore >= 66 ? 'Passed!' : 'Needs Review'})
                </span>
              ) : (
                <span className="text-xs text-slate-400">Select answers for all 3 questions</span>
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
                  className="btn-primary text-xs py-1.5 px-4"
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
