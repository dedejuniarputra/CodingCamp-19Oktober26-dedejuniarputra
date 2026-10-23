/* ============================================================
   Life Dashboard — app.js
   Challenges implemented:
     1. Light / Dark mode
     2. Custom name in greeting
     3. Prevent duplicate tasks
   ============================================================ */

'use strict';

/* ── Storage helpers ─────────────────────────────────────── */
const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

/* ── DOM refs ─────────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);

const clock         = $('clock');
const dateDisplay   = $('dateDisplay');
const greetingText  = $('greetingText');
const themeToggle   = $('themeToggle');
const nameDisplay   = $('nameDisplay');
const editNameBtn   = $('editNameBtn');
const nameModal     = $('nameModal');
const nameInput     = $('nameInput');
const saveNameBtn   = $('saveNameBtn');
const cancelNameBtn = $('cancelNameBtn');

const timerDisplay  = $('timerDisplay');
const timerMinutes  = $('timerMinutes');
const applyDuration = $('applyDuration');
const startBtn      = $('startBtn');
const stopBtn       = $('stopBtn');
const resetBtn      = $('resetBtn');

const taskInput     = $('taskInput');
const addTaskBtn    = $('addTaskBtn');
const taskList      = $('taskList');
const taskError     = $('taskError');
const sortSelect    = $('sortSelect');

const linkName      = $('linkName');
const linkUrl       = $('linkUrl');
const addLinkBtn    = $('addLinkBtn');
const linkList      = $('linkList');
const linkError     = $('linkError');

/* ═══════════════════════════════════════════════════════════
   1. CLOCK & GREETING
   ═══════════════════════════════════════════════════════════ */
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function getGreeting(hour) {
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
}

function pad(n) { return String(n).padStart(2, '0'); }

function updateClock() {
  const now  = new Date();
  const h    = now.getHours();
  const m    = now.getMinutes();
  const s    = now.getSeconds();

  clock.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;

  dateDisplay.textContent =
    `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  const name = storage.get('userName', '');
  greetingText.textContent = name
    ? `${getGreeting(h)}, ${name}!`
    : `${getGreeting(h)}!`;
}

setInterval(updateClock, 1000);
updateClock();

/* ═══════════════════════════════════════════════════════════
   2. DARK / LIGHT MODE  (Challenge #1)
   ═══════════════════════════════════════════════════════════ */
function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  themeToggle.checked = dark;
  storage.set('darkMode', dark);
}

// Load saved preference
applyTheme(storage.get('darkMode', false));

themeToggle.addEventListener('change', () => applyTheme(themeToggle.checked));

/* ═══════════════════════════════════════════════════════════
   3. CUSTOM NAME  (Challenge #2)
   ═══════════════════════════════════════════════════════════ */
function loadName() {
  const name = storage.get('userName', '');
  nameDisplay.textContent = name ? `Hi, ${name}` : 'Set your name';
}

function openNameModal() {
  nameInput.value = storage.get('userName', '');
  nameModal.classList.add('active');
  nameInput.focus();
}

function closeNameModal() {
  nameModal.classList.remove('active');
}

function saveName() {
  const val = nameInput.value.trim();
  if (val) storage.set('userName', val);
  closeNameModal();
  loadName();
  updateClock();
}

editNameBtn.addEventListener('click', openNameModal);
saveNameBtn.addEventListener('click', saveName);
cancelNameBtn.addEventListener('click', closeNameModal);
nameModal.addEventListener('click', (e) => { if (e.target === nameModal) closeNameModal(); });
nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveName(); });

loadName();

/* ═══════════════════════════════════════════════════════════
   4. FOCUS TIMER  (with custom duration)
   ═══════════════════════════════════════════════════════════ */
let timerDuration = storage.get('timerDuration', 25); // minutes
let timerSeconds  = timerDuration * 60;
let timerInterval = null;
let timerRunning  = false;

timerMinutes.value = timerDuration;

function formatTimer(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${pad(m)}:${pad(s)}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTimer(timerSeconds);
}

function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  timerInterval = setInterval(() => {
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerDisplay.textContent = '00:00';
      // Simple audio beep via Web Audio API
      playBeep();
      return;
    }
    timerSeconds--;
    renderTimer();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
}

function resetTimer() {
  stopTimer();
  timerSeconds = timerDuration * 60;
  renderTimer();
}

function applyTimerDuration() {
  const val = parseInt(timerMinutes.value, 10);
  if (isNaN(val) || val < 1 || val > 99) {
    timerMinutes.value = timerDuration;
    return;
  }
  stopTimer();
  timerDuration = val;
  storage.set('timerDuration', timerDuration);
  timerSeconds = timerDuration * 60;
  renderTimer();
}

function playBeep() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.2);
  } catch { /* audio not available */ }
}

startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', stopTimer);
resetBtn.addEventListener('click', resetTimer);
applyDuration.addEventListener('click', applyTimerDuration);
timerMinutes.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyTimerDuration(); });

renderTimer();

/* ═══════════════════════════════════════════════════════════
   5. TASKS  (+ duplicate prevention, sort)
   ═══════════════════════════════════════════════════════════ */
let tasks = storage.get('tasks', []);
// Each task: { id, text, done }

function saveTasks() { storage.set('tasks', tasks); }

function showTaskError(msg) {
  taskError.textContent = msg;
  setTimeout(() => { taskError.textContent = ''; }, 3000);
}

/* Challenge #3 — prevent duplicates */
function isDuplicate(text) {
  return tasks.some(t => t.text.toLowerCase() === text.toLowerCase());
}

function getSortedTasks() {
  const order = sortSelect.value;
  const copy  = [...tasks];
  if (order === 'az')   copy.sort((a, b) => a.text.localeCompare(b.text));
  if (order === 'za')   copy.sort((a, b) => b.text.localeCompare(a.text));
  if (order === 'done') copy.sort((a, b) => Number(a.done) - Number(b.done));
  return copy;
}

function renderTasks() {
  taskList.innerHTML = '';

  const sorted = getSortedTasks();

  if (sorted.length === 0) {
    taskList.innerHTML = '<li style="color:var(--text-muted);font-size:.85rem;padding:8px 4px;">No tasks yet. Add one above!</li>';
    return;
  }

  sorted.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.id = task.id;

    const checkbox = document.createElement('input');
    checkbox.type    = 'checkbox';
    checkbox.checked = task.done;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as done`);
    checkbox.addEventListener('change', () => toggleTask(task.id));

    const span = document.createElement('span');
    span.className = 'task-text' + (task.done ? ' done' : '');
    span.textContent = task.text;
    // Double-click to edit
    span.addEventListener('dblclick', () => enterEditMode(li, task));

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-edit';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', `Edit "${task.text}"`);
    editBtn.addEventListener('click', () => enterEditMode(li, task));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-danger';
    delBtn.textContent = 'Delete';
    delBtn.setAttribute('aria-label', `Delete "${task.text}"`);
    delBtn.addEventListener('click', () => deleteTask(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(actions);

    taskList.appendChild(li);
  });
}

function enterEditMode(li, task) {
  // Replace span with input
  const existingInput = li.querySelector('.task-edit-input');
  if (existingInput) return; // already editing

  const span = li.querySelector('.task-text');
  const input = document.createElement('input');
  input.type      = 'text';
  input.className = 'task-edit-input';
  input.value     = task.text;
  input.setAttribute('aria-label', 'Edit task');

  span.replaceWith(input);
  input.focus();
  input.select();

  function commitEdit() {
    const newText = input.value.trim();
    if (!newText) { renderTasks(); return; }

    // Duplicate check (ignore current task itself)
    const dupExists = tasks.some(
      t => t.id !== task.id && t.text.toLowerCase() === newText.toLowerCase()
    );
    if (dupExists) {
      showTaskError('⚠️ A task with that name already exists.');
      input.focus();
      return;
    }

    task.text = newText;
    saveTasks();
    renderTasks();
  }

  input.addEventListener('blur', commitEdit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  { input.blur(); }
    if (e.key === 'Escape') { renderTasks(); }
  });
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) { showTaskError('⚠️ Task cannot be empty.'); return; }

  if (isDuplicate(text)) {
    showTaskError('⚠️ That task already exists!');
    taskInput.select();
    return;
  }

  tasks.push({ id: Date.now(), text, done: false });
  saveTasks();
  taskInput.value = '';
  taskError.textContent = '';
  renderTasks();
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) { task.done = !task.done; saveTasks(); renderTasks(); }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(); });
sortSelect.addEventListener('change', renderTasks);

renderTasks();

/* ═══════════════════════════════════════════════════════════
   6. QUICK LINKS
   ═══════════════════════════════════════════════════════════ */
let links = storage.get('links', [
  { id: 1, name: 'Google',   url: 'https://www.google.com'   },
  { id: 2, name: 'Gmail',    url: 'https://mail.google.com'  },
  { id: 3, name: 'Calendar', url: 'https://calendar.google.com' }
]);

function saveLinks() { storage.set('links', links); }

function showLinkError(msg) {
  linkError.textContent = msg;
  setTimeout(() => { linkError.textContent = ''; }, 3000);
}

function isValidUrl(str) {
  try { new URL(str); return true; }
  catch { return false; }
}

function renderLinks() {
  linkList.innerHTML = '';
  links.forEach(link => {
    const chip = document.createElement('a');
    chip.className = 'link-chip';
    chip.href      = link.url;
    chip.target    = '_blank';
    chip.rel       = 'noopener noreferrer';
    chip.setAttribute('aria-label', `Open ${link.name}`);

    const nameSpan = document.createElement('span');
    nameSpan.textContent = link.name;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-link';
    removeBtn.textContent = '×';
    removeBtn.setAttribute('aria-label', `Remove ${link.name}`);
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault(); // don't follow the link
      deleteLink(link.id);
    });

    chip.appendChild(nameSpan);
    chip.appendChild(removeBtn);
    linkList.appendChild(chip);
  });
}

function addLink() {
  const name = linkName.value.trim();
  let   url  = linkUrl.value.trim();

  if (!name) { showLinkError('⚠️ Please enter a link name.'); linkName.focus(); return; }
  if (!url)  { showLinkError('⚠️ Please enter a URL.');       linkUrl.focus();  return; }

  // Auto-prepend https:// if missing
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  if (!isValidUrl(url)) { showLinkError('⚠️ That URL doesn\'t look valid.'); return; }

  links.push({ id: Date.now(), name, url });
  saveLinks();
  linkName.value = '';
  linkUrl.value  = '';
  linkError.textContent = '';
  renderLinks();
}

function deleteLink(id) {
  links = links.filter(l => l.id !== id);
  saveLinks();
  renderLinks();
}

addLinkBtn.addEventListener('click', addLink);
linkUrl.addEventListener('keydown', (e) => { if (e.key === 'Enter') addLink(); });

renderLinks();
