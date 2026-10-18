<?php
declare(strict_types=1);

session_start();

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

function escape(string $value): string {
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My Profile | Smart Library</title>
  <link rel="stylesheet" href="../css/style.css">
  <style>
    body { display: flex; flex-direction: column; min-height: 100vh; margin: 0; }
    .profile-wrap { width: calc(100% - 32px); max-width: 760px; margin: 50px auto; }
    .profile-wrap h1 { margin-bottom: 6px; font-family: Georgia, "Times New Roman", serif;
      font-size: 32px; font-weight: 500; }
    .panel { margin-top: 20px; padding: 24px; background: #fff; border: 1px solid var(--line);
      border-radius: var(--radius); box-shadow: var(--shadow); }
    .panel h2 { margin-bottom: 12px; font-family: Georgia, "Times New Roman", serif;
      font-size: 21px; font-weight: 500; }
    .panel p { margin-bottom: 6px; color: var(--muted); font-size: 14px; }
    .item { display: flex; justify-content: space-between; align-items: center; gap: 12px;
      padding: 11px 0; border-top: 1px solid var(--line); }
    .item:first-of-type { border-top: 0; }
    .item strong { display: block; font-size: 14px; }
    .item small { color: var(--muted); font-size: 12px; }
    .item .button { min-height: 36px; padding: 6px 14px; flex-shrink: 0; }
    .tags { display: flex; flex-wrap: wrap; gap: 8px; }
    .tag { padding: 5px 11px; border-radius: 999px; background: #edf1e8;
      color: var(--green); font-size: 12px; font-weight: 700; }
    .empty { color: var(--muted); font-size: 13px; }
    .late { color: #b42318; font-weight: 700; }
    .links { margin-top: 18px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
    .links a:not(.button) { color: var(--green); font-weight: 700; font-size: 14px; }
    #toast { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
      padding: 10px 18px; border-radius: 8px; color: #fff; z-index: 999;
      max-width: 90%; text-align: center; display: none; }
    .footer { margin-top: auto; }
  </style>
</head>
<body>
  <header class="navbar">
    <a href="../index.html#home" class="brand">
      <span class="brand-icon">▤</span>
      <span>Smart<span class="brand-accent">Library</span></span>
    </a>

    <nav aria-label="Main navigation">
      <a href="../index.html#home">Home</a>
      <a href="../index.html#discover">Discover</a>
      <a href="../index.html#catalog">Book Catalog</a>
    </nav>

    <a class="nav-button" href="../index.html#discover">Find My Books ↗</a>
  </header>

  <main class="profile-wrap">
    <h1>My Library Profile</h1>
    <p>Welcome, <?= escape((string) $_SESSION['user_name']) ?>!</p>

    <section class="panel">
      <h2>Account</h2>
      <p>Email: <?= escape((string) $_SESSION['user_email']) ?></p>
      <p>Account role: <?= escape((string) $_SESSION['user_role']) ?></p>

      <div class="links">
        <a href="../index.html">Back to the library</a>
        <?php if (($_SESSION['user_role'] ?? '') === 'admin'): ?>
          <a href="../admin/dashboard.html">Admin dashboard</a>
        <?php endif; ?>
        <form action="logout.php" method="post" style="margin:0">
          <button class="button button-primary" type="submit">Log out</button>
        </form>
      </div>
    </section>

    <section class="panel">
      <h2>Favorite genres</h2>
      <div id="genres" class="tags"></div>
    </section>

    <section class="panel">
      <h2>My reading list</h2>
      <div id="reading-list"></div>
    </section>

    <section class="panel">
      <h2>Books I borrowed</h2>
      <div id="borrowed"></div>
    </section>

    <section class="panel">
      <h2>Borrowing history</h2>
      <div id="history"></div>
    </section>
  </main>

  <footer class="footer">
    <a href="../index.html#home" class="brand">
      <span class="brand-icon">▤</span>
      <span>Smart<span class="brand-accent">Library</span></span>
    </a>

    <p>Read with purpose. Discover with curiosity.</p>
    <span>Smart Library · Local Demo</span>
  </footer>

  <div id="toast" role="status"></div>

  <script>
    "use strict";

    const $ = (id) => document.getElementById(id);

    function toast(text, ok) {
      const box = $("toast");
      box.textContent = text;
      box.style.background = ok === false ? "#b42318" : "#315b41";
      box.style.display = "block";
      clearTimeout(box.timer);
      box.timer = setTimeout(function () { box.style.display = "none"; }, 3500);
    }

    async function api(url, method, body) {
      const options = { method: method || "GET", credentials: "same-origin", cache: "no-store" };
      if (body) {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify(body);
      }
      try {
        const res = await fetch(url, options);
        return await res.json();
      } catch (e) {
        return { success: false, message: "Could not reach the server." };
      }
    }

    function emptyNote(container, text) {
      const p = document.createElement("p");
      p.className = "empty";
      p.textContent = text;
      container.replaceChildren(p);
    }

    function makeRow(title, subtitle, buttonText, onClick) {
      const row = document.createElement("div");
      row.className = "item";

      const text = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = title;
      const small = document.createElement("small");
      small.textContent = subtitle;
      text.append(strong, small);
      row.appendChild(text);

      if (buttonText) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "button button-light";
        button.textContent = buttonText;
        button.addEventListener("click", onClick);
        row.appendChild(button);
      }
      return row;
    }

    async function loadGenres() {
      const data = await api("../api/preferences.php");
      const box = $("genres");
      const genres = data.success ? data.favorite_genres : [];
      if (!genres.length) {
        emptyNote(box, "No favorite genres saved yet. Take the assessment on the main page.");
        return;
      }
      box.replaceChildren();
      genres.forEach(function (g) {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = g;
        box.appendChild(tag);
      });
    }

    async function loadReadingList() {
      const data = await api("../api/reading-lists.php");
      const box = $("reading-list");
      const books = data.success ? data.books : [];
      if (!books.length) {
        emptyNote(box, "Your reading list is empty. Use Save to list on the main page.");
        return;
      }
      box.replaceChildren();
      books.forEach(function (b) {
        box.appendChild(makeRow(b.title, b.author + " · " + b.genre, "Remove", async function () {
          const res = await api("../api/reading-lists.php", "DELETE", { book_id: Number(b.id) });
          toast(res.message || "Done.", res.success);
          loadReadingList();
        }));
      });
    }

    async function loadBorrowings() {
      const data = await api("../api/borrow.php");
      const list = data.success ? data.borrowings : [];
      const active = list.filter(function (b) { return b.status === "borrowed"; });
      const past = list.filter(function (b) { return b.status !== "borrowed"; });
      const today = new Date().toISOString().slice(0, 10);

      const borrowedBox = $("borrowed");
      if (!active.length) {
        emptyNote(borrowedBox, "You have no borrowed books right now.");
      } else {
        borrowedBox.replaceChildren();
        active.forEach(function (b) {
          const late = b.due_date < today;
          const row = makeRow(
            b.title,
            b.author + " · Due " + b.due_date + (late ? " (overdue)" : ""),
            "Return",
            async function () {
              const res = await api("../api/return.php", "POST", { book_id: Number(b.book_id) });
              toast(res.message || "Done.", res.success);
              loadBorrowings();
            }
          );
          if (late) row.querySelector("small").classList.add("late");
          borrowedBox.appendChild(row);
        });
      }

      const historyBox = $("history");
      if (!past.length) {
        emptyNote(historyBox, "No returned books yet.");
      } else {
        historyBox.replaceChildren();
        past.forEach(function (b) {
          historyBox.appendChild(makeRow(
            b.title,
            b.author + " · Borrowed " + String(b.borrowed_at).slice(0, 10) +
              " · Returned " + String(b.returned_at || "").slice(0, 10)
          ));
        });
      }
    }

    loadGenres();
    loadReadingList();
    loadBorrowings();
  </script>
</body>
</html>
