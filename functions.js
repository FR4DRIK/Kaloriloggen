
//#region MEAL LIST //

// CREATE MEAL LIST ITEM
function createMealListItem(item, amount, weight, cWeight, kcal, day) {
  const master = getItemById(item.id);

  const displayName = master?.name ?? item.name;
  const displayType = master?.type ?? item.type;

  const li = document.createElement("li");
  li.classList.add("sortable-item");

  li.dataset.day = day;
  li.dataset.amount = amount;
  li.dataset.weight = weight;
  li.dataset.cWeight = cWeight;
  li.dataset.kcal = kcal;
  li.dataset.item = JSON.stringify(item);

  const weightText =
    cWeight === weight
      ? `${weight} g`
      : `${weight} g | ${cWeight} gc`;

  const detailsHTML =
    displayType === "meal"
      ? item.items.map(sub => {
          const food = getItemById(sub.id);
          if (!food) return "(okänd)";

          const w = sub.weight;
          const kcalPer100 = food.kcal100 ?? food.kcal ?? 0;
          const subKcal = Math.round((kcalPer100 / 100) * w);

          return `${food.name} ${w} g (${subKcal} kcal)`;
        }).join("<br>")
      : `${weightText} (${kcal} kcal)`;

  li.innerHTML = `
    <details>
      <summary>
        <span class="day">${formatDateDisplay(new Date(day))}</span>
        <span class="title">${displayName}</span>
        <span class="filler"></span>
        <span class="meta">${kcal} kcal</span>
      </summary>

      <div class="expandedView">
        <div class="ingredientsList">
          ${detailsHTML}
        </div>

        <div class="actionButtonsRowBottom">
          <button class="deleteBtn">X</button>
          <button class="moveUpBtn">▲</button>
          <button class="moveDownBtn">▼</button>
        </div>
      </div>
    </details>
  `;

  // DELETE
  li.querySelector(".deleteBtn").addEventListener("click", () => {
    li.remove();
    saveToLocal();
    applyDayColors();
    updateWeekSummary();
  });

  // MOVE UP (DOM-flytt)
  li.querySelector(".moveUpBtn").addEventListener("click", () => {
    const prev = li.previousElementSibling;
    if (prev) {
      mealList.insertBefore(li, prev);
      saveToLocal();
      applyDayColors();
      updateWeekSummary();
    }
  });

  // MOVE DOWN (DOM-flytt)
  li.querySelector(".moveDownBtn").addEventListener("click", () => {
    const next = li.nextElementSibling;
    if (next) {
      mealList.insertBefore(next, li);
      saveToLocal();
      applyDayColors();
      updateWeekSummary();
    }
  });

  mealList.appendChild(li);
  sortMealList();
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

  applyDayColors();
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

    const diffClass = diff >= 0 ? "positive" : "negative";

    const dateObj = new Date(day);
    const weekday = dateObj.getDay(); // 0 = söndag, 6 = lördag

    const li = document.createElement("li");

    // Lägg till helgklass
    if (weekday === 0 || weekday === 6) {
      li.classList.add("weekend");
    }

    li.innerHTML = `
      <span class="weekLabel">${formatDateDisplay(dateObj)}</span>
      <span class="weekKcal">
        <span class="diff ${diffClass}">${diffText}</span>
        <span class="kcal">${total} kcal</span>
      </span>
    `;

    weekSummaryEl.appendChild(li);
  });
}

// RENDER CURRENT WEEK TOTAL - MEAL LIST
function renderCurrentWeekTotal() {
  const currentWeekTotal = calculateCurrentWeekTotal();
  const weekHistory = document.getElementById("weekHistory");
  if (!weekHistory) return;

  const now = new Date();
  const currentWeek = getWeekNumber(now);

  let existing = weekHistory.querySelector(`li[data-week='current']`);

  if (!existing) {
    existing = document.createElement("li");
    existing.dataset.week = "current";
    weekHistory.prepend(existing);
  }

  existing.innerHTML = `
  <span class="weekLabel">Denna vecka (v${currentWeek})</span>
  <span class="weekKcal">${currentWeekTotal} kcal</span>`;

}

// RENDER WEEK HISTORY - MEAL LIST
function renderWeekHistory() {
  const history = JSON.parse(localStorage.getItem("weekHistory")) || [];
  const container = document.getElementById("weekHistory");
  if (!container) return;

  container.querySelectorAll("li:not([data-week='current'])").forEach(li => li.remove());

  history.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.week - a.week;
  });

  history.forEach(entry => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="weekLabel">Vecka ${entry.week} (${entry.year})</span>
      <span class="weekKcal">${entry.total} kcal</span>
    `;
    container.appendChild(li);
  });
}

// SAVE CURRENT WEEK MANUALLY - MEAL LIST
function saveCurrentWeekManually() {
  const items = Array.from(document.querySelectorAll("#mealList li"));
  if (items.length === 0) {
    alert("Det finns inga måltider att spara.");
    return;
  }

  // 1. Hitta vilken vecka som ska sparas (baserat på första posten)
  const firstDate = new Date(items[0].dataset.day);
  const { week: targetWeek, year: targetYear } = getISOWeek(firstDate);

  const confirmSave = confirm(
    `Spara vecka ${targetWeek}? Detta tar bort alla måltider från denna vecka.`
  );
  if (!confirmSave) return;

  let total = 0;
  const remaining = [];

  // 2. falla och filtrera
  items.forEach(li => {
    const d = new Date(li.dataset.day);
    const w = getISOWeek(d);

    if (w.week === targetWeek && w.year === targetYear) {
      total += Number(li.dataset.kcal || 0);
    } else {
      remaining.push(li);
    }
  });

  // 3. Hämta historik
  let history = JSON.parse(localStorage.getItem("weekHistory")) || [];

  // 4. Kolla om veckan redan finns
  const existingIndex = history.findIndex(
    h => h.week === targetWeek && h.year === targetYear
  );

  if (existingIndex !== -1) {
    const overwrite = confirm(
      `Vecka ${targetWeek} finns redan sparad.\nVill du skriva över värdet?`
    );
    if (!overwrite) return;

    history[existingIndex].total = total;
  } else {
    history.unshift({
      week: targetWeek,
      year: targetYear,
      total
    });
  }

  // 5. Spara historik
  localStorage.setItem("weekHistory", JSON.stringify(history));

  // 6. Uppdatera mealList
  mealList.innerHTML = "";
  remaining.forEach(li => mealList.appendChild(li));
  saveToLocal();

  // 7. Uppdatera UI
  renderWeekHistory();
  renderCurrentWeekTotal();

  alert(`Vecka ${targetWeek} sparad!`);
}

// TOGGLE EXPANDED VIEW - MEAL LIST
function toggleMealListExpand() {
  const list = document.getElementById("mealList");
  const arrow = document.getElementById("toggleArrow");

  if (!list) return;

  const expanded = list.classList.toggle("mealList-expanded");

  if (expanded) {
    arrow.classList.add("expanded");
  } else {
    arrow.classList.remove("expanded");
  }
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
}


/*
document.getElementById("toggle").addEventListener("click", toggleMealListExpand);*/


//#endregion MEAL LIST

//#region MEAL BUILD //

// CREATE MEAL BUILD ITEMS - MEAL BUILD
function createMealBuildItem(item, amount, totalweight, totalcWeight, kcal) {

function buildMealIngredientSummary(meal) {
  return meal.items.map(sub => {
    const food = getItemById(sub.id);
    if (!food) return "(okänd)";

    const w = sub.weight;
    const cw = sub.cWeight;

    // RÄTT kcal-beräkning per sub-item
    const kcalPer100 = food.kcal100 ?? food.kcal ?? 0;
    const subKcal = Math.round((kcalPer100 / 100) * w);

    const cooked =
      cw > 0 &&
      cw !== w &&
      food.cPercent > 0
        ? ` → ${cw} gc`
        : "";

    return `${food.name} ${w} g (${subKcal} kcal)${cooked}`;
  }).join("<br>");
}
  const li = document.createElement("li");
  li.classList.add("meal-build-item", "mealBuildItem");
  li.dataset.id = item.id;
  li.dataset.name = item.name;
  li.dataset.weight = totalweight;
  li.dataset.cWeight = totalcWeight;
  li.dataset.kcal = kcal;
  li.dataset.item = JSON.stringify(item);


 const detailsHTML = item.type === "meal"
  ? buildMealIngredientSummary(item)
  : `${totalweight} g (${kcal} kcal)${
      totalcWeight > 0 && totalcWeight !== totalweight
        ? ` → ${totalcWeight} gc`
        : ""
    }`;

  li.innerHTML = `
    <details>
      <summary>
        <span class="day">${formatDateDisplay(new Date(daySelect.value))}</span>
        <span class="title">${item.name}</span>
        <span class="filler"></span>
        <span class="meta">${kcal} kcal</span>
      </summary>

      <div class="expandedView">
        ${detailsHTML}

        <div class="actionButtonsRowBottom">
          <button class="deleteBtn">X</button>
          <button class="moveUpBtn">▲</button>
          <button class="moveDownBtn">▼</button>
        </div>
      </div>
    </details>
  `;
  console.log("CREATE MEAL BUILD ITEM", {
  item,
  amount,
  totalweight,
  totalcWeight,
  kcal,
  dataset: {
    id: item.id,
    name: item.name,
    weight: totalweight,
    cWeight: totalcWeight,
    kcal: kcal
  }
});
li.dataset.day = daySelect.value;

// DELETE
li.querySelector(".deleteBtn").addEventListener("click", () => {
  li.remove();
  updateTotalKcal();
  updateRemainingKcal();

});

// MOVE UP
li.querySelector(".moveUpBtn").addEventListener("click", () => {
  const prev = li.previousElementSibling;
  if (prev) {
    mealBuild.insertBefore(li, prev);
    updateTotalKcal();
    updateRemainingKcal();

  }
});

// MOVE DOWN
li.querySelector(".moveDownBtn").addEventListener("click", () => {
  const next = li.nextElementSibling;
  if (next) {
    mealBuild.insertBefore(next, li);
    updateTotalKcal();
    updateRemainingKcal();

  }
});
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

  input.addEventListener("input", () => {
    const query = input.value.toLowerCase();
    const items = getData().filter(x =>
      x.name.toLowerCase().includes(query)
    );

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
    ? `<span class="meta-center">${item.cWeight} gc</span>`
    : "";

  return `
    <div class="item-row">
      <span class="item-name">${item.name}</span>

      <div class="item-meta">
        <span class="meta-left">${item.weight ?? ""} g</span>
        ${cookedPart}
        <span class="meta-right">${item.kcal ?? ""} kcal</span>
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
    cWeight: null
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
    alert("Import klar!");
  };

  input.click();

}

//REPAIR MASTER LIST FOODS
function repairMasterListFoods() {
  if (!window.masterList) {
    console.error("masterList saknas – kör loadMasterList() först.");
    return;
  }

  window.masterList.forEach(item => {
    if (item.type !== "food") return;

    // Se till att alla fält finns
    item.weight = Number(item.weight) || 0;
    item.kcal100 = Number(item.kcal100) || 0;

    // Om cPercent saknas → sätt till 100 (ingen viktförändring)
    // eller 0 om du hellre vill det
    item.cPercent = Number(item.cPercent);
    if (isNaN(item.cPercent)) item.cPercent = 100;

    // Beräkna derived fields
    item.cWeight = Math.round(item.weight * (item.cPercent / 100));
    item.kcal = Math.round((item.kcal100 / 100) * item.weight);
  });

  localStorage.setItem("masterList", JSON.stringify(window.masterList));
  console.log("Foods repaired!");
}

// LOAD MASTER LIST
async function loadMasterList() {
  const saved = localStorage.getItem("masterList");

  if (saved) {
    window.masterList = JSON.parse(saved);
    return;
  }

  // 1. Ladda foods.json
  const response = await fetch("foods.json");
  const foods = await response.json();

  // 2. Konvertera foods till nya modellen
  const convertedFoods = foods.map(f => {
    const item = createNewItem("food");

    item.name = f.name;
    item.kcal100 = Number(f.kcal100) || 0;
    item.weight = Number(f.weight) || 0;
    item.category = f.category ?? null;

    item.cPercent = Number(f.cPercent);
    if (isNaN(item.cPercent)) item.cPercent = 100;

    item.cWeight = Math.round(item.weight * (item.cPercent / 100));
    item.kcal = Math.round((item.kcal100 / 100) * item.weight);

    return item;
  });

  // 3. Ladda och konvertera äldre custom meals
  const oldMealsRaw = localStorage.getItem("customMeals");
  let convertedMeals = [];

  if (oldMealsRaw) {
    const oldMeals = JSON.parse(oldMealsRaw);

    convertedMeals = oldMeals.map(m => {
      const meal = createNewItem("meal");
      meal.name = m.name;
      meal.items = [];

      m.items.forEach(sub => {
        meal.items.push({
          id: sub.id,
          weight: sub.weight,
          cWeight: sub.cWeight,
          kcal: sub.kcal
        });
      });

      computeDerivedFields(meal);
      return meal;
    });
  }

  // 4. Spara masterList
  window.masterList = [
    ...convertedFoods,
    ...convertedMeals
  ];

  saveMasterList();
}

//#endregion MEAL BUILD 

//#region DATES //

// ISO DATE
  function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

//GET ISO WEEK
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return {
    week: Math.ceil((((d - yearStart) / 86400000) + 1) / 7),
    year: d.getUTCFullYear()
  };
}

// FORMAT DATE DISPLAY
function formatDateDisplay(d) {
  const weekdays = ["Söndag","Måndag","Tisdag","Onsdag","Torsdag","Fredag","Lördag"];
  const day = d.getDate();
  const month = d.getMonth() + 1; 
  const weekday = weekdays[d.getDay()]; 
  return `${day}/${month} ${weekday}`;
}

// GET WEEK NUMBER
function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(),0,1);
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

// FORMATE DATE DISPLAY
function formatDateDisplay(date) {
  if (!(date instanceof Date)) date = new Date(date);
  const weekdays = ["Söndag","Måndag","Tisdag","Onsdag","Torsdag","Fredag","Lördag"];
  return `${date.getDate()}/${date.getMonth()+1} ${weekdays[date.getDay()]}`;
}

//#endregion DATE FUNCTIONS 

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
    const currentWeek = getWeekNumber(now);

    let weekTotal = 0;

    mealItems.forEach(li => {
      const mealDate = new Date(li.dataset.day);
      if (getWeekNumber(mealDate) === currentWeek) {
        weekTotal += Number(li.dataset.kcal || 0);
      }
    });

    return weekTotal;
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
    document.body.classList.remove("light-theme", "dark-theme", "fall-theme");
    document.body.classList.add(`${theme}-theme`);
  }

  // RENDER DAY SELECT
  function renderDaySelect() {
    daySelect.innerHTML = "";
    const today = new Date();

    for (let i = -3; i <= 3; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);

      const option = document.createElement("option");
      option.textContent = formatDateDisplay(d);
      option.value = toISODate(d);
      daySelect.appendChild(option);
    }

    daySelect.value = toISODate(today);
  }

  // BACKUP DATA
  function backupData() {
    const data = {
      mealList: JSON.parse(localStorage.getItem("mealList")) || [],
      customMeals: JSON.parse(localStorage.getItem("customMeals")) || [],
      weekHistory: JSON.parse(localStorage.getItem("weekHistory")) || [],
      dailyKcalGoal: localStorage.getItem("dailyKcalGoal") || null,
      lastSavedWeek: localStorage.getItem("lastSavedWeek") || null
    };

    const today = new Date().toISOString().split("T")[0];
    const filename = `Kaloriloggen_backup_${today}.json`;

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

        if (data.customMeals) {
          localStorage.setItem("customMeals", JSON.stringify(data.customMeals));
        }

        if (data.weekHistory) {
          localStorage.setItem("weekHistory", JSON.stringify(data.weekHistory));
        }

        if (data.dailyKcalGoal) {
          localStorage.setItem("dailyKcalGoal", data.dailyKcalGoal);
        }

        if (data.lastSavedWeek) {
          localStorage.setItem("lastSavedWeek", data.lastSavedWeek);
        }

        alert("Data återställd! Laddar om sidan...");
        location.reload();
      } catch (err) {
        alert("Fel vid restore av fil!");
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
  a.href = url;
  a.download = "masterlist.json";
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

        alert("Masterlist importerad!");
      } catch (err) {
        alert("Felaktig JSON-fil.");
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

    const addNewFoodBtn = document.getElementById("addNewFoodBtn");
    const deleteMealBtn = document.getElementById("deleteMealBtn");

    if (item) {
      addNewFoodBtn.style.display = "none";
      deleteMealBtn.style.display = "block";
      abortBtn.style.display = "block";
      saveEditBtn.style.display = "block";

      deleteMealBtn.onclick = () => deleteMeal(item.id);

    } else {
      addNewFoodBtn.style.display = "block";
      deleteMealBtn.style.display = "none";
    }

    const fields = document.getElementById("editFields");
    const mealItems = document.getElementById("editMealItems");

    fields.innerHTML = "";
    mealItems.innerHTML = "";

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

      // Hämta rätt input-typ
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

    // Sub-items om det är en meal
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
    resetEditButtons();

    document.getElementById("editFields").innerHTML = "";
    document.getElementById("editMealItems").innerHTML = "";
    document.getElementById("editSearchInput").value = "";

    const list = document.getElementById("editDropdownList");
    list.innerHTML = "";
    list.style.display = "none";

    window.currentEditItem = null;

  }

  // RESET VIEW EDIT BUTTONS
  function resetEditButtons() {
  addNewFoodBtn.style.display = "block";
  deleteMealBtn.style.display = "none";
  saveEditBtn.style.display = "none";
  abortBtn.style.display = "none";
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
  const savedTheme = localStorage.getItem("savedTheme") || "dark";
  themeSelect.value = savedTheme;
  applyTheme(savedTheme);
}

// BOTTOM BAR NAVIGATION
  function showView(viewId) {
    document.querySelectorAll(".view").forEach(v => (v.style.display = "none"));
    const view = document.getElementById(viewId);
    if (view) view.style.display = "block";

    if (viewId === "add") {
    updateTotalKcal();
    updateRemainingKcal();

}}

// AMOUNT SELECT
function initAmountSelect() {
  for (let i = 1; i <= 20; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    amountSelect.appendChild(option);
  }
}

//#endregion SUPPORT