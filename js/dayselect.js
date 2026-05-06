//dayselect.js

    // Create Day Selector
    function createDaySelector({ container, select }) {
    if (!container || !select) {
        console.error("DaySelector: container eller select saknas");
        return;
    }

    let centerDate = ds_getToday();          // från dateService
    let centerISO = ds_toISO(centerDate);    // lokal ISO

  // Build UI for Day Selector
    function build() {
    container.innerHTML = "";

    const days = ds_getRange(centerDate, -3, 3);

    // Rensa selecten och bygg nya <option>-element
    select.innerHTML = "";
    days.forEach((d) => {
        const iso = ds_toISO(d);
        const opt = document.createElement("option");
        opt.value = iso;
        opt.textContent = ds_formatWeekday(d);
        select.appendChild(opt);
    });

    // Bygg scroller-UI
    days.forEach((d) => {
        const iso = ds_toISO(d);
        const item = document.createElement("div");
        item.classList.add("day-item");
        item.dataset.date = iso;

        if (ds_isToday(d)) {
        item.textContent = "Idag";
        item.classList.add("today");
        } else {
        item.textContent = d.getDate();
        }

        if (iso === centerISO) {
        item.classList.add("active");
        }

        container.appendChild(item);
    });

  autoScroll();
  syncSelect(centerISO);
}

    // Sync Select
    function syncSelect(iso) {
        select.value = iso;
        select.dispatchEvent(new Event("change"));
  }

  //Activate
  function activate(iso) {
    centerDate = ds_fromISO(iso);
    centerISO = iso;

    container.querySelectorAll(".day-item")
      .forEach(i => i.classList.remove("active"));

    const item = container.querySelector(`.day-item[data-date="${iso}"]`);
    if (item) {
      item.classList.add("active");
      autoScroll();
    }

    syncSelect(iso);
  }

  //Autoscroll
  function autoScroll() {
    const active = container.querySelector(".day-item.active");
    if (!active) return;

    const offset = active.offsetLeft - container.clientWidth / 2 + active.clientWidth / 2;
    container.scrollTo({ left: offset, behavior: "smooth" });
  }

  container.addEventListener("click", (e) => {
    if (!e.target.classList.contains("day-item")) return;
    activate(e.target.dataset.date);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      const today = ds_getToday();
      const todayISO = ds_toISO(today);

      centerDate = today;
      centerISO = todayISO;
      build();
    }
  });

  // Init
  build();

  return {
    rebuild: build,
    activate,
    setToToday: () => activate(ds_toISO(ds_getToday())),
    getActiveDate: () => centerISO
  };
}


// --------------------------------
// GENERIC SCROLLER 
// --------------------------------
function createScroller({ container, items, onSelect }) {
  if (!container) {
    console.error("Scroller: container saknas");
    return;
  }

  let activeValue = items?.[0] ?? null;

  function build() {
    container.innerHTML = "";

    items.forEach(value => {
      const item = document.createElement("div");
      item.classList.add("scroll-item");
      item.dataset.value = value;
      item.textContent = value;

      if (value === activeValue) {
        item.classList.add("active");
      }

      container.appendChild(item);
    });

    autoScroll();
  }

  function activate(value) {
    activeValue = value;

    container.querySelectorAll(".scroll-item")
      .forEach(i => i.classList.remove("active"));

    const item = container.querySelector(`.scroll-item[data-value="${value}"]`);
    if (item) {
      item.classList.add("active");
      autoScroll();
    }

    onSelect?.(value);
  }

  function autoScroll() {
    const active = container.querySelector(".scroll-item.active");
    if (!active) return;

    const offset = active.offsetLeft - container.clientWidth / 2 + active.clientWidth / 2;
    container.scrollTo({ left: offset, behavior: "smooth" });
  }

  container.addEventListener("click", (e) => {
    if (!e.target.classList.contains("scroll-item")) return;
    activate(e.target.dataset.value);
  });

  build();

  return {
    rebuild: build,
    activate,
    getActive: () => activeValue
  };
}

// centrera valt alternativ
function centerScrollerItem(container, item) {
  if (!container || !item) return;

  const containerWidth = container.clientWidth;
  const itemCenter = item.offsetLeft + item.clientWidth / 2;
  const scrollLeft = itemCenter - containerWidth / 2;

  container.scrollTo({
    left: scrollLeft,
    behavior: "smooth"
  });
}







