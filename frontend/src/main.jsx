import React from 'react';
import { createRoot } from 'react-dom/client';
import { CalendarDays, Sparkles, Users, Upload, Bookmark, Pencil, Trash2, Eye, UserCheck, Search } from 'lucide-react';
import './styles.css';
import StudentPage from './StudentPage';
import AdminPage from './AdminPage';
import { fetchOrganizerEvents, generateAiEventDraft, login, register, createEvent, updateEvent, deleteEvent, closeRegistrations, fetchAttendees, uploadPoster, fetchCampuses, fetchFaculties, forgotPassword, resetPassword } from './api';

function App() {
  const [currentUser, setCurrentUser] = React.useState(null);
  const [token, setToken] = React.useState('');
  const [authMode, setAuthMode] = React.useState('login');
  const [authForm, setAuthForm] = React.useState({ fullName: '', email: '', password: '', studentNumber: '', role: 'STUDENT' });
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [loadingAction, setLoadingAction] = React.useState(false);
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);
  const [forgotEmail, setForgotEmail] = React.useState('');
  const [resetSent, setResetSent] = React.useState(false);
  const [resetToken, setResetToken] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [passwordResetStep, setPasswordResetStep] = React.useState('email'); // 'email' | 'reset' | 'done'

  React.useEffect(() => {
    const session = window.localStorage.getItem('tut-event-session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setCurrentUser(parsed.user);
        setToken(parsed.token);
      } catch {
        window.localStorage.removeItem('tut-event-session');
      }
    }
  }, []);

  function saveSession(userData, jwtToken) {
    setCurrentUser(userData);
    setToken(jwtToken);
    window.localStorage.setItem('tut-event-session', JSON.stringify({ user: userData, token: jwtToken }));
  }

  function clearSession() {
    setCurrentUser(null);
    setToken('');
    window.localStorage.removeItem('tut-event-session');
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setLoadingAction(true);
    setError('');
    setMessage('');

    try {
      if (authMode === 'login') {
        const response = await login(authForm.email, authForm.password);
        saveSession({ id: response.id, fullName: response.fullName, email: response.email, role: response.role }, response.token);
        setMessage(`Welcome back, ${response.fullName}`);
      } else {
        const response = await register(authForm);
        saveSession({ id: response.id, fullName: response.fullName, email: response.email, role: response.role }, response.token);
        setMessage(`Registration complete, welcome ${response.fullName}`);
      }
      setAuthForm((prev) => ({ ...prev, password: '' }));
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleForgotPassword() {
    if (!forgotEmail) { setError('Please enter your email address'); return; }
    setLoadingAction(true); setError(''); setMessage('');
    try {
      const res = await forgotPassword(forgotEmail);
      // Extract the reset token from URL or response
      const tokenMatch = res.message?.match(/token=([a-f0-9-]+)/i);
      if (tokenMatch) {
        setResetToken(tokenMatch[1]);
        setPasswordResetStep('reset');
        setMessage('');
      } else {
        setResetSent(true);
        setMessage(res.message || 'Password reset link has been sent to your email');
      }
    } catch (err) {
      setError(err.message || 'Could not process request');
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleResetPassword() {
    if (!newPassword || newPassword.length < 4) { setError('Password must be at least 4 characters'); return; }
    setLoadingAction(true); setError(''); setMessage('');
    try {
      const res = await resetPassword(resetToken, newPassword);
      setPasswordResetStep('done');
      setMessage('Password has been reset successfully!');
      setNewPassword('');
      setForgotEmail('');
    } catch (err) {
      setError(err.message || 'Could not reset password');
    } finally {
      setLoadingAction(false);
    }
  }

  function handleAuthInput(field, value) {
    setAuthForm((prev) => ({ ...prev, [field]: value }));
  }

  if (!currentUser) {
    return <LandingPage authMode={authMode} authForm={authForm} onAuthModeChange={setAuthMode} onAuthInputChange={handleAuthInput} onAuthSubmit={handleAuthSubmit} loading={loadingAction} message={message} error={error}
      showForgotPassword={showForgotPassword} setShowForgotPassword={setShowForgotPassword}
      forgotEmail={forgotEmail} setForgotEmail={setForgotEmail} resetSent={resetSent} onForgotPassword={handleForgotPassword}
      passwordResetStep={passwordResetStep} setPasswordResetStep={setPasswordResetStep}
      newPassword={newPassword} setNewPassword={setNewPassword} onResetPassword={handleResetPassword} />;
  }

  if (currentUser.role === 'STUDENT') {
    return <StudentPage currentUser={currentUser} token={token} onSignOut={clearSession} />;
  }

  if (currentUser.role === 'ADMIN') {
    return <AdminPage currentUser={currentUser} token={token} onSignOut={clearSession} />;
  }

  return <OrganizerPage currentUser={currentUser} token={token} onSignOut={clearSession} />;
}

function LandingPage({ authMode, authForm, onAuthModeChange, onAuthInputChange, onAuthSubmit, loading, message, error,
  showForgotPassword, setShowForgotPassword, forgotEmail, setForgotEmail, resetSent, onForgotPassword,
  passwordResetStep, setPasswordResetStep, newPassword, setNewPassword, onResetPassword }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,_rgba(0,93,170,0.12),_transparent_50%),radial-gradient(circle_at_100%_100%,_rgba(242,183,5,0.08),_transparent_50%),linear-gradient(135deg,_#f8fafc_0%,_#eef4fb_100%)]">
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-tut to-[#1f77c9] text-white shadow-md shadow-tut/20">
              <CalendarDays size={22} />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-ink">TUT Event Handler</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">Official campus event platform</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden font-semibold text-muted sm:block">Welcome to TUT</span>
          </div>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-7xl items-center px-5 py-10 lg:px-8">
        <div className="grid w-full gap-12 lg:grid-cols-5">
          <div className="space-y-8 lg:col-span-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-tut/15 bg-tut/5 px-4 py-1.5 text-xs font-bold text-tut">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-tut" />
              TUT Campus Events Platform
            </div>
            <div>
              <h1 className="text-5xl font-bold leading-[1.08] tracking-tight text-ink md:text-7xl">
                Discover <span className="text-tut">campus events</span>
                <br />
                that matter to you
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
                Browse, register, and stay connected with everything happening across TUT campuses. 
                Organizers can create polished events with AI-powered drafts in seconds.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(21,22,26,0.04)] transition-all hover:-translate-y-0.5 hover:border-tut/20 hover:shadow-lg">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-tut to-[#1f77c9] text-white shadow-sm"><Users size={20} /></div>
                <p className="text-base font-bold text-ink">For Students</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">Browse all campus events, save favourites, and register in one click. Get reminded before events start.</p>
              </div>
              <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(21,22,26,0.04)] transition-all hover:-translate-y-0.5 hover:border-leaf/20 hover:shadow-lg">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-leaf to-[#2ba178] text-white shadow-sm"><Sparkles size={20} /></div>
                <p className="text-base font-bold text-ink">For Organizers</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">Create AI-assisted event drafts, manage registrations, track attendance with QR codes, and get real-time analytics.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-muted">
              <span className="inline-flex items-center gap-2 font-semibold"><svg className="text-leaf" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>AI event creation</span>
              <span className="inline-flex items-center gap-2 font-semibold"><svg className="text-leaf" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>QR check-in</span>
              <span className="inline-flex items-center gap-2 font-semibold"><svg className="text-leaf" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Real-time analytics</span>
              <span className="inline-flex items-center gap-2 font-semibold"><svg className="text-leaf" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Multi-campus</span>
            </div>
          </div>

          <div className="flex items-start justify-center pt-4 lg:col-span-2">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_rgba(21,22,26,0.08)]">
              {showForgotPassword ? (
                <>
                  <div className="mb-6 text-center">
                    <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-gold to-[#d4a104] text-white shadow-lg shadow-gold/20">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-ink">
                      {passwordResetStep === 'done' ? 'Password reset' : passwordResetStep === 'reset' ? 'Enter new password' : 'Reset password'}
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      {passwordResetStep === 'done' ? 'Your password has been updated' : passwordResetStep === 'reset' ? 'Choose a new password for your account' : 'Enter your email to get started'}
                    </p>
                  </div>
                  {error && <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}
                  {message && <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-leaf/20 bg-leaf/5 px-4 py-3 text-sm text-leaf"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>{message}</div>}
                  {passwordResetStep === 'done' ? (
                    <div className="text-center">
                      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-leaf/10 text-leaf">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      </div>
                      <p className="text-sm text-muted">Your password has been reset successfully. You can now log in with your new password.</p>
                      <button onClick={() => { setShowForgotPassword(false); setPasswordResetStep('email'); setResetSent(false); setMessage(''); }} className="mt-4 w-full rounded-xl bg-tut py-3 text-sm font-bold text-white">Back to login</button>
                    </div>
                  ) : passwordResetStep === 'reset' ? (
                    <div className="space-y-3.5">
                      <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">New password</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-tut/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,93,170,0.08)]" /></div>
                      <button onClick={onResetPassword} disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-leaf to-[#2ba178] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-leaf/20 transition-all hover:-translate-y-0.5 disabled:opacity-50">
                        {loading ? <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" fill="currentColor" className="opacity-75"/></svg> : null}
                        Reset password
                      </button>
                      <button onClick={() => { setPasswordResetStep('email'); setResetToken(''); setNewPassword(''); setMessage(''); }} className="w-full text-center text-sm font-bold text-muted hover:text-tut">Back</button>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">Email</label><input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@tut.ac.za" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-tut/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,93,170,0.08)]" /></div>
                      <button onClick={onForgotPassword} disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-[#d4a104] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-gold/20 transition-all hover:-translate-y-0.5 disabled:opacity-50">
                        {loading ? <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" fill="currentColor" className="opacity-75"/></svg> : null}
                        Send reset link
                      </button>
                      <button onClick={() => { setShowForgotPassword(false); setPasswordResetStep('email'); setResetSent(false); }} className="w-full text-center text-sm font-bold text-muted hover:text-tut">Back to login</button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="mb-6 text-center">
                    <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-tut to-[#1f77c9] text-white shadow-lg shadow-tut/20"><CalendarDays size={24} /></div>
                    <h2 className="text-2xl font-bold text-ink">{authMode === 'login' ? 'Welcome back' : 'Create account'}</h2>
                    <p className="mt-1 text-sm text-muted">{authMode === 'login' ? 'Sign in to your account' : 'Join the TUT event community'}</p>
                  </div>
                  {error && <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}
                  {message && <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-leaf/20 bg-leaf/5 px-4 py-3 text-sm text-leaf"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>{message}</div>}
                  <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-1">
                    <button type="button" onClick={() => onAuthModeChange('login')} className={`rounded-lg px-3 py-2 text-sm font-bold transition-all ${authMode === 'login' ? 'bg-white text-tut shadow-sm' : 'text-slate-500 hover:text-tut'}`}>Login</button>
                    <button type="button" onClick={() => onAuthModeChange('register')} className={`rounded-lg px-3 py-2 text-sm font-bold transition-all ${authMode === 'register' ? 'bg-white text-tut shadow-sm' : 'text-slate-500 hover:text-tut'}`}>Register</button>
                  </div>
                  <form onSubmit={onAuthSubmit} className="space-y-3.5">
                    {authMode === 'register' && (
                      <>
                        <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">Full name</label><input type="text" value={authForm.fullName} onChange={(e) => onAuthInputChange('fullName', e.target.value)} placeholder="e.g. Thabo Mokoena" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-tut/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,93,170,0.08)]" /></div>
                        <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">Student number</label><input type="text" value={authForm.studentNumber} onChange={(e) => onAuthInputChange('studentNumber', e.target.value)} placeholder="e.g. 224567890" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-tut/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,93,170,0.08)]" /></div>
                        <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">Role</label>
                          <select value={authForm.role} onChange={(e) => onAuthInputChange('role', e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-tut/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,93,170,0.08)]">
                            <option value="STUDENT">🎓 Student</option>
                            <option value="ORGANIZER">📋 Event Organizer</option>
                          </select>
                        </div>
                      </>
                    )}
                    <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">Email</label><input type="email" value={authForm.email} onChange={(e) => onAuthInputChange('email', e.target.value)} placeholder="you@tut.ac.za" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-tut/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,93,170,0.08)]" /></div>
                    <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">Password</label><input type="password" value={authForm.password} onChange={(e) => onAuthInputChange('password', e.target.value)} placeholder="••••••••" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-tut/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,93,170,0.08)]" /></div>
                    <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-tut to-[#1f77c9] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-tut/20 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 active:translate-y-0">
                      {loading ? (<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" fill="currentColor" className="opacity-75"/></svg>) : null}
                      {authMode === 'login' ? 'Sign in' : 'Create account'}
                    </button>
                    {authMode === 'login' && (
                      <button type="button" onClick={() => setShowForgotPassword(true)} className="w-full text-center text-sm font-bold text-muted hover:text-tut">
                        Forgot password?
                      </button>
                    )}
                  </form>
                  <p className="mt-6 text-center text-xs text-muted">By continuing, you agree to the TUT Event Handler terms of service.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function OrganizerPage({ currentUser, token, onSignOut }) {
  const [aiPrompt, setAiPrompt] = React.useState('Create a workshop for Computer Science students at Soshanguve Campus on 15 August from 10am until 2pm. The workshop teaches Spring Boot and React. Maximum 120 students.');
  const [draft, setDraft] = React.useState(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [availableCampuses, setAvailableCampuses] = React.useState([]);
  const [availableFaculties, setAvailableFaculties] = React.useState([]);
  const [selectedCampusId, setSelectedCampusId] = React.useState(null);
  const [selectedFacultyId, setSelectedFacultyId] = React.useState(null);
  const [posterFile, setPosterFile] = React.useState(null);
  const [posterUploadUrl, setPosterUploadUrl] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [loadingAction, setLoadingAction] = React.useState(false);
  const [organizerEvents, setOrganizerEvents] = React.useState([]);
  const [selectedOrganizerEvent, setSelectedOrganizerEvent] = React.useState(null);
  const [attendees, setAttendees] = React.useState([]);
  const [showManagePanel, setShowManagePanel] = React.useState(false);
  const [editEvent, setEditEvent] = React.useState(null);
  const [editForm, setEditForm] = React.useState({ title: '', description: '', venue: '', eventDate: '', startTime: '', endTime: '', maximumAttendees: '', category: 'WORKSHOP' });
  const [eventForm, setEventForm] = React.useState({ venue: 'Main Auditorium', eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), startTime: '10:00', endTime: '14:00', maximumAttendees: 120 });
  const [organizerSearchQuery, setOrganizerSearchQuery] = React.useState('');

  const filteredOrganizerEvents = organizerEvents.filter((event) => {
    if (!organizerSearchQuery) return true;
    const text = `${event.title} ${event.campus} ${event.faculty} ${event.category} ${event.status}`.toLowerCase();
    return text.includes(organizerSearchQuery.toLowerCase());
  });

  React.useEffect(() => {
    let cancelled = false;
    fetchCampuses().then((d) => { if (!cancelled) { setAvailableCampuses(d.map((c) => ({ id: c.id, name: c.name }))); setSelectedCampusId(d[0]?.id ?? null); } }).catch(() => { if (!cancelled) setAvailableCampuses([]); });
    fetchFaculties().then((d) => { if (!cancelled) { setAvailableFaculties(d.map((f) => ({ id: f.id, name: f.name }))); setSelectedFacultyId(d[0]?.id ?? null); } }).catch(() => { if (!cancelled) setAvailableFaculties([]); });
    if (currentUser?.id) {
      fetchOrganizerEvents(currentUser.id, token).then((e) => { if (!cancelled) setOrganizerEvents(e); }).catch(() => { if (!cancelled) setOrganizerEvents([]); });
    }
    return () => { cancelled = true; };
  }, [currentUser?.id, token]);

  async function generateDraft() {
    setError(''); setIsGenerating(true);
    try { setDraft(await generateAiEventDraft(aiPrompt)); }
    catch (err) {
      setError('AI draft generation failed, using fallback.');
      setDraft({ title: 'Spring Boot and React Workshop', category: 'Workshop', summary: 'A practical full-stack development workshop.', audience: 'Computer Science students', objectives: ['Build REST APIs with Spring Boot', 'Create responsive React interfaces'], bring: 'Laptop, charger, student card', duration: '4 hours', tags: ['Spring Boot', 'React', 'Full-stack'] });
    } finally { setIsGenerating(false); }
  }

  async function handlePosterUpload() {
    if (!posterFile || !token) { setError('Choose a poster image.'); return; }
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(posterFile.type)) { setError('Only PNG, JPEG, and WebP images are allowed.'); return; }
    if (posterFile.size > 5 * 1024 * 1024) { setError('Poster image must be under 5MB.'); return; }
    setLoadingAction(true); setError('');
    try { const r = await uploadPoster(posterFile, token); setPosterUploadUrl(r.url); setMessage('Poster uploaded successfully.'); } catch (err) { setError(err.message || 'Poster upload failed'); } finally { setLoadingAction(false); }
  }

  async function handleCreateEventFromDraft() {
    if (!draft) { setError('Generate a draft first.'); return; }
    setLoadingAction(true); setError('');
    try {
      const payload = {
        title: draft.title, description: draft.summary || draft.description, campusId: selectedCampusId, facultyId: selectedFacultyId, organizerId: currentUser.id,
        venue: eventForm.venue, eventDate: eventForm.eventDate, startTime: eventForm.startTime, endTime: eventForm.endTime,
        category: normalizeCategory(draft.category || draft.suggestedCategory || 'WORKSHOP'), maximumAttendees: Number(eventForm.maximumAttendees) || 120,
        posterUrl: posterUploadUrl || '', registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        tags: Array.isArray(draft.tags) ? draft.tags.join(', ') : draft.tags || '', targetAudience: draft.audience || draft.targetAudience,
        shortSummary: draft.summary || draft.shortSummary, objectives: Array.isArray(draft.objectives) ? draft.objectives.join('; ') : draft.objectives || '',
        attendeeRequirements: draft.bring || draft.attendeeRequirements, searchKeywords: Array.isArray(draft.tags) ? draft.tags.join(', ') : draft.tags || ''
      };
      const newEvent = await createEvent(payload, token);
      setMessage('Event is now live and visible to students.');
      setDraft(null); setPosterFile(null); setPosterUploadUrl(''); setAiPrompt('');
      setOrganizerEvents((prev) => [{ id: prev.length > 0 ? Math.max(...prev.map((e) => e.id)) + 1 : newEvent?.id || Date.now(), title: payload.title, campus: availableCampuses.find((c) => c.id === selectedCampusId)?.name || 'Campus', faculty: availableFaculties.find((f) => f.id === selectedFacultyId)?.name || 'Faculty', category: payload.category, date: payload.eventDate, time: `${payload.startTime} - ${payload.endTime}`, registrations: 0, status: 'PUBLISHED' }, ...prev]);
      setOrganizerEvents((prev) => prev.map((e) => e.id === 0 ? { ...e, id: newEvent?.id || Date.now() + Math.random() } : e));
    } catch (err) { setError(err.message || 'Event submission failed'); } finally { setLoadingAction(false); }
  }

  async function handleManageEvent(event) { setSelectedOrganizerEvent(event); setShowManagePanel(true); setError(''); setMessage(''); try { setAttendees(await fetchAttendees(event.id, token)); } catch { setAttendees([]); setError('Could not load attendees'); } }
  async function handleCloseRegistrations(eventId) { if (!window.confirm('Are you sure you want to close registrations?')) return; setLoadingAction(true); setError(''); try { const u = await closeRegistrations(eventId, token); setOrganizerEvents((prev) => prev.map((i) => i.id === eventId ? { ...i, status: u.status || 'REGISTRATION_CLOSED' } : i)); setMessage('Registrations closed.'); } catch (err) { setError(err.message || 'Could not close registrations'); } finally { setLoadingAction(false); } }
  async function handleDeleteEvent(event) { if (!window.confirm(`Are you sure you want to delete "${event.title}"?`)) return; setLoadingAction(true); setError(''); try { await deleteEvent(event.id, token); setOrganizerEvents((prev) => prev.filter((i) => i.id !== event.id)); setMessage('Event removed.'); } catch (err) { setError(err.message || 'Could not delete event'); } finally { setLoadingAction(false); } }

  function openEditEvent(event) {
    const [st, et] = (event.time || '').split(' - ');
    const mc = availableCampuses.find((c) => c.name === event.campus);
    const mf = availableFaculties.find((f) => f.name === event.faculty);
    if (mc) setSelectedCampusId(mc.id); if (mf) setSelectedFacultyId(mf.id);
    setEditEvent(event);
    setEditForm({ title: event.title || '', description: event.description || '', venue: event.venue || '', eventDate: event.date || '', startTime: st || eventForm.startTime, endTime: et || eventForm.endTime, maximumAttendees: event.maxAttendees || eventForm.maximumAttendees, category: normalizeCategory(event.category || 'WORKSHOP') });
  }

  async function handleQuickEdit() {
    if (!editEvent) return; setLoadingAction(true); setError('');
    try {
      const payload = { title: editForm.title, description: editForm.description || editForm.title, campusId: selectedCampusId || availableCampuses[0]?.id || null, facultyId: selectedFacultyId || availableFaculties[0]?.id || null, organizerId: currentUser.id, venue: editForm.venue, eventDate: editForm.eventDate, startTime: editForm.startTime, endTime: editForm.endTime, category: normalizeCategory(editForm.category || 'WORKSHOP'), maximumAttendees: Number(editForm.maximumAttendees) || 120, posterUrl: posterUploadUrl || '', registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), tags: editEvent.tags || '', targetAudience: editEvent.targetAudience || 'TUT students', shortSummary: editForm.description || editForm.title, objectives: editEvent.objectives || '', attendeeRequirements: editEvent.attendeeRequirements || '', searchKeywords: editForm.title };
      await updateEvent(editEvent.id, payload, token);
      setOrganizerEvents((prev) => prev.map((i) => i.id === editEvent.id ? { ...i, title: payload.title, description: payload.description, venue: payload.venue, date: payload.eventDate, time: `${payload.startTime} - ${payload.endTime}`, category: payload.category, maxAttendees: payload.maximumAttendees } : i));
      setMessage('Event updated successfully.'); setEditEvent(null);
    } catch (err) { setError(err.message || 'Could not update event'); } finally { setLoadingAction(false); }
  }

  function normalizeCategory(value) {
    if (!value) return 'WORKSHOP';
    const n = String(value).trim().toUpperCase().replace(/\s+/g, '_');
    return ['CAREER_FAIR','SPORTS','CULTURAL','ACADEMIC','HACKATHON','WORKSHOP','SEMINAR','CONFERENCE','STUDENT_SOCIETY','COMMUNITY_OUTREACH','ENTERTAINMENT','ORIENTATION'].includes(n) ? n : 'WORKSHOP';
  }

  function categoryAccent(c) { const a = { CAREER_FAIR: 'bg-gold/20 text-[#7b5a00] border-gold/30', SPORTS: 'bg-leaf/15 text-leaf border-leaf/25', CULTURAL: 'bg-coral/15 text-coral border-coral/25', ACADEMIC: 'bg-tut/10 text-tut border-tut/20', HACKATHON: 'bg-ink/10 text-ink border-ink/15', WORKSHOP: 'bg-tut/10 text-tut border-tut/20', SEMINAR: 'bg-leaf/15 text-leaf border-leaf/25', CONFERENCE: 'bg-gold/20 text-[#7b5a00] border-gold/30', STUDENT_SOCIETY: 'bg-coral/15 text-coral border-coral/25', COMMUNITY_OUTREACH: 'bg-leaf/15 text-leaf border-leaf/25', ENTERTAINMENT: 'bg-coral/15 text-coral border-coral/25', ORIENTATION: 'bg-gold/20 text-[#7b5a00] border-gold/30' }; return a[normalizeCategory(c)] || a.WORKSHOP; }
  function statusAccent(s) { const n = String(s || 'DRAFT').toUpperCase(); if (n.includes('CLOSED')) return 'bg-coral/15 text-coral border-coral/25'; if (n.includes('PENDING')) return 'bg-gold/20 text-[#7b5a00] border-gold/30'; if (n.includes('DRAFT')) return 'bg-slate-100 text-slate-600 border-slate-200'; return 'bg-leaf/15 text-leaf border-leaf/25'; }

  const organizerStats = [
    { label: 'Published', value: organizerEvents.filter((e) => String(e.status || '').includes('PUBLISHED')).length, tone: 'bg-leaf/15 text-leaf border-leaf/25' },
    { label: 'Registrations', value: organizerEvents.reduce((t, e) => t + Number(e.registrations || 0), 0), tone: 'bg-tut/10 text-tut border-tut/20' },
    { label: 'Events', value: organizerEvents.length, tone: 'bg-gold/20 text-[#7b5a00] border-gold/30' }
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,_rgba(0,93,170,0.18),_transparent_32%),radial-gradient(circle_at_85%_8%,_rgba(242,183,5,0.20),_transparent_28%),linear-gradient(135deg,_#f8fafc_0%,_#eef4fb_100%)]">
      <section className="border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-8">
          <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-tut via-[#1f77c9] to-leaf text-white shadow-lg shadow-tut/20"><CalendarDays size={24} /></div><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-tut">TUT Event Handler</p><p className="text-sm text-muted">Organizer Dashboard</p></div></div>
          <div className="flex items-center gap-3"><div className="rounded-2xl border border-tut/10 bg-white px-3 py-2 text-right shadow-sm"><p className="text-sm font-bold">{currentUser.fullName}</p><p className="text-xs text-muted">{currentUser.role}</p></div><button onClick={onSignOut} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-tut hover:text-tut">Sign out</button></div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
        <div className="mb-6 grid gap-3 md:grid-cols-3">{organizerStats.map((item) => (<div key={item.label} className={`rounded-[22px] border p-4 shadow-[0_12px_34px_rgba(21,22,26,0.05)] ${item.tone}`}><p className="text-3xl font-bold">{item.value}</p><p className="text-sm font-semibold uppercase tracking-[0.12em]">{item.label}</p></div>))}</div>
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-tut/10 bg-white/95 p-6 shadow-[0_20px_60px_rgba(21,22,26,0.08)] backdrop-blur">
            <div className="mb-6 flex items-start justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-tut">Organizer workspace</p><h2 className="mt-1 text-2xl font-bold text-slate-900">Create a polished campus event</h2></div><div className="rounded-full border border-leaf/25 bg-leaf/10 px-3 py-2 text-sm font-bold text-leaf">Live instantly</div></div>
            {isGenerating && <div className="mb-4 rounded-2xl border border-leaf/20 bg-leaf/10 px-4 py-3 text-sm text-leaf">Generating your draft...</div>}
            {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
            {message && <div className="mb-4 rounded-2xl border border-leaf/20 bg-leaf/10 px-4 py-3 text-sm text-leaf">{message}</div>}
            <div className="space-y-4">
              <div><label className="mb-2 block text-sm font-medium text-muted">Event description</label><textarea className="h-32 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-tut focus:bg-white" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Describe the event you want to create. Include date, time, campus, audience, and topic." /></div>
              <button onClick={generateDraft} disabled={isGenerating} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-leaf to-[#2ba178] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-leaf/20 transition hover:-translate-y-0.5 disabled:opacity-50"><Sparkles size={17} />{isGenerating ? 'Generating...' : 'Generate draft'}</button>
              {draft && (
                <div className="rounded-[24px] border border-leaf/30 bg-gradient-to-br from-[#f8fcf9] via-white to-tut/5 p-5 shadow-inner">
                  <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-[0.14em] text-leaf">AI draft preview</p><h3 className="text-2xl font-bold text-slate-900">{draft.title}</h3></div></div>
                  <p className="text-sm text-muted">{draft.summary}</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3"><Info label="Category" value={draft.category} /><Info label="Audience" value={draft.audience} /><Info label="Duration" value={draft.duration} /></div>
                  <div className="mt-4 flex flex-wrap gap-2">{draft.tags && draft.tags.map((tag) => <span key={tag} className="rounded-full border border-leaf/20 bg-leaf/10 px-2.5 py-1 text-xs font-bold text-leaf">{tag}</span>)}</div>
                </div>
              )}
              {draft && (
                <div className="rounded-[24px] border border-tut/10 bg-gradient-to-b from-slate-50 to-white p-5">
                  <h3 className="mb-4 text-lg font-bold text-slate-900">Publish your event</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block text-sm font-medium text-muted">Campus<select className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-tut" value={selectedCampusId ?? ''} onChange={(e) => setSelectedCampusId(e.target.value ? Number(e.target.value) : null)}><option value="">Select campus</option>{availableCampuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                    <label className="block text-sm font-medium text-muted">Faculty<select className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-tut" value={selectedFacultyId ?? ''} onChange={(e) => setSelectedFacultyId(e.target.value ? Number(e.target.value) : null)}><option value="">Select faculty</option>{availableFaculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
                    <label className="block text-sm font-medium text-muted">Venue<input value={eventForm.venue} onChange={(e) => setEventForm((prev) => ({ ...prev, venue: e.target.value }))} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-tut" /></label>
                    <label className="block text-sm font-medium text-muted">Max attendees<input type="number" value={eventForm.maximumAttendees} onChange={(e) => setEventForm((prev) => ({ ...prev, maximumAttendees: e.target.value }))} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-tut" /></label>
                    <label className="block text-sm font-medium text-muted">Date<input type="date" value={eventForm.eventDate} onChange={(e) => setEventForm((prev) => ({ ...prev, eventDate: e.target.value }))} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-tut" /></label>
                    <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-medium text-muted">Start<input type="time" value={eventForm.startTime} onChange={(e) => setEventForm((prev) => ({ ...prev, startTime: e.target.value }))} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-tut" /></label><label className="block text-sm font-medium text-muted">End<input type="time" value={eventForm.endTime} onChange={(e) => setEventForm((prev) => ({ ...prev, endTime: e.target.value }))} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-tut" /></label></div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-muted">Poster image</label><input type="file" accept="image/*" onChange={(e) => setPosterFile(e.target.files?.[0] || null)} className="mt-2 w-full" />
                    {posterFile && <div className="mt-3"><img src={URL.createObjectURL(posterFile)} alt="poster preview" className="h-32 w-full rounded-2xl object-cover" /></div>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={handlePosterUpload} disabled={loadingAction || !posterFile} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold transition hover:border-tut hover:text-tut disabled:opacity-50"><Upload size={16} /> Upload poster</button>
                      <button onClick={handleCreateEventFromDraft} disabled={loadingAction} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-tut to-[#1f77c9] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-tut/20 transition hover:-translate-y-0.5 disabled:opacity-50">Publish event</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-[24px] border border-gold/30 bg-gradient-to-br from-white via-gold/10 to-white p-5 shadow-[0_16px_45px_rgba(21,22,26,0.06)] backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#7b5a00]">Your publishing flow</p>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div className="rounded-2xl border border-gold/25 bg-white/80 p-3 shadow-sm"><span className="mr-2 font-bold text-[#7b5a00]">01</span>Describe the event and generate an AI draft.</div>
                <div className="rounded-2xl border border-tut/15 bg-white/80 p-3 shadow-sm"><span className="mr-2 font-bold text-tut">02</span>Refine the details, choose campus and faculty, and upload a poster.</div>
                <div className="rounded-2xl border border-leaf/20 bg-white/80 p-3 shadow-sm"><span className="mr-2 font-bold text-leaf">03</span>Publish once and the event appears immediately for students.</div>
              </div>
            </div>
            <div className="rounded-[24px] border border-tut/10 bg-white/95 p-5 shadow-[0_16px_45px_rgba(21,22,26,0.06)] backdrop-blur">
              <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-bold text-slate-900">Your events</h3><span className="rounded-full border border-tut/20 bg-tut/10 px-2.5 py-1 text-xs font-bold text-tut">{organizerEvents.length} total</span></div>
              <label className="relative mb-3 block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} /><input className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-tut focus:bg-white" placeholder="Filter events..." value={organizerSearchQuery} onChange={(e) => setOrganizerSearchQuery(e.target.value)} /></label>
              <div className="space-y-3">
                {filteredOrganizerEvents.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-tut/20 bg-tut/5 p-4 text-sm text-muted">{organizerEvents.length === 0 ? 'No events yet.' : 'No events match your search.'}</div>
                ) : filteredOrganizerEvents.slice(0, 6).map((event) => (
                  <div key={event.id} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-tut/5 p-3 transition hover:-translate-y-0.5 hover:border-tut/30 hover:shadow-md">
                    <div className="flex items-start justify-between gap-2"><div><p className="font-semibold text-slate-900">{event.title}</p><p className="text-xs text-muted">{event.date} - {event.time}</p></div><span className={`rounded-full border px-2 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${statusAccent(event.status)}`}>{event.status}</span></div>
                    <div className="mt-2 flex flex-wrap gap-2"><span className="rounded-full border border-tut/20 bg-tut/10 px-2 py-1 text-[11px] font-bold text-tut">{event.campus}</span><span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600">{event.faculty}</span><span className={`rounded-full border px-2 py-1 text-[11px] font-bold ${categoryAccent(event.category)}`}>{event.category}</span></div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => handleManageEvent(event)} className="inline-flex items-center gap-1 rounded-full border border-tut/20 bg-tut/5 px-2 py-1 text-xs font-bold text-tut transition hover:bg-tut/10"><Eye size={12} /> Manage</button>
                      <button onClick={() => openEditEvent(event)} className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-1 text-xs font-bold text-[#7b5a00] transition hover:bg-gold/20"><Pencil size={12} /> Edit</button>
                      <button onClick={() => handleCloseRegistrations(event.id)} className="inline-flex items-center gap-1 rounded-full border border-leaf/25 bg-leaf/10 px-2 py-1 text-xs font-bold text-leaf transition hover:bg-leaf/15"><UserCheck size={12} /> Close</button>
                      <button onClick={() => handleDeleteEvent(event)} className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-700 transition hover:border-red-400"><Trash2 size={12} /> Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {editEvent && (
              <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_16px_45px_rgba(21,22,26,0.06)] backdrop-blur">
                <div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-tut">Edit event</p><h3 className="text-lg font-bold text-slate-900">{editEvent.title}</h3></div><button onClick={() => setEditEvent(null)} className="text-sm font-bold text-muted">Cancel</button></div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-sm font-medium text-muted">Title<input value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-tut" /></label>
                  <label className="block text-sm font-medium text-muted">Category<select value={editForm.category} onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-tut"><option value="WORKSHOP">Workshop</option><option value="SEMINAR">Seminar</option><option value="CAREER_FAIR">Career fair</option><option value="SPORTS">Sports</option><option value="ACADEMIC">Academic</option><option value="CULTURAL">Cultural</option></select></label>
                  <label className="block text-sm font-medium text-muted md:col-span-2">Description<textarea value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} className="mt-2 h-24 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-tut" /></label>
                  <label className="block text-sm font-medium text-muted">Venue<input value={editForm.venue} onChange={(e) => setEditForm((p) => ({ ...p, venue: e.target.value }))} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-tut" /></label>
                  <label className="block text-sm font-medium text-muted">Max attendees<input type="number" value={editForm.maximumAttendees} onChange={(e) => setEditForm((p) => ({ ...p, maximumAttendees: e.target.value }))} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-tut" /></label>
                  <label className="block text-sm font-medium text-muted">Date<input type="date" value={editForm.eventDate} onChange={(e) => setEditForm((p) => ({ ...p, eventDate: e.target.value }))} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-tut" /></label>
                  <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-medium text-muted">Start<input type="time" value={editForm.startTime} onChange={(e) => setEditForm((p) => ({ ...p, startTime: e.target.value }))} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-tut" /></label><label className="block text-sm font-medium text-muted">End<input type="time" value={editForm.endTime} onChange={(e) => setEditForm((p) => ({ ...p, endTime: e.target.value }))} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-tut" /></label></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2"><button onClick={handleQuickEdit} disabled={loadingAction} className="rounded-2xl bg-tut px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-50">Save changes</button><button onClick={() => setEditEvent(null)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">Cancel</button></div>
              </div>
            )}
            {showManagePanel && selectedOrganizerEvent && (
              <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_16px_45px_rgba(21,22,26,0.06)] backdrop-blur">
                <div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-bold text-slate-900">{selectedOrganizerEvent.title}</h3><button onClick={() => setShowManagePanel(false)} className="text-sm font-bold text-muted">Close</button></div>
                <p className="text-sm text-muted">{selectedOrganizerEvent.campus} - {selectedOrganizerEvent.faculty}</p>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">Attendees</p>
                  {attendees.length === 0 ? <p className="mt-2 text-sm text-muted">No registrations yet.</p> : (
                    <div className="mt-2 space-y-2">{attendees.map((a) => (
                      <div key={a.id} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-sm shadow-sm">
                        <div><p className="font-semibold">{a.studentName}</p><p className="text-xs text-muted">{a.studentEmail}</p></div>
                        <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${a.attended ? 'bg-leaf/10 text-leaf' : 'bg-tut/10 text-tut'}`}>{a.attended ? 'Checked in' : 'Registered'}</span>
                      </div>
                    ))}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }) {
  return <div><p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p><p className="font-bold">{value}</p></div>;
}

createRoot(document.getElementById('root')).render(<App />);