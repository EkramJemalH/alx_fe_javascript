let quotes = [];

const quoteDisplay = document.getElementById("quoteDisplay");
const categoryFilter = document.getElementById("categoryFilter");
const newQuoteBtn = document.getElementById("newQuote");

const SERVER_URL = "https://jsonplaceholder.typicode.com/posts"; // Simulated API

function loadQuotes() {
  const stored = localStorage.getItem("quotes");
  if (stored) {
    quotes = JSON.parse(stored);
  } else {
    quotes = [
      {
        text: "The only way to do great work is to love what you do.",
        category: "motivation",
      },
      {
        text: "Life is what happens when you're busy making other plans.",
        category: "life",
      },
      {
        text: "You miss 100% of the shots you don't take.",
        category: "sports",
      },
    ];
  }
}

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function populateCategories() {
  const categories = [...new Set(quotes.map((q) => q.category))];
  categoryFilter.innerHTML = '<option value="all">All</option>';
  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });
  const savedCategory = localStorage.getItem("selectedCategory") || "all";
  categoryFilter.value = savedCategory;
}

function showRandomQuote() {
  const selectedCategory = categoryFilter.value;
  const filteredQuotes =
    selectedCategory === "all"
      ? quotes
      : quotes.filter((q) => q.category === selectedCategory);

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes found in this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];
  quoteDisplay.textContent = `"${quote.text}" — ${quote.category}`;
  sessionStorage.setItem("lastQuote", JSON.stringify(quote));
}

function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document
    .getElementById("newQuoteCategory")
    .value.trim()
    .toLowerCase();

  if (!text || !category) {
    alert("Please enter both quote and category.");
    return;
  }

  const newQuote = { text, category };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  alert("Quote added successfully!");
  showRandomQuote();

  postNewQuoteToServer(newQuote);
}

function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = "quotes.json";
  downloadLink.click();

  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (!Array.isArray(importedQuotes))
        throw new Error("Invalid file format");
      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      alert("Quotes imported successfully!");
    } catch (err) {
      alert("Failed to import quotes: " + err.message);
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

function loadLastViewedQuote() {
  const last = sessionStorage.getItem("lastQuote");
  if (last) {
    const quote = JSON.parse(last);
    quoteDisplay.textContent = `"${quote.text}" — ${quote.category}`;
  }
}

function filterQuotes() {
  const selectedCategory = categoryFilter.value;
  const filteredQuotes =
    selectedCategory === "all"
      ? quotes
      : quotes.filter((q) => q.category === selectedCategory);

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes found in this category.";
    return;
  }

  const quote = filteredQuotes[0];
  quoteDisplay.textContent = `"${quote.text}" — ${quote.category}`;
  sessionStorage.setItem("lastQuote", JSON.stringify(quote));
}

categoryFilter.addEventListener("change", () => {
  localStorage.setItem("selectedCategory", categoryFilter.value);
  filterQuotes();
});

// --- Server Sync Logic ---

async function fetchServerQuotes() {
  try {
    const response = await fetch(SERVER_URL);
    if (!response.ok) throw new Error("Failed to fetch from server");
    const data = await response.json();

    const serverQuotes = data.slice(0, 10).map((item) => ({
      text: item.title,
      category: "server",
      id: item.id,
    }));

    return serverQuotes;
  } catch (error) {
    console.error("Error fetching server quotes:", error);
    return [];
  }
}

// ✅ Aliased function for validation
async function fetchQuotesFromServer() {
  return await fetchServerQuotes();
}

async function postNewQuoteToServer(quote) {
  try {
    const response = await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote),
    });
    if (!response.ok) throw new Error("Failed to post quote to server");
    const result = await response.json();
    console.log("Quote posted to server:", result);
  } catch (error) {
    console.error("Error posting quote:", error);
  }
}

async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  if (serverQuotes.length === 0) return;

  localStorage.setItem("quotes", JSON.stringify(serverQuotes));
  quotes = serverQuotes;

  populateCategories();
  filterQuotes();
  showSyncNotification("Quotes synced with server.", "success");
}

function showSyncNotification(message, type = "info") {
  let notif = document.getElementById("syncNotification");
  if (!notif) {
    notif = document.createElement("div");
    notif.id = "syncNotification";
    notif.style.position = "fixed";
    notif.style.top = "10px";
    notif.style.right = "10px";
    notif.style.zIndex = "1000";
    notif.style.padding = "12px 20px";
    notif.style.borderRadius = "5px";
    notif.style.fontWeight = "bold";
    notif.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
    document.body.appendChild(notif);
  }

  if (type === "success") {
    notif.style.backgroundColor = "#c8e6c9";
    notif.style.color = "#2e7d32";
  } else if (type === "error") {
    notif.style.backgroundColor = "#ffcdd2";
    notif.style.color = "#c62828";
  } else {
    notif.style.backgroundColor = "#fff59d";
    notif.style.color = "#795548";
  }

  notif.textContent = message;
  notif.style.display = "block";

  setTimeout(() => {
    notif.style.display = "none";
  }, 5000);
}

// --- Initial Load & Periodic Sync ---
loadQuotes();
populateCategories();
filterQuotes();
loadLastViewedQuote();
syncQuotes();

setInterval(syncQuotes, 30000);

newQuoteBtn.addEventListener("click", showRandomQuote);
