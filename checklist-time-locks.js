const INDIA_TIME_ZONE = "Asia/Kolkata";

function getIndiaDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const map = {};
  parts.forEach((part) => {
    if (part.type !== "literal") map[part.type] = part.value;
  });

  const hour = map.hour === "24" ? "00" : map.hour;
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    minutes: Number(hour) * 60 + Number(map.minute),
  };
}

function getIndiaToday() {
  return getIndiaDateParts().date;
}

function setDefaultIndiaDate(inputId) {
  const input = document.getElementById(inputId);
  if (input) input.value = getIndiaToday();
}

function timeToMinutes(timeText) {
  const [hour, minute] = String(timeText).trim().split(":").map(Number);
  return hour * 60 + (minute || 0);
}

function isFilledCellValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function isRowEditableNow(rowIndex, times, selectedDate) {
  const now = getIndiaDateParts();
  if (selectedDate !== now.date) return false;

  const start = timeToMinutes(times[rowIndex]);
  const next = rowIndex + 1 < times.length ? timeToMinutes(times[rowIndex + 1]) : 24 * 60;
  return now.minutes > start && now.minutes < next;
}

function markCurrentValuesLocked(selector) {
  document.querySelectorAll(selector).forEach((input) => {
    input.dataset.lockedValue = input.value || "";
  });
}

function refreshChecklistCellLocks(options) {
  const date = document.getElementById(options.dateInputId)?.value || "";
  document.querySelectorAll(options.rowSelector).forEach((row, rowIndex) => {
    const rowEditable = isRowEditableNow(rowIndex, options.times, date);
    row.querySelectorAll("input[data-row]").forEach((input) => {
      const locked = isFilledCellValue(input.dataset.lockedValue);
      input.disabled = locked || !rowEditable;
      input.title = locked
        ? "Cell already has saved data and cannot be edited"
        : rowEditable
          ? ""
          : "Editable only during this row's India time window";
    });
  });
}

function setupChecklistCellLocks(options) {
  const refresh = () => refreshChecklistCellLocks(options);
  const dateInput = document.getElementById(options.dateInputId);
  if (dateInput) dateInput.addEventListener("change", refresh);

  document.addEventListener("input", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.matches(`${options.rowSelector} input[data-row]`)) return;

    if (isFilledCellValue(input.dataset.lockedValue) && input.value !== input.dataset.lockedValue) {
      input.value = input.dataset.lockedValue;
      if (typeof options.onLockedEdit === "function") options.onLockedEdit();
    }
  });

  window.setInterval(refresh, 30000);
  refresh();
}
