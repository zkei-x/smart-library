

"use strict";

// Find the HTML elements that JavaScript needs to control.
const interestForm = document.getElementById("interest-form");
const interestOptionsContainer = document.getElementById("interest-options");
const selectionCount = document.getElementById("selection-count");
const assessmentMessage = document.getElementById("assessment-message");
const recommendationSection = document.getElementById("recommendations");
const recommendationList = document.getElementById("recommendation-list");
const recommendationSummary = document.getElementById("recommendation-summary");
const editInterestsButton = document.getElementById("edit-interests");
const catalogList = document.getElementById("catalog-list");
const searchInput = document.getElementById("book-search");
const genreFilter = document.getElementById("genre-filter");
const bookCount = document.getElementById("book-count");
const emptyCatalog = document.getElementById("empty-catalog");

// Save the current assessment choices in memory for this page session.
let selectedInterests = [];

// State shared with the PHP API.
let currentUser = { loggedIn: false };
let borrowedIds = new Set();

// ---------- Small helpers ----------
function toast(text, ok = true) {
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
  box.style.background = ok ? "#315b41" : "#b42318";
  box.style.display = "block";
  clearTimeout(box.timer);
  box.timer = setTimeout(() => {
    box.style.display = "none";
  }, 3500);
}

async function postJson(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body)
  });
  try {
    return await res.json();
  } catch {
    return { success: false, message: "Unexpected server response." };
  }
}

function makeLink(href, text) {
  const a = document.createElement("a");
  a.href = href;
  a.textContent = text;
  return a;
}

// ---------- Book cards ----------
function createActionButtons(book) {
  const wrap = document.createElement("div");
  wrap.style.cssText =
    "display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;width:100%";

  const save = document.createElement("button");
  save.type = "button";
  save.textContent = "Save to list";
  save.addEventListener("click", async () => {
    if (!currentUser.loggedIn) return toast("Please log in first.", false);
    const data = await postJson("api/reading-lists.php", "POST", {
      book_id: book.id
    });
    toast(data.message || "Done.", data.success);
  });

  const isBorrowed = borrowedIds.has(book.id);
  const action = document.createElement("button");
  action.type = "button";
  action.textContent = isBorrowed ? "Return" : "Borrow";
  action.disabled = !isBorrowed && !book.available;
  action.addEventListener("click", async () => {
    if (!currentUser.loggedIn) return toast("Please log in first.", false);
    const file = borrowedIds.has(book.id) ? "return.php" : "borrow.php";
    const data = await postJson("api/" + file, "POST", { book_id: book.id });
    toast(data.message || "Done.", data.success);
    loadLibrary();
  });

  wrap.append(save, action);
  return wrap;
}

// Create HTML elements safely when displaying book data.
function createBookCard(book, score = null) {
  const card = document.createElement("article");
  card.className = "book-card";

  const cover = document.createElement("div");
  cover.className = "book-cover";
  cover.style.backgroundColor = book.color;

  const symbol = document.createElement("span");
  symbol.className = "cover-symbol";
  symbol.textContent = book.symbol;

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
  genre.textContent = book.genre;

  const title = document.createElement("h3");
  title.textContent = book.title;

  const author = document.createElement("p");
  author.textContent = "by " + book.author;

  const description = document.createElement("p");
  description.className = "book-description";
  description.textContent = book.description;

  const footer = document.createElement("div");
  footer.className = "book-footer";

  const availability = document.createElement("span");
  availability.textContent = book.available
    ? "● Available"
    : "● Currently borrowed";
  availability.style.color = book.available ? "#477b50" : "#a35e48";

  footer.appendChild(availability);
  footer.appendChild(createActionButtons(book));

  if (score !== null) {
    const match = document.createElement("span");
    match.className = "match-score";
    match.textContent = score + " matching interest" + (score === 1 ? "" : "s");
    footer.appendChild(match);
  }

  details.append(genre, title, author, description, footer);
  card.append(cover, details);

  return card;
}

// ---------- Interest assessment ----------
// Generate the interest selection cards from books.js.
function renderInterestOptions() {
  interestOptionsContainer.replaceChildren();

  interestOptions.forEach((interest) => {
    const label = document.createElement("label");
    label.className = "interest-option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "interests";
    checkbox.value = interest.name;

    const emoji = document.createElement("span");
    emoji.className = "interest-emoji";
    emoji.textContent = interest.emoji;
    emoji.setAttribute("aria-hidden", "true");

    const textContainer = document.createElement("span");

    const name = document.createElement("span");
    name.className = "interest-name";
    name.textContent = interest.name;

    const description = document.createElement("small");
    description.textContent = interest.description;
    description.style.display = "block";
    description.style.color = "#737a72";
    description.style.fontSize = "11px";

    textContainer.append(name, description);
    label.append(checkbox, emoji, textContainer);
    interestOptionsContainer.appendChild(label);

    checkbox.addEventListener("change", updateSelectionCount);
  });
}

// Update the number of interests selected.
function updateSelectionCount() {
  const checked = interestOptionsContainer.querySelectorAll(
    'input[name="interests"]:checked'
  );

  const count = checked.length;
  selectionCount.textContent =
    count + " interest" + (count === 1 ? "" : "s") + " selected";

  assessmentMessage.textContent = "";
}

// Rank books according to the number of matching interests.
// The score is a simple count, not an AI-generated probability.
function getRecommendations(interests) {
  return books
    .map((book) => {
      const score = book.interests.filter((interest) =>
        interests.includes(interest)
      ).length;

      return { book, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      // Prefer higher interest matches, then available books.
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      if (a.book.available !== b.book.available) {
        return a.book.available ? -1 : 1;
      }

      return a.book.title.localeCompare(b.book.title);
    });
}

// Show recommendations after a valid assessment.
function showRecommendations(interests, scroll = true) {
  selectedInterests = interests;

  const matches = getRecommendations(interests);

  recommendationList.replaceChildren();

  matches.forEach(({ book, score }) => {
    recommendationList.appendChild(createBookCard(book, score));
  });

  recommendationSummary.textContent =
    matches.length +
    " matching books for your interests: " +
    interests.join(", ") +
    ".";

  recommendationSection.classList.remove("hidden");
  assessmentMessage.textContent = "";

  if (scroll) {
    recommendationSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

// Handle assessment submission.
interestForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const interests = Array.from(
    interestOptionsContainer.querySelectorAll(
      'input[name="interests"]:checked'
    )
  ).map((checkbox) => checkbox.value);

  if (interests.length === 0) {
    assessmentMessage.textContent =
      "Please select at least one interest to discover your books.";
    return;
  }

  if (currentUser.loggedIn) {
    postJson("api/preferences.php", "POST", { favorite_genres: interests });
  }

  showRecommendations(interests);
});

// Allow the user to change their assessment choices.
editInterestsButton.addEventListener("click", () => {
  recommendationSection.classList.add("hidden");

  interestOptionsContainer
    .querySelectorAll('input[name="interests"]')
    .forEach((checkbox) => {
      checkbox.checked = selectedInterests.includes(checkbox.value);
    });

  updateSelectionCount();

  document.getElementById("discover").scrollIntoView({
    behavior: "smooth"
  });
});

// ---------- Catalog ----------
// Fill the genre filter using the genres in the catalog.
function renderGenreOptions() {
  const genres = [...new Set(books.map((book) => book.genre))].sort();

  genres.forEach((genre) => {
    const option = document.createElement("option");
    option.value = genre;
    option.textContent = genre;
    genreFilter.appendChild(option);
  });
}

// Render the catalog based on the current search and filter.
function renderCatalog() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedGenre = genreFilter.value;

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.genre.toLowerCase().includes(query);

    const matchesGenre =
      selectedGenre === "All" || book.genre === selectedGenre;

    return matchesSearch && matchesGenre;
  });

  catalogList.replaceChildren();

  filteredBooks.forEach((book) => {
    catalogList.appendChild(createBookCard(book));
  });

  bookCount.textContent =
    filteredBooks.length +
    " book" +
    (filteredBooks.length === 1 ? "" : "s");

  emptyCatalog.classList.toggle("hidden", filteredBooks.length > 0);
}

searchInput.addEventListener("input", renderCatalog);
genreFilter.addEventListener("change", renderCatalog);

// ---------- Connection to the PHP API ----------
function renderAuthBar() {
  let bar = document.getElementById("auth-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "auth-bar";
    bar.style.cssText =
      "position:fixed;top:8px;right:8px;z-index:900;background:#fffffff2;" +
      "padding:6px 14px;border-radius:999px;font-size:13px;" +
      "box-shadow:0 2px 8px #0003";
    document.body.appendChild(bar);
  }
  bar.replaceChildren();

  if (currentUser.loggedIn) {
    bar.append(currentUser.name + " · ", makeLink("auth/profile.php", "Profile"));
    if (currentUser.role === "admin") {
      bar.append(" · ", makeLink("admin/dashboard.html", "Admin"));
    }
    bar.append(" · ", makeLink("auth/logout.php", "Log out"));
  } else {
    bar.append(
      makeLink("auth/login.php", "Log in"),
      " · ",
      makeLink("auth/register.php", "Sign up")
    );
  }
}

async function loadLibrary() {
  try {
    const res = await fetch("api/books.php", { credentials: "same-origin" });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    books.length = 0;
    books.push(...data.books);

    borrowedIds = new Set();
    if (currentUser.loggedIn) {
      const r = await fetch("api/borrow.php", { credentials: "same-origin" });
      const d = await r.json();
      (d.borrowings || [])
        .filter((b) => b.status === "borrowed")
        .forEach((b) => borrowedIds.add(Number(b.book_id)));
    }
  } catch (err) {
    toast("Could not load books from the database.", false);
  }

  const keep = genreFilter.value;
  genreFilter.length = 1; // keep only the "All" option
  renderGenreOptions();
  genreFilter.value = keep;
  renderCatalog();

  if (!recommendationSection.classList.contains("hidden")) {
    showRecommendations(selectedInterests, false);
  }
}

async function init() {
  renderInterestOptions();

  try {
    const res = await fetch("api/me.php", { credentials: "same-origin" });
    currentUser = await res.json();
  } catch {
    currentUser = { loggedIn: false };
  }
  renderAuthBar();

  await loadLibrary();

  if (currentUser.loggedIn) {
    try {
      const res = await fetch("api/preferences.php", {
        credentials: "same-origin"
      });
      const data = await res.json();
      if (data.success && data.favorite_genres.length) {
        interestOptionsContainer
          .querySelectorAll('input[name="interests"]')
          .forEach((box) => {
            box.checked = data.favorite_genres.includes(box.value);
          });
        updateSelectionCount();
      }
    } catch {
      /* preferences are optional */
    }
  }
}

init();