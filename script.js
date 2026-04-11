
//#region DOM ELEMENTS
const foodSelect = document.getElementById("foodSelect");
const mealSelect = document.getElementById("mealSelect");
const weightInput = document.getElementById("weightInput");
const amountSelect = document.getElementById("amountSelect");
const addBtn = document.getElementById("addBtn");
const acceptBtn = document.getElementById("acceptBtn");
const saveBtn = document.getElementById("saveBtn");
const mealList = document.getElementById("mealList");
const mealBuild = document.getElementById("mealBuild");
const daySelect = document.getElementById("daySelect");
const weekHistory = document.getElementById("weekHistory");
const deleteMealBtn = document.getElementById("deleteMealBtn");

let foods = []; //behövs för global användning av foods-JSON
let meals = []; //behövs för global användning av meals-JSON
  //#endregion

  //Bygger JSON-listan foods
  function initFoodSelect(foods) {
      const sortedFoods = foods.slice().sort((a, b) => {
          return a.name.localeCompare(b.name, 'sv');
      });
      sortedFoods.forEach(item => {
          const option = document.createElement('option');
          option.value = item.id;

          const cookedWeight = Math.round(item.weight * (item.cooked / 100));

const kcalTotal = Math.round((item.kcal / 100) * item.weight);
let text = `${item.name} | ${kcalTotal} kcal | ${item.weight} g`;


if (cookedWeight !== item.weight) {
    text += ` → ${cookedWeight} (gc)`;
}
option.textContent = text;
foodSelect.appendChild(option);
      });
  }

//Laddar JSON+startar appen 
async function loadFoods() {
    const response = await fetch('./foods.json');
    foods = await response.json();
    initFoodSelect(foods);
}
    loadFoods(); //JSON


  //Bygger JSON-listan meals
 function initMealSelect(meals) {
    const sortedMeals = meals.slice().sort((a, b) => {
        return a.name.localeCompare(b.name, 'sv');
    });
    sortedMeals.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;

        let text = `${item.name} | ${item.kcal} kcal | ${item.weight} g`;

        option.textContent = text;

        mealSelect.appendChild(option); // 👈 viktigt
    });
}

//Laddar JSON+startar appen 
async function loadMeals() {
    const response = await fetch('./meals.json');
    meals = await response.json();
}

loadMeals(); //JSON

//#region DATA & VARIABLES

let customMeals = []; // Egna måltider skapade av användaren
const savedMeals = JSON.parse(localStorage.getItem("mealList")) || [];

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
  await loadMeals();     // vänta tills meals.json är laddad
  loadCustomMeals();     // laddar customMeals och kör renderMealSelect()
  loadFromLocal();
  checkNewWeek();
});



  //#endregion

//#region FUNCTIONS
  const getKcal = (f, weight = f.weight) => Math.round(f.kcal * weight / 100);

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



function applyDayColors() {
  const items = Array.from(mealList.querySelectorAll("li"));
  const colors = ["#fffcab", "#a5f0ff"];
  let lastDay = null;
  let colorIndex = 0;

  items.forEach(li => {
    const day = li.dataset.day;
    if (day !== lastDay) { colorIndex = 1 - colorIndex; lastDay = day; }
    li.style.backgroundColor = colors[colorIndex];
    li.style.padding = "4px 8px";
    li.style.borderRadius = "4px";
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

  const sortedDays = Object.keys(dayTotals).sort(
    (a, b) => new Date(a) - new Date(b)
  );

  const weekSummaryEl = document.getElementById("weekSummary");
  weekSummaryEl.innerHTML = "";

  sortedDays.forEach(day => {
    const li = document.createElement("li");
    li.textContent = `${formatDateDisplay(new Date(day))}: ${dayTotals[day]} kcal`;
    weekSummaryEl.appendChild(li);
  });
}



  //#endregion

  //#region HELP FUNCTIONS

function extractWeekday(displayText) {
  return displayText.split(" ")[1]; // t.ex. "5/4 Söndag" → "Söndag"
}

  //#endregion

  // Lägg till / uppdatera endast EN rad i weekHistory
  if(weekHistory) {
    const now = new Date();
    const currentWeek = getWeekNumber(now);

    // Hitta befintlig rad
    let existing = weekHistory.querySelector(`li[data-week='${currentWeek}']`);

    if (!existing) {
      // Skapa ny rad ENDAST om den inte finns
      existing = document.createElement("li");
      existing.dataset.week = currentWeek;
      weekHistory.appendChild(existing);
    }

    // Uppdatera text
    const weekTotal = calculateCurrentWeekTotal();
    existing.textContent = `Denna vecka: ${weekTotal} kcal`;
  } else {
    console.warn("weekHistory finns inte i DOM");
  }


// Hjälpfunktion: veckonummer
function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(),0,1);
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

function saveToLocal() {
  const data = Array.from(mealList.querySelectorAll("li")).map(li => ({
    day: li.dataset.day,
    name: li.querySelector(".name")?.textContent || li.querySelector(".title")?.textContent || "",
    amount: li.dataset.amount || 1,
    weight: li.dataset.weight || 0,
    kcal: li.dataset.kcal || 0
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

  renderMealSelect();
}

function renderMealSelect() {
  mealSelect.innerHTML = "<option value=''>Måltid</option>";

  const allMeals = [...meals, ...customMeals].sort((a, b) =>
    a.name.localeCompare(b.name, "sv")
  );

  allMeals.forEach(m => {
    const option = document.createElement("option");
    option.value = m.id;

    const weight = m.weight;
    const kcalPerGram = m.kcal / weight;
    const kcalTotal = Math.round(kcalPerGram * weight);

    option.textContent = `${m.name} | ${kcalTotal} kcal | ${weight} g`;
    mealSelect.appendChild(option);
  });
}



// ------------------------- DELETE SELECTED MEAL -------------------------
deleteMealBtn.addEventListener("click", () => {
  const selectedValue = mealSelect.value;

  if (!selectedValue) {
    alert("Välj en måltid i dropdown-menyn först!");
    return;
  }

  const optionToDelete = mealSelect.querySelector(`option[value="${selectedValue}"]`);
  if (optionToDelete) {
    optionToDelete.remove();
    mealSelect.value = "";
    mealSelect.classList.remove("select-active");
    mealSelect.classList.add("select-default");
  }

  const index = customMeals.findIndex(m => m.id === selectedValue);
  if (index !== -1) {
    const deletedMeal = customMeals.splice(index, 1)[0];
    saveCustomMeals();
    alert(`Måltiden "${deletedMeal.name}" har raderats permanent.`);
  } else {
    alert(`Måltiden raderades från dropdown, men finns inte i sparade måltider.`);
  }

  renderMealSelect();
});

// ------------------------- LOAD SAVED MEALS -------------------------
function loadFromLocal() {
  const savedMeals = JSON.parse(localStorage.getItem("mealList")) || [];
  mealList.innerHTML = "";

  savedMeals.forEach(item => {
    const li = document.createElement("li");
    li.dataset.day = item.day;
    li.dataset.amount = item.amount;
    li.dataset.weight = item.weight;
    li.dataset.kcal = item.kcal;

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
            ${formatDateDisplay(new Date(item.day))} |
            ${item.amount}st |
            ${item.weight} gram |
            <button class="deleteBtn">X</button>
          </div>
        </div>
      </details>
    `;

    // Lägg till delete-knapp listener
    const btn = li.querySelector(".deleteBtn");
    if(btn) {
      btn.addEventListener("click", () => {
        li.remove();
        updateWeekSummary();
        saveToLocal();
        applyDayColors();
      });
    }

    mealList.appendChild(li);
  });

// Sortera efter datum
const sorted = Array.from(mealList.querySelectorAll("li")).sort(
  (a, b) => new Date(a.dataset.day) - new Date(b.dataset.day)
);

mealList.innerHTML = "";
sorted.forEach(li => mealList.appendChild(li));

  applyDayColors();
  updateWeekSummary();
}

// ------------------------- EVENT LISTENERS -------------------------
acceptBtn.addEventListener("click", () => {
  // STOPP: om inget är valt
  if (!foodSelect.value && !mealSelect.value) {
    alert("Välj livsmedel eller måltid först!");
    return;
  }

  // STOPP: om båda är valda samtidigt
  if (foodSelect.value && mealSelect.value) {
    alert("Välj antingen livsmedel eller måltid - inte båda!");
    return;
  }

  const amount = Number(amountSelect.value) || 1;
  let selectedText = "";
  let totalWeightRaw = 0;
  let totalWeightCooked = 0;
  let baseKcal = 0;

  // ---------------- LIVSMEDEL ----------------
  if (foodSelect.value) {
    const food = foods.find(f => f.id === foodSelect.value);

    // rå vikt per portion
    const rawPerPortion = Number(weightInput.value) || food.weight;
    totalWeightRaw = rawPerPortion * amount;

    // tillagad vikt per portion
    const cookedPerPortion = Math.round(rawPerPortion * (food.cooked / 100));
    totalWeightCooked = cookedPerPortion * amount;

    selectedText = food.name;

    // kcal baserat på tillagad vikt
    baseKcal = Math.round((food.kcal / 100) * totalWeightRaw);


    createMealBuildItem(
      selectedText,
      amount,
      totalWeightRaw,
      totalWeightCooked,
      baseKcal
    );
  }

  // ---------------- SPARAD MÅLTID ----------------
  // ---------------- SPARAD MÅLTID ----------------
else if (mealSelect.value) {
  const meal = [...meals, ...customMeals].find(m => m.id === mealSelect.value);

  selectedText = meal.name;

  const rawPerPortion = Number(weightInput.value) || meal.weight;
  const totalWeight = rawPerPortion * amount;

  const kcalPerGram = meal.kcal / meal.weight;
  baseKcal = Math.round(kcalPerGram * totalWeight);

  createMealBuildItem(
    selectedText,
    amount,
    totalWeight,
    totalWeight,   // cooked = raw för måltider
    baseKcal
  );
}



  // Nollställ selects
  allSelects.forEach(select => {
    select.selectedIndex = 0;
    select.classList.remove("select-active");
    select.classList.add("select-default");
  });

  // Nollställ vikt-input
  if (weightInput) {
    weightInput.value = "";
  }
});


addBtn.addEventListener("click", () => {
  const items = Array.from(mealBuild.querySelectorAll("li"));

  items.forEach(item => {
    mealList.appendChild(item);
  });

  // Sortera efter datum
  const sortedItems = Array.from(mealList.querySelectorAll("li")).sort(
    (a, b) => new Date(a.dataset.day) - new Date(b.dataset.day)
  );

  mealList.innerHTML = "";
  sortedItems.forEach(li => mealList.appendChild(li));

  applyDayColors();
  updateWeekSummary();
  saveToLocal();

  mealBuild.innerHTML = "";
  updateTotalKcal();

  allSelects.forEach(select => {
    select.value = "";
    select.classList.remove("select-active");
    select.classList.add("select-default");
  });
});

mealList.addEventListener("click", (e) => {
  if (e.target.classList.contains("deleteBtn")) {
    const item = e.target.closest("li");
    item.remove();

    updateWeekSummary();
    saveToLocal();
    applyDayColors();
  }
});

daySelect.addEventListener("change", () => {
  // Detta uppdaterar visningen baserat på valt datum
  updateMealBuildView();
  applyDayColors(); 
});

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

function createMealBuildItem(name, amount, totalWeightRaw, totalWeightCooked, kcal) {
  const li = document.createElement("li");

  // Visa cooked weight endast om den skiljer sig från raw
  const weightDisplay =
    totalWeightCooked === totalWeightRaw
      ? `${totalWeightRaw} g`
      : `${totalWeightRaw} g → ${totalWeightCooked} g (gc)`;

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
        ${formatDateDisplay(new Date(daySelect.value))} |
        ${amount}st |
        ${weightDisplay}
        <button class="deleteBtn">X</button>
      </div>
    </div>
  </details>
  `;

  li.dataset.day = daySelect.value;
  li.dataset.amount = amount;
  li.dataset.weightRaw = totalWeightRaw;
  li.dataset.weightCooked = totalWeightCooked;
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

  let totalWeightRaw = 0;
  let totalWeightCooked = 0;
  let totalText = "";
  let totalKcal = 0;
  const mealItems = [];

  // 1. Summera alla ingredienser
  items.forEach(li => {
    const name = li.dataset.name;
    const kcal = Number(li.dataset.kcal || 0);
    const amount = Number(li.dataset.amount || 1);
    const weightRaw = Number(li.dataset.weightRaw || 0);
    const weightCooked = Number(li.dataset.weightCooked || 0);

    totalWeightRaw += weightRaw;
    totalWeightCooked += weightCooked;
    totalKcal += kcal;
    totalText += `${name} (${amount}), `;

    mealItems.push({
      name: `${name} (${amount})`,
      kcal,
      weightRaw,
      weightCooked
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
    weight: totalWeightCooked,   // EN vikt
    items: mealItems
  });

  // 4. Spara till localStorage
  saveCustomMeals();

  // 5. Uppdatera dropdown
  renderMealSelect();

  // 6. Töm builder
  mealBuild.innerHTML = "";
  updateTotalKcal();

  alert(`Ny måltid "${totalText}" sparad med ${totalKcal} kcal och ${totalWeightCooked} g!`);
});


//Function current week total

function renderCurrentWeekTotal() {
  const currentWeekTotal = calculateCurrentWeekTotal();
  const weekHistory = document.getElementById("weekHistory");
  if (!weekHistory) return;

  const now = new Date();
  const currentWeek = getWeekNumber(now);

  // Hitta befintlig rad
  let existing = weekHistory.querySelector(`li[data-week='${currentWeek}']`);

  if (!existing) {
    // Skapa ny rad ENDAST om den inte finns
    existing = document.createElement("li");
    existing.dataset.week = currentWeek;
    weekHistory.appendChild(existing);
  }

  // Uppdatera text
  existing.textContent = `Denna vecka: ${currentWeekTotal} kcal`;
}
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
    li.textContent = `Vecka ${lastSavedWeek}: ${weekTotal} kcal`;
    li.dataset.week = lastSavedWeek;
    weekHistoryEl.prepend(li);

    mealList.innerHTML = "";
    keep.forEach(li => mealList.appendChild(li));

    saveToLocal();
    localStorage.setItem("lastSavedWeek", currentWeek);
  }
}

const allSelects = [foodSelect, mealSelect, amountSelect];
allSelects.forEach(select => {
  select.classList.add("select-default");
  select.addEventListener("change", () => {
    select.classList.toggle("select-active", select.value !== "");
    select.classList.toggle("select-default", select.value === "");
  });
});

function populateSelect(select, items, textFn) {
  items.forEach(item => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = textFn(item);
    select.appendChild(option);
  });
}

// ------------------------- EXPORT / IMPORT EVENTS -------------------------

document.getElementById("exportBtn").addEventListener("click", exportData);

document.getElementById("importFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) importData(file);
});

//EXPORT FUNCTION
function exportData() {
  const data = {
    mealList: JSON.parse(localStorage.getItem("mealList")) || [],
    customMeals: JSON.parse(localStorage.getItem("customMeals")) || [],
    lastSavedWeek: localStorage.getItem("lastSavedWeek") || null
  };

  const today = new Date().toISOString().split("T")[0]; 
  // ex: 2026-04-11

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
loadCustomMeals();
applyDayColors();
