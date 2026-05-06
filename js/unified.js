//#region unified //

// Render unified list items
function renderUnifiedListItemHTML(item, config) {
  return `
    <div class="collapsedView">
      ${config.renderCollapsed(item)}
    </div>

    <div class="expandedView">
      ${config.renderExpanded(item)}

      <div class="actionButtonsRowBottom">
        ${config.showDelete ? `<button class="deleteBtn">X</button>` : ""}
        ${config.showMoveButtons ? `<button class="moveDownBtn">▼</button>` : ""}
        ${config.showMoveButtons ? `<button class="moveUpBtn">▲</button>` : ""}
      </div>
    </div>
  `;
}

// Meal Config
const mealConfig = {
  showDelete: true,
  showMoveButtons: true,

  renderCollapsed(item) {
    const date = ds_fromISO(item.day);
    const amountHTML = item.amount > 1 
      ? `<span class="viewAmount">[${item.amount}]</span>` 
      : "";

    return `
      <span class="viewDay">${ds_formatShort(date)}</span>
      <span class="viewName">${item.name}</span>
      ${amountHTML}
      <span class="viewKcal">${item.kcal} kcal</span>
    `;
  },

  renderExpanded(item) {
    return `
      <div class="ingredientsList">${item.detailsHTML}</div>
    `;
  }
};

// Health config
const healthConfig = {
  showDelete: true,
  showMoveButtons: false,

  renderCollapsed(item) {
    return `
      <span class="viewDay">${item.dateLabel}</span>
      <span class="viewWeight">${item.weight} kg</span>
      <span class="viewWaist">${item.waist} cm</span>
      <span class="viewBmi">${item.bmi ?? ""} BMI</span>
    `;
  },

  renderExpanded(item) {
    return `
    <div class="form-row">
      <div class="diffRow">Vikt: ${item.diffWeight ?? ""}</div>
      <div class="diffRow">Midja: ${item.diffWaist ?? ""}</div>
      <div class="diffRow">BMI: ${item.diffBmi ?? ""}</div>
    </div>
    `;
  }
};

// Collapse other expanded list items
function collapseOtherExpanded(activeExpanded, parentList) {
  parentList.querySelectorAll(".expandedView.open").forEach(ev => {
    if (ev !== activeExpanded) {
      ev.classList.remove("open");
      const btn = ev.parentElement.querySelector(".expandToggle");
      if (btn) btn.textContent = "▼";
    }
  });
}
// Attach unified list items
function attachUnifiedListItemEvents(li, parentList) {

const collapsedView = li.querySelector(".collapsedView");
const expanded = li.querySelector(".expandedView");

collapsedView.addEventListener("click", () => {
  const isOpen = expanded.classList.contains("open");

  // Stäng andra
  collapseOtherExpanded(expanded, parentList);

  // Toggla denna
  expanded.classList.toggle("open");
});

// DELETE
li.querySelector(".deleteBtn").addEventListener("click", () => {
    const row = li;                 // li är alltid rätt element
    const date = row.dataset.date;  // hämtar rätt datum

    console.log("UNIFIED DELETE, date =", date);

    // Ta bort DOM-raden
    row.remove();

    // ⭐ HealthList
    if (parentList.id === "healthList") {
        if (date) {
            healthList.remove(date);
        } else {
            console.warn("Ingen date hittades på raden:", row);
        }
        showToast("Hälsopost borttagen");
        return; // ⭐ viktigt: hoppa över mealList-logik
    }

    // ⭐ MealList (original)
    saveToLocal?.();
    updateTotalKcal?.();
    updateRemainingKcal?.();
    applyDayColors?.();
    updateWeekSummary?.();
    renderCurrentWeekTotal();

    showToast("Måltid borttagen");
});

  // MOVE UP
const moveUp = li.querySelector(".moveUpBtn");
if (moveUp) {
  moveUp.addEventListener("click", () => {
    const prev = li.previousElementSibling;
    if (prev) {
      parentList.insertBefore(li, prev);
      saveToLocal?.();
      updateTotalKcal?.();
      updateRemainingKcal?.();
    }
  });
}

 // MOVE DOWN
const moveDown = li.querySelector(".moveDownBtn");
if (moveDown) {
  moveDown.addEventListener("click", () => {
    const next = li.nextElementSibling;
    if (next) {
      parentList.insertBefore(next, li);
      saveToLocal?.();
      updateTotalKcal?.();
      updateRemainingKcal?.();
    }
  });
}
}
// COLLAPSE EXPANDED VIEW MEAL LIST & MEAL BUILD
function collapseOtherExpanded(activeExpanded) {
  const parent = activeExpanded.closest("ul, ol, #mealBuild, #mealList");
  if (!parent) return;

  const all = parent.querySelectorAll(".expandedView.open");
  all.forEach(ev => {
    if (ev !== activeExpanded) {
      ev.classList.remove("open");
    }
  });
}

//#endregion
