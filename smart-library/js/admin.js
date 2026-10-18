const API = '../api/admin/';
let books = [];
let editId = null;

const $ = (id) => document.getElementById(id);

function esc(value) {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}

function say(text, ok = true) {
  const el = $('message');
  el.textContent = text || '';
  el.className = ok ? 'ok' : 'err';
}

async function api(file, method = 'GET', body) {
  const res = await fetch(API + file, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try { data = await res.json(); }
  catch { data = { success: false, message: 'Unexpected server response.' }; }

  if (res.status === 401 || res.status === 403) {
    document.querySelector('main').innerHTML =
      '<p class="err">' + esc(data.message) + ' <a href="../auth/login.php">Log in as admin</a></p>';
    throw new Error('denied');
  }
  return data;
}

/* ---------- Tabs ---------- */
document.querySelectorAll('nav button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('nav button').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('section').forEach((s) => s.classList.remove('active'));
    btn.classList.add('active');
    $('tab-' + btn.dataset.tab).classList.add('active');
    say('');
    loadTab(btn.dataset.tab);
  });
});

function loadTab(tab) {
  if (tab === 'books' || tab === 'inventory') return loadBooks();
  if (tab === 'users') return loadUsers();
  if (tab === 'transactions') return loadTransactions();
}

/* ---------- Books + Inventory ---------- */
async function loadBooks() {
  const data = await api('books.php');
  if (!data.success) return say(data.message, false);
  books = data.books;

  $('books-body').innerHTML = books.map((b) => `
    <tr>
      <td>${esc(b.title)}</td>
      <td>${esc(b.author)}</td>
      <td>${esc(b.genre)}</td>
      <td>${Number(b.available_copies)} / ${Number(b.total_copies)}</td>
      <td>
        <button class="btn small" data-edit="${Number(b.id)}">Edit</button>
        <button class="btn small danger" data-delete="${Number(b.id)}">Delete</button>
      </td>
    </tr>`).join('');

  const genres = {};
  books.forEach((b) => {
    const g = genres[b.genre] || (genres[b.genre] = { titles: 0, total: 0, avail: 0 });
    g.titles += 1;
    g.total += Number(b.total_copies);
    g.avail += Number(b.available_copies);
  });
  $('inventory-body').innerHTML = Object.entries(genres).map(([name, g]) => `
    <tr><td>${esc(name)}</td><td>${g.titles}</td><td>${g.total}</td>
        <td>${g.avail}</td><td>${g.total - g.avail}</td></tr>`).join('');
}

$('books-body').addEventListener('click', async (e) => {
  const editBtn = e.target.closest('[data-edit]');
  const delBtn = e.target.closest('[data-delete]');

  if (editBtn) {
    const b = books.find((x) => x.id === Number(editBtn.dataset.edit));
    if (!b) return;
    editId = b.id;
    const f = $('book-form');
    f.title.value = b.title;
    f.author.value = b.author;
    f.genre.value = b.genre;
    f.total_copies.value = b.total_copies;
    f.description.value = b.description || '';
    $('form-title').textContent = 'Edit book';
    $('cancel-edit').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (delBtn) {
    if (!confirm('Delete this book? This cannot be undone.')) return;
    const data = await api('books.php', 'DELETE', { id: Number(delBtn.dataset.delete) });
    say(data.message, data.success);
    if (data.success) loadBooks();
  }
});

function resetForm() {
  editId = null;
  $('book-form').reset();
  $('form-title').textContent = 'Add a book';
  $('cancel-edit').hidden = true;
}
$('cancel-edit').addEventListener('click', resetForm);

$('book-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const payload = {
    title: f.title.value,
    author: f.author.value,
    genre: f.genre.value,
    description: f.description.value,
    total_copies: Number(f.total_copies.value),
  };
  let data;
  if (editId) {
    payload.id = editId;
    data = await api('books.php', 'PUT', payload);
  } else {
    data = await api('books.php', 'POST', payload);
  }
  say(data.message || (data.success ? 'Saved.' : 'Failed.'), data.success);
  if (data.success) { resetForm(); loadBooks(); }
});

/* ---------- Users ---------- */
async function loadUsers() {
  const data = await api('users.php');
  if (!data.success) return say(data.message, false);

  $('users-body').innerHTML = data.users.map((u) => `
    <tr>
      <td>${esc(u.full_name)}</td>
      <td>${esc(u.email)}</td>
      <td>
        <select data-user="${Number(u.id)}">
          <option value="user" ${u.role === 'user' ? 'selected' : ''}>user</option>
          <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>admin</option>
        </select>
      </td>
      <td>${Number(u.active_borrows)}</td>
      <td>${esc(u.created_at)}</td>
    </tr>`).join('');
}

$('users-body').addEventListener('change', async (e) => {
  const sel = e.target.closest('[data-user]');
  if (!sel) return;
  const data = await api('users.php', 'PUT', { id: Number(sel.dataset.user), role: sel.value });
  say(data.message, data.success);
  loadUsers();
});

/* ---------- Transactions ---------- */
async function loadTransactions() {
  const data = await api('transactions.php');
  if (!data.success) return say(data.message, false);

  $('transactions-body').innerHTML = data.transactions.map((t) => `
    <tr>
      <td>${esc(t.full_name)}<br><small>${esc(t.email)}</small></td>
      <td>${esc(t.title)}</td>
      <td>${esc(t.borrowed_at)}</td>
      <td>${esc(t.due_date)}</td>
      <td>${esc(t.returned_at || '-')}</td>
      <td class="${Number(t.overdue) ? 'overdue' : ''}">${Number(t.overdue) ? 'OVERDUE' : esc(t.status)}</td>
    </tr>`).join('');
}

/* ---------- Start ---------- */
loadBooks().catch(() => {});