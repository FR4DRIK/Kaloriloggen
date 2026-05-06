//functions.js
loadHealthHistory();


function initNavigation() {
  // Ladda RAM EN gång vid sidstart
  loadHealthEntries();
  loadHealthHistory();
  loadWeekHistory();

  const buttons = document.querySelectorAll(".bottom-bar button");

  if (buttons.length > 0) {
    const firstButton = buttons[0];
    firstButton.classList.add("active");
    const target = firstButton.dataset.view;
    showView(target);
  }

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.view;

      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      showView(target);
    });
  });
}

function filterWeekHistoryByYear(year) {
  return weekHistoryData.filter(entry => entry.year === parseInt(year));
}

// BOTTOM BAR NAVIGATION

  // SHOW VIEW
function showView(viewId) {
  document.querySelectorAll(".view").forEach(v => {
    v.style.display = "none";
  });

  const view = document.getElementById(viewId);
  if (view) {
    view.style.display = "block";
  }

  if (viewId === "food") {
  populateFixedYearSelect("yearSelectWeek");
  populateFixedYearSelect("yearSelectHealth");
  loadWeekHistory();
  const year = document.getElementById("yearSelectWeek").value;
  renderWeekHistory(filterWeekHistoryByYear(year));
}


  if (viewId === "health") {
    loadTrainingStartDate();
    updateTrainingDays();
    healthList.render();
    const year = document.getElementById("yearSelectHealth").value;
    renderHealthHistory(filterHealthHistoryByYear(year));
    populateFixedYearSelect("yearSelectWeek");
    populateFixedYearSelect("yearSelectHealth");
  }

  if (viewId === "settings") {
    loadTrainingStartDate();
    updateTrainingDays();
  }
}


  // SHOW VIEW PAGES NAVIGATION //
 function initNavigation() {
  const buttons = document.querySelectorAll(".bottom-bar button");
  const views = document.querySelectorAll(".view");

  // FIRST TAB ACTIVE
  if (buttons.length > 0) {
    const firstButton = buttons[0];
    firstButton.classList.add("active");
    const target = firstButton.dataset.view;
    showView(target);
  }

  // CLICK CHANGE TAB
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.view;

      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      showView(target);
    });
  });
}

// högst upp i functions.js

window.showEditCard = function () {
  document.getElementById("editCard").classList.remove("hidden");
  document.getElementById("settingsCard").classList.add("hidden");
};

window.hideEditCard = function () {
  document.getElementById("editCard").classList.add("hidden");
  document.getElementById("settingsCard").classList.remove("hidden");
};




//#region MEAL LIST //

// CREATE MEAL LIST ITEM
function createMealListItem(item, amount, weight, cWeight, kcal, day) {
  const master = getItemById(item.id);
  const displayName = master?.name ?? item.name;
  const displayType = master?.type ?? item.type;

  const li = document.createElement("li");
  li.classList.add("list-item", "sortable-item");

  li.dataset.day = day;
  li.dataset.amount = amount;
  li.dataset.weight = weight;
  li.dataset.cWeight = cWeight;
  li.dataset.kcal = kcal;
  li.dataset.item = JSON.stringify(item);

  const weightText =
    cWeight === weight ? `${weight} g` : `${weight} g | ${cWeight} gc`;

  const detailsHTML =
  displayType === "meal"
    ? item.items.map(sub => {
        const food = getItemById(sub.id);
        if (!food) return "(okänd)";

        const normalW = food.weight ?? sub.weight;
        const actualW = sub.weight > 0 ? sub.weight : normalW;

        const kcalPer100 = food.kcal100 ?? food.kcal ?? 0;
        const subKcal = Math.round((kcalPer100 / 100) * actualW);

        const weightLabel = `${actualW} g`;
        return `${sub.amount} st | ${food.name} | ${weightLabel} | ${subKcal} kcal`;

      }).join("<br>")
    : (() => {
        const normalW = item.weight ?? weight;
        const actualW = weight > 0 ? weight : normalW;

        const cookedLabel =
          cWeight && cWeight !== actualW ? ` | ${cWeight} gc` : "";

        const weightLabel = `${actualW} g`;
      return `${amount} st | ${item.name} | ${weightLabel} | ${kcal} kcal`;

      })();

  li.innerHTML = renderUnifiedListItemHTML({
    name: displayName,
    amount: amount ?? item.amount ?? 1,
    kcal,
    day,
    detailsHTML
  }, mealConfig);

  attachUnifiedListItemEvents(li, mealList);
  mealList.appendChild(li);
  sortMealList();
  applyDayColors();
}

// LOAD FROM LOCAL - MEAL LIST
function loadFromLocal() {
  const savedMeals = JSON.parse(localStorage.getItem("mealList")) || [];
  mealList.innerHTML = "";

  savedMeals.forEach(entry => {
    createMealListItem(
      entry.item,
      entry.amount,
      entry.weight,
      entry.cWeight,
      entry.kcal,
      entry.day
    );
  });

  updateWeekSummary();
}

// SAVE TO LOCAL - MEAL LIST
function saveToLocal() {
  const data = Array.from(mealList.querySelectorAll("li")).map(li => ({
    day: li.dataset.day,
    item: JSON.parse(li.dataset.item),
    amount: Number(li.dataset.amount),
    weight: Number(li.dataset.weight),
    cWeight: Number(li.dataset.cWeight),
    kcal: Number(li.dataset.kcal)
  }));

  localStorage.setItem("mealList", JSON.stringify(data));
}

// APPLY DAY COLORS - MEAL LIST
function applyDayColors() {
  const items = Array.from(mealList.querySelectorAll("li"));
  let lastDay = null;
  let colorIndex = 0;

  items.forEach(li => {
    const day = li.dataset.day;

    if (day !== lastDay) {
      colorIndex = 1 - colorIndex;
      lastDay = day;
    }

    li.classList.remove("dayColor0", "dayColor1");
    li.classList.add(`dayColor${colorIndex}`);
  });
}

// UPDATE WEEK SUMMARY - MEAL LIST
function updateWeekSummary() {
  const mealItems = Array.from(document.querySelectorAll("#mealList li"));

  const dayTotals = {};

  mealItems.forEach(li => {
    const day = li.dataset.day;
    const kcal = Number(li.dataset.kcal || 0);

    if (!dayTotals[day]) dayTotals[day] = 0;
    dayTotals[day] += kcal;
  });

  // Sortera nyaste datum först
  const sortedDays = Object.keys(dayTotals).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  const weekSummaryEl = document.getElementById("weekSummary");
  weekSummaryEl.innerHTML = "";

  const storedGoal = localStorage.getItem("dailyKcalGoal");
  const goal = storedGoal !== null ? Number(storedGoal) : 2000; // ← basvärde


  sortedDays.forEach(day => {
    const total = dayTotals[day];
    const diff = goal ? total - goal : null;

    const diffText = diff !== null
      ? `${diff >= 0 ? "+" : ""}${diff} kcal`
      : "";

    const diffClass = diff <= 0 ? "positive" : "negative";

    const dateObj = new Date(day);
    const weekday = dateObj.getDay(); // 0 = söndag, 6 = lördag

    const li = document.createElement("li");

    // Lägg till helgklass
    if (weekday === 0 || weekday === 6) {
      li.classList.add("weekend");
    }

li.innerHTML = `
  <div class="rowBase">
    <span class="baseDay">${ds_formatDisplay(ds_fromISO(day))
}</span>
    <span>
      <span class="baseDiff ${diffClass}">${diffText}</span>
      <span class="baseValue">${total} Kcal</span>
    </span>
  </div>
`;

    weekSummaryEl.appendChild(li);
  });

  const summaryArray = sortedDays.map(day => ({
    date: day,
    totalKcal: dayTotals[day],
    diff: goal ? dayTotals[day] - goal : null
  }));

  localStorage.setItem("currentWeekSummary", JSON.stringify(summaryArray));

}

// RENDER CURRENT WEEK TOTAL - MEAL LIST
function renderCurrentWeekTotal() {
  const currentWeekTotal = calculateCurrentWeekTotal();
  const weekHistory = document.getElementById("weekHistory");
  if (!weekHistory) return;

  const now = new Date();
  const { week: currentWeek, year: currentYear } = ds_getISOWeek(now);

  // ⭐ Beräkna diff för den aktuella veckan
  const currentWeekDiff = calculateWeekDiff(currentWeek, currentYear);

  let existing = weekHistory.querySelector(`li[data-week='current']`);

  if (!existing) {
    existing = document.createElement("li");
    existing.dataset.week = "current";
    existing.classList.add("rowBase");
    weekHistory.prepend(existing);
  }

  existing.classList.add("rowBase");
  existing.innerHTML = `
    <span class="baseDay">Pågående (v${currentWeek})</span>
    <span class="diff ${currentWeekDiff >= 0 ? "pos" : "neg"}">
      (${currentWeekDiff >= 0 ? "+" : ""}${currentWeekDiff})</span>
    <span class="baseValue">${currentWeekTotal} kcal</span>
  `;
}


// RENDER WEEK HISTORY - MEAL LIST
function renderWeekHistory(list = weekHistoryData) {
  const container = document.getElementById("weekHistory");
  if (!container) return;

  // Rensa ALLT
  container.innerHTML = "";

  list.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.week - a.week;
  });

  list.forEach(entry => {
    const li = document.createElement("li");
    li.classList.add("rowBase");
    li.innerHTML = `
      <span class="baseDay">Vecka ${entry.week} (${entry.year})</span>
        <span class="diff ${entry.diff >= 0 ? "pos" : "neg"}">
          (${entry.diff >= 0 ? "+" : ""}${entry.diff})</span>
        <span class="baseValue">${entry.total} kcal</span>
    `;
    container.appendChild(li);
  });
}

// SAVE CURRENT WEEK MANUALLY - MEAL LIST
function saveCurrentWeekManually() {
  const items = Array.from(document.querySelectorAll("#mealList li"));
  if (items.length === 0) {
    showToast("det finns inga måltider att spara");
    return;
  }
  
  items.sort((a, b) => new Date(a.dataset.day) - new Date(b.dataset.day));

  const firstDate = new Date(items[0].dataset.day);
  const { week: targetWeek, year: targetYear } = ds_getISOWeek(firstDate);

  const confirmSave = confirm(
    `Spara vecka ${targetWeek}? Detta tar bort alla måltider från denna vecka.`
  );
  if (!confirmSave) return;

  let total = 0;
  const remaining = [];

  items.forEach(li => {
    const d = new Date(li.dataset.day);
    const w = ds_getISOWeek(d);

    if (w.week === targetWeek && w.year === targetYear) {
      total += Number(li.dataset.kcal || 0);
    } else {
      remaining.push(li);
    }
  });

  const diff = calculateWeekDiff(targetWeek, targetYear);
  let history = JSON.parse(localStorage.getItem("weekHistory")) || [];

  const existingIndex = history.findIndex(
    h => h.week === targetWeek && h.year === targetYear
  );

  if (existingIndex !== -1) {
    const overwrite = confirm(
      `Vecka ${targetWeek} finns redan sparad.\nVill du skriva över värdet?`
    );

    if (!overwrite) return;

  history[existingIndex].total = total;
  history[existingIndex].diff = diff;

  } else {
    history.unshift({
      week: targetWeek,
      year: targetYear,
      total: total,
      diff: diff,
    });

  }




  localStorage.setItem("weekHistory", JSON.stringify(history));
  weekHistoryData = history;              // ✅ viktig rad

  mealList.innerHTML = "";
  remaining.forEach(li => mealList.appendChild(li));
  saveToLocal();

  renderWeekHistory();
  renderCurrentWeekTotal();
  updateWeekSummary();

  showToast("Veckan sparad i historik");
}

// SORT MEAL LIST BY DATE
function sortMealList() {
  const list = document.getElementById("mealList");
  const items = Array.from(list.querySelectorAll("li"));

  const sorted = items.sort((a, b) => {
    const dateA = new Date(a.dataset.day);
    const dateB = new Date(b.dataset.day);
    return dateB - dateA; // nyaste först
  });

  list.innerHTML = "";
  sorted.forEach(li => list.appendChild(li));

  applyDayColors();
}

//#endregion MEAL LIST

//#region MEAL BUILD //

// CREATE MEAL BUILD ITEMS - MEAL BUILD
function createMealBuildItem(item, amount, totalweight, totalcWeight, kcal) {
  const li = document.createElement("li");
  li.classList.add("list-item");

  li.dataset.id = item.id;
  li.dataset.name = item.name;
  li.dataset.weight = totalweight;
  li.dataset.cWeight = totalcWeight;
  li.dataset.kcal = kcal;
  li.dataset.item = JSON.stringify(item);
  li.dataset.amount = amount;
  li.dataset.day = daySelect.value;

  // Om item är en måltid (recept) och vi bygger en portion → skala sub-items
if (item.type === "meal" && item.items && totalweight > 0) {
  const originalTotal = item.items.reduce((sum, sub) => sum + sub.weight, 0);
  const scale = totalweight / originalTotal;

  item.items = item.items.map(sub => ({
    ...sub,
    weight: Math.round(sub.weight * scale) // skala vikten
  }));
}

const detailsHTML = item.type === "meal"
  ? item.items.map(sub => {
      const food = getItemById(sub.id);
      if (!food) return "(okänd)";

      const normalW = food.weight ?? sub.weight;   // fallback
      const actualW = sub.weight > 0 ? sub.weight : normalW;

      const kcalPer100 = food.kcal100 ?? food.kcal ?? 0;
      const subKcal = Math.round((kcalPer100 / 100) * actualW);

      const weightLabel = `${actualW} g`;
      return `${sub.amount} st | ${food.name} | ${weightLabel} | ${subKcal} kcal`;

    }).join("<br>")
  : (() => {
      const normalW = item.weight ?? totalweight;
      const actualW = totalweight > 0 ? totalweight : normalW;

      const weightLabel = `${actualW} g`;
      return `${amount} st | ${item.name} | ${weightLabel} | ${kcal} kcal`;

    })();

    li.innerHTML = renderUnifiedListItemHTML({
      name: item.name,
      amount,
      kcal,
      day: li.dataset.day,
      detailsHTML
    }, mealConfig);

  attachUnifiedListItemEvents(li, mealBuild);
  mealBuild.appendChild(li);

  updateTotalKcal();
  updateRemainingKcal();
}

// HANDLE SELECTED ITEMS - MEAL BUILD
function handleSelectedItem(item) {
  const amount = Number(amountSelect.value) || 1;
  const weight = Number(weightInput.value) || item.weight || 0;

  const totalweight = weight * amount;
  const cookedRatio = item.weight && item.cWeight
  ? item.cWeight / item.weight
  : item.cPercent / 100;

  const totalcWeight = Math.round(totalweight * cookedRatio);

  const kcalPer100 = item.kcal100 ?? item.kcal ?? 0;
  const kcal = Math.round((kcalPer100 / 100) * totalweight);

  createMealBuildItem(
    item,
    amount,
    totalweight,
    totalcWeight,
    kcal
  );
}

// RESET MEALBUILD
function resetMealBuild() {
  
  mealBuild.innerHTML = "";

  document.querySelectorAll("#add input, #add select").forEach(el => {
    el.value = "";
  });

  // återställ vald dag via daySelector (korrekt källa)
 if (window.mealDay) {
    window.mealDay.setToToday();
  }

  updateTotalKcal();
  updateRemainingKcal();
  showToast("Åtgärden avbröts!");

  if (typeof updateMealBuildButtons === "function") {
    updateMealBuildButtons();
  }
}

// LOAD HEALTH HISTORY
function loadHealthHistory() {
  const saved = localStorage.getItem("healthHistory");
  healthHistoryData = saved ? JSON.parse(saved) : [];
}



//#endregion MEAL BUILD

//#region DROPDOWN //

// SETUP DROPDOWN
function setupDropdown(inputId, listId, getData, onSelect) {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);

  input.addEventListener("click", () => {
  const items = getData(); // hela listan
  renderDropdownList(list, items, onSelect);
 });

  // 1. Öppna dropdown när fältet får fokus
input.addEventListener("focus", () => {
  const query = input.value.toLowerCase();
  input.placeholder = "";

  const items = getData()
    .filter(item => item.name.toLowerCase().includes(query))
    .sort((a, b) => {
      if (query === "") return a.name.localeCompare(b.name);
      return getMatchScore(b.name, query) - getMatchScore(a.name, query);
    });

  renderDropdownList(list, items, onSelect);
  list.classList.add("open");
});

input.addEventListener("blur", () => {
  input.placeholder = "Sök…";
});

// 2. Filtrera medan man skriver
input.addEventListener("input", () => {
  const query = input.value.toLowerCase();

  const items = getData()
    .filter(item => item.name.toLowerCase().includes(query))
    .sort((a, b) => {
      if (query === "") return a.name.localeCompare(b.name);
      return getMatchScore(b.name, query) - getMatchScore(a.name, query);
    });

  renderDropdownList(list, items, onSelect);
});
}

// RENDER DROPDOWN LIST
function renderDropdownList(list, items, onSelect) {
  list.innerHTML = "";
  list.style.display = items.length ? "block" : "none";

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = renderItemLayout(item);

  div.onclick = () => {
  const wrapper = list.closest(".dropdown");
  const input = wrapper.querySelector("input");

  if (input) {
    input.value = getDisplayText(item);  
  }

  list.style.display = "none";
  onSelect(item);
};

    list.appendChild(div);
  });

  document.addEventListener("click", (e) => {
  const lists = document.querySelectorAll(".dropdown-list");

  lists.forEach(list => {
    const wrapper = list.closest(".dropdown");
    if (!wrapper) return;

    if (!wrapper.contains(e.target)) {
      list.style.display = "none";
    }
  });
});
}

// SEARCH MATCH SORTING
function getMatchScore(name, query) {
  name = name.toLowerCase();
  query = query.toLowerCase();

  if (name === query) return 1000;
  if (name.startsWith(query)) return 800; 
  const index = name.indexOf(query);
  if (index !== -1) return 500 - index;
  return 0 - name.length * 0.1;
}

// GET DISPLAY TEXT DROPDOWN
function getDisplayText(item) {
  const weight = item.weight ?? item.totalweight ?? "";
  const cWeight = item.cWeight ?? item.totalcWeight ?? "";
  const kcal = item.kcal ?? item.kcal100 ?? "";


  let parts = [item.name];

  if (weight) parts.push(`${weight} g`);
  if (cWeight && cWeight !== weight) parts.push(`${cWeight} gc`);
  if (kcal) parts.push(`${kcal} kcal`);

  return parts.join(" | ");
}

// GET ALL ITEMS DROPDOWN
function getAllItems() {
  if (!window.masterList) return [];   // ← iPhone-säkring
  return [...window.masterList].sort((a, b) =>
    a.name.localeCompare(b.name, "sv")
  );
}

// REFRESH ALL DROPDOWNS
function refreshAllDropdowns() {
  if (!window.masterList || !Array.isArray(window.masterList)) {
    console.warn("refreshAllDropdowns: masterList saknas");
    return;
  }

  const lists = [
    document.getElementById("foodDropdownList"),
    document.getElementById("editDropdownList")
  ];

  lists.forEach(list => {
    if (!list) return;

    list.innerHTML = "";

    window.masterList.forEach(item => {
      const row = document.createElement("div");
      row.className = "dropdown-item";
      row.dataset.id = item.id;

      row.innerHTML = `
        <div class="item-name">${item.name}</div>
        <div class="item-meta">${item.type}</div>
      `;

      list.appendChild(row);
    });

    list.style.display = "none";
  });
}

//RENDER ITEM LAYOUT UI FOR FOOD AND MEAL DROPDOWNS
function renderItemLayout(item) {
  const showCooked =
    item.cPercent > 0 &&
    item.cWeight > 0 &&
    item.cWeight !== item.weight;

  const cookedPart = showCooked
    ? `<span class="item-meta-center">${item.cWeight} gc</span>`
    : "";

  return `
    <div class="dropdown-item">
      <span class="item-name">${item.name}</span>

      <div class="item-meta">
        <span class="item-meta-left">${item.weight ?? ""} g</span>
        ${cookedPart}
        <span class="item-meta-right">${item.kcal ?? ""} kcal</span>
      </div>
    </div>
  `;
}

//#endregion DROPDOWN

//#region MASTER LIST //

// CREATE NEW ITEM IN MASTER LIST
function createNewItem(type) {
  const id = (self.crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(16).slice(2);

  return {
    id,
    type,
    name: "",
    kcal100: "",
    weight: "",
    cPercent: "",
    category: type,
    kcal: null,
    cWeight: null,
    items: type === "meal" ? [] : null
  };
}

// SAVE MASTER LIST
function saveMasterList() {
  localStorage.setItem("masterList", JSON.stringify(window.masterList));
}

// GET ITEM BY ID MASTER LIST
function getItemById(id) {
  return window.masterList.find(x => x.id === id);
}

//SAVE LIST ITEMS
function saveItem(item) {
  computeDerivedFields(item);

  const index = window.masterList.findIndex(x => x.id === item.id);

  if (index === -1) {
    // Nytt item
    window.masterList.push(item);
  } else {
    // Uppdatering
    window.masterList[index] = item;
  }
  saveMasterList();
}

//DELETE ITEM MASTER LIST ITEMS
function deleteItem(id) {
  window.masterList = window.masterList.filter(x => x.id !== id);
  saveMasterList();
}

//IMPORT MASTER LIST
function importMasterList() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";

  input.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    let imported;

    try {
      imported = JSON.parse(text);
    } catch {
      alert("Ogiltig JSON");
      return;
    }

    if (!Array.isArray(imported)) {
      alert("Filen måste vara en lista");
      return;
    }

    window.masterList = imported;
    saveMasterList();
    refreshAllDropdowns();
    showToast("Import klar");
  };

  input.click();

}

// LOAD MASTER LIST
async function loadMasterList() {
  const saved = localStorage.getItem("masterList");

  // Kontrollera att saved är en giltig JSON-array
  if (saved !== null && saved !== "null" && saved !== "undefined") {
    try {
      const parsed = JSON.parse(saved);

      // Om parsed är en array → använd den
      if (Array.isArray(parsed)) {
        window.masterList = parsed;
        return;
      }
    } catch (e) {
      // JSON-fel → fallthrough till fetch
    }
  }

  // Fallback: hämta masterList.json
  const response = await fetch("masterList.json");
  const data = await response.json();

  window.masterList = data;
  localStorage.setItem("masterList", JSON.stringify(data));

}

//#endregion MEAL BUILD 

//#region SUPPORT //

  // GET DAILY GOAL
  function getDailyGoal() {
    const stored = localStorage.getItem("dailyKcalGoal");
    return stored ? Number(stored) : null;
  }

  // GET TODAYS LOGGED KCAL
function getTodaysLoggedKcal() {
  const today = new Date().toISOString().slice(0, 10);
  const mealList = JSON.parse(localStorage.getItem("mealList") || "[]");

  return mealList
    .filter(m => m.day === today)
    .reduce((sum, m) => sum + (m.kcal || 0), 0);
}

  // GET TODAYS BUILD KCAL
function getTodaysBuildKcal() {
  const today = new Date().toISOString().slice(0, 10);
  const items = document.querySelectorAll("#mealBuild li");

  let total = 0;

  items.forEach(li => {
    if (li.dataset.day === today) {
      const kcal = Number(li.dataset.kcal);
      if (!isNaN(kcal)) total += kcal;
    }
  });

  return total;
}

  // UPDATE TOTAL KCAL
function updateTotalKcal() {
  const items = document.querySelectorAll("#mealBuild li");

  let total = 0;
  items.forEach(li => {
    const kcal = Number(li.dataset.kcal);
    if (!isNaN(kcal)) total += kcal;
  });

  const el = document.getElementById("totalKcal");
  if (!el) return;

  el.textContent = `${total} kcal`;
}

  // UPDATE REMAINING KCAL
function updateRemainingKcal() {
  const dailyGoal = getDailyGoal();
  const todaysLogged = getTodaysLoggedKcal();
  const buildKcal = getTodaysBuildKcal(); // dagmedveten

  const remaining = dailyGoal - todaysLogged - buildKcal;

  const el = document.getElementById("remainingKcal");
  if (!el) return;

  // Ta bort gamla klasser
  el.classList.remove("kcal-positive", "kcal-negative");

  if (remaining >= 0) {
    el.textContent = `-${remaining} kcal`;
    el.classList.add("kcal-positive");
  } else {
    el.textContent = `+${Math.abs(remaining)} kcal`;
    el.classList.add("kcal-negative");
  }
}

  // CALULATE CURRENT WEEK TOTAL
  function calculateCurrentWeekTotal() {
    const mealItems = Array.from(document.querySelectorAll("#mealList li"));
    const now = new Date();
    const currentWeek = ds_getWeekNumber(now);
  

    let weekTotal = 0;

    mealItems.forEach(li => {
      const mealDate = new Date(li.dataset.day);
      if (ds_getWeekNumber(mealDate) === currentWeek) {

        weekTotal += Number(li.dataset.kcal || 0);
      }
    });

    return weekTotal;
  }

  // CALCULATE CURRENT WEEK DIFF KCAL
function calculateWeekDiff(week, year) {
  const mealItems = Array.from(document.querySelectorAll("#mealList li"));
  const dailyGoal = getDailyGoal();
  let dayTotals = {};

  mealItems.forEach(li => {
    const dateStr = li.dataset.day;
    const mealDate = new Date(dateStr);
    const w = ds_getISOWeek(mealDate);

    if (w.week === week && w.year === year) {
      const kcal = Number(li.dataset.kcal || 0);
      if (!dayTotals[dateStr]) dayTotals[dateStr] = 0;
      dayTotals[dateStr] += kcal;
    }
  });

  let weekDiff = 0;
  Object.values(dayTotals).forEach(dayTotal => {
    weekDiff += (dayTotal - dailyGoal);
  });

  return weekDiff;
}


  //COMPUTE DERIVED FIELD EDIT UI
  function computeDerivedFieldsUI() {
    const weightInput = document.querySelector('input[data-key="weight"]');
    const kcal100Input = document.querySelector('input[data-key="kcal100"]');
    const cPercentInput = document.querySelector('input[data-key="cPercent"]');
    const cWeightField = document.querySelector('.readonly-field[data-key="cWeight"]');
    const kcalField = document.querySelector('.readonly-field[data-key="kcal"]');

    if (!weightInput || !kcal100Input || !cPercentInput) return;

    const weight = Number(weightInput.value) || 0;
    const kcal100 = Number(kcal100Input.value) || 0;
    const cPercent = Number(cPercentInput.value) || 0;

    const cookedWeight = Math.round(weight * (cPercent / 100));
    const kcal = Math.round((kcal100 / 100) * weight);

    if (cWeightField) cWeightField.textContent = cookedWeight;
    if (kcalField) kcalField.textContent = kcal;
  }

  // COMPUTE DERIVED FIELDS ITEM
  function computeDerivedFields(item) {
    // 1. Beräkna cooked weight (gäller alla typer)
    if (item.weight != null && item.cPercent != null) {
      item.cWeight = Math.round(item.weight * (item.cPercent / 100));
    }
    // 2. FOOD + INGREDIENT
    // Dessa har egen kcal100 och beräknas direkt
    if (item.type === "food" || item.type === "ingredient") {
      if (item.kcal100 != null && item.weight != null) {
        item.kcal = Math.round((item.kcal100 / 100) * item.weight);
      }
      return item;
    }
    // 3. MEAL
    // Meals har items och ska summeras
    if (item.type === "meal" && Array.isArray(item.items)) {
      let totalKcal = 0;
      let totalWeight = 0;
      let totalCWeight = 0;

      item.items.forEach(sub => {
        totalKcal += sub.kcal || 0;
        totalWeight += sub.weight || 0;
        totalCWeight += sub.cWeight || 0;
      });

      item.kcal = totalKcal;
      item.weight = totalWeight;
      item.cWeight = totalCWeight;

      // Auto-beräkna kcal100 för meal
      if (totalWeight > 0) {
        item.kcal100 = Math.round((totalKcal / totalWeight) * 100);
      }
    }

  }

  // APPLY THEME
  function applyTheme(theme) {
    document.body.classList.remove("night-theme","vivid-theme", "happy-theme", 
      "wood-theme", "earth-theme", "cold-theme");
    document.body.classList.add(`${theme}-theme`);

  }

  // BACKUP DATA
function backupData() {
  const data = {
    mealList: JSON.parse(localStorage.getItem("mealList")) || [],
    weekHistory: JSON.parse(localStorage.getItem("weekHistory")) || [],
    dailyKcalGoal: localStorage.getItem("dailyKcalGoal") || null,
    masterList: JSON.parse(localStorage.getItem("masterList")) || [],
    health_entries: JSON.parse(localStorage.getItem("health_entries")) || [],
    training_start_date: localStorage.getItem("training_start_date") || null,
    userHeightCm: localStorage.getItem("userHeightCm") || [],
  };

  const today = new Date().toISOString().split("T")[0];
  const filename = `MealStudioUserData_${today}.json`;

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

  // RESTORE DATA
 function restoreData(file) {
  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);

      if (data.mealList) {
        localStorage.setItem("mealList", JSON.stringify(data.mealList));
      }

      if (data.weekHistory) {
        localStorage.setItem("weekHistory", JSON.stringify(data.weekHistory));
      }

      if (data.dailyKcalGoal) {
        localStorage.setItem("dailyKcalGoal", data.dailyKcalGoal);
      }

      if (data.masterList) {
        localStorage.setItem("masterList", JSON.stringify(data.masterList));
      }

      if (data.health_entries) {
        localStorage.setItem("health_entries", JSON.stringify(data.health_entries));
      }

      if (data.training_start_date) {
        localStorage.setItem("training_start_date", data.training_start_date);
      }
       if (data.userHeightCm) {
        localStorage.setItem("userHeightCm", data.userHeightCm);
      }

      showToast("Data återställd, laddar om sidan");
      location.reload();
    } catch (err) {
      showToast("Fel vid återställning av fil");
      console.error(err);
    }
  };

  reader.readAsText(file);
}

  // EXPORT MASTER LIST
    function exportMasterList() {
  const masterList = JSON.parse(localStorage.getItem("masterList") || "[]");

  const blob = new Blob([JSON.stringify(masterList, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  const today = new Date().toISOString().split("T")[0];

  a.download = `MealStudioMasterList_${today}.json`;
  a.href = url;

  a.click();
  URL.revokeObjectURL(url);
}


  // IMPORT MASTER LIST
    function importMasterList(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const imported = JSON.parse(e.target.result);

        // Spara som ny masterList
        localStorage.setItem("masterList", JSON.stringify(imported));

        // Återskapa dropdowns, mealBuild, mealList osv
        window.masterList = imported;

         showToast("MasterList importerad");;
      } catch (err) {
         showToast("Felaktig Json-fil");;
      }
    };

      reader.readAsText(file);
  }

  // GET INPUT TYPE FOR KEY (NUMBERS)
    function getInputTypeForKey(key) {
  const numericKeys = ["weight", "kcal100", "cPercent"];
  if (numericKeys.includes(key)) {
    return { type: "number", inputmode: "numeric" };
  }
  return { type: "text", inputmode: "text" };
  }

  // LOAD ITEMS FOR EDITING
  function loadItemForEditing(item) {
      window.currentEditItem = item;

      const fields = document.getElementById("editFields");
      const mealItems = document.getElementById("editMealItems");

      fields.innerHTML = "";
      mealItems.innerHTML = "";

      // Om inget item är valt ska kortet bara vara tomt
      if (!item) return;

      const topFields = [
        { key: "name", label: "Namn" },
        { key: "weight", label: "Vikt (g)" },
        { key: "kcal100", label: "kcal / 100g" },
        { key: "cPercent", label: "cPercent" }
      ];

      topFields.forEach(f => {
        if (item[f.key] === undefined) return;

        const isMeal = item.type === "meal";
        const isLockedField = isMeal && ["weight", "kcal100", "cPercent"].includes(f.key);
        const readonlyAttr = isLockedField ? "readonly" : "";

        const { type, inputmode } = getInputTypeForKey(f.key);

        fields.insertAdjacentHTML(
          "beforeend",
          `
            <div class="edit-row">
              <div class="edit-label">${f.label}</div>
              <div class="edit-value">
                <input 
                  type="${type}"
                  inputmode="${inputmode}"
                  data-key="${f.key}" 
                  value="${item[f.key]}"
                  ${readonlyAttr}
                >
              </div>
            </div>
          `
        );
      });

      if (item.type === "meal") {
        item.items.forEach(sub => {
          const food = getItemById(sub.id);

          mealItems.insertAdjacentHTML(
            "beforeend",
            `
              <div class="edit-row">
                <div class="edit-label">${food ? food.name : "(okänd)"}</div>
                <div class="edit-value">
                  <input 
                    type="number"
                    inputmode="numeric"
                    class="meal-item-weight"
                    value="${sub.weight}"
                    data-id="${sub.id}"
                  >
                </div>
              </div>
            `
          );
        });
      }
  }

  // SHOW EDIT DIALOG
  function showEditConfirmationDialog(before, after) {
    let diff = "";

    const ignoreKeys = ["kcal", "cWeight", "kcal100Total", "weightTotal"];

    for (const key in after) {
      if (key === "items") continue;
      if (ignoreKeys.includes(key)) continue;

      if (before[key] !== after[key]) {
        diff += `${key}: ${before[key]} → ${after[key]}\n`;
      }
    }

    if (after.type === "meal") {
      diff += "\nIngredienser:\n";

      after.items.forEach((sub, i) => {
        const beforeSub = before.items[i];
        if (!beforeSub) return;

        if (beforeSub.weight !== sub.weight) {
          const food = getItemById(sub.id);
          diff += ` - ${food.name}: ${beforeSub.weight}g → ${sub.weight}g\n`;
        }
      });
    }

    return confirm("Vill du spara innehållet?\n\n" + diff);
  }
  
  // SAVE EDITED ITEM
  function saveEditedItem() {
    const item = window.currentEditItem;
    if (!item) return;

    const before = JSON.parse(JSON.stringify(item));

    const fields = document.querySelectorAll("#editFields [data-key]");
    fields.forEach(field => {
      const key = field.dataset.key;
      let value = field.value;

      if (["weight", "kcal100", "cPercent"].includes(key)) {
        value = value === "" ? null : Number(value);
      }

      item[key] = value;
    });

    if (item.type === "meal") {
      const rows = document.querySelectorAll("#editMealItems .edit-row");

      rows.forEach(row => {
        const input = row.querySelector(".meal-item-weight");
        const id = String(input.dataset.id);
        const weight = Number(input.value);

        const sub = item.items.find(x => String(x.id) === id);
        if (!sub) return;

        const food = getItemById(id);
        if (!food) return;

        sub.weight = weight;
        sub.kcal = Math.round((food.kcal100 / 100) * weight);
        sub.cWeight = Math.round(weight * (food.cPercent / 100));
      });
    }

    if (item.type === "food") {
      const w = Number(item.weight) || 0;
      const kcal100 = Number(item.kcal100) || 0;
      const cPercent = Number(item.cPercent) || 0;

      item.kcal = Math.round((kcal100 / 100) * w);
      item.cWeight = Math.round(w * (cPercent / 100));
    }

    const after = JSON.parse(JSON.stringify(item));

    if (!showEditConfirmationDialog(before, after)) return;
    
    saveItem(item);
    refreshAllDropdowns();
    loadItemForEditing(null);

    document.getElementById("editFields").innerHTML = "";
    document.getElementById("editMealItems").innerHTML = "";
    document.getElementById("editSearchInput").value = "";

    const list = document.getElementById("editDropdownList");
    list.innerHTML = "";
    list.style.display = "none";

    window.currentEditItem = null;
    showToast("Redigering sparad!");
}


// DAILY GOAL SELECT
function initDailyGoalSelect() {
  for (let kcal = 1000; kcal <= 4000; kcal += 50) {
    const opt = document.createElement("option");
    opt.value = kcal;
    opt.textContent = `${kcal}`;
    dailyGoalSelect.appendChild(opt);
  }

  const savedGoal = localStorage.getItem("dailyKcalGoal");
  if (savedGoal) {
    dailyGoalSelect.value = savedGoal;
  }
}
// THEMES
function initTheme() {
  const savedTheme = localStorage.getItem("savedTheme") || "cold";
  themeSelect.value = savedTheme;
  applyTheme(savedTheme);
}

// AMOUNT SELECT
function initAmountSelect() {
  for (let i = 1; i <= 20; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    amountSelect.appendChild(option);
  }
}

// Toast
function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}

//#endregion SUPPORT

//#region TEST 

//Card toggle
function showCard(cardToShow, cardToHide) {
  cardToShow.classList.remove("hidden");
  cardToHide.classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  const mealBuildCard = document.getElementById("mealBuildCard");
  const mealListCard = document.getElementById("mealListCard");

  const acceptBtn = document.getElementById("acceptBtn");
  const addBtn = document.getElementById("addBtn");
  const saveBtn = document.getElementById("saveBtn");
  const addCancelBtn = document.getElementById("addCancelBtn");
  const switchPageBtn = document.getElementById("switchPageBtn");

  // 1) acceptBtn → visa mealBuildCard
  acceptBtn.addEventListener("click", () => {
    showCard(mealBuildCard, mealListCard);
  });

  // 2) addBtn, saveBtn, addCancelBtn → visa mealListCard
  [addBtn, saveBtn, addCancelBtn].forEach(btn => {
    btn.addEventListener("click", () => {
      showCard(mealListCard, mealBuildCard);
    });
  });
});

// show edit card
document.addEventListener("DOMContentLoaded", () => {
  const editCard = document.getElementById("editCard");
  const settingsCard = document.getElementById("settingsCard");

  const abortBtn = document.getElementById("abortBtn");
  const saveEditBtn = document.getElementById("saveEditBtn");

  function showEditCard() {
    editCard.classList.remove("hidden");
    settingsCard.classList.add("hidden");
  }

  function hideEditCard() {
    editCard.classList.add("hidden");
    settingsCard.classList.remove("hidden");
  }

  // När användaren väljer något i dropdownlistan
  document.getElementById("editDropdownList").addEventListener("click", (e) => {
    if (e.target.matches(".dropdown-item")) {
      showEditCard();
    }
  });

  // När användaren sparar eller avbryter
  [abortBtn, saveEditBtn].forEach(btn => {
    btn.addEventListener("click", hideEditCard);
  });
});

// Ändra Header på Edit cards
function setEditTitle(mode) {
  const cardElement = document.getElementById("editCard");
  const title = cardElement.querySelector(".toggle-title");
  title.textContent = mode === "edit" ? "Redigera innehåll" : "Lägg till nytt innehåll";
}

//#endregion TEST

// RESET DATA CLEAR LOCAL STORAGE //

// RESET ALL CLEAR ALL DATA
document.querySelector("#clearAllStorageBtn").addEventListener("click", () => {
  if (!confirm("Vill du rensa ALL appdata?")) return;

  const keys = [
    "health_entries",
    "savedTheme",
    "mealList",
    "weekHistory",
    "dailyKcalGoal",
    "masterList",
    "training_start_date",
    "userHeightCm"
  ];

  keys.forEach(key => localStorage.removeItem(key));

  showToast("All appdata rensad");
  location.reload()
});

// RESET CLEAR HEALTH DATA
document.querySelector("#clearHealthStorageBtn").addEventListener("click", () => {
  if (!confirm("Vill du nollställa hälsodata?")) return;
  localStorage.removeItem("health_entries");
  localStorage.removeItem("healthHistory");
  healthList.clear();
  showToast("Hälsodata rensad");
  location.reload()
});


// NY UNIFIED SELECT FÖR ÅRTAL
//----------------------------------------
function populateFixedYearSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = "";

  for (let year = 2026; year <= 2036; year++) {
    const opt = document.createElement("option");
    opt.value = year;
    opt.textContent = year;
    select.appendChild(opt);
  }
}


function filterHealthHistoryByYear(year) {
  return healthHistoryData.filter(entry => entry.month.startsWith(year));
}






