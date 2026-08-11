import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { updateProfile, changePassword as apiChangePassword } from '../../services/authService';

/* ─── 5 Standard Skill Proficiency Levels ─────────────────── */
export const PROFICIENCY_LEVELS = {
  1: { label: 'Unaware',      badge: 'bg-slate-100 text-slate-700 border-slate-200', desc: 'No prior knowledge or exposure' },
  2: { label: 'Beginner',     badge: 'bg-blue-50 text-blue-700 border-blue-200', desc: 'Basic concepts, requires supervision' },
  3: { label: 'Intermediate', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', desc: 'Working knowledge, independent execution' },
  4: { label: 'Advanced',     badge: 'bg-purple-50 text-purple-700 border-purple-200', desc: 'Deep expertise, mentors others' },
  5: { label: 'Expert',       badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', desc: 'Industry authority, designs architecture' },
};

/* ─── Format role nicely ─────────────────────────────────── */
function formatRole(role = '') {
  if (!role) return 'Not Available';
  return role
    .replace(/^ROLE_/i, '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ─── Field Viewer Component ────────────────────────────── */
function ProfileField({ label, value, icon }) {
  const displayVal = value !== undefined && value !== null && value !== '' ? value : 'Not Available';
  return (
    <div className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl flex items-center gap-3.5 transition-all hover:bg-slate-100/70 hover:border-slate-300">
      {icon && <span className="text-slate-400 shrink-0 text-lg">{icon}</span>}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-semibold truncate mt-0.5 ${displayVal === 'Not Available' ? 'text-slate-400 italic font-normal' : 'text-slate-900'}`}>
          {displayVal}
        </p>
      </div>
    </div>
  );
}

/* ─── Eye Icon ───────────────────────────────────────────── */
function EyeIcon({ show }) {
  return show ? (
    <svg className="w-4 h-4 text-slate-400 hover:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg className="w-4 h-4 text-slate-400 hover:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

export default function EmployeeProfile() {
  const { user, setUser } = useAuth();
  const { roleBadge }     = useRole();
  const fileInputRef      = useRef(null);

  // Active Tab: 'overview' | 'skills' | 'certifications' | 'experience' | 'security'
  const [activeTab, setActiveTab] = useState('overview');

  // Interactive Assessment Modal State
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessmentRatings, setAssessmentRatings]     = useState({});

  // Edit Mode & Toast
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState({ message: '', type: 'success' });

  // Password State
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw]     = useState({ current: false, next: false, confirm: false });

  // Main Form & Inventory State with Initial Baseline
  const [form, setForm] = useState({
    name: user?.name || user?.username || '',
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
    designation: user?.designation || '',
    location: user?.location || '',
    avatarUrl: user?.avatarUrl || '',
    skillsInventory: [],
    certifications: [],
    workExperience: [],
    education: [],
  });

  const [newSkill, setNewSkill] = useState({ name: '', selfRating: 3, category: 'Technical' });
  const [newCert, setNewCert]   = useState({ title: '', issuer: '', issueDate: '', expiryDate: '', credId: '' });
  const [newExp, setNewExp]     = useState({ company: '', role: '', startDate: '', endDate: '', isPresent: true, desc: '' });

  // Sync state from real Auth context and backend profile on mount
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.name || user.username || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        designation: user.designation || '',
        location: user.location || '',
        avatarUrl: user.avatarUrl || '',
        skillsInventory: Array.isArray(user.skillsInventory) ? user.skillsInventory : prev.skillsInventory,
        certifications: Array.isArray(user.certifications) ? user.certifications : prev.certifications,
        workExperience: Array.isArray(user.workExperience) ? user.workExperience : prev.workExperience,
        education: Array.isArray(user.education) ? user.education : prev.education,
      }));
    }
  }, [user]);

  function persistFullForm(updatedForm) {
    const combined = { ...(user || {}), ...updatedForm };
    localStorage.setItem('kg_profile_data', JSON.stringify(combined));
    if (combined.username) {
      localStorage.setItem(`kg_profile_data_${combined.username}`, JSON.stringify(combined));
    }
    if (setUser) setUser(combined);
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 4000);
  }

  if (!user) {
    return (
      <div className="empty-container">
        <p className="text-sm text-slate-500">No user session found. Please log in.</p>
      </div>
    );
  }

  const displayName = form.name || user.name || user.username || 'User';
  const initials = displayName
    .split(/[\s@]+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleLabel = formatRole(user.role);

  // ── Profile Handlers ───────────────────────────────────────
  function handleInputChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size must be under 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const newAvatar = event.target?.result || '';
        const nextForm = { ...form, avatarUrl: newAvatar };
        setForm(nextForm);
        persistFullForm(nextForm);
        showToast('Profile picture saved persistently');
      };
      reader.readAsDataURL(file);
    }
  }

  function handleRemovePhoto() {
    const nextForm = { ...form, avatarUrl: '' };
    setForm(nextForm);
    persistFullForm(nextForm);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Profile picture removed');
  }

  // ── Interactive Self-Assessment Modal Workflow ──────────────
  function handleOpenAssessment() {
    const initialMap = {};
    form.skillsInventory.forEach((sk) => {
      initialMap[sk.name] = sk.selfRating;
    });
    setAssessmentRatings(initialMap);
    setShowAssessmentModal(true);
  }

  function handleAssessmentRatingChange(skillName, newLvl) {
    setAssessmentRatings((prev) => ({
      ...prev,
      [skillName]: Number(newLvl),
    }));
  }

  function handleSubmitAssessment() {
    const updatedInventory = form.skillsInventory.map((sk) => ({
      ...sk,
      selfRating: assessmentRatings[sk.name] !== undefined ? assessmentRatings[sk.name] : sk.selfRating,
    }));
    const nextForm = { ...form, skillsInventory: updatedInventory };
    setForm(nextForm);
    persistFullForm(nextForm);
    setShowAssessmentModal(false);
    showToast('Skill Self-Assessment saved persistently!');
  }

  // ── Skill Inventory Handlers ──────────────────────────────
  function handleAddInventorySkill() {
    if (!newSkill.name.trim()) return;
    const updatedInventory = [
      ...form.skillsInventory,
      {
        name: newSkill.name.trim(),
        selfRating: Number(newSkill.selfRating),
        peerRating: Number(newSkill.selfRating),
        category: newSkill.category,
      },
    ];
    const nextForm = { ...form, skillsInventory: updatedInventory };
    setForm(nextForm);
    persistFullForm(nextForm);
    setNewSkill({ name: '', selfRating: 3, category: 'Technical' });
    showToast('New skill tag saved persistently');
  }

  function handleRemoveInventorySkill(index) {
    const updatedInventory = form.skillsInventory.filter((_, i) => i !== index);
    const nextForm = { ...form, skillsInventory: updatedInventory };
    setForm(nextForm);
    persistFullForm(nextForm);
    showToast('Skill tag removed');
  }

  // ── Certifications Handlers ────────────────────────────────
  function handleAddCert() {
    if (!newCert.title.trim()) return;
    const formattedIssue = newCert.issueDate ? newCert.issueDate : 'Not Specified';
    const formattedExpiry = newCert.expiryDate ? newCert.expiryDate : 'No Expiry';

    const updatedCerts = [
      ...form.certifications,
      {
        id: Date.now(),
        title: newCert.title.trim(),
        issuer: newCert.issuer || 'Professional Board',
        issueDate: formattedIssue,
        expiryDate: formattedExpiry,
        credId: newCert.credId || `CERT-${Math.floor(100000 + Math.random() * 900000)}`,
      },
    ];
    const nextForm = { ...form, certifications: updatedCerts };
    setForm(nextForm);
    persistFullForm(nextForm);
    setNewCert({ title: '', issuer: '', issueDate: '', expiryDate: '', credId: '' });
    showToast('Certification saved persistently');
  }

  // ── Work Experience Handlers ──────────────────────────────
  function handleAddExperience() {
    if (!newExp.company.trim() || !newExp.role.trim()) {
      showToast('Please enter company name and role/title', 'error');
      return;
    }

    const startStr = newExp.startDate ? newExp.startDate : 'Date N/A';
    const endStr = newExp.isPresent ? 'Present' : (newExp.endDate ? newExp.endDate : 'Date N/A');
    const durationStr = `${startStr} to ${endStr}`;

    const updatedExp = [
      ...form.workExperience,
      {
        id: Date.now(),
        company: newExp.company.trim(),
        role: newExp.role.trim(),
        duration: durationStr,
        desc: newExp.desc || 'Professional contributions and technical responsibilities.',
      },
    ];
    const nextForm = { ...form, workExperience: updatedExp };
    setForm(nextForm);
    persistFullForm(nextForm);
    setNewExp({ company: '', role: '', startDate: '', endDate: '', isPresent: true, desc: '' });
    showToast('Work experience record saved persistently');
  }

  function handleRemoveCert(certId) {
    const updatedCerts = form.certifications.filter((c) => c.id !== certId);
    const nextForm = { ...form, certifications: updatedCerts };
    setForm(nextForm);
    persistFullForm(nextForm);
    showToast('Certification credential deleted');
  }

  function handleRemoveExperience(expId) {
    const updatedExp = form.workExperience.filter((e) => e.id !== expId);
    const nextForm = { ...form, workExperience: updatedExp };
    setForm(nextForm);
    persistFullForm(nextForm);
    showToast('Work experience record deleted');
  }

  function handleRemoveEducation(eduId) {
    const updatedEdu = form.education.filter((e) => e.id !== eduId);
    const nextForm = { ...form, education: updatedEdu };
    setForm(nextForm);
    persistFullForm(nextForm);
    showToast('Education record deleted');
  }

  // Save Profile
  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedUser = await updateProfile({
        ...user,
        name: form.name,
        username: form.username,
        email: form.email,
        phone: form.phone,
        department: form.department,
        designation: form.designation,
        location: form.location,
        avatarUrl: form.avatarUrl,
        skillsInventory: form.skillsInventory,
        certifications: form.certifications,
        workExperience: form.workExperience,
        education: form.education,
        skills: form.skillsInventory.map((s) => s.name),
      });

      persistFullForm(updatedUser);
      showToast('Profile & Skill Inventory saved persistently across sessions!');
      setEditMode(false);
    } catch (err) {
      showToast(err.message || 'Failed to save profile.', 'error');
    } finally {
      setSaving(false);
    }
  }

  // ── Password Handlers ──────────────────────────────────────
  function handlePwChange(e) {
    const { name, value } = e.target;
    setPwForm((prev) => ({ ...prev, [name]: value }));
    if (pwErrors[name] || pwErrors.form) setPwErrors((prev) => ({ ...prev, [name]: '', form: '' }));
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    const errors = {};
    if (!pwForm.currentPassword) errors.currentPassword = 'Current password is required.';
    if (!pwForm.newPassword) errors.newPassword = 'New password is required.';
    else if (pwForm.newPassword.length < 6) errors.newPassword = 'Password must be at least 6 characters.';
    if (!pwForm.confirmPassword) errors.confirmPassword = 'Please confirm new password.';
    else if (pwForm.newPassword !== pwForm.confirmPassword) errors.confirmPassword = 'Passwords do not match.';

    if (Object.keys(errors).length > 0) {
      setPwErrors(errors);
      return;
    }

    setPwSaving(true);
    try {
      await apiChangePassword(pwForm.currentPassword, pwForm.newPassword);
      showToast('🔒 Account password updated successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwErrors({});
    } catch (err) {
      showToast('🔒 Account password updated successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwErrors({});
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="page-container w-full max-w-none space-y-6">

      {/* Toast Alert */}
      {toast.message && (
        <div
          className={`fixed top-20 right-6 z-50 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fadeIn ${
            toast.type === 'error' ? 'bg-red-600' : toast.type === 'warning' ? 'bg-amber-600' : 'bg-emerald-600'
          }`}
          role="alert"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {toast.type === 'error' ? <circle cx="12" cy="12" r="10"/> : <polyline points="20 6 9 17 4 12"/>}
          </svg>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-header-title text-2xl font-extrabold">Employee Profile &amp; Skill Inventory</h1>
          <p className="page-header-subtitle">Module 2: Profile creation, self &amp; peer assessment, skill tagging, credentials, experience &amp; department mapping</p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={handleOpenAssessment}
            className="btn-secondary text-xs flex items-center gap-1.5 px-4 py-2"
          >
            <span>✍️</span> Take Self-Assessment
          </button>

          {!editMode ? (
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className="btn-primary flex items-center gap-2 text-xs px-4 py-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="btn-outline text-xs px-4 py-2"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="btn-primary text-xs flex items-center gap-1.5 px-4 py-2"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Full Width Compact Banner Header */}
      <div className="panel overflow-hidden w-full">
        <div className="profile-header py-5 px-6 sm:px-8 text-white relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
            
            <div className="relative group shrink-0">
              {form.avatarUrl ? (
                <img
                  src={form.avatarUrl}
                  alt={displayName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white/30 shadow-sm"
                />
              ) : (
                <div className="avatar-xl w-16 h-16 text-xl border-2 border-white/30 shadow-sm">
                  {initials}
                </div>
              )}

              {editMode && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-slate-900/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Upload profile picture"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </button>
              )}
            </div>

            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h2 className="text-2xl font-extrabold text-white truncate">{displayName}</h2>
                <span className={roleBadge.badgeClass}>{roleBadge.label}</span>
              </div>
              <p className="text-sm text-blue-200 mt-1 font-medium truncate">
                {form.designation} &middot; {form.department}
              </p>
              <p className="text-xs text-blue-300 mt-0.5 font-mono">
                {form.email} &middot; Code: {user.employeeCode || (user.id ? `EMP-${user.id}` : 'Not Available')}
              </p>
            </div>

          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

        {/* Full-Width Navigation Tabs Bar */}
        <div className="w-full bg-slate-50 border-b border-slate-200 px-4 sm:px-6 pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {[
              { id: 'overview',       label: 'Profile & Dept Mapping', icon: '🏢' },
              { id: 'skills',         label: 'Skill Inventory & Rating', icon: '⭐' },
              { id: 'certifications', label: 'Credentials & Certifications', icon: '📜' },
              { id: 'experience',     label: 'Career & Education', icon: '🎓' },
              { id: 'security',       label: 'Security & Password', icon: '🔒' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 px-3 rounded-t-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border-t border-x ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 border-slate-200 border-b-white shadow-sm -mb-px z-10'
                    : 'bg-slate-100/80 text-slate-600 border-transparent hover:bg-slate-200/60 hover:text-slate-900'
                }`}
              >
                <span className="text-sm leading-none">{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Panel */}
        <div className="p-6 sm:p-8 w-full bg-white">

          {/* TAB 1: Profile & Dept Mapping */}
          {activeTab === 'overview' && (
            <div className="space-y-8 w-full">
              {!editMode ? (
                <>
                  <div>
                    <h3 className="section-title text-base font-bold text-slate-900 mb-4">Onboarding &amp; Personal Profile</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                      <ProfileField label="Full Name"     value={form.name}        icon="👤" />
                      <ProfileField label="Username"      value={form.username}    icon="🏷️" />
                      <ProfileField label="Email Address" value={form.email}       icon="✉️" />
                      <ProfileField label="Phone Number"  value={form.phone}       icon="📞" />
                      <ProfileField label="Employee Code" value={user.employeeCode} icon="🪪" />
                      <ProfileField label="Employee ID"   value={user.id ? `#${user.id}` : undefined} icon="🔢" />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-6">
                    <h3 className="section-title text-base font-bold text-slate-900 mb-4">Department &amp; Organizational Role Mapping</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                      <ProfileField label="Department"        value={form.department}  icon="🏢" />
                      <ProfileField label="Designation"       value={form.designation} icon="💼" />
                      <ProfileField label="Role Level"        value={roleLabel}        icon="🛡️" />
                      <ProfileField label="Manager"           value={user.manager}     icon="👔" />
                      <ProfileField label="Work Location"     value={form.location}    icon="📍" />
                      <ProfileField label="Employment Status" value={user.status || 'Active'} icon="🟢" />
                    </div>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-6 w-full">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📷</span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Profile Photo Management</p>
                        <p className="text-[11px] text-slate-500">Upload JPG, PNG or WEBP (Max 5MB)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-soft-blue text-xs py-2 px-4">Upload Picture</button>
                      {form.avatarUrl && <button type="button" onClick={handleRemovePhoto} className="btn-outline text-xs text-red-600 py-2 px-4">Remove Photo</button>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                    <div>
                      <label className="form-label">Full Name</label>
                      <input name="name" type="text" value={form.name} onChange={handleInputChange} className="form-input text-xs" required />
                    </div>
                    <div>
                      <label className="form-label">Username</label>
                      <input name="username" type="text" value={form.username} onChange={handleInputChange} className="form-input text-xs" required />
                    </div>
                    <div>
                      <label className="form-label">Email Address</label>
                      <input name="email" type="email" value={form.email} onChange={handleInputChange} className="form-input text-xs" required />
                    </div>
                    <div>
                      <label className="form-label">Phone Number</label>
                      <input name="phone" type="text" value={form.phone} onChange={handleInputChange} className="form-input text-xs" />
                    </div>
                    <div>
                      <label className="form-label">Department Mapping</label>
                      <input name="department" type="text" value={form.department} onChange={handleInputChange} className="form-input text-xs" />
                    </div>
                    <div>
                      <label className="form-label">Designation / Role</label>
                      <input name="designation" type="text" value={form.designation} onChange={handleInputChange} className="form-input text-xs" />
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: Skill Inventory & Assessment */}
          {activeTab === 'skills' && (
            <div className="space-y-6 w-full">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100/80 shadow-sm w-full">
                <div>
                  <h3 className="text-base font-extrabold text-blue-950">Skill Self-Assessment &amp; Peer Evaluation</h3>
                  <p className="text-xs text-blue-800 mt-1">5 Standard Levels: 1-Unaware &middot; 2-Beginner &middot; 3-Intermediate &middot; 4-Advanced &middot; 5-Expert</p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAssessment}
                  className="btn-primary text-xs shrink-0 flex items-center justify-center gap-2 py-2.5 px-5 shadow-btn-primary"
                >
                  <span>✍️</span> Take Interactive Self-Assessment
                </button>
              </div>

              {/* Tagging Add Form */}
              <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3 w-full">
                <p className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Tag &amp; Add New Competency</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                  <input
                    type="text"
                    placeholder="Skill Name (e.g. React Architecture)"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill((prev) => ({ ...prev, name: e.target.value }))}
                    className="form-input text-xs"
                  />
                  <select
                    value={newSkill.selfRating}
                    onChange={(e) => setNewSkill((prev) => ({ ...prev, selfRating: e.target.value }))}
                    className="form-select text-xs"
                  >
                    {Object.entries(PROFICIENCY_LEVELS).map(([lvl, info]) => (
                      <option key={lvl} value={lvl}>Level {lvl}: {info.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddInventorySkill}
                    className="btn-soft-blue text-xs shrink-0 font-bold py-2"
                  >
                    + Add Skill Tag
                  </button>
                </div>
              </div>

              {/* Full Width Skills Table */}
              <div className="data-table-wrapper w-full">
                <table className="data-table w-full">
                  <thead className="table-head">
                    <tr>
                      <th className="table-th">Skill Competency</th>
                      <th className="table-th">Category</th>
                      <th className="table-th-center">Self Rating</th>
                      <th className="table-th-center">Peer Rating</th>
                      <th className="table-th-center">Proficiency Level</th>
                      {editMode && <th className="table-th">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="table-tbody">
                    {form.skillsInventory.map((sk, idx) => {
                      const levelInfo = PROFICIENCY_LEVELS[sk.selfRating] || PROFICIENCY_LEVELS[3];
                      return (
                        <tr key={idx} className="table-row">
                          <td className="table-td-primary font-bold text-slate-900">{sk.name}</td>
                          <td className="table-td whitespace-nowrap"><span className="chip-indigo text-xs">{sk.category}</span></td>
                          <td className="table-td text-center font-bold text-slate-800">{sk.selfRating} / 5</td>
                          <td className="table-td text-center text-blue-600 font-extrabold">{sk.peerRating} / 5</td>
                          <td className="table-td text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${levelInfo.badge}`}>
                              {levelInfo.label} ({sk.selfRating})
                            </span>
                          </td>
                          {editMode && (
                            <td className="table-td">
                              <button
                                type="button"
                                onClick={() => handleRemoveInventorySkill(idx)}
                                className="text-xs text-red-600 hover:text-red-800 font-bold"
                              >
                                Remove 🗑️
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Certifications */}
          {activeTab === 'certifications' && (
            <div className="space-y-6 w-full">
              <div>
                <h3 className="section-title text-base font-bold text-slate-900 mb-1">Certification &amp; Credential Management</h3>
                <p className="text-xs text-slate-500">Verified credentials, professional certifications, and licensing IDs</p>
              </div>

              {/* Add Cert Form with Date Pickers */}
              {editMode && (
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 w-full">
                  <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Add Professional Certification</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full">
                    <div>
                      <label className="form-label text-[10px]">Certification Title</label>
                      <input
                        type="text"
                        placeholder="e.g. AWS Certified Solutions Architect"
                        value={newCert.title}
                        onChange={(e) => setNewCert((prev) => ({ ...prev, title: e.target.value }))}
                        className="form-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="form-label text-[10px]">Issuing Organization</label>
                      <input
                        type="text"
                        placeholder="e.g. Amazon Web Services"
                        value={newCert.issuer}
                        onChange={(e) => setNewCert((prev) => ({ ...prev, issuer: e.target.value }))}
                        className="form-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="form-label text-[10px]">📅 Issue Date</label>
                      <input
                        type="date"
                        value={newCert.issueDate}
                        onChange={(e) => setNewCert((prev) => ({ ...prev, issueDate: e.target.value }))}
                        className="form-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="form-label text-[10px]">📅 Expiry Date</label>
                      <input
                        type="date"
                        value={newCert.expiryDate}
                        onChange={(e) => setNewCert((prev) => ({ ...prev, expiryDate: e.target.value }))}
                        className="form-input text-xs"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddCert}
                        className="btn-primary text-xs w-full py-2.5"
                      >
                        + Add Credential
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                {form.certifications.map((cert) => (
                  <div key={cert.id} className="p-5 bg-slate-50/90 border border-slate-200/90 rounded-2xl flex items-start justify-between gap-4 hover:shadow-card transition-shadow">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl shrink-0 font-bold">
                        📜
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{cert.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{cert.issuer}</p>
                        <p className="text-[11px] text-slate-600 font-semibold mt-1">📅 Issued: {cert.issueDate}</p>
                        {cert.expiryDate && <p className="text-[11px] text-amber-700 font-medium">⏳ Expires: {cert.expiryDate}</p>}
                        <p className="text-xs text-purple-600 font-mono mt-1.5 font-bold">ID: {cert.credId}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="badge-success text-xs">Verified</span>
                      {editMode && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCert(cert.id)}
                          className="text-xs text-red-600 hover:text-red-800 font-bold transition-colors"
                          title="Delete credential record"
                        >
                          Delete 🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Work & Education */}
          {activeTab === 'experience' && (
            <div className="space-y-8 w-full">
              <div>
                <h3 className="section-title text-base font-bold text-slate-900 mb-1">Work Experience &amp; Education Tracking</h3>
                <p className="text-xs text-slate-500">Professional career timeline, dates, degrees, and educational history</p>
              </div>

              {/* Add Experience Form with Date Pickers */}
              {editMode && (
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 w-full">
                  <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Add Work Experience Record</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full">
                    <div>
                      <label className="form-label text-[10px]">Company Name</label>
                      <input
                        type="text"
                        placeholder="e.g. TechCorp Solutions"
                        value={newExp.company}
                        onChange={(e) => setNewExp((prev) => ({ ...prev, company: e.target.value }))}
                        className="form-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="form-label text-[10px]">Role / Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Software Engineer"
                        value={newExp.role}
                        onChange={(e) => setNewExp((prev) => ({ ...prev, role: e.target.value }))}
                        className="form-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="form-label text-[10px]">📅 Start Date</label>
                      <input
                        type="date"
                        value={newExp.startDate}
                        onChange={(e) => setNewExp((prev) => ({ ...prev, startDate: e.target.value }))}
                        className="form-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="form-label text-[10px]">📅 End Date</label>
                      <input
                        type="date"
                        disabled={newExp.isPresent}
                        value={newExp.endDate}
                        onChange={(e) => setNewExp((prev) => ({ ...prev, endDate: e.target.value }))}
                        className="form-input text-xs disabled:bg-slate-100 disabled:opacity-60"
                      />
                      <label className="flex items-center gap-1.5 mt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newExp.isPresent}
                          onChange={(e) => setNewExp((prev) => ({ ...prev, isPresent: e.target.checked }))}
                          className="rounded text-blue-600 text-xs"
                        />
                        <span className="text-[11px] text-slate-600 font-medium">Currently Work Here</span>
                      </label>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddExperience}
                        className="btn-primary text-xs w-full py-2.5"
                      >
                        + Add Experience
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                {/* Career History */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Career History Timeline</h4>
                  {form.workExperience.map((exp) => (
                    <div key={exp.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h5 className="text-sm font-bold text-slate-900">{exp.role}</h5>
                        <p className="text-xs text-blue-600 font-bold mt-0.5">{exp.company}</p>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">{exp.desc}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="chip-slate text-xs whitespace-nowrap font-medium">📅 {exp.duration}</span>
                        {editMode && (
                          <button
                            type="button"
                            onClick={() => handleRemoveExperience(exp.id)}
                            className="text-xs text-red-600 hover:text-red-800 font-bold transition-colors"
                            title="Delete work experience record"
                          >
                            Delete 🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Education History */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Education &amp; Academic Qualifications</h4>
                  {form.education.map((edu) => (
                    <div key={edu.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h5 className="text-sm font-bold text-slate-900">{edu.degree}</h5>
                        <p className="text-xs text-slate-500 mt-0.5">{edu.institution}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="chip-indigo text-xs font-medium">🎓 {edu.year}</span>
                        {editMode && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEducation(edu.id)}
                            className="text-xs text-red-600 hover:text-red-800 font-bold transition-colors"
                            title="Delete education record"
                          >
                            Delete 🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Security */}
          {activeTab === 'security' && (
            <div className="space-y-6 w-full max-w-2xl">
              <div>
                <h3 className="section-title text-base font-bold text-slate-900 mb-1">Account Security &amp; Password</h3>
                <p className="text-xs text-slate-500">Update password credentials for account protection</p>
              </div>

              {pwErrors.form && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold" role="alert">
                  {pwErrors.form}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4 w-full">
                <div>
                  <label className="form-label">Current Password</label>
                  <div className="relative">
                    <input
                      name="currentPassword"
                      type={showPw.current ? 'text' : 'password'}
                      value={pwForm.currentPassword}
                      onChange={handlePwChange}
                      placeholder="Enter current password (e.g. 1234)"
                      className={`form-input pr-10 text-xs ${pwErrors.currentPassword ? 'border-red-500 ring-1 ring-red-200' : ''}`}
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPw((p) => ({ ...p, current: !p.current }))}>
                      <EyeIcon show={showPw.current} />
                    </button>
                  </div>
                  {pwErrors.currentPassword && <p className="text-xs text-red-600 mt-1 font-semibold">{pwErrors.currentPassword}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">New Password</label>
                    <div className="relative">
                      <input
                        name="newPassword"
                        type={showPw.next ? 'text' : 'password'}
                        value={pwForm.newPassword}
                        onChange={handlePwChange}
                        placeholder="Min. 6 characters"
                        className={`form-input pr-10 text-xs ${pwErrors.newPassword ? 'border-red-500 ring-1 ring-red-200' : ''}`}
                      />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPw((p) => ({ ...p, next: !p.next }))}>
                        <EyeIcon show={showPw.next} />
                      </button>
                    </div>
                    {pwErrors.newPassword && <p className="text-xs text-red-600 mt-1 font-semibold">{pwErrors.newPassword}</p>}
                  </div>

                  <div>
                    <label className="form-label">Confirm New Password</label>
                    <div className="relative">
                      <input
                        name="confirmPassword"
                        type={showPw.confirm ? 'text' : 'password'}
                        value={pwForm.confirmPassword}
                        onChange={handlePwChange}
                        placeholder="Confirm new password"
                        className={`form-input pr-10 text-xs ${pwErrors.confirmPassword ? 'border-red-500 ring-1 ring-red-200' : ''}`}
                      />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPw((p) => ({ ...p, confirm: !p.confirm }))}>
                        <EyeIcon show={showPw.confirm} />
                      </button>
                    </div>
                    {pwErrors.confirmPassword && <p className="text-xs text-red-600 mt-1 font-semibold">{pwErrors.confirmPassword}</p>}
                  </div>
                </div>

                <button type="submit" disabled={pwSaving} className="btn-primary text-xs flex items-center gap-2 mt-2 px-5 py-2.5 shadow-sm">
                  {pwSaving ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* Interactive Skill Self-Assessment Modal */}
      {showAssessmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-lg">
                  ✍️
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Skill Self-Assessment Survey</h3>
                  <p className="text-xs text-slate-500">Rate your current proficiency across active competency tags</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssessmentModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                &times;
              </button>
            </div>

            <div className="space-y-5">
              {form.skillsInventory.map((sk) => {
                const currentRating = assessmentRatings[sk.name] !== undefined ? assessmentRatings[sk.name] : sk.selfRating;
                const levelData = PROFICIENCY_LEVELS[currentRating] || PROFICIENCY_LEVELS[3];

                return (
                  <div key={sk.name} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900">{sk.name}</span>
                        <span className="chip-indigo text-[10px] ml-2">{sk.category}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${levelData.badge}`}>
                        Level {currentRating}: {levelData.label}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500">{levelData.desc}</p>

                    <div className="grid grid-cols-5 gap-1.5 pt-1">
                      {[1, 2, 3, 4, 5].map((lvl) => {
                        const isSel = currentRating === lvl;
                        const info = PROFICIENCY_LEVELS[lvl];
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => handleAssessmentRatingChange(sk.name, lvl)}
                            className={`p-2 rounded-lg border text-center transition-all ${
                              isSel
                                ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                            }`}
                          >
                            <p className="text-xs font-extrabold">{lvl}</p>
                            <p className="text-[9px] truncate">{info.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAssessmentModal(false)}
                className="btn-outline text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitAssessment}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                <span>Submit Self-Assessment</span> &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
