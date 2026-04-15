
//#region DOM ELEMENTS
const weightInput = document.getElementById("weightInput");
const amountSelect = document.getElementById("amountSelect");
const addBtn = document.getElementById("addBtn");
const acceptBtn = document.getElementById("acceptBtn");
const saveBtn = document.getElementById("saveBtn");
const mealList = document.getElementById("mealList");
const mealBuild = document.getElementById("mealBuild");
const daySelect = document.getElementById("daySelect");
const weekHistory = document.getElementById("weekHistory");

let selectedItem = null;
let foods = [];
let foodDropdown = null;


//#region DATA & VARIABLES

let customMeals = []; // Egna måltider skapade av användaren

// Fyll amountSelect med antal
for (let i = 1; i <= 20; i++) {
    const option = document.createElement('option');
    option.value = i;        // värdet som skickas vid submit
    option.textContent = i;  // texten som visas
    amountSelect.appendChild(option);
}

  //#endregion

//#region EVENT LISTENERS

document.addEventListener("DOMContentLoaded", async () => {
  
  loadFromLocal();
  renderCurrentWeekTotal();
  renderWeekHistory();
});



  //#endregion

//#region FUNCTIONS
/* DENNA VERKAR INTE ANVÄNDAS LÄNGRE  
const getKcal = (f, weight = f.weight) => Math.round(f.kcal * weight / 100); */

  function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateDisplay(d) {
  const weekdays = ["Söndag","Måndag","Tisdag","Onsdag","Torsdag","Fredag","Lördag"];
  const day = d.getDate();             // dag utan ledande nolla
  const month = d.getMonth() + 1;      // månad (0-indexerad, +1)
  const weekday = weekdays[d.getDay()]; 
  return `${day}/${month} ${weekday}`;
}

function renderDaySelect() {
  daySelect.innerHTML = "";
  const today = new Date();

  for (let i = -3; i <= 3; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i); // lägger till eller drar ifrån dagar

    const option = document.createElement("option");
    option.textContent = formatDateDisplay(d); // texten som syns
    option.value = toISODate(d);               // värdet för <select>
    daySelect.appendChild(option);
  }

  daySelect.value = toISODate(today); // dagens datum som förvalt
}

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

  // 2. Summera och filtrera
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


function updateTotalKcal() {
  const items = Array.from(mealBuild.querySelectorAll("li"));
  const total = items.reduce((sum, li) => sum + Number(li.dataset.kcal || 0), 0);
  document.getElementById("totalKcal").textContent = `Totalt: ${total} kcal`;
}
function updateWeekSummary() {
  const mealItems = Array.from(document.querySelectorAll("#mealList li"));

  const dayTotals = {};

  mealItems.forEach(li => {
    const day = li.dataset.day;
    const kcal = Number(li.dataset.kcal || 0);

    if (!dayTotals[day]) dayTotals[day] = 0;
    dayTotals[day] += kcal;
  });

  // ⭐ Sortera nyaste datum först
  const sortedDays = Object.keys(dayTotals).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  const weekSummaryEl = document.getElementById("weekSummary");
  weekSummaryEl.innerHTML = "";

  const goal = Number(localStorage.getItem("dailyKcalGoal")) || null;

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

    // ⭐ Lägg till helgklass
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


  //#endregion

  //#region HELP FUNCTIONS

  //#endregion


// Hjälpfunktion: veckonummer
function getWeekNumber(date) { //FINNS TVÅ VERSIONER AV DETTA MED OLIKA BENÄMNING
  const d = new Date(date);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(),0,1);
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

function getISOWeek(date) { //FINNS TVÅ VERSIONER AV DETTA MED OLIKA BENÄMNING
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return {
    week: Math.ceil((((d - yearStart) / 86400000) + 1) / 7),
    year: d.getUTCFullYear()
  };
}

function renderWeekHistory() {
  const history = JSON.parse(localStorage.getItem("weekHistory")) || [];
  const container = document.getElementById("weekHistory");
  if (!container) return;

  // ❗ Rensa bara sparade veckor, inte current week eller knappar
  container.querySelectorAll("li:not([data-week='current'])").forEach(li => li.remove());

  // Sortera: nyast vecka först
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


function saveToLocal() {
  const data = Array.from(mealList.querySelectorAll("li")).map(li => ({
    day: li.dataset.day,
    name: li.querySelector(".title")?.textContent || "",
    amount: Number(li.dataset.amount) || 1,
    weight: Number(li.dataset.weight) || 0,
    cWeight: Number(li.dataset.cWeight) || 0,
    kcal: Number(li.dataset.kcal) || 0
  }));

  localStorage.setItem("mealList", JSON.stringify(data));
}


// ------------------------- CUSTOM MEALS -------------------------
function saveCustomMeals() {
  localStorage.setItem("customMeals", JSON.stringify(customMeals));
}

function loadCustomMeals() {
  const saved = localStorage.getItem("customMeals");
  if (saved) customMeals = JSON.parse(saved);

  // sortera customMeals direkt
  customMeals.sort((a, b) => a.name.localeCompare(b.name, "sv"));

}

// ------------------------- DELETE SELECTED MEAL -------------------------
deleteSavedMealBtn.addEventListener("click", () => {
  const selectedValue = deleteMealSelect.value;

  if (!selectedValue) {
    alert("Välj en sparad måltid först!");
    return;
  }

  // 🔥 NYTT: Bekräftelsedialog
  const mealName = deleteMealSelect.options[deleteMealSelect.selectedIndex].textContent;
  const ok = confirm(`Är du säker på att du vill radera måltiden:\n\n"${mealName}"?`);

  if (!ok) return; // ❌ Avbryt radering

  // Ta bort från dropdown
  const optionToDelete = deleteMealSelect.querySelector(`option[value="${selectedValue}"]`);
  if (optionToDelete) optionToDelete.remove();

  // Ta bort från customMeals
  const index = customMeals.findIndex(m => m.id === selectedValue);
  if (index !== -1) {
    const deletedMeal = customMeals.splice(index, 1)[0];
    saveCustomMeals();
    alert(`Måltiden har raderats.`);
  }
  populateDeleteMealSelect();
});


function populateDeleteMealSelect() {
  deleteMealSelect.innerHTML = '<option value="">Välj måltid</option>';

  // 🔥 Sortera A–Ö
  const sorted = [...customMeals].sort((a, b) =>
    a.name.localeCompare(b.name, "sv")
  );
  sorted.forEach(meal => {
    const opt = document.createElement("option");
    opt.value = meal.id;
    opt.textContent = meal.name;
    deleteMealSelect.appendChild(opt);
  });
}

document.querySelector('[data-view="profile"]').addEventListener("click", () => {
  populateDeleteMealSelect();
});


// ------------------------- LOAD SAVED MEALS -------------------------
function loadFromLocal() {
  const savedMeals = JSON.parse(localStorage.getItem("mealList")) || [];
  mealList.innerHTML = "";

  savedMeals.forEach(item => {
    const li = document.createElement("li");

    li.classList.add("sortable-item");
    li.dataset.day = item.day;
    li.dataset.amount = item.amount;
    li.dataset.weight = item.weight;
    li.dataset.cWeight = item.cWeight;
    li.dataset.kcal = item.kcal;
    li.dataset.name = item.name;

    const weightText =
      item.cWeight === item.weight
        ? `${item.weight} g`
        : `${item.weight} g | ${item.cWeight} gc`;

    li.innerHTML = `
      <details>
        <summary>
          <span class="day">${formatDateDisplay(new Date(item.day))}</span>
          <span class="title">${item.name}</span>
          <span class="filler"></span>
          <span class="meta">${item.kcal} kcal</span>
        </summary>
        <div class="expandedView">
          <div>${item.name}</div>
         <div id="detailedView">
  <div class="detailsText">
    ${formatDateDisplay(new Date(item.day))} |
    ${weightText}
  </div>

  <div class="actionButtonsRowBottom">
    <button class="deleteBtn">X</button>
    <button class="moveUpBtn">▲</button>
    <button class="moveDownBtn">▼</button>
  </div>
</div>
        </div>
      </details>
    `;

    li.querySelector(".deleteBtn").addEventListener("click", () => {
      li.remove();
      updateWeekSummary();
      saveToLocal();
      applyDayColors();
    });

    mealList.appendChild(li);
  });

  // Sortera efter datum
  const sorted = Array.from(mealList.querySelectorAll("li")).sort(
    (a, b) => new Date(b.dataset.day) - new Date(a.dataset.day)
  );

  mealList.innerHTML = "";
  sorted.forEach(li => mealList.appendChild(li));

  applyDayColors();
  updateWeekSummary();
}

// ------------------------- EVENT LISTENERS -------------------------
acceptBtn.addEventListener("click", () => {
  if (!selectedItem) {
    alert("Välj något först!");
    return;
  }

  handleSelectedItem(selectedItem);

  weightInput.value = "";
  amountSelect.value = "";
  foodDropdown.reset();
});

  // Nollställ vikt-input
  if (weightInput) {
    weightInput.value = "";
    
  }


addBtn.addEventListener("click", () => {
  if (mealBuild.children.length === 0) {
    alert("Du måste bekräfta valda alternativ först.");
    return;
  }

  const items = Array.from(mealBuild.querySelectorAll("li"));

  // Flytta items till mealList (endast en gång)
  items.forEach(item => {
    const details = item.querySelector("details");
    if (details) details.removeAttribute("open");
    mealList.appendChild(item);
  });

  // ⭐ Sortera mealList direkt
  const sortedItems = Array.from(mealList.querySelectorAll("li")).sort(
    (a, b) => new Date(b.dataset.day) - new Date(a.dataset.day)
  );

  mealList.innerHTML = "";
  sortedItems.forEach(li => mealList.appendChild(li));

  applyDayColors();
  updateWeekSummary();
  saveToLocal();
  renderCurrentWeekTotal();

  mealBuild.innerHTML = "";
  updateTotalKcal();

});

mealList.addEventListener("click", (e) => {
  if (e.target.classList.contains("deleteBtn")) {
    const item = e.target.closest("li");
    item.remove();

    updateWeekSummary();
    saveToLocal();
    applyDayColors();
    renderCurrentWeekTotal();
  }
});

daySelect.addEventListener("change", () => {
  // Detta uppdaterar visningen baserat på valt datum

  applyDayColors(); 
});


function handleSelectedItem(item) {
  const amount = Number(amountSelect.value) || 1;

  const rawPerPortion = Number(weightInput.value) || item.weight;
  const totalweight = rawPerPortion * amount;

  // Tillagad vikt baserat på proportion
  const cookedRatio = item.cWeight / item.weight;
  const cookedPerPortion = Math.round(rawPerPortion * cookedRatio);
  const totalcWeight = cookedPerPortion * amount;

  // ⭐ RÄTT: använd kcal100 (kcal per 100 g)
  const kcal = Math.round((item.kcal100 / 100) * totalweight);

  createMealBuildItem(
    item.name,
    amount,
    totalweight,
    totalcWeight,
    kcal
  );
}


//Function - beräkna vecka
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



// funktion

function createMealBuildItem(name, amount, totalweight, totalcWeight, kcal) {
  const li = document.createElement("li");

  li.classList.add("sortable-item");

  // Visa cooked weight endast om den skiljer sig från raw
  const weightDisplay =
    totalcWeight === totalweight
      ? `${totalweight} g`
      : `${totalweight} g | ${totalcWeight} gc`;

  li.innerHTML = `
  <details>
    <summary>
      <span class="day">${formatDateDisplay(new Date(daySelect.value))}</span> 
      <span class="title">${name}</span>
      <span class="filler"></span>
      <span class="meta">${kcal} kcal</span>
    </summary>

    <div class="expandedView">
      <div>${name}</div>
     <div id="detailedView">
  <div class="detailsText">
    ${formatDateDisplay(new Date(daySelect.value))} |
    ${weightDisplay}
  </div>

  <div class="actionButtonsRowBottom">
    <button class="deleteBtn">X</button>
    <button class="moveUpBtn">▲</button>
    <button class="moveDownBtn">▼</button>
  </div>
</div>


    </div>
  </details>
  `;

  li.dataset.day = daySelect.value;
  li.dataset.amount = amount;
  li.dataset.weight = totalweight;
  li.dataset.cWeight = totalcWeight;
  li.dataset.kcal = kcal;
  li.dataset.name = name;

  li.querySelector(".deleteBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    li.remove();
    updateTotalKcal();
    updateWeekSummary();
    saveToLocal();
    applyDayColors();
  });

  mealBuild.appendChild(li);
  updateTotalKcal();
}

saveBtn.addEventListener("click", () => {
  const items = Array.from(mealBuild.querySelectorAll("li"));
  if (items.length === 0) {
    alert("Det finns inga måltider att spara!");
    return;
  }

  let totalweight = 0;
  let totalcWeight = 0;
  let totalText = "";
  let totalKcal = 0;
  const mealItems = [];

  // 1. Summera alla ingredienser
  items.forEach(li => {
    const name = li.dataset.name;
    const kcal = Number(li.dataset.kcal || 0);
    const amount = Number(li.dataset.amount || 1);
    const weight = Number(li.dataset.weight || 0);
    const cWeight = Number(li.dataset.cWeight || 0);

    totalweight += weight;
    totalcWeight += cWeight;
    totalKcal += kcal;
    const weightText =
  cWeight === weight
    ? `${weight} g`
    : `${weight} g | ${cWeight} gc`;

  totalText += `${name} (${weightText}), `;


   mealItems.push({
  name: `${name} | ${weightText}`,
  kcal,
  weight,
  cWeight
});

  });

  // Ta bort sista ", "
  totalText = totalText.slice(0, -2);

  // 2. Skapa ID
  const newId = totalText.toLowerCase().replace(/\s+/g, "_");

  // 3. Spara EN måltid
    customMeals.push({
    id: newId,
    name: totalText,
    kcal: totalKcal,
    weight: totalcWeight,   // EN vikt
    items: mealItems
  });

  // 4. Spara till localStorage
  saveCustomMeals();

  // 6. Töm builder
  mealBuild.innerHTML = "";
  updateTotalKcal();

  alert(`Ny måltid "${totalText}" sparad med ${totalKcal} kcal och ${totalcWeight} g!`);
});


//Function current week total

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

mealList.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (!li) return;

  if (e.target.classList.contains("moveUpBtn")) {
    const prev = li.previousElementSibling;
    if (prev) {
      mealList.insertBefore(li, prev);
      saveToLocal();
      applyDayColors();
      updateWeekSummary();
    }
  }

  if (e.target.classList.contains("moveDownBtn")) {
    const next = li.nextElementSibling;
    if (next) {
      mealList.insertBefore(next, li);
      saveToLocal();
      applyDayColors();
      updateWeekSummary();
    }
  }

  if (e.target.classList.contains("deleteBtn")) {
    li.remove();
    saveToLocal();
    applyDayColors();
    updateWeekSummary();
  }
});




/* DENNA VERKAR INTE ANVÄNDAS LÄNGRE - ERSATT AV MANUAL SAVE WEEK HISTORY
function checkNewWeek() {
  const now = new Date();
  const currentWeek = getWeekNumber(now);
  const lastSavedWeek = Number(localStorage.getItem("lastSavedWeek"));

  if (!lastSavedWeek) {
    localStorage.setItem("lastSavedWeek", currentWeek);
    return;
  }

  if (currentWeek !== lastSavedWeek) {

    const mealItems = Array.from(document.querySelectorAll("#mealList li"));
    let weekTotal = 0;

    const keep = [];

    mealItems.forEach(li => {
      const mealDate = new Date(li.dataset.day);
      const week = getWeekNumber(mealDate);

      if (week === lastSavedWeek) {
        weekTotal += Number(li.dataset.kcal || 0);
      } else {
        keep.push(li);
      }
    });

    const weekHistoryEl = document.getElementById("weekHistory");
    const li = document.createElement("li");
   li.innerHTML = `
      <span class="weekLabel">Vecka ${lastSavedWeek}</span>
      <span class="weekKcal">${weekTotal} kcal</span>`;

    li.dataset.week = lastSavedWeek;
    weekHistoryEl.prepend(li);

    mealList.innerHTML = "";
    keep.forEach(li => mealList.appendChild(li));

    saveToLocal();
    localStorage.setItem("lastSavedWeek", currentWeek);
  }
} */ 

// ------------------------- EXPORT / IMPORT EVENTS -------------------------

document.getElementById("exportBtn").addEventListener("click", exportData);
document.getElementById("refreshAppBtn").addEventListener("click", () => {
  location.reload();
});

document.getElementById("importFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) importData(file);
});

//EXPORT FUNCTION
function exportData() {
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

//RESTORE FUNCTION
function importData(file) {
  const reader = new FileReader();

  reader.onload = function(e) {
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
      alert("Fel vid import av fil!");
      console.error(err);
    }
  };

  reader.readAsText(file);
}

renderDaySelect(); 
applyDayColors();

//BOTTOM BAR
function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
  document.getElementById(viewId).style.display = 'block';
}

//BOTTOM BAR PAGE SELECT
const buttons = document.querySelectorAll('.bottom-nav button');
const views = document.querySelectorAll('.view');

window.addEventListener("DOMContentLoaded", () => { //BEHÖVER SES ÖVER - DUBBEL FUNKTION?
  const firstButton = buttons[0];
  if (firstButton) {
    firstButton.classList.add("active");

    // Visa första vyn direkt
    const target = firstButton.dataset.view;
    document.getElementById(target).style.display = 'block';
  }
});

buttons.forEach(btn => { //BEHÖVER SES ÖVER - DUBBEL FUNKTION?
  btn.addEventListener('click', () => {
    const target = btn.dataset.view;

    // Ta bort active från alla knappar
    buttons.forEach(b => b.classList.remove('active'));

    // Lägg till active på den klickade knappen
    btn.classList.add('active');

    // Dölj alla vyer
    views.forEach(v => v.style.display = 'none');

    // Visa rätt vy
    document.getElementById(target).style.display = 'block';
  });
});

const dailyGoalInput = document.getElementById("dailyGoal");
const saveGoalBtn = document.getElementById("saveGoalBtn");

// Ladda mål vid start
function loadDailyGoal() {
  const goal = localStorage.getItem("dailyKcalGoal");
  if (goal) dailyGoalInput.value = goal;
}
loadDailyGoal();

// Spara mål
saveGoalBtn.addEventListener("click", () => {
  const goal = Number(dailyGoalInput.value);
  if (!goal || goal < 500) {
    alert("Ange ett rimligt kcal-mål.");
    return;
  }
  localStorage.setItem("dailyKcalGoal", goal);
  updateWeekSummary();
  alert("Mål sparat!");
});

document.getElementById("saveWeekBtn").addEventListener("click", saveCurrentWeekManually);


//DROPDOWN//

// ---------------------------------------------------------
// LOAD FOODS
// ---------------------------------------------------------
async function loadFoods() {
  const res = await fetch("foods.json");
  return await res.json();
}

// ---------------------------------------------------------
// COMPONENT: SEARCHABLE DROPDOWN
// ---------------------------------------------------------
class SearchableDropdown {
  constructor({ container, placeholder = "Sök...", items = [], onSelect = null }) {
    this.container = container;
    this.placeholder = placeholder;
    this.items = items.sort((a, b) => a.name.localeCompare(b.name, "sv"));
    this.onSelect = onSelect;

    this.render();
    this.attachEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="dropdown">
        <input type="text" class="dropdown-input" placeholder="${this.placeholder}" autocomplete="off">
        <div class="dropdown-list"></div>
      </div>
    `;

    this.input = this.container.querySelector(".dropdown-input");
    this.list = this.container.querySelector(".dropdown-list");

    this.renderList();
  }

  renderList() {
    this.list.innerHTML = "";

    this.items.forEach(item => {
      const div = document.createElement("div");
      div.className = "item";

      div.innerHTML = `
        <div class="item-row">
          <div class="item-name">${item.name}</div>
          <div class="item-meta">
            <span class="meta-left">${item.weight} g</span>
            ${item.weight !== item.cWeight
              ? `<span class="meta-center">${item.cWeight} g</span>`
              : `<span class="meta-center"></span>`}
            <span class="meta-right">${item.kcal} kcal</span>
          </div>
          <hr class="item-divider">
        </div>
      `;

      div.addEventListener("click", () => {
        this.selectedItem = item;

        this.input.value =
          item.weight !== item.cWeight
            ? `${item.name} | ${item.weight} g | ${item.cWeight} g | ${item.kcal} kcal`
            : `${item.name} | ${item.weight} g | ${item.kcal} kcal`;

        this.list.style.display = "none";

        if (this.onSelect) this.onSelect(item);
      });

      this.list.appendChild(div);
    });
  }

  attachEvents() {
    this.input.addEventListener("focus", () => {
      this.input.select();
      this.list.style.display = "block";
    });

    this.input.addEventListener("input", () => {
      const q = this.input.value.toLowerCase();
      this.list.querySelectorAll(".item").forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(q)
          ? "block"
          : "none";
      });
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".dropdown")) {
        this.list.style.display = "none";
      }
    });
  }
  reset() {
  this.input.value = "";
  this.selectedItem = null;
  this.renderList();
  this.list.style.display = "none";
}
}
async function init() {
  // 1. Ladda foods och normalisera JSON-formatet
  const foodsRaw = await loadFoods();

  const foods = foodsRaw.map(f => ({
    id: f.id,
    name: f.name,
    weight: f.weight,
    cWeight: f.cWeight ?? f.cWeight ?? f.weight,
    kcal100: f.kcal100,
    kcal: f.kcal, // total kcal, används bara som metadata
    category: f.category
  }));

  // 2. Ladda custom meals
  loadCustomMeals();

  // 3. Normalisera customMeals också
  const customItems = customMeals.map(m => ({
    id: m.id,
    name: m.name,
    weight: m.weight,
    cWeight: m.cWeight ?? m.weight,
    kcal100: m.kcal100 ?? (m.kcal / (m.weight / 100)), // fallback
    kcal: m.kcal,
    category: "custom"
  }));

  // 4. Slå ihop båda listorna
  const items = [...foods, ...customItems];

  // 5. Skapa dropdown
  foodDropdown = new SearchableDropdown({
    container: document.querySelector("#foodDropdown"),
    placeholder: "Sök livsmedel...",
    items,
    onSelect: (item) => {
      selectedItem = item;
    }
  });
}


init();



// ---------------------------------------------------------
// OPTIONAL: SHOW SELECTED INFO
// ---------------------------------------------------------
function showSelectedInfo(item) {
  console.log("Valt item:", item);
}




