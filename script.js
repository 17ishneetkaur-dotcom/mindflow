const STORAGE_KEY = "mindflow-entries";

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function addEntry(content) {
  const entries = loadEntries();
  entries.unshift({
    id: Date.now(),
    content,
    createdAt: new Date().toISOString(),
  });
  saveEntries(entries);
  return entries;
}

const tabButtons = document.querySelectorAll(".tab-btn, .review-btn");
const panels = document.querySelectorAll(".panel");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.tab;
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    panels.forEach((p) => p.classList.remove("active"));
    document.getElementById(`tab-${target}`).classList.add("active");

    if (target === "progress") loadProgress();
    if (target === "review") loadReview();
  });
});

// ---------- Journal Flow ----------
const journalInput = document.getElementById("journal-input");
const journalSaveBtn = document.getElementById("journal-save");
const journalSaved = document.getElementById("journal-saved");

function saveJournalEntry() {
  const content = journalInput.value.trim();
  if (!content) return;

  addEntry(content);
  journalInput.value = "";
  journalSaved.classList.add("show");
  setTimeout(() => journalSaved.classList.remove("show"), 2500);
}

journalSaveBtn.addEventListener("click", saveJournalEntry);
journalInput.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") saveJournalEntry();
});

// ---------- Mood Shift (local, no AI) ----------
const moodInput = document.getElementById("mood-input");
const moodAnalyzeBtn = document.getElementById("mood-analyze");
const moodResult = document.getElementById("mood-result");

const MOOD_LEXICON = [
  { keywords: ["anxious", "anxiety", "worried", "nervous", "panic", "stressed", "overwhelmed"], mood: "anxious",
    reframes: [
      "This feeling is temporary, even if it doesn't feel that way right now.",
      "You don't need to solve everything at once — just the next small step.",
      "Anxiety often exaggerates the odds of the worst outcome.",
    ],
    calm: "Take a slow breath in for 4 counts, hold for 4, and release for 6. Your body can settle even when your mind is racing.",
    step: "Write down the one thing causing the most worry, then one action, however small, you can take today.",
  },
  { keywords: ["sad", "down", "depressed", "lonely", "empty", "hopeless", "hurt"], mood: "sad",
    reframes: [
      "It's okay to feel this way — emotions are information, not failures.",
      "This moment doesn't define your whole story.",
      "Reaching out, even in a small way, is a sign of strength, not weakness.",
    ],
    calm: "Let yourself sit with the feeling for a moment without judging it. You are allowed to feel low sometimes.",
    step: "Message or call one person who makes you feel a little lighter, even just to say hello.",
  },
  { keywords: ["angry", "mad", "furious", "frustrated", "annoyed", "irritated"], mood: "frustrated",
    reframes: [
      "Anger often signals something important to you was crossed — that's worth noticing.",
      "You can feel the intensity without acting on it immediately.",
      "A pause now can protect a relationship or decision you care about.",
    ],
    calm: "Unclench your jaw and shoulders. Let your exhale be longer than your inhale for a few rounds.",
    step: "Step away for 10 minutes before responding to whatever triggered this feeling.",
  },
  { keywords: ["happy", "great", "excited", "grateful", "good", "joy", "proud", "calm", "peaceful"], mood: "positive",
    reframes: [
      "Notice what led to this feeling — it's worth repeating.",
      "You deserve to enjoy this moment fully.",
      "Sharing good moments with others can make them last longer.",
    ],
    calm: "Take a second to really notice this feeling in your body — where do you feel it?",
    step: "Write down what contributed to this mood so you can return to it later.",
  },
  { keywords: ["tired", "exhausted", "drained", "burnt out", "burned out"], mood: "exhausted",
    reframes: [
      "Rest is productive, not a failure to keep up.",
      "You don't have to earn the right to slow down.",
      "Small pockets of rest add up over a day.",
    ],
    calm: "Let your shoulders drop and your breathing slow. You don't need to fix anything right now.",
    step: "Give yourself permission to take a 10-minute break with no screen before doing anything else.",
  },
];

const DEFAULT_MOOD = { mood: "reflective",
  reframes: [
    "Naming a feeling is the first step to understanding it.",
    "Whatever you're experiencing, it's valid.",
    "You showed up here to check in with yourself — that matters.",
  ],
  calm: "Take a moment to breathe slowly and notice how your body feels right now.",
  step: "Jot down one word that captures how you feel, and one thing you need right now.",
};

const AFFIRMATIONS = [
  "You are doing better than you think.",
  "This feeling is passing through, not staying forever.",
  "You have gotten through hard moments before.",
  "It's okay to take things one step at a time.",
  "You are allowed to prioritize your wellbeing.",
];

function analyzeMoodLocally(text) {
  const lower = text.toLowerCase();
  const match = MOOD_LEXICON.find((entry) =>
    entry.keywords.some((kw) => lower.includes(kw))
  ) || DEFAULT_MOOD;

  const affirmation = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
  return { ...match, affirmation };
}

function renderMoodResult(result) {
  document.getElementById("mood-detected").textContent = result.mood;
  const list = document.getElementById("mood-reframes");
  list.innerHTML = "";
  result.reframes.forEach((r) => {
    const li = document.createElement("li");
    li.textContent = r;
    list.appendChild(li);
  });
  document.getElementById("mood-calm").textContent = result.calm;
  document.getElementById("mood-step").textContent = result.step;
  document.getElementById("mood-affirm").textContent = result.affirmation;
  moodResult.classList.remove("hidden");
}

moodAnalyzeBtn.addEventListener("click", () => {
  const text = moodInput.value.trim();
  if (!text) return;
  const result = analyzeMoodLocally(text);
  renderMoodResult(result);
});

// ---------- Progress Memory ----------
function computeSummary(entries) {
  const total = entries.length;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const entriesThisWeek = entries.filter((e) => new Date(e.createdAt) >= weekAgo).length;

  return { totalEntries: total, entriesThisWeek };
}

function loadProgress() {
  const entries = loadEntries();
  const summary = computeSummary(entries);

  document.getElementById("stat-total").textContent = summary.totalEntries;
  document.getElementById("stat-week").textContent = summary.entriesThisWeek;
  document.getElementById("stat-trend").textContent =
    summary.totalEntries > 0 ? "steady" : "—";

  const timeline = document.getElementById("timeline");
  timeline.innerHTML = "";

  if (entries.length === 0) {
    timeline.innerHTML = `<div class="empty-state">Your space is empty. Start typing in Journal Flow when you're ready.</div>`;
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "timeline-item";
    const date = new Date(entry.createdAt);
    const dateStr = date.toLocaleDateString(undefined, {
      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
    });
    item.innerHTML = `
      <p class="timeline-date">${dateStr}</p>
      <p class="timeline-text">${escapeHtml(entry.content)}</p>
    `;
    timeline.appendChild(item);
  });
}

// ---------- Review (local, rule-based, no AI) ----------
function loadReview() {
  const container = document.getElementById("review-content");
  const entries = loadEntries();
  const summary = computeSummary(entries);

  if (!summary.totalEntries) {
    container.innerHTML = `<p class="empty-state">Write a few journal entries first, and your review will appear here.</p>`;
    return;
  }

  const insights = [];
  if (summary.totalEntries >= 5) {
    insights.push("You've built a real habit of checking in with yourself — consistency like this compounds over time.");
  } else {
    insights.push("You're just getting started with journaling — every entry adds to a clearer picture of your patterns.");
  }
  if (summary.entriesThisWeek > 0) {
    insights.push(`You've written ${summary.entriesThisWeek} ${summary.entriesThisWeek === 1 ? "entry" : "entries"} this week, showing you're actively making space for reflection.`);
  }

  const suggestions = [
    "Try journaling at the same time each day to build a steady rhythm.",
    "When a strong emotion comes up, use Mood Shift to work through it in the moment.",
    "Revisit older entries occasionally to notice how far you've come.",
  ];

  const overallMessage = "You're building a valuable habit of self-reflection. Keep going, one entry at a time.";

  container.innerHTML = `
    <div class="review-block">
      <h3>Personal insights</h3>
      <ul>${insights.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
    </div>
    <div class="review-block">
      <h3>Suggestions</h3>
      <ul>${suggestions.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
    </div>
    <p class="review-message">${escapeHtml(overallMessage)}</p>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
