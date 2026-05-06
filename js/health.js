let healthHistoryData = [];
let weekHistoryData = [];
let healthEntries = [];

function loadHealthEntries() {
  healthEntries = JSON.parse(localStorage.getItem("health_entries") || "[]");
}
function loadHealthHistory() {
  healthHistoryData = JSON.parse(localStorage.getItem("healthHistory") || "[]");
}
function loadWeekHistory() {
  weekHistoryData = JSON.parse(localStorage.getItem("weekHistory") || "[]");
}


// ---------------------------------------------------------
// 1. LocalStorage-modul
// ---------------------------------------------------------
const healthStorage = {
  load() {
    return JSON.parse(localStorage.getItem("health_entries") || "[]");
  },

  save(data) {
    localStorage.setItem("health_entries", JSON.stringify(data));
  }
};

// ---------------------------------------------------------
// 2. createList – lista för hälsodata
// ---------------------------------------------------------

function createHealthList(container) {
  const el = document.querySelector(container);
  let entries = healthStorage.load();

  function computeDiffs(sorted) {
    const height = parseInt(localStorage.getItem("userHeightCm"));

    return sorted.map((entry, index) => {
      const prev = sorted[index + 1];

      const weight = parseFloat(entry.weight).toFixed(1);
      const waist = parseFloat(entry.waist);
      const bmi = height
        ? calculateBMI(parseFloat(weight), height).toFixed(1)
        : "";

      let diffWeight = "";
      let diffWaist = "";
      let diffBmi = "";

      if (prev) {
        const wPrev = parseFloat(prev.weight);
        const waistPrev = parseFloat(prev.waist);

        const wDiff = (parseFloat(weight) - wPrev).toFixed(1);
        diffWeight = wDiff != 0
          ? (wDiff > 0 ? `(+${wDiff})` : `(${wDiff})`)
          : "";

        const waistD = Math.round(waist - waistPrev);
        diffWaist = waistD != 0
          ? (waistD > 0 ? `(+${waistD})` : `(${waistD})`)
          : "";

        if (height) {
          const prevBmi = calculateBMI(wPrev, height).toFixed(1);
          const bmiDiff = (bmi - prevBmi).toFixed(1);

          diffBmi = bmiDiff != 0
            ? (bmiDiff > 0 ? `(+${bmiDiff})` : `(${bmiDiff})`)
            : "";
        }
      }

      return {
        ...entry,
        weight,
        bmi,
        diffWeight,
        diffWaist,
        diffBmi
      };
    });
  }

  function render() {
    el.innerHTML = "";

    const sorted = entries
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const withDiffs = computeDiffs(sorted);

    withDiffs.forEach(item => {
      const li = document.createElement("li");
      li.classList.add("list-item");
      li.dataset.date = item.date;

      li.innerHTML = renderUnifiedListItemHTML(item, healthConfig);
      attachUnifiedListItemEvents(li, el);

      el.appendChild(li);
    });
  }

  // Render initial list
  render();

  return {
    get entries() {
      return entries;
    },
    set entries(val) {
      entries = val;
    },

    add(data) {
      entries.push(data);
      healthEntries = entries;
      healthStorage.save(entries);
      render();
    },

    clear() {
      entries = [];
      healthStorage.save(entries);
      render();
    },

    remove(date) {
      entries = entries.filter(e => e.date !== date);
      healthStorage.save(entries);
      render();
    },

    render
  };
}



// ---------------------------------------------------------
// 3. healthInput – enkel inputpanel
// ---------------------------------------------------------
const healthInput = {
  onAdd: null,
  getDate: null,

  init({ onAdd, getDate }) {
    this.onAdd = onAdd;
    this.getDate = getDate;
  },

save() {
  const rawDate = this.getDate();
  const dateObj = rawDate instanceof Date ? rawDate : ds_fromISO(rawDate);

  const isoDate   = ds_toISO(dateObj);
  const dateLabel = ds_formatShort(dateObj);

  const weight = document
    .querySelector("#bodyWeightInput")
    .value.replace(",", ".");
  const waist = document
    .querySelector("#bodyWaistInput")
    .value.replace(",", ".");

  if (weight && waist) {

    const height = parseInt(localStorage.getItem("userHeightCm"));
    const bmi = height
      ? calculateBMI(parseFloat(weight), height).toFixed(1)
      : "";

  // ⭐ 1. Beräkna veckonyckel
const weekKey = ds_getWeekKey(dateObj);

// ⭐ 2. Kolla om veckan redan finns i healthList.entries
const existingIndex = healthList.entries.findIndex(e =>
  ds_getWeekKey(ds_fromISO(e.date)) === weekKey
);

if (existingIndex !== -1) {
  const overwrite = confirm(
    `Du har redan sparat vecka ${weekKey}. Vill du skriva över?`
  );
  if (!overwrite) return;

  // ⭐ Ta bort den gamla posten innan vi lägger till den nya
  healthList.entries.splice(existingIndex, 1);
  healthStorage.save(healthList.entries);
}
    
    this.onAdd({
      date: isoDate,
      dateLabel,
      weight,
      waist,
      bmi   // ⭐ NU SPARAS BMI
    });

    showToast("Hälsa sparad");
    document.querySelector("#bodyWeightInput").value = "";
    document.querySelector("#bodyWaistInput").value = "";
    return;
  }
  showToast("Inget att spara");
}
};

// ---------------------------------------------------------
// 4. Skapa lista
// ---------------------------------------------------------
const healthList = createHealthList("#healthList");

// ---------------------------------------------------------
// 5. Initiera inputmodulen
// ---------------------------------------------------------
healthInput.init({
  onAdd: (data) => healthList.add(data),
  getDate: () => window.healthDay.getActiveDate()
});

// ---------------------------------------------------------
// 6. Save-knapp
// ---------------------------------------------------------

document.querySelector("#saveHealthBtn").addEventListener("click", () => {
  healthInput.save();
});

// ---------------------------------------------------------
// ANTAL TRÄNINGSDAGAR I STRÄCK //
// ---------------------------------------------------------
// Hämta datum till beräkning antal träningsdagar
const startDate = document.querySelector("#startDateInput").value;

//Beräkna antal dagar
function daysSince(dateString) {
  const start = new Date(dateString);
  const today = new Date();

  // nollställ tid för att undvika timezone-buggar
  start.setHours(0,0,0,0);
  today.setHours(0,0,0,0);

  const diffMs = today - start;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
// Hämta beräknat antal dagar
const chosenDate = document.querySelector("#startDateInput").value;
const days = daysSince(chosenDate);

//Spara datum så fort det väljs
const startDateInput = document.querySelector("#startDateInput");
const trainingDaysOutput = document.querySelector("#trainingDaysOutput");

// spara när användaren väljer datum
startDateInput.addEventListener("change", () => {
  localStorage.setItem("training_start_date", startDateInput.value);
  updateTrainingDays();
});

// ladda sparat värde vid start
function loadTrainingStartDate() {
  const saved = localStorage.getItem("training_start_date");
  if (saved) {
    startDateInput.value = saved;
  }
}

//Uppdatera textfält som redovisar antal dagar
function updateTrainingDays() {
  const chosenDate = startDateInput.value;
  const days = daysSince(chosenDate);

  trainingDaysOutput.textContent = `Träningsstreak: ${days} dagar`;
}
loadTrainingStartDate();
updateTrainingDays();

// ---------------------------------------------------------
// Options för val av längd
// ---------------------------------------------------------
const lengthSelect = document.querySelector("#lengthSelect");

// Generera options 150–210 cm
for (let cm = 150; cm <= 210; cm++) {
  const opt = document.createElement("option");
  opt.value = cm;
  opt.textContent = cm + " cm";
  lengthSelect.appendChild(opt);
}
// Ladda sparat värde från Local Storage
let savedLength = localStorage.getItem("userHeightCm");

if (savedLength) {
  // Använd sparat värde
  lengthSelect.value = savedLength;
} else {
  // ⭐ Första gången: sätt default till 150 cm
  const defaultHeight = 150;
  lengthSelect.value = defaultHeight;
  localStorage.setItem("userHeightCm", defaultHeight);
}

// Spara angett värde
lengthSelect.addEventListener("change", () => {
  localStorage.setItem("userHeightCm", lengthSelect.value);
});

// ---------------------------------------------------------
// Beräkning av BMI
// ---------------------------------------------------------
function calculateBMI(weightKg, heightCm) {
  const h = heightCm / 100;
  return (weightKg / (h * h));
}

// ---------------------------------------------------------
// Build Weekly Health Summary
// ---------------------------------------------------------
function buildWeeklyHealthSummary(entries) {
  const weeks = {};

  entries.forEach(e => {
    const { week, year } = ds_getISOWeek(e.date);
    const key = `${year}-W${String(week).padStart(2, "0")}`;

    if (!weeks[key]) {
      weeks[key] = [];
    }

    weeks[key].push(e);
  });

  // Skapa en sammanfattning per vecka
  return Object.entries(weeks).map(([weekKey, items]) => {
    // Sortera veckan så senaste posten hamnar sist
    items.sort((a, b) => new Date(a.date) - new Date(b.date));

    const last = items[items.length - 1];

    return {
      weekKey,
      date: last.date,
      weight: last.weight,
      waist: last.waist,
      bmi: last.bmi
    };
  });
}

// ---------------------------------------------------------
// Save week to history
// ---------------------------------------------------------


// ---------------------------------------------------------
// spara hälsa till week history
// ---------------------------------------------------------
function saveHealthWeekToHistory(entries) {
  const { week, year } = ds_getISOWeek(entries[0].date);

  const weightAvg = (
    entries.reduce((a, b) => a + parseFloat(b.weight), 0) / entries.length
  ).toFixed(1);

  const waistAvg = Math.round(
    entries.reduce((a, b) => a + parseFloat(b.waist), 0) / entries.length
  );

  const bmiAvg = entries[0].bmi
    ? (
        entries.reduce((a, b) => a + parseFloat(b.bmi), 0) / entries.length
      ).toFixed(1)
    : null;

  const entry = {
    year,
    week,
    weight: weightAvg,
    waist: waistAvg,
    bmi: bmiAvg,
    items: entries
  };

  // ⭐ RAM först
  const index = healthHistoryData.findIndex(h => h.year === year && h.week === week);

  if (index !== -1) {
    healthHistoryData[index] = entry;
  } else {
    healthHistoryData.unshift(entry);
  }

  // ⭐ Synka till localStorage
  localStorage.setItem("healthHistory", JSON.stringify(healthHistoryData));

  // ⭐ Rendera om UI
  renderHealthHistory(healthHistoryData);
}

// ---------------------------------------------------------
// Hitta överlappande veckor
// ---------------------------------------------------------
function weekOverlapsMonth(weekEntry, year, month) {
  const monthStr = `${year}-${month}`;

  return weekEntry.days.some(d => d.date.startsWith(monthStr));
}

// ---------------------------------------------------------
// Filtrera historik genom val i select
// ---------------------------------------------------------

function filterHealthHistoryByYear(year) {
  return healthHistoryData.filter(entry => entry.month.startsWith(year));
}


