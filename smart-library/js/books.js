
"use strict";

const books = [
  {
    id: 1,
    title: "The Silent Patient",
    author: "Alex Michaelides",
    genre: "Mystery",
    interests: ["Mystery", "Psychology", "Thriller"],
    description: "A psychological mystery surrounding a painter who stops speaking after a shocking crime.",
    symbol: "◈",
    color: "#35546a",
    available: true
  },
  {
    id: 2,
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    genre: "Fantasy",
    interests: ["Fantasy", "Adventure"],
    description: "Join an unlikely hero on an unforgettable journey through a magical world.",
    symbol: "✦",
    color: "#63774b",
    available: true
  },
  {
    id: 3,
    title: "Atomic Habits",
    author: "James Clear",
    genre: "Self-Help",
    interests: ["Self-Help", "Psychology", "Productivity"],
    description: "Learn how small daily improvements can create remarkable long-term changes.",
    symbol: "✳",
    color: "#bd9250",
    available: true
  },
  {
    id: 4,
    title: "Sapiens",
    author: "Yuval Noah Harari",
    genre: "History",
    interests: ["History", "Science", "Philosophy"],
    description: "Explore the major developments that shaped human civilization.",
    symbol: "⌘",
    color: "#895d50",
    available: true
  },
  {
    id: 5,
    title: "Dune",
    author: "Frank Herbert",
    genre: "Science Fiction",
    interests: ["Science Fiction", "Adventure", "Philosophy"],
    description: "Politics, ecology, and destiny collide on a desert planet.",
    symbol: "☼",
    color: "#b47b4e",
    available: true
  },
  {
    id: 6,
    title: "The Psychology of Money",
    author: "Morgan Housel",
    genre: "Psychology",
    interests: ["Psychology", "Self-Help", "Finance"],
    description: "Discover how behavior and personal experiences influence financial decisions.",
    symbol: "◎",
    color: "#477b70",
    available: true
  },
  {
    id: 7,
    title: "Harry Potter",
    author: "J.K. Rowling",
    genre: "Fantasy",
    interests: ["Fantasy", "Adventure", "Mystery"],
    description: "A young wizard discovers a hidden world of friendship and danger.",
    symbol: "✧",
    color: "#76537f",
    available: true
  },
  {
    id: 8,
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    genre: "Science",
    interests: ["Science", "Philosophy"],
    description: "Explore big questions about the universe, time, and the cosmos.",
    symbol: "☾",
    color: "#405b82",
    available: true
  },
  {
    id: 9,
    title: "Sherlock Holmes",
    author: "Arthur Conan Doyle",
    genre: "Mystery",
    interests: ["Mystery", "History", "Psychology"],
    description: "Follow a brilliant detective as he solves puzzling cases through observation.",
    symbol: "⌕",
    color: "#6d7162",
    available: true
  },
  {
    id: 10,
    title: "The Alchemist",
    author: "Paulo Coelho",
    genre: "Philosophy",
    interests: ["Philosophy", "Adventure", "Self-Help"],
    description: "A young shepherd travels in search of treasure and discovers his purpose.",
    symbol: "◇",
    color: "#b58a50",
    available: true
  },
  {
    id: 11,
    title: "Deep Work",
    author: "Cal Newport",
    genre: "Productivity",
    interests: ["Productivity", "Self-Help", "Psychology"],
    description: "Learn strategies for focused work and meaningful accomplishments.",
    symbol: "▤",
    color: "#466a5b",
    available: true
  },
  {
    id: 12,
    title: "The Martian",
    author: "Andy Weir",
    genre: "Science Fiction",
    interests: ["Science Fiction", "Science", "Adventure"],
    description: "An astronaut uses ingenuity and science to survive alone on Mars.",
    symbol: "♂",
    color: "#a75f45",
    available: false
  }
];

const interestOptions = [
  { name: "Mystery", emoji: "🔎", description: "Puzzles and secrets" },
  { name: "Fantasy", emoji: "🐉", description: "Magic and wonder" },
  { name: "Adventure", emoji: "🧭", description: "Journeys and discovery" },
  { name: "Science Fiction", emoji: "🚀", description: "Future and technology" },
  { name: "Science", emoji: "🔬", description: "Discover how things work" },
  { name: "History", emoji: "🏛️", description: "People and the past" },
  { name: "Psychology", emoji: "🧠", description: "Understand the mind" },
  { name: "Self-Help", emoji: "🌱", description: "Grow and improve" },
  { name: "Philosophy", emoji: "💭", description: "Ideas and big questions" },
  { name: "Productivity", emoji: "🎯", description: "Focus and achieve goals" },
  { name: "Finance", emoji: "💰", description: "Money and decisions" },
  { name: "Thriller", emoji: "⚡", description: "Suspense and tension" }
];