import { useState, useEffect } from 'react';
import { getSkills, LEVEL_LABELS } from '../../services/skillService';
import ExportToolbar from '../../components/common/ExportToolbar';
import LoadingScreen from '../../components/feedback/LoadingScreen';
import ErrorState    from '../../components/feedback/ErrorState';
import EmptyState    from '../../components/feedback/EmptyState';

const CATEGORIES = ['All', 'Technical', 'Data Science', 'Soft Skills', 'Management', 'Finance', 'Marketing'];

const LEVEL_BADGE = {
  1: 'badge-neutral',
  2: 'badge-neutral',
  3: 'badge-info',
  4: 'badge-purple',
  5: 'badge-warning',
};

const SKILL_COLUMNS = [
  { label: 'Skill Name',     key: 'name' },
  { label: 'Category',       key: 'category' },
  { label: 'Description',    key: 'description' },
  { label: 'Required Level', key: 'requiredLevel' },
];

export default function SkillList() {
  const [skills,   setSkills]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('All');

  function fetchSkills() {
    setLoading(true);
    setError(null);
    getSkills()
      .then((data) => {
        setSkills(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Error loading skills, using presentation fallback:', err);
        setSkills([]);
        setLoading(false);
      });
  }

  useEffect(() => { fetchSkills(); }, []);

  const safeSkillsList = Array.isArray(skills) ? skills : [];

  const filtered = safeSkillsList.filter((s) => {
    if (!s) return false;
    const nameStr = (s.name || s.skillName || '').toLowerCase();
    const searchStr = (search || '').toLowerCase();
    const matchSearch   = nameStr.includes(searchStr);
    const matchCategory = category === 'All' || (s.category || 'Technical') === category;
    return matchSearch && matchCategory;
  });

  if (loading) return <LoadingScreen message="Loading organizational skills library…" />;
  if (error)   return <ErrorState message={error} onRetry={fetchSkills} />;

  return (
    <div className="page-container">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="page-header-row">
        <div>
          <h1 className="page-header-title">Skills Catalog</h1>
          <p className="page-header-subtitle">Central competency registry and required proficiency benchmark levels</p>
        </div>
        <span className="count-badge">{safeSkillsList.length} Registered Skills</span>
      </div>

      <ExportToolbar
        data={filtered}
        columns={SKILL_COLUMNS}
        filename="skills_catalog_report"
        title="Export Skills Catalog"
      />

      {/* ── Filters Bar ──────────────────────────────────── */}
      <div className="filter-bar flex flex-col sm:flex-row gap-3">
        <div className="search-input-wrapper flex-1 max-w-sm">
          <svg className="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            id="skill-search"
            type="text"
            placeholder="Search by skill name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <select
          id="category-filter"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="form-select sm:w-52"
        >
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* ── Table ────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState title="No skills found" message="Adjust your search or category filter." />
      ) : (
        <div className="data-table-wrapper">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead className="table-head">
                <tr>
                  <th className="table-th">Skill Name</th>
                  <th className="table-th">Category</th>
                  <th className="table-th">Description</th>
                  <th className="table-th-center">Required Level</th>
                </tr>
              </thead>
              <tbody className="table-tbody">
                {filtered.map((skill, idx) => (
                  <tr key={skill.id || idx} className="table-row">
                    <td className="table-td-primary whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span>{skill.name || skill.skillName || 'Skill'}</span>
                      </div>
                    </td>
                    <td className="table-td whitespace-nowrap">
                      <span className="chip-indigo">{skill.category || 'Technical'}</span>
                    </td>
                    <td className="table-td text-slate-500 max-w-sm leading-relaxed">{skill.description || 'Core organizational competency skill.'}</td>
                    <td className="table-td text-center whitespace-nowrap">
                      <div className="flex flex-col items-center gap-1">
                        <span className={LEVEL_BADGE[skill.requiredLevel] ?? 'badge-neutral'}>
                          {LEVEL_LABELS[skill.requiredLevel] || 'Intermediate'} ({skill.requiredLevel ?? 3}/5)
                        </span>
                        <div className="progress-track w-16">
                          <div
                            className="progress-fill bg-blue-600"
                            style={{ width: `${((skill.requiredLevel ?? 3) / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>Showing {filtered.length} of {safeSkillsList.length} skills</span>
            {filtered.length < safeSkillsList.length && (
              <span className="text-blue-600 font-semibold">Filter active</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
