const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

// Log API base URL in development for debugging
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL);
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchPublicEvents() {
  const response = await fetch(`${API_BASE_URL}/api/events/public`);
  if (!response.ok) {
    throw new Error(`Could not load events: ${response.status}`);
  }
  const events = await response.json();
  return events.map(toUiEvent);
}

export async function fetchOrganizerEvents(organizerId, token) {
  const response = await fetch(`${API_BASE_URL}/api/events/organizer/${organizerId}`, {
    headers: { ...authHeaders(token) }
  });
  if (!response.ok) {
    throw new Error(`Could not load organizer events: ${response.status}`);
  }
  const events = await response.json();
  return events.map(toUiEvent);
}

export async function generateAiEventDraft(prompt) {
  const response = await fetch(`${API_BASE_URL}/api/events/ai-draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!response.ok) {
    throw new Error(`Could not generate draft: ${response.status}`);
  }
  const draft = await response.json();
  return {
    title: draft.title,
    category: readableCategory(draft.suggestedCategory || 'WORKSHOP'),
    summary: draft.shortSummary || draft.description,
    audience: draft.targetAudience,
    objectives: splitList(draft.objectives),
    bring: draft.attendeeRequirements,
    duration: draft.estimatedDuration,
    tags: splitList(draft.tags)
  };
}

export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!response.ok) {
    throw new Error('Invalid credentials');
  }
  return response.json();
}

export async function register(request) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  if (!response.ok) {
    throw new Error('Registration failed');
  }
  return response.json();
}

export async function createEvent(request, token) {
  const response = await fetch(`${API_BASE_URL}/api/events/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(request)
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Could not create event: ${response.status} ${body}`);
  }
  return response.json();
}

export async function updateEvent(eventId, request, token) {
  const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(request)
  });
  if (!response.ok) throw new Error('Could not update event');
  return response.json();
}

export async function deleteEvent(eventId, token) {
  const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
    method: 'DELETE', headers: authHeaders(token)
  });
  if (!response.ok) throw new Error('Could not delete event');
  return response.ok;
}

export async function closeRegistrations(eventId, token) {
  const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/close-registrations`, {
    method: 'POST', headers: authHeaders(token)
  });
  if (!response.ok) throw new Error('Could not close registrations');
  return response.json();
}

export async function fetchAttendees(eventId, token) {
  const response = await fetch(`${API_BASE_URL}/api/registrations/events/${eventId}`, {
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error('Could not load attendees');
  return response.json();
}

export async function fetchSavedEvents(studentId, token) {
  const response = await fetch(`${API_BASE_URL}/api/saved-events/students/${studentId}`, {
    headers: { ...authHeaders(token) }
  });
  if (!response.ok) throw new Error('Could not load saved events');
  return response.json();
}

export async function fetchCampuses() {
  const response = await fetch(`${API_BASE_URL}/api/reference/campuses`);
  if (!response.ok) throw new Error('Could not load campuses');
  return response.json();
}

export async function fetchFaculties() {
  const response = await fetch(`${API_BASE_URL}/api/reference/faculties`);
  if (!response.ok) throw new Error('Could not load faculties');
  return response.json();
}

export async function saveEvent(studentId, eventId, token) {
  const response = await fetch(`${API_BASE_URL}/api/saved-events/students/${studentId}/events/${eventId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) }
  });
  if (!response.ok) throw new Error('Could not save event');
  return response.json();
}

export async function registerForEvent(eventId, studentId, token) {
  const response = await fetch(`${API_BASE_URL}/api/registrations/events/${eventId}/students/${studentId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) }
  });
  if (!response.ok) throw new Error('Could not register for event');
  return response.json();
}

export async function uploadPoster(file, token) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE_URL}/api/posters`, {
    method: 'POST', headers: authHeaders(token), body: formData
  });
  if (!response.ok) throw new Error('Could not upload poster');
  return response.json();
}

function toUiEvent(event) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    campus: event.campus,
    faculty: event.faculty,
    venue: event.venue,
    date: formatDate(event.date),
    time: event.time,
    category: readableCategory(event.category),
    maxAttendees: event.maxAttendees || 0,
    registrations: event.registrations || 0,
    organizer: event.organizer,
    status: event.status || 'PUBLISHED',
    posterClass: posterClassFor(event.category)
  };
}

function formatDate(value) {
  if (!value) return 'Date to be confirmed';
  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric', month: 'short', year: 'numeric'
  }).format(new Date(`${value}T00:00:00`));
}

function readableCategory(value) {
  return String(value || '').toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function splitList(value) {
  if (Array.isArray(value)) return value;
  return String(value || '').split(/[,;]\s*/).map((item) => item.trim()).filter(Boolean);
}

export async function fetchAdminStats(token) {
  const response = await fetch(`${API_BASE_URL}/api/admin/stats`, { headers: authHeaders(token) });
  if (!response.ok) throw new Error('Could not load admin stats');
  return response.json();
}

export async function fetchAdminUsers(token) {
  const response = await fetch(`${API_BASE_URL}/api/admin/users`, { headers: authHeaders(token) });
  if (!response.ok) throw new Error('Could not load users');
  return response.json();
}

export async function updateAdminUser(userId, updates, token) {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders(token) }, body: JSON.stringify(updates)
  });
  if (!response.ok) throw new Error('Could not update user');
  return response.json();
}

export async function deleteAdminUser(userId, token) {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, { method: 'DELETE', headers: authHeaders(token) });
  if (!response.ok) throw new Error('Could not delete user');
  return response.ok;
}

export async function fetchAdminEvents(token) {
  const response = await fetch(`${API_BASE_URL}/api/admin/events`, { headers: authHeaders(token) });
  if (!response.ok) throw new Error('Could not load events');
  return response.json();
}

export async function deleteAdminEvent(eventId, token) {
  const response = await fetch(`${API_BASE_URL}/api/admin/events/${eventId}`, { method: 'DELETE', headers: authHeaders(token) });
  if (!response.ok) throw new Error('Could not delete event');
  return response.ok;
}

export async function createCampus(data, token) {
  const response = await fetch(`${API_BASE_URL}/api/admin/campuses`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders(token) }, body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Could not create campus');
  return response.json();
}

export async function updateCampus(campusId, data, token) {
  const response = await fetch(`${API_BASE_URL}/api/admin/campuses/${campusId}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders(token) }, body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Could not update campus');
  return response.json();
}

export async function deleteCampus(campusId, token) {
  const response = await fetch(`${API_BASE_URL}/api/admin/campuses/${campusId}`, { method: 'DELETE', headers: authHeaders(token) });
  if (!response.ok) throw new Error('Could not delete campus');
  return response.ok;
}

export async function createFaculty(data, token) {
  const response = await fetch(`${API_BASE_URL}/api/admin/faculties`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders(token) }, body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Could not create faculty');
  return response.json();
}

export async function updateFaculty(facultyId, data, token) {
  const response = await fetch(`${API_BASE_URL}/api/admin/faculties/${facultyId}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders(token) }, body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Could not update faculty');
  return response.json();
}

export async function deleteFaculty(facultyId, token) {
  const response = await fetch(`${API_BASE_URL}/api/admin/faculties/${facultyId}`, { method: 'DELETE', headers: authHeaders(token) });
  if (!response.ok) throw new Error('Could not delete faculty');
  return response.ok;
}

export async function createAdminUser(data, token) {
  const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders(token) }, body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Could not create user');
  return response.json();
}

export async function fetchAdminRegistrations(token) {
  const response = await fetch(`${API_BASE_URL}/api/admin/registrations`, { headers: authHeaders(token) });
  if (!response.ok) throw new Error('Could not load registrations');
  return response.json();
}

export async function deleteAdminRegistration(id, token) {
  const response = await fetch(`${API_BASE_URL}/api/admin/registrations/${id}`, { method: 'DELETE', headers: authHeaders(token) });
  if (!response.ok) throw new Error('Could not delete registration');
  return response.ok;
}

export async function fetchAdminSavedEvents(token) {
  const response = await fetch(`${API_BASE_URL}/api/admin/saved-events`, { headers: authHeaders(token) });
  if (!response.ok) throw new Error('Could not load saved events');
  return response.json();
}

export async function deleteAdminSavedEvent(id, token) {
  const response = await fetch(`${API_BASE_URL}/api/admin/saved-events/${id}`, { method: 'DELETE', headers: authHeaders(token) });
  if (!response.ok) throw new Error('Could not delete saved event');
  return response.ok;
}

export async function forgotPassword(email) {
  const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
  });
  if (!response.ok) {
    const body = await response.text();
    try { const j = JSON.parse(body); throw new Error(j.message || 'Could not process request'); }
    catch (e) { if (e.message !== 'Could not process request') throw e; throw new Error(body); }
  }
  return response.json();
}

export async function resetPassword(token, password) {
  const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password })
  });
  if (!response.ok) {
    const body = await response.text();
    try { const j = JSON.parse(body); throw new Error(j.message || 'Invalid or expired reset token'); }
    catch (e) { if (e.message !== 'Invalid or expired reset token') throw e; throw new Error(body); }
  }
  return response.json();
}

export async function fetchAnalyticsDetailed(token) {
  const response = await fetch(`${API_BASE_URL}/api/admin/analytics/detailed`, { headers: authHeaders(token) });
  if (!response.ok) throw new Error('Could not load analytics');
  return response.json();
}

export async function fetchAnalyticsTrends(token) {
  const response = await fetch(`${API_BASE_URL}/api/admin/analytics/trends`, { headers: authHeaders(token) });
  if (!response.ok) throw new Error('Could not load trends');
  return response.json();
}

export async function fetchAnalyticsTopEvents(token) {
  const response = await fetch(`${API_BASE_URL}/api/admin/analytics/top-events`, { headers: authHeaders(token) });
  if (!response.ok) throw new Error('Could not load top events');
  return response.json();
}

export async function generatePosterHtml(eventId, token) {
  const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/poster`, { headers: authHeaders(token) });
  if (!response.ok) throw new Error('Could not generate poster');
  return response.text();
}

function posterClassFor(category) {
  const classes = {
    WORKSHOP: 'bg-[linear-gradient(135deg,#005daa,#1d8a64)]',
    CAREER_FAIR: 'bg-[linear-gradient(135deg,#15161a,#f2b705)]',
    SPORTS: 'bg-[linear-gradient(135deg,#1d8a64,#f2b705)]',
    SEMINAR: 'bg-[linear-gradient(135deg,#d95f43,#005daa)]'
  };
  return classes[category] || 'bg-[linear-gradient(135deg,#005daa,#d95f43)]';
}