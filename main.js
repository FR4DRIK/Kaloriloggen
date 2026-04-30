
// // // DOMCONTENT LOADED // // //
document.addEventListener("DOMContentLoaded", async () => {

  //#region DOM ELEMENTS
  const weightInput = document.getElementById("weightInput");
  const amountSelect = document.getElementById("amountSelect");
  const daySelect = document.getElementById("daySelect");
  const dailyGoalSelect = document.getElementById("dailyGoalSelect");
  const saveBtn = document.getElementById("saveBtn");

  const addBtn = document.getElementById("addBtn");
  const restoreBtn = document.getElementById("restoreBtn");
  const restoreFile = document.getElementById("restoreFile");
  const backupBtn = document.getElementById("backupBtn");
  const refreshAppBtn = document.getElementById("refreshAppBtn");
  const abortBtn = document.getElementById("abortBtn");

  const deleteMealBtn = document.getElementById("deleteMealBtn");
  const saveEditBtn = document.getElementById("saveEditBtn");
  const addNewFoodBtn = document.getElementById("addNewFoodBtn");
  const mealList = document.getElementById("mealList");
  const mealBuild = document.getElementById("mealBuild");

  const buttons = document.querySelectorAll(".bottom-bar button");
  const views = document.querySelectorAll(".view");

  let selectedItem = null;

  //#endregion DOM ELEMENTS
  
  //#region INIT //
    renderDaySelect();
    await loadMasterList();
    loadFromLocal();      
    applyDayColors();  
    refreshAllDropdowns();
    renderCurrentWeekTotal();
    renderWeekHistory();

    initDailyGoalSelect();
    initTheme();
    initAmountSelect();
    initNavigation();

    //Reload/refresh when returning to app
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        renderDaySelect();
      }
    });


  //#endregion INIT
  
  //#region BACKUP / RESTORE //

  if (restoreBtn && restoreFile) {
    restoreBtn.addEventListener("click", () => restoreFile.click());
    restoreFile.addEventListener("change", e => {const file = e.target.files[0];
      if (file) restoreData(file);});
  }
  //#endregion BACKUP / RESTORE
  
  //#region DROPDOWNS

  // SETUP EDIT DROPDOWS
  setupDropdown("editSearchInput", "editDropdownList", getAllItems, item => {
    loadItemForEditing(item);
    showEditCard();
    setEditTitle("edit");
  });


  // SETUP FOOD DROPDOWN
  setupDropdown("foodSearchInput", "foodDropdownList", getAllItems, item => {
    selectedItem = item;
    if (weightInput) {
      weightInput.value = item.weight ?? "";
    }
  });
  
  //#endregion DROPDOWS 
  
  //#region EVENT LISTENERS //

  // BUTTON / ACTION EVENT LISTENERS
    document.getElementById("exportBtn").addEventListener("click", exportMasterList);
    document.getElementById("saveWeekBtn")?.addEventListener("click", saveCurrentWeekManually);
    document.getElementById("importBtn").addEventListener("click", () => {
    document.getElementById("importMasterFile").click();});
    document.getElementById("importMasterFile").addEventListener("change", importMasterList);

  // AUTO SELECT OF ALL TEXT ON INPUT
    document.addEventListener("focusin", (e) => {
    const el = e.target;

  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
    el.select();
  }
  });

  // BACKUP BUTTON EVENT LISTENER
  backupBtn.addEventListener("click", backupData);
 
  // REFRESH BUTTON EVENT LISTENER
  refreshAppBtn.addEventListener("click", () => location.reload());

  // RESET MASTER LIST AND RESTORE FROM GITHUB
  document.getElementById("resetMasterListBtn").addEventListener("click", async () => {
  const confirmReset = confirm("Detta rensar din masterList och hämtar en ny från GitHub. Fortsätt?");
  if (!confirmReset) return;

  // 1. Rensa localStorage
  localStorage.removeItem("masterList");

  // 2. Hämta masterList.json från GitHub
  const response = await fetch("masterList.json", { cache: "no-store" });
  const freshList = await response.json();

  // 3. Spara i localStorage
  localStorage.setItem("masterList", JSON.stringify(freshList));

  // 4. Ladda om appen
  location.reload();
});


  // DAY SELECT EVENT LISTENER - MEAL BUILD
  daySelect.addEventListener("change", () => {
    applyDayColors();
  });

  /* utbytt mot unified 
  // DELETE BUTTON EVENT LISTENER - MEAL LIST
  mealList.addEventListener("click", (e) => {
    if (e.target.classList.contains("deleteBtn")) {
      const item = e.target.closest("li");
      item.remove();

      updateWeekSummary();
      saveToLocal();
      applyDayColors();
      renderCurrentWeekTotal();
      showToast("Måltiden har tagits bort från listan!");

    }
  }); */

  // SAVE EDIT BUTTON EVENT LISTENER
  saveEditBtn.addEventListener("click", () => {
    saveEditedItem();
    setEditTitle("default");
  });

  // ADD NEW FOOD EDIT EVENT BUTTON LISTENER
  addNewFoodBtn.addEventListener("click", () => {
  const item = createNewItem("food");
  item.items = undefined;
  loadItemForEditing(item);
  window.currentEditItem = item;
    showEditCard();

    const mealCard = document.getElementById("editCard");
    setEditTitle(mealCard, "add");

  });

  // ABORT EDIT BUTTON EVENT LISTENER
  abortBtn.addEventListener("click", () => {
    showToast("Åtgärden avbruten");
    selectedEditItem = null;

    const editInput = document.getElementById("editSearchInput");
    if (editInput) editInput.value = "";

    const editList = document.getElementById("editDropdownList");
    if (editList) {
      editList.innerHTML = "";
      editList.style.display = "none";
    }

    const editFields = document.getElementById("editFields");
    if (editFields) editFields.innerHTML = "";
    document.getElementById("editMealItems").innerHTML = "";
    
    loadItemForEditing(null);
    setEditTitle("edit");

  });

  // DELETE MEAL EDIT BUTTON EVENT LISTNER
  deleteMealBtn.addEventListener("click", () => {
    const item = window.currentEditItem;

    if (!item) {
      showToast("Inget valt att radera");

      return;
    }

    const ok = confirm(`Åtgärden raderar valt innehåll permanent. Vill du radera:\n\n${item.name}?`);
    if (!ok) return;

    window.masterList = window.masterList.filter(x => x.id !== item.id);
    localStorage.setItem("masterList", JSON.stringify(window.masterList));

    refreshAllDropdowns();
    loadItemForEditing(null);

    abortBtn.click();
    showToast("Innehållet raderat permanent!");

  });

  // CANCEL MEAL BUILD BUTTON EVENT LISTENER
  const addCancelBtn = document.getElementById("addCancelBtn");

addCancelBtn.addEventListener("click", () => {
  resetMealBuild();
});

  // ACTION BUTTONS EVENT LISTENER - MEAL LIST
  mealList.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;

    if (e.target.classList.contains("moveUpBtn")) {
      const prev = li.previousElementSibling;
      if (prev) {
       moveMealListItemUp(index);

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

  // SAVE DAILY GOAL BUTTON EVENT LISTENER
dailyGoalSelect.addEventListener("change", () => {
  const goal = Number(dailyGoalSelect.value);

  if (!goal || goal < 500) {
    showToast("Ange ett rimligt kcal mål");
    return;
  }

  localStorage.setItem("dailyKcalGoal", goal);
  updateWeekSummary();
  showToast("Mål uppdaterat");
});

// ACCEPT BUTTON EVENT LISTENER
acceptBtn.addEventListener("click", () => {
  if (!selectedItem) {
    showToast("Du måste välja något först");

    return;
  }

  handleSelectedItem(selectedItem);

  // Nollställ selectedItem så dubbletter inte kan läggas till
  selectedItem = null;

  // Nollställ inputs
  weightInput.value = "";
  amountSelect.value = "";

  // Töm dropdownen
  const foodInput = document.getElementById("foodSearchInput");
  const foodList = document.getElementById("foodDropdownList");

  if (foodInput) foodInput.value = "";
  if (foodList) {
    foodList.innerHTML = "";
    foodList.style.display = "none";
  }
});


// ADD BUTTON EVENT LISTENER - MEAL LIST
addBtn.addEventListener("click", () => {
  const items = Array.from(mealBuild.querySelectorAll("li"));

  if (items.length === 0) {
    showToast("Du måste lägga till något i listan");

    return;
  }

  items.forEach(li => {
    const entry = {
      day: li.dataset.day,
      item: JSON.parse(li.dataset.item),
      amount: Number(li.dataset.amount),
      weight: Number(li.dataset.weight),
      cWeight: Number(li.dataset.cWeight),
      kcal: Number(li.dataset.kcal)
    };

    // Skapa DOM‑element direkt
    createMealListItem(
      entry.item,
      entry.amount,
      entry.weight,
      entry.cWeight,
      entry.kcal,
      entry.day
    );
  });

  // töm builder
  mealBuild.innerHTML = "";

  saveToLocal();
  applyDayColors();
  updateWeekSummary();
  updateTotalKcal();
  updateRemainingKcal(0);
  renderCurrentWeekTotal();
  showToast("Måltid tillagd");

});

// SAVE BUTTON EVENT LISTENER
saveBtn.addEventListener("click", () => {
  const items = Array.from(mealBuild.querySelectorAll("li"));

if (items.length < 1) {
 showToast("Du behöver lägga till något i listan");

  return;
}

  // 🔥 NYTT: Tvinga fram namn
  let customName = "";
  while (customName.trim() === "") {
    customName = prompt("Ange namn på måltiden:");
    if (customName === null) return; // användaren tryckte Avbryt
  }

  let totalweight = 0;
  let totalcWeight = 0;
  let totalKcal = 0;
  const mealItems = [];

  items.forEach(li => {
    const name = li.dataset.name;
    const kcal = Number(li.dataset.kcal || 0);
    const weight = Number(li.dataset.weight || 0);
    const cWeight = Number(li.dataset.cWeight || 0);
    const amount = Number(li.dataset.amount || 1);

    totalweight += weight;
    totalcWeight += cWeight;
    totalKcal += kcal;

    mealItems.push({
      amount,
      id: li.dataset.id,
      weight,
      cWeight,
      kcal
    });
  });

  // Skapa nytt masterList‑item
  const meal = createNewItem("meal");
  meal.name = customName; // 🔥 användarens namn
  meal.weight = totalweight;
  meal.cWeight = totalcWeight;
  meal.kcal = totalKcal;
  meal.items = mealItems;

  // Spara i masterList
  saveItem(meal);

  // Töm builder
  mealBuild.innerHTML = "";
  updateTotalKcal();
  updateRemainingKcal(0);

  showToast(`Ny måltid "${customName}" sparad med ${totalKcal} kcal och ${totalcWeight} gc`);
});

  saveToLocal();

// THEME SELECT
const themeSelect = document.getElementById("themeSelect");

// INIT
const savedTheme = localStorage.getItem("savedTheme") || "cold";
themeSelect.value = savedTheme;
applyTheme(savedTheme);

// EVENT LISTENER (endast en!)
themeSelect.addEventListener("change", () => {
  const theme = themeSelect.value;
  localStorage.setItem("savedTheme", theme);
  applyTheme(theme);

  const label = theme.charAt(0).toUpperCase() + theme.slice(1);
  showToast(`Tema "${label}" har aktiverats`);
});

  //#endregion EVENT LISTENERS

  //STÄNGER DOMCONTENT LOADED
}); 