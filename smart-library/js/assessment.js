"use strict";

document.addEventListener("DOMContentLoaded", async function () {
  const form = document.getElementById("assessment-form");
  const message = document.getElementById("assessment-message");
  const results = document.getElementById("recommendations");
  const resultList = document.getElementById("recommendation-list");
  const summary = document.getElementById("recommendation-summary");
  const retakeButton = document.getElementById("retake-assessment");

  const catalogList = document.getElementById("catalog-list");
  const searchInput = document.getElementById("book-search");
  const genreFilter = document.getElementById("genre-filter");
  const bookCount = document.getElementById("book-count");
  const emptyCatalog = document.getElementById("empty-catalog");

  let catalog = [];
  let currentUser = { loggedIn: false };
  let borrowedIds = new Set();
  let lastAnswers = null;

  if (!form || !catalogList || !searchInput || !genreFilter) {
    console.error("Smart Library: A required HTML element is missing.");
    return;
  }

  // ---------- Small helpers ----------
  function toast(text, ok) {
    let box = document.getElementById("toast");
    if (!box) {
      box = document.createElement("div");
      box.id = "toast";
      box.style.cssText =
        "position:fixed;bottom:16px;left:50%;transform:translateX(-50%);" +
        "padding:10px 18px;border-radius:8px;color:#fff;z-index:999;" +
        "max-width:90%;text-align:center";
      document.body.appendChild(box);
    }
    box.textContent = text;
    box.style.background = ok === false ? "#b42318" : "#315b41";
    box.style.display = "block";
    clearTimeout(box.timer);
    box.timer = setTimeout(function () {
      box.style.display = "none";
    }, 3500);
  }

  async function postJson(url, method, body) {
    const res = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body)
    });
    try {
      return await res.json();
    } catch (e) {
      return { success: false, message: "Unexpected server response." };
    }
  }

  function makeLink(href, text) {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = text;
    return a;
  }

  // ---------- Login bar ----------
  function styleLink(link, filled) {
    link.style.cssText =
      "display:inline-block;padding:9px 16px;border-radius:10px;" +
      "font-size:14px;font-weight:700;text-decoration:none;" +
      (filled
        ? "background:#315b48;color:#fff;border:1px solid #315b48;"
        : "background:#fff;color:#182d29;border:1px solid #d9ded4;");
    return link;
  }

  function renderAuthBar() {
    let bar = document.getElementById("auth-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "auth-bar";
      const navbar = document.querySelector(".navbar");
      if (navbar) {
        // Sit inside the site's own navigation bar.
        bar.style.cssText =
          "display:flex;align-items:center;gap:10px;margin-left:12px;" +
          "white-space:nowrap";
        navbar.appendChild(bar);
      } else {
        bar.style.cssText =
          "position:fixed;top:8px;right:8px;z-index:900;display:flex;" +
          "align-items:center;gap:8px;background:rgba(255,255,255,.95);" +
          "padding:8px 12px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.25)";
        document.body.appendChild(bar);
      }
    }
    bar.replaceChildren();

    if (currentUser.loggedIn) {
      const avatar = document.createElement("span");
      avatar.textContent = String(currentUser.name || "?").trim().charAt(0).toUpperCase();
      avatar.style.cssText =
        "display:inline-grid;place-items:center;width:36px;height:36px;" +
        "border-radius:50%;background:#d8ad66;color:#182d29;" +
        "font-weight:800;font-size:16px";

      const name = document.createElement("span");
      name.textContent = currentUser.name;
      name.style.cssText = "font-weight:700;font-size:14px";

      bar.append(avatar, name, styleLink(makeLink("auth/profile.php", "Profile"), false));
      if (currentUser.role === "admin") {
        bar.append(styleLink(makeLink("admin/dashboard.html", "Admin"), false));
      }
      bar.append(styleLink(makeLink("auth/logout.php", "Log out"), true));
    } else {
      bar.append(
        styleLink(makeLink("auth/login.php", "Log in"), false),
        styleLink(makeLink("auth/register.php", "Sign up"), true)
      );
    }
  }

  async function loadUser() {
    try {
      const res = await fetch("api/me.php", { credentials: "same-origin" });
      currentUser = await res.json();
    } catch (e) {
      currentUser = { loggedIn: false };
    }
    renderAuthBar();
  }

  async function loadBorrowed() {
    borrowedIds = new Set();
    if (!currentUser.loggedIn) return;

    try {
      const res = await fetch("api/borrow.php", {
        credentials: "same-origin",
        cache: "no-store"
      });
      const data = await res.json();
      const list = data.borrowings || [];
      list.forEach(function (b) {
        if (b.status === "borrowed") {
          borrowedIds.add(Number(b.book_id));
        }
      });
    } catch (e) {
      console.error("Could not load borrowings:", e);
    }
  }

  // ---------- Book cards ----------
  function createActionButtons(book) {
    const wrap = document.createElement("div");
    wrap.style.cssText =
      "display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;width:100%";

    const save = document.createElement("button");
    save.type = "button";
    save.className = "button button-light";
    save.style.cssText = "padding:7px 14px;font-size:13px;cursor:pointer";
    save.textContent = "Save to list";
    save.addEventListener("click", async function () {
      if (!currentUser.loggedIn) {
        toast("Please log in first.", false);
        return;
      }
      const data = await postJson("api/reading-lists.php", "POST", {
        book_id: book.id
      });
      toast(data.message || "Done.", data.success);
    });

    const isBorrowed = borrowedIds.has(book.id);
    const action = document.createElement("button");
    action.type = "button";
    action.className = "button button-primary";
    action.style.cssText = "padding:7px 14px;font-size:13px;cursor:pointer";
    action.textContent = isBorrowed ? "Return" : "Borrow";
    action.disabled = !isBorrowed && !book.available;
    action.addEventListener("click", async function () {
      if (!currentUser.loggedIn) {
        toast("Please log in first.", false);
        return;
      }
      const file = borrowedIds.has(book.id) ? "return.php" : "borrow.php";
      const data = await postJson("api/" + file, "POST", { book_id: book.id });
      toast(data.message || "Done.", data.success);
      refreshLibrary();
    });

    wrap.append(save, action);
    return wrap;
  }

  // Create book cards using the same classes as your existing CSS.
  function createBookCard(book, scoreText) {
    const card = document.createElement("article");
    card.className = "book-card";

    const cover = document.createElement("div");
    cover.className = "book-cover";
    cover.style.backgroundColor = book.color || "#477b70";

    const symbol = document.createElement("span");
    symbol.className = "cover-symbol";
    symbol.textContent = book.symbol || "\u25A4";

    const coverTitle = document.createElement("div");
    coverTitle.className = "cover-title";
    coverTitle.textContent = book.title;

    const coverAuthor = document.createElement("div");
    coverAuthor.className = "cover-author";
    coverAuthor.textContent = book.author;

    cover.append(symbol, coverTitle, coverAuthor);

    const details = document.createElement("div");
    details.className = "book-details";

    const genre = document.createElement("span");
    genre.className = "book-genre";
    genre.textContent = book.genre || "General";

    const title = document.createElement("h3");
    title.textContent = book.title;

    const author = document.createElement("p");
    author.textContent = "by " + book.author;

    const description = document.createElement("p");
    description.className = "book-description";
    description.textContent = book.description || "No description available.";

    const footer = document.createElement("div");
    footer.className = "book-footer";

    const availability = document.createElement("span");
    availability.textContent = book.available
      ? "\u25CF Available"
      : "\u25CF Currently borrowed";
    availability.style.color = book.available ? "#477b50" : "#a35e48";

    footer.appendChild(availability);

    if (scoreText) {
      const match = document.createElement("span");
      match.className = "match-score";
      match.textContent = scoreText;
      footer.appendChild(match);
    }

    details.append(
      genre,
      title,
      author,
      description,
      footer,
      createActionButtons(book)
    );
    card.append(cover, details);

    return card;
  }

  // ---------- Loading books ----------
  // Load books from the PHP API, which reads the MySQL database.
  async function loadBooks(quiet) {
    if (!quiet) message.textContent = "Loading books from the database...";

    try {
      const response = await fetch("api/books.php", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("The books API returned HTTP " + response.status);
      }

      const data = await response.json();

      if (!data.success || !Array.isArray(data.books)) {
        throw new Error("The API response did not contain a books array.");
      }

      catalog = data.books;

      if (catalog.length === 0) {
        message.textContent = "There are no books in the database yet.";
        return false;
      }

      message.textContent = "";
      return true;
    } catch (error) {
      console.error("Could not load database books:", error);
      message.textContent =
        "Could not load books from MySQL. Check that Apache and MySQL are running and api/books.php works.";
      return false;
    }
  }

  // Build the genre filter from the actual database records.
  function renderGenreOptions() {
    genreFilter.replaceChildren();

    const allOption = document.createElement("option");
    allOption.value = "All";
    allOption.textContent = "All genres";
    genreFilter.appendChild(allOption);

    const genres = Array.from(
      new Set(
        catalog
          .map(function (book) { return book.genre; })
          .filter(Boolean)
      )
    ).sort();

    genres.forEach(function (genre) {
      const option = document.createElement("option");
      option.value = genre;
      option.textContent = genre;
      genreFilter.appendChild(option);
    });
  }

  // Search by title, author, genre, or description.
  function renderCatalog() {
    const query = searchInput.value.trim().toLowerCase();
    const selectedGenre = genreFilter.value;

    const filtered = catalog.filter(function (book) {
      const matchesSearch = [
        book.title,
        book.author,
        book.genre,
        book.description
      ].some(function (value) {
        return String(value || "").toLowerCase().includes(query);
      });

      const matchesGenre =
        selectedGenre === "All" || book.genre === selectedGenre;

      return matchesSearch && matchesGenre;
    });

    catalogList.replaceChildren();

    filtered.forEach(function (book) {
      catalogList.appendChild(createBookCard(book, ""));
    });

    bookCount.textContent =
      filtered.length + (filtered.length === 1 ? " book" : " books");

    if (emptyCatalog) {
      emptyCatalog.classList.toggle("hidden", filtered.length > 0);
    }
  }

  // Reload books and borrowings after a borrow/return, without moving the page.
  async function refreshLibrary() {
    const ok = await loadBooks(true);
    if (!ok) return;

    await loadBorrowed();

    const keep = genreFilter.value;
    renderGenreOptions();
    const stillThere = Array.from(genreFilter.options).some(function (o) {
      return o.value === keep;
    });
    if (stillThere) {
      genreFilter.value = keep;
    }
    renderCatalog();

    if (lastAnswers && !results.hidden) {
      showMatches(lastAnswers, false);
    }
  }

  // ---------- Recommendations ----------
  // Generate personalized results using assessment answers.
  // This is a basic matching algorithm, not an AI prediction.
  function findRecommendations(answers) {
    const goalKeywords = {
      "Entertainment": ["fantasy", "mystery", "adventure", "thriller", "fiction"],
      "Learning": ["science", "history", "philosophy", "educational"],
      "Skills": ["productivity", "finance", "self-help", "psychology"],
      "Personal Growth": ["self-help", "psychology", "productivity", "philosophy"],
      "Academic": ["science", "history", "educational", "philosophy"]
    };

    const scored = catalog.map(function (book) {
      const genre = String(book.genre || "").toLowerCase();
      const interests = Array.isArray(book.interests)
        ? book.interests.map(function (value) {
            return String(value).toLowerCase();
          })
        : [genre];

      const searchable = [
        book.title,
        book.author,
        book.genre,
        book.description
      ].concat(interests).join(" ").toLowerCase();

      let score = 0;

      answers.genres.forEach(function (selected) {
        const value = selected.toLowerCase();

        if (genre === value) score += 4;
        else if (interests.includes(value)) score += 3;
      });

      answers.interests.forEach(function (selected) {
        const value = selected.toLowerCase();

        if (interests.includes(value)) score += 3;
        else if (searchable.includes(value)) score += 1;
      });

      const keywords = goalKeywords[answers.goal] || [];

      if (keywords.some(function (keyword) {
        return searchable.includes(keyword);
      })) {
        score += 2;
      }

      // Only use these preferences if matching metadata exists in the API.
      const type = String(book.book_type || "").toLowerCase();
      const difficulty = String(book.difficulty || "").toLowerCase();

      if (answers.bookType !== "Any" && type) {
        if (type === answers.bookType.toLowerCase()) score += 2;
      }

      if (answers.difficulty !== "Any" && difficulty) {
        if (difficulty === answers.difficulty.toLowerCase()) score += 1;
      }

      return { book: book, score: score };
    });

    return scored
      .filter(function (item) { return item.score > 0; })
      .sort(function (a, b) {
        if (b.score !== a.score) return b.score - a.score;

        if (a.book.available !== b.book.available) {
          return a.book.available ? -1 : 1;
        }

        return a.book.title.localeCompare(b.book.title);
      })
      .slice(0, 6);
  }

  function showMatches(answers, scroll) {
    const matches = findRecommendations(answers);

    resultList.replaceChildren();

    if (!matches.length) {
      summary.textContent =
        "No close matches were found. Try choosing different interests.";
    } else {
      summary.textContent =
        "Here are " + matches.length +
        " recommendations based on your answers.";
    }

    matches.forEach(function (item) {
      resultList.appendChild(
        createBookCard(item.book, item.score + " matching points")
      );
    });

    results.hidden = false;
    results.classList.remove("hidden");

    if (scroll) {
      results.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!catalog.length) {
      message.textContent = "No books are loaded yet. Please refresh the page.";
      return;
    }

    const data = new FormData(form);

    const answers = {
      genres: data.getAll("genres"),
      interests: data.getAll("interests"),
      goal: data.get("goal"),
      bookType: data.get("bookType"),
      difficulty: data.get("difficulty")
    };

    if (!answers.genres.length) {
      message.textContent = "Please select at least one favorite genre.";
      return;
    }

    if (!answers.goal || !answers.bookType || !answers.difficulty) {
      message.textContent = "Please answer all five assessment questions.";
      return;
    }

    lastAnswers = answers;

    // Logged-in users get their favorite genres saved to their profile.
    if (currentUser.loggedIn) {
      postJson("api/preferences.php", "POST", {
        favorite_genres: answers.genres
      });
    }

    showMatches(answers, true);
  });

  if (retakeButton) {
    retakeButton.addEventListener("click", function () {
      form.reset();
      lastAnswers = null;
      message.textContent = "";
      results.hidden = true;
      results.classList.add("hidden");
      resultList.replaceChildren();
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  searchInput.addEventListener("input", renderCatalog);
  genreFilter.addEventListener("change", renderCatalog);

  // ---------- Start ----------
  await loadUser();

  // Wait until the database books arrive before rendering the catalog.
  const loaded = await loadBooks(false);

  if (loaded) {
    await loadBorrowed();
    renderGenreOptions();
    renderCatalog();
    console.log("Smart Library loaded " + catalog.length + " books from MySQL.");
  }

  // Pre-check the user's saved favorite genres.
  if (currentUser.loggedIn) {
    try {
      const res = await fetch("api/preferences.php", {
        credentials: "same-origin",
        cache: "no-store"
      });
      const prefs = await res.json();
      if (prefs.success && Array.isArray(prefs.favorite_genres)) {
        form.querySelectorAll('input[name="genres"]').forEach(function (box) {
          box.checked = prefs.favorite_genres.includes(box.value);
        });
      }
    } catch (e) {
      /* preferences are optional */
    }
  }
});