//dateservice.js

// Alltid "idag" i LOKAL tid, inte UTC
function ds_getToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
// ISO YYYY-MM-DD i LOKAL tid (inte toISOString som är UTC)
function ds_toISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
// Från ISO till Date (lokal)
function ds_fromISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  return date;
}
// Range runt "center" (t.ex. -3..3)
function ds_getRange(centerDate, offsetStart, offsetEnd) {
  const days = [];
  for (let i = offsetStart; i <= offsetEnd; i++) {
    const d = new Date(centerDate);
    d.setDate(centerDate.getDate() + i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}
// Är detta idag?
function ds_isToday(date) {
  const today = ds_getToday();
  return ds_toISO(date) === ds_toISO(today);
}
// Visningsformat (anpassa efter din tidigare formatDateDisplay)
function ds_formatDisplay(date) {
  // Exempel: "Mån 5 maj"
  const weekdays = ["Sön", "Mån", "Tis", "Ons", "Tors", "Fre", "Lör"];
  const months = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

  const wd = weekdays[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];

  return `${wd} ${day} ${month}`;
}
// ISO-VECKA
function ds_getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(),0,1);
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}
// FULLT DATUM FORMAT
function ds_formatLong(date) {
  if (!(date instanceof Date)) date = ds_fromISO(date);

  const weekdays = ["Söndag","Måndag","Tisdag","Onsdag","Torsdag","Fredag","Lördag"];
  return `${weekdays[date.getDay()]} ${date.getDate()}/${date.getMonth()+1}`;
}
// KORT DATUM FORMAT
function ds_formatShort(date) {
  if (!(date instanceof Date)) date = ds_fromISO(date);

  const weekdaysShort = ["Sö","Må","Ti","On","To","Fr","Lö"];
  return `${weekdaysShort[date.getDay()]} ${date.getDate()}/${date.getMonth()+1}`;
}
// MINIMALT DATUM FORMAT
function ds_formatDateOnly(date) {
  if (!(date instanceof Date)) date = ds_fromISO(date);

  return `${date.getDate()}/${date.getMonth()+1}`;
}
window.ds_formatLong = ds_formatLong;
window.ds_formatShort = ds_formatShort;
window.ds_formatDateOnly = ds_formatDateOnly;

//Veckor på ett år
function getWeeksInYear(year) {
  const d = new Date(year, 11, 31);
  const week = ds_getWeekNumber(d); // du har redan en ISO-vecka-funktion
  return week === 1 ? 52 : week;
}
//Veckonummer
function ds_getISOWeek(date) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));

  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  const year = d.getFullYear();

  return { week, year };
}

//Veckoadag
function ds_formatWeekday(date) {
  if (!(date instanceof Date)) date = ds_fromISO(date);
  const weekdays = ["Söndag","Måndag","Tisdag","Onsdag","Torsdag","Fredag","Lördag"];
  return weekdays[date.getDay()];
}
//Vecka och datum
function ds_getWeekKey(date) {
  const { week, year } = ds_getISOWeek(date);
  return `${String(week).padStart(2, "0")} (${year})`;
}
