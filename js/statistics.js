
//hämta tillgängliga årtal
function getYearsWithData() {
  const years = new Set();

  const health = JSON.parse(localStorage.getItem("health_entries") || "[]");
  const weeks = JSON.parse(localStorage.getItem("weekHistory") || "[]");

  health.forEach(e => {
    if (e.date && typeof e.date === "string") {
      years.add(Number(e.date.slice(0, 4)));
    }
  });

  weeks.forEach(w => {
    if (w.week && typeof w.week === "string") {
      years.add(Number(w.week.slice(0, 4)));
    }
  });

  return [...years].sort((a, b) => a - b);
}


//bygg lista med årtal
function buildFullYearList() {
  const yearsWithData = getYearsWithData();
  const currentYear = new Date().getFullYear();

  const maxYear = currentYear;
  const minDataYear = yearsWithData.length > 0 ? yearsWithData[0] : currentYear;
  const minVisibleYear = currentYear - 4;
  const minYear = Math.min(minDataYear, minVisibleYear);

  const list = [];
  for (let y = minYear; y <= maxYear; y++) {
    list.push(String(y));
  }

  return list;
}


// Initera månads-scroller
let monthScroller = null;

function getMonthsForYear(year) {
  const months = new Set();

  const health = JSON.parse(localStorage.getItem("health_entries") || "[]");
  const weeks = JSON.parse(localStorage.getItem("weekHistory") || "[]");

  health.forEach(e => {
    if (e.date.startsWith(year)) months.add(e.date.slice(5, 7));
  });

  weeks.forEach(w => {
    if (!w || typeof w.week !== "string") return;
    if (w.week.startsWith(year)) months.add(w.week.slice(5, 7));
  });

  return [...months].sort();
}


// render month scroller
function renderMonthScroller(year) {
  const monthsWithData = getMonthsForYear(year);

  monthScroller = createScroller({
    container: document.getElementById("monthScroller"),
    items: ["01","02","03","04","05","06","07","08","09","10","11","12"],
    onSelect: (month) => {
      activeMonth = month;
    },
    decorateItem: (item, value) => {
      if (!monthsWithData.includes(value)) {
        item.classList.add("no-data");
      }
    }
  });

  monthScroller.activate(null);
}


// Initera year scroller
function initYearScroller() {
  const years = buildFullYearList();
  const yearsWithData = new Set(getYearsWithData().map(String));
  const currentYear = String(new Date().getFullYear());

  yearScroller = createScroller({
    container: document.getElementById("yearScroller"),
    items: years,
    onSelect: (year) => {
      activeYear = year;
      activeMonth = null;
      renderMonthScroller(year);
    },
    decorateItem: (item, value) => {
      if (!yearsWithData.has(value)) {
        item.classList.add("no-data");
      }
    }
  });

  yearScroller.activate(currentYear);

  const container = document.getElementById("yearScroller");
  const activeItem = container.querySelector(`.scroll-item[data-value="${currentYear}"]`);

  if (activeItem) {
    const offset = activeItem.offsetLeft - (container.clientWidth - activeItem.clientWidth);
    container.scrollTo({ left: offset, behavior: "smooth" });
  }
}


//render weekSummary
function renderWeekSummary(days) {
  const ul = document.getElementById("weekSummary");
  if (!ul) return;

  ul.innerHTML = "";
  

  days.forEach(d => {
    const li = document.createElement("li");
    li.classList.add("rowBase");

    li.innerHTML = `
      <span class="day">${d.date}</span>
      <span class="meta">${d.totalKcal} kcal (${d.diff >= 0 ? "+" : ""}${d.diff})</span>
    `;

    ul.appendChild(li);
  });
}

//render health history
function renderHealthHistory(list = healthHistoryData) {
  const container = document.getElementById("healthHistory");
  if (!container) return;

  container.innerHTML = "";

  list.forEach(month => {
    const block = document.createElement("div");
    block.classList.add("historyBlock");

    let html = "";

    if (month.items && month.items.length > 0) {
      month.items.forEach(e => {
        html += `
          <div class="rowBase">
            <span class="day">${month.month}</span>
            <span class="meta">${e.weight} kg, ${e.waist} cm, BMI ${e.bmi}</span>
          </div>
        `;
      });
    }

    block.innerHTML = html;
    container.appendChild(block);
  });
}



// Save current monthly health manually
function saveCurrentMonthHealth() {
  // 1. Läs rådata direkt från localStorage
  const health = JSON.parse(localStorage.getItem("health_entries") || "[]");

  if (health.length === 0) {
    showToast("det finns ingen hälsodata att spara");
    return;
  }

  // 2. Hitta månad
  const months = Array.from(
    new Set(health.map(e => e.date.slice(0, 7)))
  ).sort();

  const monthStr = months[0];

  // 3. Hämta alla poster från den månaden
  const monthEntries = health.filter(e => e.date.startsWith(monthStr));

  const confirmSave = confirm(
    `Vill du spara ${monthStr} till Historik?`
  );
  if (!confirmSave) return;

  // 4. Läs historik
  let history = JSON.parse(localStorage.getItem("healthHistory") || "[]");

  // Kolla om månaden redan finns
  const existingIndex = history.findIndex(h => h.month === monthStr);

  if (existingIndex !== -1) {
    const overwrite = confirm(
      `Du har redan sparat ${monthStr}. Vill du skriva över?`
    );
    if (!overwrite) return;

    // Ta bort den gamla posten innan vi lägger till den nya
    history.splice(existingIndex, 1);
  }
  // 5. Skapa historikpost (kopiera objekten!)
  const entry = {
    month: monthStr,
    items: monthEntries.map(e => ({ ...e })) // ⭐ kopia, inga referenser
  };
  // 6. Lägg till i historiken
  history.unshift(entry);

  // 7. Spara historik
  localStorage.setItem("healthHistory", JSON.stringify(history));

  // 8. Ta bort flyttade poster från health_entries
  const remaining = health.filter(e => !e.date.startsWith(monthStr));
  localStorage.setItem("health_entries", JSON.stringify(remaining));

  // 9. Uppdatera UI
  healthList.entries = remaining;
  healthStorage.save(remaining);
  healthList.render();

  healthHistoryData = history;
  renderHealthHistory();

  showToast(`Hälsoposter för ${monthStr} flyttade till historik`);
}



