import React from 'react';
import { fetchAdminStats, fetchAdminUsers, fetchAdminEvents, updateAdminUser, deleteAdminUser, deleteAdminEvent, createAdminUser,
  fetchCampuses, fetchFaculties, createCampus, updateCampus, deleteCampus, createFaculty, updateFaculty, deleteFaculty,
  fetchAdminRegistrations, deleteAdminRegistration, fetchAdminSavedEvents, deleteAdminSavedEvent } from './api';

const TABS = ['Dashboard', 'Users', 'Events', 'Campuses', 'Faculties', 'Registrations', 'Saved Events'];

export default function AdminPage({ currentUser, token, onSignOut }) {
  const [activeTab, setActiveTab] = React.useState('Dashboard');
  const [stats, setStats] = React.useState(null);
  const [users, setUsers] = React.useState([]);
  const [events, setEvents] = React.useState([]);
  const [campuses, setCampuses] = React.useState([]);
  const [faculties, setFaculties] = React.useState([]);
  const [registrations, setRegistrations] = React.useState([]);
  const [savedEvents, setSavedEvents] = React.useState([]);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  // User CRUD state
  const [editingUser, setEditingUser] = React.useState(null);
  const [editUserForm, setEditUserForm] = React.useState({ fullName: '', email: '', role: '', approved: false });
  const [showCreateUser, setShowCreateUser] = React.useState(false);
  const [createUserForm, setCreateUserForm] = React.useState({ fullName: '', email: '', role: 'STUDENT', studentNumber: '' });

  // Campus CRUD state
  const [newCampus, setNewCampus] = React.useState({ name: '', city: '' });
  const [editingCampus, setEditingCampus] = React.useState(null);

  // Faculty CRUD state
  const [newFaculty, setNewFaculty] = React.useState({ name: '' });
  const [editingFaculty, setEditingFaculty] = React.useState(null);

  function loadData() {
    setLoading(true);
    Promise.all([
      fetchAdminStats(token).then(setStats).catch(() => {}),
      fetchAdminUsers(token).then(setUsers).catch(() => {}),
      fetchAdminEvents(token).then(setEvents).catch(() => {}),
      fetchCampuses().then(setCampuses).catch(() => {}),
      fetchFaculties().then(setFaculties).catch(() => {}),
      fetchAdminRegistrations(token).then(setRegistrations).catch(() => {}),
      fetchAdminSavedEvents(token).then(setSavedEvents).catch(() => {})
    ]).finally(() => setLoading(false));
  }

  React.useEffect(() => { loadData(); }, []);

  // ===== USER CRUD =====
  async function handleCreateUser() {
    if (!createUserForm.fullName || !createUserForm.email) return;
    try {
      const user = await createAdminUser(createUserForm, token);
      setUsers((prev) => [...prev, user]);
      setShowCreateUser(false);
      setCreateUserForm({ fullName: '', email: '', role: 'STUDENT', studentNumber: '' });
      setMessage('User created.');
    } catch (err) { setError(err.message); }
  }

  async function handleApproveUser(userId) {
    try {
      await updateAdminUser(userId, { approved: true }, token);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, approved: true } : u));
      setMessage('User approved.');
    } catch (err) { setError(err.message); }
  }

  async function handleDeleteUser(userId, name) {
    if (!window.confirm(`Delete user "${name}"?`)) return;
    try {
      await deleteAdminUser(userId, token);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setMessage('User deleted.');
    } catch (err) { setError(err.message); }
  }

  async function handleSaveUserEdit() {
    if (!editingUser) return;
    try {
      const updated = await updateAdminUser(editingUser.id, editUserForm, token);
      setUsers((prev) => prev.map((u) => u.id === editingUser.id ? updated : u));
      setEditingUser(null);
      setMessage('User updated.');
    } catch (err) { setError(err.message); }
  }

  function openEditUser(user) {
    setEditingUser(user);
    setEditUserForm({ fullName: user.fullName, email: user.email, role: user.role, approved: user.approved });
  }

  // ===== EVENT CRUD =====
  async function handleDeleteEvent(eventId, title) {
    if (!window.confirm(`Delete event "${title}"?`)) return;
    try {
      await deleteAdminEvent(eventId, token);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      setMessage('Event deleted.');
    } catch (err) { setError(err.message); }
  }

  // ===== CAMPUS CRUD =====
  async function handleCreateCampus() {
    if (!newCampus.name) return;
    try {
      const created = await createCampus(newCampus, token);
      setCampuses((prev) => [...prev, created]);
      setNewCampus({ name: '', city: '' });
      setMessage('Campus created.');
    } catch (err) { setError(err.message); }
  }

  async function handleUpdateCampus() {
    if (!editingCampus) return;
    try {
      const updated = await updateCampus(editingCampus.id, editingCampus, token);
      setCampuses((prev) => prev.map((c) => c.id === editingCampus.id ? updated : c));
      setEditingCampus(null);
      setMessage('Campus updated.');
    } catch (err) { setError(err.message); }
  }

  async function handleDeleteCampus(campusId, name) {
    if (!window.confirm(`Delete campus "${name}"?`)) return;
    try {
      await deleteCampus(campusId, token);
      setCampuses((prev) => prev.filter((c) => c.id !== campusId));
      setMessage('Campus deleted.');
    } catch (err) { setError(err.message); }
  }

  // ===== FACULTY CRUD =====
  async function handleCreateFaculty() {
    if (!newFaculty.name) return;
    try {
      const created = await createFaculty(newFaculty, token);
      setFaculties((prev) => [...prev, created]);
      setNewFaculty({ name: '' });
      setMessage('Faculty created.');
    } catch (err) { setError(err.message); }
  }

  async function handleUpdateFaculty() {
    if (!editingFaculty) return;
    try {
      const updated = await updateFaculty(editingFaculty.id, editingFaculty, token);
      setFaculties((prev) => prev.map((f) => f.id === editingFaculty.id ? updated : f));
      setEditingFaculty(null);
      setMessage('Faculty updated.');
    } catch (err) { setError(err.message); }
  }

  async function handleDeleteFaculty(facultyId, name) {
    if (!window.confirm(`Delete faculty "${name}"?`)) return;
    try {
      await deleteFaculty(facultyId, token);
      setFaculties((prev) => prev.filter((f) => f.id !== facultyId));
      setMessage('Faculty deleted.');
    } catch (err) { setError(err.message); }
  }

  // ===== REGISTRATION CRUD =====
  async function handleDeleteRegistration(id) {
    if (!window.confirm('Delete this registration?')) return;
    try {
      await deleteAdminRegistration(id, token);
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
      setMessage('Registration deleted.');
    } catch (err) { setError(err.message); }
  }

  // ===== SAVED EVENT CRUD =====
  async function handleDeleteSavedEvent(id) {
    if (!window.confirm('Delete this saved event?')) return;
    try {
      await deleteAdminSavedEvent(id, token);
      setSavedEvents((prev) => prev.filter((s) => s.id !== id));
      setMessage('Saved event deleted.');
    } catch (err) { setError(err.message); }
  }

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const text = `${u.fullName} ${u.email} ${u.role} ${u.studentNumber || ''}`.toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,_rgba(0,93,170,0.10),_transparent_40%),linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)]">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-coral to-[#d95f43] text-white shadow-lg shadow-coral/25 ring-1 ring-white/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-ink">TUT Event Handler</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Admin panel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 sm:flex">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-coral to-[#d95f43] text-center text-[11px] font-bold leading-7 text-white">
                {currentUser.fullName?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold leading-tight text-ink">{currentUser.fullName}</p>
                <p className="text-[11px] font-medium text-muted">Admin</p>
              </div>
            </div>
            <button onClick={onSignOut} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-coral/30 hover:text-coral">Sign out</button>
          </div>
        </div>
      </header>

      <div className="border-b border-slate-200/60 bg-white/50">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 lg:px-8">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap px-4 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === tab ? 'border-tut text-tut' : 'border-transparent text-muted hover:text-ink'}`}>{tab}</button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
        {error && <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><span className="flex-1">{error}</span><button onClick={() => setError('')} className="font-bold text-red-600">&times;</button></div>}
        {message && <div className="mb-4 flex items-center gap-3 rounded-xl border border-leaf/20 bg-leaf/5 px-4 py-3 text-sm text-leaf"><span className="flex-1">{message}</span><button onClick={() => setMessage('')} className="font-bold text-leaf">&times;</button></div>}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-4">{[1,2,3,4].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />)}</div>
        ) : (
          <>
            {/* DASHBOARD */}
            {activeTab === 'Dashboard' && stats && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  {[
                    { label: 'Total Users', value: stats.totalUsers, color: 'from-tut to-[#1f77c9]' },
                    { label: 'Students', value: stats.students, color: 'from-leaf to-[#2ba178]' },
                    { label: 'Organizers', value: stats.organizers, color: 'from-gold to-[#d4a104]' },
                    { label: 'Events', value: stats.totalEvents, color: 'from-coral to-[#d95f43]' }
                  ].map((s) => (
                    <div key={s.label} className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(21,22,26,0.04)]">
                      <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${s.color} opacity-5`} />
                      <p className="text-3xl font-bold tracking-tight text-ink">{s.value}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  {[
                    { label: 'Campuses', value: stats.totalCampuses, color: 'from-tut to-[#1f77c9]' },
                    { label: 'Faculties', value: stats.totalFaculties, color: 'from-leaf to-[#2ba178]' },
                    { label: 'Registrations', value: stats.totalRegistrations, color: 'from-gold to-[#d4a104]' },
                    { label: 'Saved Events', value: stats.totalSavedEvents, color: 'from-coral to-[#d95f43]' }
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl border border-slate-200/80 bg-white p-5">
                      <p className="text-2xl font-bold text-ink">{s.value}</p>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* USERS */}
            {activeTab === 'Users' && (
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <input className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-tut/50" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  <button onClick={() => setShowCreateUser(true)} className="rounded-xl bg-tut px-4 py-2.5 text-sm font-bold text-white">+ Create User</button>
                  <span className="text-sm font-semibold text-muted">{filteredUsers.length} users</span>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-bold uppercase tracking-[0.12em] text-muted">
                        <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Student #</th><th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-medium text-ink">{user.fullName}</td>
                          <td className="px-4 py-3 text-muted">{user.email}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-lg px-2 py-1 text-[11px] font-bold uppercase ${user.role === 'ADMIN' ? 'bg-coral/10 text-coral' : user.role === 'ORGANIZER' ? 'bg-gold/10 text-[#7b5a00]' : 'bg-tut/10 text-tut'}`}>{user.role}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold ${user.approved ? 'bg-leaf/10 text-leaf' : 'bg-red-50 text-red-600'}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${user.approved ? 'bg-leaf' : 'bg-red-500'}`} />{user.approved ? 'Approved' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted">{user.studentNumber || '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              <button onClick={() => openEditUser(user)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-600 hover:border-tut/20 hover:text-tut">Edit</button>
                              {!user.approved && <button onClick={() => handleApproveUser(user.id)} className="rounded-lg border border-leaf/20 bg-leaf/5 px-2 py-1 text-xs font-bold text-leaf hover:bg-leaf/10">Approve</button>}
                              <button onClick={() => handleDeleteUser(user.id, user.fullName)} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-100">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {editingUser && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setEditingUser(null)}>
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                      <h3 className="text-lg font-bold text-ink">Edit User</h3>
                      <div className="mt-4 space-y-3">
                        <div><label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">Name</label><input value={editUserForm.fullName} onChange={(e) => setEditUserForm((p) => ({ ...p, fullName: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-tut/50" /></div>
                        <div><label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">Email</label><input value={editUserForm.email} onChange={(e) => setEditUserForm((p) => ({ ...p, email: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-tut/50" /></div>
                        <div><label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">Role</label>
                          <select value={editUserForm.role} onChange={(e) => setEditUserForm((p) => ({ ...p, role: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-tut/50">
                            <option value="STUDENT">Student</option><option value="ORGANIZER">Organizer</option><option value="ADMIN">Admin</option>
                          </select>
                        </div>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editUserForm.approved} onChange={(e) => setEditUserForm((p) => ({ ...p, approved: e.target.checked }))} className="rounded" /> Approved</label>
                      </div>
                      <div className="mt-5 flex gap-2">
                        <button onClick={handleSaveUserEdit} className="flex-1 rounded-xl bg-tut py-2.5 text-sm font-bold text-white">Save</button>
                        <button onClick={() => setEditingUser(null)} className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600">Cancel</button>
                      </div>
                    </div>
                  </div>
                )}

                {showCreateUser && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowCreateUser(false)}>
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                      <h3 className="text-lg font-bold text-ink">Create User</h3>
                      <div className="mt-4 space-y-3">
                        <div><label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">Name</label><input value={createUserForm.fullName} onChange={(e) => setCreateUserForm((p) => ({ ...p, fullName: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-tut/50" /></div>
                        <div><label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">Email</label><input value={createUserForm.email} onChange={(e) => setCreateUserForm((p) => ({ ...p, email: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-tut/50" /></div>
                        <div><label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">Role</label>
                          <select value={createUserForm.role} onChange={(e) => setCreateUserForm((p) => ({ ...p, role: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-tut/50">
                            <option value="STUDENT">Student</option><option value="ORGANIZER">Organizer</option><option value="ADMIN">Admin</option>
                          </select>
                        </div>
                        <div><label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">Student Number</label><input value={createUserForm.studentNumber} onChange={(e) => setCreateUserForm((p) => ({ ...p, studentNumber: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-tut/50" /></div>
                      </div>
                      <div className="mt-5 flex gap-2">
                        <button onClick={handleCreateUser} className="flex-1 rounded-xl bg-tut py-2.5 text-sm font-bold text-white">Create</button>
                        <button onClick={() => setShowCreateUser(false)} className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600">Cancel</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* EVENTS */}
            {activeTab === 'Events' && (
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <input className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-tut/50" placeholder="Search events..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  <span className="text-sm font-semibold text-muted">{events.length} events</span>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-bold uppercase tracking-[0.12em] text-muted">
                        <th className="px-4 py-3">Title</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Venue</th><th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {events.filter((e) => !searchQuery || e.title?.toLowerCase().includes(searchQuery.toLowerCase())).map((event) => (
                        <tr key={event.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-medium text-ink">{event.title}</td>
                          <td className="px-4 py-3 text-muted">{event.eventDate}</td>
                          <td className="px-4 py-3"><span className="rounded-lg bg-tut/10 px-2 py-1 text-[11px] font-bold text-tut">{event.category}</span></td>
                          <td className="px-4 py-3"><span className={`rounded-lg px-2 py-1 text-[11px] font-bold ${event.status === 'PUBLISHED' ? 'bg-leaf/10 text-leaf' : 'bg-gold/10 text-[#7b5a00]'}`}>{event.status}</span></td>
                          <td className="px-4 py-3 text-muted">{event.venue}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleDeleteEvent(event.id, event.title)} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-100">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CAMPUSES */}
            {activeTab === 'Campuses' && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
                  <h3 className="text-sm font-bold text-ink">Add Campus</h3>
                  <div className="mt-3 space-y-3">
                    <input value={newCampus.name} onChange={(e) => setNewCampus((p) => ({ ...p, name: e.target.value }))} placeholder="Campus name" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-tut/50" />
                    <input value={newCampus.city} onChange={(e) => setNewCampus((p) => ({ ...p, city: e.target.value }))} placeholder="City" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-tut/50" />
                    <button onClick={handleCreateCampus} className="rounded-xl bg-tut px-4 py-2.5 text-sm font-bold text-white">Add Campus</button>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
                  <h3 className="text-sm font-bold text-ink">Existing Campuses</h3>
                  <div className="mt-3 space-y-2">
                    {campuses.map((c) => (
                      <div key={c.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2">
                        {editingCampus?.id === c.id ? (
                          <div className="flex flex-1 items-center gap-2">
                            <input value={editingCampus.name} onChange={(e) => setEditingCampus((p) => ({ ...p, name: e.target.value }))} className="h-8 flex-1 rounded-lg border border-slate-200 px-2 text-sm" />
                            <input value={editingCampus.city || ''} onChange={(e) => setEditingCampus((p) => ({ ...p, city: e.target.value }))} className="h-8 w-24 rounded-lg border border-slate-200 px-2 text-sm" placeholder="City" />
                            <button onClick={handleUpdateCampus} className="rounded-lg bg-tut px-2 py-1 text-xs font-bold text-white">Save</button>
                            <button onClick={() => setEditingCampus(null)} className="text-xs font-bold text-muted">Cancel</button>
                          </div>
                        ) : (
                          <>
                            <div><p className="text-sm font-medium text-ink">{c.name}</p><p className="text-xs text-muted">{c.city || ''}</p></div>
                            <div className="flex gap-1">
                              <button onClick={() => setEditingCampus({ ...c })} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-600">Edit</button>
                              <button onClick={() => handleDeleteCampus(c.id, c.name)} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-600">Delete</button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* FACULTIES */}
            {activeTab === 'Faculties' && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
                  <h3 className="text-sm font-bold text-ink">Add Faculty</h3>
                  <div className="mt-3 space-y-3">
                    <input value={newFaculty.name} onChange={(e) => setNewFaculty((p) => ({ ...p, name: e.target.value }))} placeholder="Faculty name" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-tut/50" />
                    <button onClick={handleCreateFaculty} className="rounded-xl bg-tut px-4 py-2.5 text-sm font-bold text-white">Add Faculty</button>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
                  <h3 className="text-sm font-bold text-ink">Existing Faculties</h3>
                  <div className="mt-3 space-y-2">
                    {faculties.map((f) => (
                      <div key={f.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2">
                        {editingFaculty?.id === f.id ? (
                          <div className="flex flex-1 items-center gap-2">
                            <input value={editingFaculty.name} onChange={(e) => setEditingFaculty((p) => ({ ...p, name: e.target.value }))} className="h-8 flex-1 rounded-lg border border-slate-200 px-2 text-sm" />
                            <button onClick={handleUpdateFaculty} className="rounded-lg bg-tut px-2 py-1 text-xs font-bold text-white">Save</button>
                            <button onClick={() => setEditingFaculty(null)} className="text-xs font-bold text-muted">Cancel</button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-ink">{f.name}</p>
                            <div className="flex gap-1">
                              <button onClick={() => setEditingFaculty({ ...f })} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-600">Edit</button>
                              <button onClick={() => handleDeleteFaculty(f.id, f.name)} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-600">Delete</button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* REGISTRATIONS */}
            {activeTab === 'Registrations' && (
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-sm font-semibold text-muted">{registrations.length} registrations</span>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-bold uppercase tracking-[0.12em] text-muted">
                        <th className="px-4 py-3">ID</th><th className="px-4 py-3">QR Token</th><th className="px-4 py-3">Attended</th><th className="px-4 py-3">Registered At</th><th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {registrations.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-ink">{r.id}</td>
                          <td className="px-4 py-3 font-mono text-xs text-muted">{r.qrCodeToken?.substring(0, 16)}...</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-lg px-2 py-1 text-[11px] font-bold ${r.attended ? 'bg-leaf/10 text-leaf' : 'bg-slate-100 text-muted'}`}>{r.attended ? 'Yes' : 'No'}</span>
                          </td>
                          <td className="px-4 py-3 text-muted">{r.registeredAt ? new Date(r.registeredAt).toLocaleDateString() : '—'}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleDeleteRegistration(r.id)} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-100">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SAVED EVENTS */}
            {activeTab === 'Saved Events' && (
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-sm font-semibold text-muted">{savedEvents.length} saved events</span>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-bold uppercase tracking-[0.12em] text-muted">
                        <th className="px-4 py-3">ID</th><th className="px-4 py-3">Student ID</th><th className="px-4 py-3">Event ID</th><th className="px-4 py-3">Saved At</th><th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {savedEvents.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-ink">{s.id}</td>
                          <td className="px-4 py-3 text-muted">{s.student?.id || s.student}</td>
                          <td className="px-4 py-3 text-muted">{s.event?.id || s.event}</td>
                          <td className="px-4 py-3 text-muted">{s.savedAt ? new Date(s.savedAt).toLocaleDateString() : '—'}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleDeleteSavedEvent(s.id)} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-100">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}