// SPA Router
const routes = {
  '#home': 'view-home',
  '#auth': 'view-auth',
  '#todo': 'view-todo',
  '#pomodoro': 'view-pomodoro',
  '#timetable': 'view-timetable',
};

const PROTECTED_ROUTES = new Set(['#todo', '#pomodoro', '#timetable']);

function isLoggedIn() {
  return !!Storage.get('currentUser', null);
}

function setActiveRoute(hash) {
  if (!routes[hash]) hash = '#todo';
  // gate protected routes
  if (PROTECTED_ROUTES.has(hash) && !isLoggedIn()) {
    hash = '#home';
  }
  // show/hide header only for auth route
  const header = document.querySelector('.app-header');
  if (header) header.style.display = (hash === '#auth') ? 'none' : '';
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById(routes[hash]).classList.remove('hidden');

  document.querySelectorAll('.nav-link').forEach(b => {
    b.classList.toggle('active', b.dataset.route === hash);
  });
}

window.addEventListener('hashchange', () => setActiveRoute(location.hash));
window.addEventListener('DOMContentLoaded', async () => {
  await initApp();
  setActiveRoute(location.hash || '#home');
  // wire navbar buttons to update the hash route
  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.addEventListener('click', () => {
      const route = btn.dataset.route || '#todo';
      // prevent navigating to protected routes when logged out
      const target = (PROTECTED_ROUTES.has(route) && !isLoggedIn()) ? '#home' : route;
      if (location.hash !== target) location.hash = target; else setActiveRoute(target);
      // close mobile menu if open
      const nav = document.getElementById('navbar');
      const toggle = document.getElementById('nav-toggle');
      if (nav && toggle) { nav.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); }
    });
  });

  // mobile nav toggle
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('navbar');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('open', !expanded);
    });
  }
});

// Utilities
const Storage = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
};

const Toast = {
  el: null,
  show(msg) {
    if (!this.el) this.el = document.getElementById('toast');
    this.el.textContent = msg;
    this.el.classList.remove('hidden');
    this.el.classList.add('show');
    setTimeout(() => this.el.classList.remove('show'), 2000);
  }
};

// Notifications
async function ensureNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const p = await Notification.requestPermission();
    return p === 'granted';
  }
  return false;
}

function scheduleLocalReminder(task) {
  // simple setTimeout-based reminder (works while tab is open)
  if (!task.reminder || !task.dueAt) return;
  const dueMs = new Date(task.dueAt).getTime();
  const delay = dueMs - Date.now();
  if (delay <= 0) return;
  setTimeout(async () => {
    const ok = await ensureNotificationPermission();
    const body = task.dueAt ? `Due: ${new Date(task.dueAt).toLocaleString()}` : '';
    if (ok) new Notification('Task Reminder', { body });
    Toast.show(`Reminder: ${task.title}`);
  }, Math.min(delay, 2_147_000_000)); // clamp to ~24 days
}

// API Hooks (replaced to call Node/Express backend)
const AppState = { todos: [], events: [], sessions: [] };
const API_BASE = '';
async function http(path, opts={}) {
  const res = await fetch(API_BASE + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });
  if (res.status === 401) return { __unauthorized: true };
  if (!res.ok) throw new Error(await res.text());
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

const Api = {
  // Auth helpers used in initAuth
  async me() { return http('/api/auth/me'); },
  async signup(payload) { return http('/api/auth/signup', { method: 'POST', body: JSON.stringify(payload) }); },
  async login(payload) { return http('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }); },
  async logout() { return http('/api/auth/logout', { method: 'POST' }); },

  async listTodos() {
    const data = await http('/api/todos');
    if (data && data.__unauthorized) return [];
    AppState.todos = data;
    return data;
  },
  async createTodo(payload) {
    const data = await http('/api/todos', { method: 'POST', body: JSON.stringify(payload) });
    AppState.todos.push(data);
    return data;
  },
  async updateTodo(id, updates) {
    const data = await http(`/api/todos/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
    const i = AppState.todos.findIndex(t => t.id === id);
    if (i >= 0) AppState.todos[i] = { ...AppState.todos[i], ...updates };
    return data;
  },
  async deleteTodo(id) {
    await http(`/api/todos/${id}`, { method: 'DELETE' });
    AppState.todos = AppState.todos.filter(t => t.id !== id);
  },

  async listEvents() {
    const data = await http('/api/events');
    if (data && data.__unauthorized) return [];
    AppState.events = data;
    return data;
  },
  async upsertEvent(payload) {
    const data = await http('/api/events/upsert', { method: 'POST', body: JSON.stringify(payload) });
    const i = AppState.events.findIndex(e => e.id === payload.id);
    if (i >= 0) AppState.events[i] = data; else AppState.events.push(data);
    return data;
  },
  async deleteEvent(id) {
    await http(`/api/events/${id}`, { method: 'DELETE' });
    AppState.events = AppState.events.filter(e => e.id !== id);
  },

  async listSessions() {
    const data = await http('/api/sessions');
    if (data && data.__unauthorized) return [];
    AppState.sessions = data;
    return data;
  },
  async addSession(session) {
    const data = await http('/api/sessions', { method: 'POST', body: JSON.stringify(session) });
    AppState.sessions.push(data);
  }
};

// To-Do Logic
function renderTodos(todos) {
  const ul = document.getElementById('todo-list');
  ul.innerHTML = '';
  const frag = document.createDocumentFragment();
  todos.sort((a,b)=>{
    const ad = a.done - b.done; if (ad !== 0) return ad;
    return (a.dueAt?new Date(a.dueAt).getTime():Infinity) - (b.dueAt?new Date(b.dueAt).getTime():Infinity);
  });
  for (const t of todos) {
    const li = document.createElement('li');
    li.className = 'todo-item';
    li.innerHTML = `
      <div class="todo-title ${t.done ? 'done' : ''}">${t.title}</div>
      <div>${t.dueAt ? new Date(t.dueAt).toLocaleString() : '-'}</div>
      <div><span class="badge ${t.done ? 'success' : 'pending'}">${t.done ? 'Done' : 'Pending'}</span></div>
      <div>
        <button class="btn" data-action="toggle" data-id="${t.id}">${t.done ? 'Undo' : 'Done'}</button>
        <button class="btn" data-action="remind" data-id="${t.id}">Remind</button>
        <button class="btn" data-action="delete" data-id="${t.id}">Delete</button>
      </div>
    `;
    frag.appendChild(li);
  }
  ul.appendChild(frag);
}

async function loadTodos() {
  const todos = await Api.listTodos();
  renderTodos(todos);
  // reschedule reminders
  todos.forEach(scheduleLocalReminder);
  populateTaskLinks(todos);
}

function populateTaskLinks(todos) {
  const sel = document.getElementById('event-link');
  const current = sel.value;
  sel.innerHTML = '<option value="">Link to task (optional)</option>';
  todos.filter(t=>!t.done).forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.title;
    sel.appendChild(opt);
  });
  if ([...sel.options].some(o=>o.value===current)) sel.value = current;
}

function uuid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function initTodos() {
  const form = document.getElementById('todo-form');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const title = document.getElementById('todo-title').value.trim();
    const dueAt = document.getElementById('todo-due').value || null;
    const reminder = document.getElementById('todo-reminder').checked;
    if (!title) return;
    const task = { id: uuid(), title, dueAt, reminder, done: false, createdAt: Date.now() };
    await Api.createTodo(task);
    scheduleLocalReminder(task);
    form.reset();
    await loadTodos();
    Toast.show('Task added');
  });

  document.getElementById('todo-list').addEventListener('click', async e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const todos = await Api.listTodos();
    const t = todos.find(x=>x.id===id);
    if (!t) return;
    const action = btn.dataset.action;
    if (action === 'toggle') {
      await Api.updateTodo(id, { done: !t.done });
      await loadTodos();
    } else if (action === 'delete') {
      await Api.deleteTodo(id);
      await loadTodos();
    } else if (action === 'remind') {
      await ensureNotificationPermission();
      scheduleLocalReminder(t);
      Toast.show('Reminder scheduled');
    }
  });
}

// Pomodoro Logic
const Pomodoro = {
  currentType: 'focus',
  remainingSec: 25*60,
  timerId: null,
};

function setSessionType(type) {
  Pomodoro.currentType = type;
  const minutes = type==='focus'?25:type==='short'?5:15;
  Pomodoro.remainingSec = minutes*60;
  updateTimerDisplay();
  document.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active', c.dataset.session===type));
}

function updateTimerDisplay() {
  const m = String(Math.floor(Pomodoro.remainingSec/60)).padStart(2,'0');
  const s = String(Pomodoro.remainingSec%60).padStart(2,'0');
  document.getElementById('timer-display').textContent = `${m}:${s}`;
}

function tick() {
  if (Pomodoro.remainingSec > 0) {
    Pomodoro.remainingSec -= 1;
    updateTimerDisplay();
  } else {
    clearInterval(Pomodoro.timerId); Pomodoro.timerId = null;
    completeSession();
  }
}

async function completeSession() {
  const today = new Date().toDateString();
  const sessions = await Api.listSessions();
  const session = { id: uuid(), type: Pomodoro.currentType, completedAt: Date.now(), day: today };
  await Api.addSession(session);
  updateStats();
  ensureNotificationPermission().then(ok=>{ if (ok) new Notification('Pomodoro complete!', { body: `Type: ${Pomodoro.currentType}` }); });
  Toast.show('Session completed');
}

async function updateStats() {
  const sessions = await Api.listSessions();
  const today = new Date().toDateString();
  const todayCount = sessions.filter(s=>s.day===today && s.type==='focus').length;
  document.getElementById('sessions-today').textContent = String(todayCount);

  // streak calc: consecutive days where at least 1 focus session
  const days = new Set(sessions.filter(s=>s.type==='focus').map(s=>new Date(s.completedAt).toDateString()));
  let streak = 0;
  for (let i=0;;i++){
    const d = new Date(); d.setDate(d.getDate()-i);
    const key = d.toDateString();
    if (days.has(key)) streak++; else break;
  }
  document.getElementById('streak-days').textContent = String(streak);
}

function initPomodoro() {
  document.querySelectorAll('.chip').forEach(c=>{
    c.addEventListener('click', ()=> setSessionType(c.dataset.session));
  });
  document.getElementById('timer-start').addEventListener('click', ()=>{
    if (Pomodoro.timerId) return;
    Pomodoro.timerId = setInterval(tick, 1000);
  });
  document.getElementById('timer-pause').addEventListener('click', ()=>{
    if (!Pomodoro.timerId) return;
    clearInterval(Pomodoro.timerId); Pomodoro.timerId = null;
  });
  document.getElementById('timer-reset').addEventListener('click', ()=>{
    setSessionType(Pomodoro.currentType);
    clearInterval(Pomodoro.timerId); Pomodoro.timerId = null;
  });
  document.getElementById('timer-complete').addEventListener('click', ()=>{
    clearInterval(Pomodoro.timerId); Pomodoro.timerId = null; completeSession();
  });
  setSessionType('focus');
  updateStats();
}

// Timetable Logic
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function renderTimetable(events) {
  const root = document.getElementById('timetable');
  root.innerHTML = '';
  for (let d=0; d<7; d++) {
    const col = document.createElement('div');
    col.className = 'day-column';
    col.dataset.day = String(d);
    col.innerHTML = `<div class="day-header">${DAY_LABELS[d]} <span class="hint">drop here</span></div>`;
    col.addEventListener('dragover', e=>{ e.preventDefault(); });
    col.addEventListener('drop', async e=>{
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
const ev = AppState.events.find(x=>x.id===id);
      if (!ev) return;
      ev.day = d;
      await Api.upsertEvent(ev);
      renderTimetable(AppState.events);
    });

    const dayEvents = events.filter(e=>e.day===d).sort((a,b)=> (a.time||'').localeCompare(b.time||''));
    for (const ev of dayEvents) {
      const card = document.createElement('div');
      card.className = 'event-card';
      card.draggable = true;
      card.dataset.id = ev.id;
      card.addEventListener('dragstart', e=>{
        e.dataTransfer.setData('text/plain', ev.id);
      });
const link = ev.linkTaskId ? (AppState.todos.find(t=>t.id===ev.linkTaskId)?.title || '') : '';
      card.innerHTML = `
        <div class="event-title">${ev.title}</div>
        <div class="event-meta"><span>${ev.time||''}</span>${link?`<span>• ${link}</span>`:''}</div>
        <div class="event-actions">
          <button class="btn" data-action="edit" data-id="${ev.id}">Edit</button>
          <button class="btn" data-action="delete" data-id="${ev.id}">Delete</button>
        </div>
      `;
      col.appendChild(card);
    }
    root.appendChild(col);
  }
}

function initTimetable() {
  const form = document.getElementById('event-form');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const title = document.getElementById('event-title').value.trim();
    const day = Number(document.getElementById('event-day').value);
    const time = document.getElementById('event-time').value || '';
    const linkTaskId = document.getElementById('event-link').value || null;
    if (!title) return;
    const ev = { id: uuid(), title, day, time, linkTaskId };
    await Api.upsertEvent(ev);
    form.reset();
    renderTimetable(await Api.listEvents());
    Toast.show('Event added');
  });

  document.getElementById('timetable').addEventListener('click', async e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === 'delete') {
      await Api.deleteEvent(id);
      renderTimetable(await Api.listEvents());
    } else if (btn.dataset.action === 'edit') {
      const events = await Api.listEvents();
      const ev = events.find(x=>x.id===id);
      if (!ev) return;
      const title = prompt('Edit title', ev.title) || ev.title;
      const time = prompt('Edit time (HH:MM)', ev.time) || ev.time;
      await Api.upsertEvent({ ...ev, title, time });
      renderTimetable(await Api.listEvents());
    }
  });
}

async function initApp() {
  await initAuth();
  initTodos();
  initPomodoro();
  initTimetable();
  try { await loadTodos(); } catch {}
  try { renderTimetable(await Api.listEvents()); } catch { renderTimetable([]); }
  initHome();
  updateAuthUI();
}

// Auth wired to backend
async function initAuth() {
  const navAuth = document.getElementById('nav-auth');

  async function refreshMe() {
    try {
      const { user } = await Api.me();
      if (user) Storage.set('currentUser', user); else Storage.set('currentUser', null);
    } catch { Storage.set('currentUser', null); }
  }
  await refreshMe();

  if (Storage.get('currentUser', null)) {
    navAuth.textContent = 'Logout';
    navAuth.onclick = async () => { await Api.logout(); Storage.set('currentUser', null); updateAuthUI(); location.hash = '#home'; };
  }

  const loginForm = document.getElementById('form-login');
  const signupForm = document.getElementById('form-signup');

  document.querySelectorAll('[data-authtab]').forEach(tab => {
    tab.addEventListener('click', () => {
      const t = tab.dataset.authtab;
      document.getElementById('form-login').classList.toggle('hidden', t !== 'login');
      document.getElementById('form-signup').classList.toggle('hidden', t !== 'signup');
    });
  });

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    try {
      const user = await Api.login({ email, password });
      Storage.set('currentUser', { id: user.id, name: user.name, email: user.email });
      updateAuthUI();
      location.hash = '#todo';
      Toast.show(`Welcome, ${user.name}`);
    } catch (err) { Toast.show('Invalid credentials'); }
  });

  signupForm.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const password = document.getElementById('signup-password').value;
    try {
      const user = await Api.signup({ name, email, password });
      Storage.set('currentUser', { id: user.id, name: user.name, email: user.email });
      updateAuthUI();
      location.hash = '#todo';
      Toast.show(`Welcome, ${user.name}`);
    } catch (err) { Toast.show('Sign up failed'); }
  });
}

function initHome() {
  const cta = document.getElementById('cta-get-started');
  if (cta) cta.addEventListener('click', () => { location.hash = '#auth'; });
}

function updateAuthUI() {
  const logged = isLoggedIn();
  // toggle nav items
  document.querySelectorAll('.nav-link').forEach(el => {
    const route = el.dataset.route;
    if (!route) return;
    if (PROTECTED_ROUTES.has(route)) {
      el.style.display = logged ? '' : 'none';
    }
  });
  // toggle auth button state
  const navAuth = document.getElementById('nav-auth');
  if (navAuth) {
    if (logged) {
      navAuth.textContent = 'Logout';
navAuth.onclick = async () => { await Api.logout(); Storage.set('currentUser', null); updateAuthUI(); location.hash = '#home'; };
    } else {
      navAuth.textContent = 'Login';
      navAuth.onclick = null;
    }
  }
  // redirect if currently on protected route while logged out
  if (!logged && PROTECTED_ROUTES.has(location.hash)) {
    setActiveRoute('#home');
    location.hash = '#home';
  }
}


