import React from 'react';
import { Users, Bookmark, Search } from 'lucide-react';
import { events as fallbackEvents } from './data/events';
import { fetchPublicEvents, fetchCampuses, fetchFaculties, saveEvent, registerForEvent, fetchSavedEvents } from './api';

const CATEGORIES = ['All', 'Workshop', 'Seminar', 'Career Fair', 'Sports', 'Academic', 'Cultural'];
const SORT_OPTIONS = [
  { label: 'Soonest', value: 'date_asc' },
  { label: 'Latest', value: 'date_desc' },
  { label: 'Most popular', value: 'popular' },
  { label: 'A–Z', value: 'alpha' }
];

export default function StudentPage({ currentUser, token, onSignOut }) {
  const [query, setQuery] = React.useState('');
  const [campusFilter, setCampusFilter] = React.useState('All campuses');
  const [facultyFilter, setFacultyFilter] = React.useState('All faculties');
  const [availableCampuses, setAvailableCampuses] = React.useState([{ id: null, name: 'All campuses' }]);
  const [availableFaculties, setAvailableFaculties] = React.useState([{ id: null, name: 'All faculties' }]);
  const [events, setEvents] = React.useState(fallbackEvents);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [savedEventIds, setSavedEventIds] = React.useState(new Set());
  const [loadingAction, setLoadingAction] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState(null);
  const [showEventDetail, setShowEventDetail] = React.useState(false);
  const [showOnlySaved, setShowOnlySaved] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showConfirmModal, setShowConfirmModal] = React.useState(null);
  const [registeringId, setRegisteringId] = React.useState(null);
  const [registeredEventIds, setRegisteredEventIds] = React.useState(new Set());
  const [showOnlyRegistered, setShowOnlyRegistered] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] = React.useState([]);
  const [sortBy, setSortBy] = React.useState('date_asc');
  const [categoryFilter, setCategoryFilter] = React.useState('All');
  const [showShareToast, setShowShareToast] = React.useState(false);

  const campusOptions = availableCampuses.map((c) => c.name);
  const facultyOptions = availableFaculties.map((f) => f.name);
  const hasActiveFilters = query || campusFilter !== campusOptions[0] || facultyFilter !== facultyOptions[0] || showOnlySaved || showOnlyRegistered || categoryFilter !== 'All';

  // Load user's saved & registered events from server on mount
  React.useEffect(() => {
    if (!currentUser?.id || !token) return;
    fetchSavedEvents(currentUser.id, token)
      .then((saved) => setSavedEventIds(new Set(saved.map((s) => s.eventId || s.event?.id))))
      .catch(() => {});
  }, [currentUser?.id, token]);

  React.useEffect(() => {
    let cancelled = false;

    fetchPublicEvents()
      .then((apiEvents) => {
        if (cancelled) return;
        setEvents(apiEvents);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setEvents(fallbackEvents);
        setIsLoading(false);
      });

    fetchCampuses()
      .then((campusesData) => {
        if (cancelled) return;
        setAvailableCampuses([{ id: null, name: 'All campuses' }, ...campusesData.map((c) => ({ id: c.id, name: c.name }))]);
      })
      .catch(() => {
        if (cancelled) return;
        setAvailableCampuses([{ id: null, name: 'All campuses' }]);
      });

    fetchFaculties()
      .then((facultiesData) => {
        if (cancelled) return;
        setAvailableFaculties([{ id: null, name: 'All faculties' }, ...facultiesData.map((f) => ({ id: f.id, name: f.name }))]);
      })
      .catch(() => {
        if (cancelled) return;
        setAvailableFaculties([{ id: null, name: 'All faculties' }]);
      });

    return () => { cancelled = true; };
  }, []);

  const filteredEvents = events
    .filter((event) => {
      const text = `${event.title} ${event.faculty} ${event.organizer} ${event.campus} ${event.venue} ${event.category}`.toLowerCase();
      const matchesSearch = !query || text.includes(query.toLowerCase());
      const matchesCampus = campusFilter === campusOptions[0] || event.campus === campusFilter;
      const matchesFaculty = facultyFilter === facultyOptions[0] || event.faculty === facultyFilter;
      const matchesSaved = !showOnlySaved || savedEventIds.has(event.id);
      const matchesRegistered = !showOnlyRegistered || registeredEventIds.has(event.id);
      const matchesCategory = categoryFilter === 'All' || event.category?.toLowerCase() === categoryFilter.toLowerCase();
      return matchesSearch && matchesCampus && matchesFaculty && matchesSaved && matchesRegistered && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'date_asc') return new Date(a.date || 0) - new Date(b.date || 0);
      if (sortBy === 'date_desc') return new Date(b.date || 0) - new Date(a.date || 0);
      if (sortBy === 'popular') return (b.registrations || 0) - (a.registrations || 0);
      if (sortBy === 'alpha') return (a.title || '').localeCompare(b.title || '');
      return 0;
    });

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingEvents = events.filter((e) => {
    const d = new Date(e.date + 'T00:00:00');
    return d >= now && d <= nextWeek;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  function clearFilters() {
    setQuery('');
    setCampusFilter(campusOptions[0]);
    setFacultyFilter(facultyOptions[0]);
    setShowOnlySaved(false);
    setShowOnlyRegistered(false);
    setCategoryFilter('All');
  }

  function addNotification(type, event) {
    const msg = type === 'registration'
      ? { title: 'Registration confirmed', body: `You registered for "${event.title}"`, color: 'leaf', icon: 'check' }
      : { title: 'Event reminder', body: `"${event.title}" is coming up on ${event.date}`, color: 'tut', icon: 'bell' };
    setNotifications((prev) => [msg, ...prev].slice(0, 20));
  }

  async function handleSaveEvent(eventId) {
    if (!currentUser || !token) { setError('Must be logged in to save events.'); return; }
    setLoadingAction(true);
    setError('');
    try {
      if (savedEventIds.has(eventId)) {
        const next = new Set(savedEventIds);
        next.delete(eventId);
        setSavedEventIds(next);
        setMessage('Event removed from saved.');
      } else {
        await saveEvent(currentUser.id, eventId, token);
        setSavedEventIds((prev) => new Set(prev).add(eventId));
        setMessage('Event saved for later.');
      }
    } catch (err) { setError(err.message || 'Unable to save event');
    } finally { setLoadingAction(false); }
  }

  async function handleRegisterForEvent(eventId) {
    if (!currentUser || !token) { setError('Must be logged in to register.'); return; }
    setRegisteringId(eventId);
    setError('');
    try {
      await registerForEvent(eventId, currentUser.id, token);
      const next = new Set(registeredEventIds);
      next.add(eventId);
      setRegisteredEventIds(next);
      const event = events.find((e) => e.id === eventId);
      if (event) addNotification('registration', event);
      setShowConfirmModal(eventId);
      setMessage('You are now registered for this event.');
    } catch (err) { setError(err.message || 'Unable to register for event');
    } finally { setRegisteringId(null); }
  }

  function dismissNotification(index) {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleShareEvent(event) {
    const text = `${event.title}\n📅 ${event.date} · ${event.time}\n📍 ${event.venue || 'TBD'}\n🏛️ ${event.campus} · ${event.faculty}`;
    try {
      await navigator.clipboard.writeText(text);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2500);
    } catch { setError('Could not copy to clipboard'); }
  }

  function daysUntil(dateStr) {
    const diff = Math.ceil((new Date(dateStr + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff <= 7) return `In ${diff} days`;
    return null;
  }

  const totalRegistrations = registeredEventIds.size;
  const campusCount = new Set(events.map((e) => e.campus)).size;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,_rgba(0,93,170,0.10),_transparent_40%),radial-gradient(circle_at_100%_0%,_rgba(29,138,100,0.07),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)]">
      {showShareToast && (
        <div className="fixed left-1/2 top-4 z-[60] -translate-x-1/2 animate-bounce rounded-xl border border-tut/20 bg-tut px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-tut/30">
          📋 Event details copied to clipboard!
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-tut to-[#1f77c9] text-white shadow-lg shadow-tut/25 ring-1 ring-white/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-ink">TUT Event Handler</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Student dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNotifications(true)} className="relative inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition-all hover:border-tut/30 hover:text-tut hover:shadow-md">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {notifications.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-coral text-[9px] font-bold text-white ring-2 ring-white">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>
            <button onClick={() => { setShowOnlyRegistered((prev) => !prev); setShowOnlySaved(false); }} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-bold shadow-sm transition-all ${showOnlyRegistered ? 'border-leaf/30 bg-leaf/10 text-leaf shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-leaf/20 hover:text-leaf hover:shadow-md'}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              My Events ({registeredEventIds.size})
            </button>
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 sm:flex">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-tut to-[#1f77c9] text-center text-[11px] font-bold leading-7 text-white">
                {currentUser.fullName?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold leading-tight text-ink">{currentUser.fullName}</p>
                <p className="text-[11px] font-medium text-muted">Student</p>
              </div>
            </div>
            <button onClick={onSignOut} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-tut/30 hover:text-tut hover:shadow-md active:translate-y-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
        <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: 'Events', value: events.length, color: 'from-tut to-[#1f77c9]' },
            { label: 'My Registrations', value: totalRegistrations, color: 'from-leaf to-[#2ba178]' },
            { label: 'Campuses', value: campusCount, color: 'from-gold to-[#d4a104]' }
          ].map((s) => (
            <div key={s.label} className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_rgba(21,22,26,0.04)] transition-all hover:shadow-lg">
              <div className={`absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br ${s.color} opacity-5 transition group-hover:opacity-10`} />
              <p className="text-2xl font-bold tracking-tight text-ink">{s.value}</p>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{s.label}</p>
            </div>
          ))}
        </div>

        {upcomingEvents.length > 0 && !showOnlyRegistered && !showOnlySaved && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-white via-gold/[0.04] to-white shadow-[0_8px_30px_rgba(242,183,5,0.06)]">
            <div className="flex items-center gap-3 border-b border-gold/15 px-5 py-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gold/15 text-[#7b5a00]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div>
                <p className="text-sm font-bold text-[#7b5a00]">Upcoming this week</p>
                <p className="text-xs text-muted">{upcomingEvents.length} event{upcomingEvents.length !== 1 ? 's' : ''} in the next 7 days</p>
              </div>
            </div>
            <div className="divide-y divide-gold/10">
              {upcomingEvents.slice(0, 3).map((event) => {
                const dayLabel = daysUntil(event.date);
                return (
                  <div key={event.id} className="flex cursor-pointer items-center gap-4 px-5 py-3 transition hover:bg-gold/[0.03]" onClick={() => { setSelectedEvent(event); setShowEventDetail(true); }}>
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-tut to-[#1f77c9] text-xs font-bold text-white">{dayLabel?.startsWith('In') ? dayLabel.split(' ')[1] + 'd' : dayLabel?.slice(0, 3) || '?'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{event.title}</p>
                      <p className="truncate text-xs text-muted">{event.date} · {event.time} · {event.venue || 'TBD'}</p>
                    </div>
                    {dayLabel && <span className="shrink-0 rounded-lg border border-gold/20 bg-gold/10 px-2 py-1 text-[10px] font-bold text-[#7b5a00]">{dayLabel}</span>}
                  </div>
                );
              })}
              {upcomingEvents.length > 3 && (
                <div className="px-5 py-2 text-center text-xs font-semibold text-muted">+{upcomingEvents.length - 3} more</div>
              )}
            </div>
          </div>
        )}

        <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_rgba(21,22,26,0.04)]">
          <div className="grid gap-3 md:grid-cols-[1fr_160px_160px_auto_auto]">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition-all focus:border-tut/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,93,170,0.08)]" placeholder="Search events..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <select value={campusFilter} onChange={(e) => setCampusFilter(e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition-all focus:border-tut/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,93,170,0.08)]">
              {campusOptions.map((opt) => <option key={opt} value={opt}>{opt === 'All campuses' ? '🏛️ All' : opt}</option>)}
            </select>
            <select value={facultyFilter} onChange={(e) => setFacultyFilter(e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition-all focus:border-tut/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,93,170,0.08)]">
              {facultyOptions.map((opt) => <option key={opt} value={opt}>{opt === 'All faculties' ? '📚 All' : opt}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition-all focus:border-tut/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,93,170,0.08)]">
              {SORT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <button onClick={() => setShowOnlySaved((prev) => !prev)} className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition-all ${showOnlySaved ? 'border-tut/30 bg-tut/10 text-tut shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-tut/20 hover:text-tut'}`}>
              <Bookmark size={16} /> {savedEventIds.size}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setCategoryFilter(cat)} className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition-all ${categoryFilter === cat ? 'border-tut/30 bg-tut/10 text-tut shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-tut/20 hover:text-tut'}`}>{cat}</button>
            ))}
          </div>
          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Filters:</span>
              {query && <span className="inline-flex items-center gap-1 rounded-lg border border-tut/15 bg-tut/5 px-2 py-1 text-xs font-bold text-tut">"{query}"</span>}
              {campusFilter !== campusOptions[0] && <span className="inline-flex items-center gap-1 rounded-lg border border-gold/15 bg-gold/5 px-2 py-1 text-xs font-bold text-[#7b5a00]">{campusFilter}</span>}
              {facultyFilter !== facultyOptions[0] && <span className="inline-flex items-center gap-1 rounded-lg border border-leaf/15 bg-leaf/5 px-2 py-1 text-xs font-bold text-leaf">{facultyFilter}</span>}
              {categoryFilter !== 'All' && <span className="inline-flex items-center gap-1 rounded-lg border border-coral/15 bg-coral/5 px-2 py-1 text-xs font-bold text-coral">{categoryFilter}</span>}
              {showOnlySaved && <span className="inline-flex items-center gap-1 rounded-lg border border-tut/15 bg-tut/5 px-2 py-1 text-xs font-bold text-tut">Saved</span>}
              {showOnlyRegistered && <span className="inline-flex items-center gap-1 rounded-lg border border-leaf/15 bg-leaf/5 px-2 py-1 text-xs font-bold text-leaf">Registered</span>}
              <button onClick={clearFilters} className="ml-auto text-xs font-bold text-muted underline underline-offset-2 hover:text-tut">Clear all</button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} className="font-bold text-red-600">&times;</button>
          </div>
        )}
        {message && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-leaf/20 bg-leaf/5 px-4 py-3 text-sm text-leaf shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span className="flex-1">{message}</span>
            <button onClick={() => setMessage('')} className="font-bold text-leaf">&times;</button>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex gap-2"><div className="h-5 w-16 animate-pulse rounded-lg bg-slate-200" /><div className="h-5 w-20 animate-pulse rounded-lg bg-slate-200" /></div>
                <div className="mb-2 h-6 w-3/4 animate-pulse rounded-lg bg-slate-200" />
                <div className="mb-4 h-4 w-1/2 animate-pulse rounded-lg bg-slate-200" />
                <div className="flex gap-2"><div className="h-10 flex-1 animate-pulse rounded-xl bg-slate-200" /><div className="h-10 w-24 animate-pulse rounded-xl bg-slate-200" /></div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-16 text-center">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-tut/10 text-tut">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <h3 className="text-xl font-bold text-ink">{showOnlySaved ? 'No saved events' : showOnlyRegistered ? 'No registrations yet' : hasActiveFilters ? 'No events found' : 'No events'}</h3>
            <p className="mt-2 max-w-sm text-sm text-muted">
              {showOnlySaved ? 'Tap the bookmark icon on events to save them for later.' : showOnlyRegistered ? 'Register for events to see them here.' : hasActiveFilters ? 'Try adjusting your filters.' : 'Events will appear once published.'}
            </p>
            {hasActiveFilters && <button onClick={clearFilters} className="mt-6 rounded-xl bg-tut px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-tut/20 transition-all hover:-translate-y-0.5 active:translate-y-0">Clear all filters</button>}
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-muted">{filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}{showOnlySaved && ' saved'}</p>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredEvents.map((event) => {
                const isFilling = event.maxAttendees && (event.registrations || 0) / event.maxAttendees >= 0.8;
                const fillPct = Math.min(100, ((event.registrations || 0) / (event.maxAttendees || 1)) * 100);
                return (
                  <div key={event.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(21,22,26,0.04)] transition-all hover:-translate-y-1 hover:border-tut/20 hover:shadow-lg">
                    <div className={`relative h-28 ${event.posterClass || 'bg-gradient-to-br from-tut to-[#1f77c9]'}`}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 flex items-start justify-between">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="rounded-lg bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-tut backdrop-blur-sm">{event.campus}</span>
                          <span className="rounded-lg bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-700 backdrop-blur-sm">{event.category}</span>
                          {isFilling && (
                            <span className="rounded-lg bg-coral/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">Filling fast</span>
                          )}
                        </div>
                        <button onClick={() => handleSaveEvent(event.id)} className={`rounded-lg border p-1.5 backdrop-blur-sm transition-all ${savedEventIds.has(event.id) ? 'border-tut/30 bg-tut/20 text-tut' : 'border-white/30 bg-white/20 text-white hover:bg-white/30'}`}>
                          <Bookmark size={14} fill={savedEventIds.has(event.id) ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="cursor-pointer text-base font-bold text-ink transition-colors hover:text-tut" onClick={() => { setSelectedEvent(event); setShowEventDetail(true); }}>{event.title}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                        <span className="inline-flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>{event.date}</span>
                        <span className="inline-flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>{event.time}</span>
                        <span className="inline-flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>{event.organizer || 'Organizer'}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted"><Users size={13} />{event.registrations || 0} / {event.maxAttendees || '∞'}</span>
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                            <div className={`h-full rounded-full ${isFilling ? 'bg-gradient-to-r from-coral to-coral/70' : 'bg-gradient-to-r from-tut to-[#1f77c9]'}`} style={{ width: `${fillPct}%` }} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleRegisterForEvent(event.id)} disabled={registeringId === event.id} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-tut to-[#1f77c9] px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-tut/20 transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 active:translate-y-0">
                            {registeringId === event.id ? (<svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" fill="currentColor" className="opacity-75"/></svg>) : 'Register'}
                          </button>
                          <button onClick={() => { setSelectedEvent(event); setShowEventDetail(true); }} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition-all hover:border-tut/20 hover:text-tut">Details</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {showEventDetail && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => { setSelectedEvent(null); setShowEventDetail(false); }}>
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className={`relative h-40 ${selectedEvent.posterClass || 'bg-gradient-to-br from-tut to-[#1f77c9]'}`}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-lg bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-tut backdrop-blur-sm">{selectedEvent.campus}</span>
                  <span className="rounded-lg bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-700 backdrop-blur-sm">{selectedEvent.category}</span>
                </div>
                <h2 className="mt-2 text-2xl font-bold text-white drop-shadow-sm">{selectedEvent.title}</h2>
              </div>
              <div className="absolute right-4 top-4 flex gap-2">
                <button onClick={() => handleShareEvent(selectedEvent)} className="grid h-8 w-8 place-items-center rounded-xl bg-black/20 text-white backdrop-blur-sm transition hover:bg-black/40" title="Share event">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                </button>
                <button onClick={() => { setSelectedEvent(null); setShowEventDetail(false); }} className="grid h-8 w-8 place-items-center rounded-xl bg-black/20 text-white backdrop-blur-sm transition hover:bg-black/40">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
            <div className="space-y-5 p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Date & Time</p>
                  <p className="mt-1 text-sm font-bold text-ink">{selectedEvent.date}</p>
                  <p className="text-xs text-muted">{selectedEvent.time}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Venue</p>
                  <p className="mt-1 text-sm font-bold text-ink">{selectedEvent.venue || 'TBD'}</p>
                  <p className="text-xs text-muted">{selectedEvent.faculty}</p>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Description</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{selectedEvent.description || 'No description available for this event.'}</p>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-tut" />
                  <div>
                    <p className="text-xs font-semibold text-muted">Registrations</p>
                    <p className="text-sm font-bold text-ink">{selectedEvent.registrations || 0} / {selectedEvent.maxAttendees || 'Unlimited'}</p>
                  </div>
                </div>
                <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-gradient-to-r from-tut to-[#1f77c9]" style={{ width: `${Math.min(100, ((selectedEvent.registrations || 0) / (selectedEvent.maxAttendees || 1)) * 100)}%` }} />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { handleRegisterForEvent(selectedEvent.id); setSelectedEvent(null); setShowEventDetail(false); }} disabled={registeringId === selectedEvent.id} className="flex-1 rounded-xl bg-gradient-to-r from-tut to-[#1f77c9] py-3 text-sm font-bold text-white shadow-lg shadow-tut/20 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 active:translate-y-0">
                  {registeringId === selectedEvent.id ? 'Registering...' : 'Register now'}
                </button>
                <button onClick={() => handleShareEvent(selectedEvent)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:border-tut/20 hover:text-tut" title="Share">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                </button>
                <button onClick={() => { setSelectedEvent(null); setShowEventDetail(false); }} className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 transition-all hover:border-tut/20 hover:text-tut">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNotifications && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={() => setShowNotifications(false)} />
          <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-tut"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <div><p className="text-sm font-bold text-ink">Notifications</p><p className="text-[11px] text-muted">{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</p></div>
              </div>
              <button onClick={() => setShowNotifications(false)} className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-tut/30 hover:text-tut">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-muted">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  </div>
                  <p className="text-sm font-bold text-ink">No notifications yet</p>
                  <p className="mt-1 text-xs text-muted">Registration confirmations appear here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((n, i) => (
                    <div key={i} className={`group relative rounded-xl border p-3 transition hover:shadow-sm ${n.color === 'leaf' ? 'border-leaf/20 bg-leaf/[0.03]' : 'border-tut/15 bg-tut/[0.02]'}`}>
                      <button onClick={() => dismissNotification(i)} className="absolute right-2 top-2 hidden text-xs font-bold text-muted hover:text-ink group-hover:block">&times;</button>
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${n.color === 'leaf' ? 'bg-leaf/10 text-leaf' : 'bg-tut/10 text-tut'}`}>
                          {n.icon === 'check' ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-ink">{n.title}</p>
                          <p className="text-xs text-muted">{n.body}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="border-t border-slate-200 p-4">
                <button onClick={() => setNotifications([])} className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600 transition hover:border-red-200 hover:text-red-600">Clear all notifications</button>
              </div>
            )}
          </div>
        </>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowConfirmModal(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-leaf/10 text-leaf">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3 className="text-xl font-bold text-ink">Registration confirmed!</h3>
            <p className="mt-2 text-sm text-muted">You have successfully registered for this event.</p>
            <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-left text-sm">
              <div><p className="text-xs font-semibold text-muted">Date</p><p className="font-bold text-ink">{filteredEvents.find((e) => e.id === showConfirmModal)?.date || 'N/A'}</p></div>
              <div><p className="text-xs font-semibold text-muted">Time</p><p className="font-bold text-ink">{filteredEvents.find((e) => e.id === showConfirmModal)?.time || 'N/A'}</p></div>
            </div>
            <button onClick={() => setShowConfirmModal(null)} className="mt-6 w-full rounded-xl bg-tut py-3 text-sm font-bold text-white shadow-lg shadow-tut/20 transition-all hover:-translate-y-0.5 active:translate-y-0">Done</button>
          </div>
        </div>
      )}
    </main>
  );
}