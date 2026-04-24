
// // // DOMCONTENT LOADED // // //
document.addEventListener("DOMContentLoaded", async () => {

  //#region DOM ELEMENTS
  const weightInput = document.getElementById("weightInput");
  const amountSelect = document.getElementById("amountSelect");
  const saveGoalBtn = document.getElementById("saveGoalBtn");
  const daySelect = document.getElementById("daySelect");
  const weekHistory = document.getElementById("weekHistory");
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
  const themeSelect = document.getElementById("themeSelect");
  const saveThemeBtn = document.getElementById("saveThemeBtn");

  const buttons = document.querySelectorAll(".bottom-nav button");
  const views = document.querySelectorAll(".view");

  let originalEditItem = null;
  let customMeals = [];
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

    //Reload/refresh when returning to app
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        renderDaySelect();
      }
    });

    //NAVIGATION BAR - FIRST TAB ACTIVE
    if (buttons.length > 0) {
      const firstButton = buttons[0];
      firstButton.classList.add("active");
      const target = firstButton.dataset.view;
      showView(target);
    }

    //NAVIGATION BAR - CLICK CHANGE TAB
    buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.view;

      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      views.forEach(v => (v.style.display = "none"));
      showView(target);
    });
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
  setupDropdown("editSearchInput", "editDropdownList", getAllItems, item =>
    loadItemForEditing(item)
  );

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

    document.getElementById("toggle").addEventListener("click", toggleMealListExpand);

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

  // DAY SELECT EVENT LISTENER - MEAL BUILD
  daySelect.addEventListener("change", () => {
    applyDayColors();
  });

  // DELETE BUTTON EVENT LISTENER - MEAL LIST
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

  // SAVE EDIT BUTTON EVENT LISTENER
  saveEditBtn.addEventListener("click", saveEditedItem);

  // ADD NEW FOOD EDIT EVENT BUTTON LISTENER
  addNewFoodBtn.addEventListener("click", () => {
  const item = createNewItem("food");
  item.items = undefined;
  loadItemForEditing(item);
  window.currentEditItem = item;

    addNewFoodBtn.style.display = "none";
    deleteMealBtn.style.display = "none"; 
    abortBtn.style.display = "block";
    saveEditBtn.style.display = "block";
  
  });

  // ABORT EDIT BUTTON EVENT LISTENER
  abortBtn.addEventListener("click", () => {
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
    
    resetEditButtons();

  });

  // DELETE MEAL EDIT BUTTON EVENT LISTNER
  deleteMealBtn.addEventListener("click", () => {
    const item = window.currentEditItem;

    if (!item) {
      alert("Inget valt att radera.");
      return;
    }

    const ok = confirm(`Åtgärden raderar valt innehåll permanent. Vill du radera:\n\n${item.name}?`);
    if (!ok) return;

    window.masterList = window.masterList.filter(x => x.id !== item.id);
   
    refreshAllDropdowns();
    resetEditButtons();

    abortBtn.click();

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
    saveGoalBtn.addEventListener("click", () => {
    const goal = Number(dailyGoalSelect.value);
    if (!goal || goal < 500) {
      alert("Ange ett rimligt kcal-mål.");
      return;
    }
    localStorage.setItem("dailyKcalGoal", goal);
    updateWeekSummary();
    alert("Mål sparat!");
  });

// ACCEPT BUTTON EVENT LISTENER
acceptBtn.addEventListener("click", () => {
  if (!selectedItem) {
    alert("Välj något först!");
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
    alert("Du måste bekräfta valda alternativ först.");
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
});

// SAVE BUTTON EVENT LISTENER
saveBtn.addEventListener("click", () => {
  const items = Array.from(mealBuild.querySelectorAll("li"));

  if (items.length === 0) {
    alert("Det finns inga måltider att spara!");
    return;
  }

  const confirmSave = confirm("Vill du spara som ny måltid?");
  if (!confirmSave) return;

  let totalweight = 0;
  let totalcWeight = 0;
  let totalKcal = 0;
  const mealItems = [];

  items.forEach(li => {
    const name = li.dataset.name;
    const kcal = Number(li.dataset.kcal || 0);
    const weight = Number(li.dataset.weight || 0);
    const cWeight = Number(li.dataset.cWeight || 0);

    totalweight += weight;
    totalcWeight += cWeight;
    totalKcal += kcal;

    mealItems.push({
      id: li.dataset.id,
      weight,
      cWeight,
      kcal
    });
  });

  // Skapa nytt masterList‑item
  const meal = createNewItem("meal");
  meal.name = items.map(li => li.dataset.name).join(", ");
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

  alert(`Ny måltid sparad med ${totalKcal} kcal och ${totalcWeight} gc!`);
});


saveToLocal();

  // SAVE THEME
  saveThemeBtn.addEventListener("click", () => {
    const theme = themeSelect.value;
    localStorage.setItem("savedTheme", theme);
    applyTheme(theme);
  });

  //#endregion EVENT LISTENERS

  //STÄNGER DOMCONTENT LOADED
}); 