import { useState, useEffect } from 'react';
import { useRole } from '../../context/RoleContext';
import { getTrainings } from '../../services/trainingService';
import { subscribeToStore, getCollection } from '../../utils/hybridStore';
import LoadingScreen from '../../components/feedback/LoadingScreen';
import ErrorState    from '../../components/feedback/ErrorState';
import EmptyState    from '../../components/feedback/EmptyState';

export default function TrainingManagement() {
  const { roleBadge } = useRole();
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  function fetchTrainings() {
    setLoading(true);
    setError(null);
    getTrainings()
      .then((data) => {
        const list = Array.isArray(data) && data.length > 0 ? data : getCollection('trainings');
        setTrainings(list);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('[TrainingManagement] Backend failed, loading from hybridStore:', err);
        const fallback = getCollection('trainings');
        setTrainings(fallback);
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchTrainings();
    const unsub = subscribeToStore(fetchTrainings);
    return unsub;
  }, []);

  if (loading) return <LoadingScreen message="Loading training programs…" />;
  if (error && trainings.length === 0) return <ErrorState message={error} onRetry={fetchTrainings} />;

  const safeTrainings = Array.isArray(trainings) ? trainings : [];

  return (
    <div className="page-container space-y-6">
      <div className="page-header-row">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-header-title">Training &amp; L&amp;D Management</h1>
            <span className={roleBadge.badgeClass}>L&amp;D Governance</span>
          </div>
          <p className="page-header-subtitle">Configure training programs, manage course assignments, and track skill interventions</p>
        </div>
        <span className="count-badge text-xs px-3 py-1 font-semibold">{safeTrainings.length} Active Courses</span>
      </div>

      {safeTrainings.length === 0 ? (
        <EmptyState
          title="No training programs registered"
          message="No training programs or courses exist in the database yet."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {safeTrainings.map((t, i) => {
            const prog = typeof t.progress === 'number' ? t.progress : 65;
            return (
              <div key={t.id || i} className="panel p-5 space-y-3 flex flex-col justify-between hover:shadow-card transition-shadow">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="badge-info text-[10px]">{t.dept || 'Engineering'}</span>
                    <span className="chip-indigo text-[10px]">{t.difficulty || 'Advanced'}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{t.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {t.description || 'Organizational skill upskilling and certification course.'}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Trainer: <strong className="text-slate-800">{t.trainer || 'Senior Architect'}</strong></span>
                    <span className="font-semibold text-blue-600">{t.duration || '4 Weeks'}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">{t.enrolled || 12} enrolled</span>
                      <span className="font-bold text-slate-700">{prog}% complete</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${
                          prog === 100 ? 'bg-emerald-500' : prog >= 50 ? 'bg-blue-500' : 'bg-amber-400'
                        }`}
                        style={{ width: `${prog}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Status: <strong className="text-emerald-700 font-semibold">{t.status || 'Active'}</strong></span>
                    <span className="text-slate-400">{t.startDate || '2026-09-01'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
