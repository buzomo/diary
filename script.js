// Constants
const CONFIG = {
  dayNames: ["日", "月", "火", "水", "木", "金", "土"],
  defaultActiveDays: new Set([0, 1, 2, 3, 4, 5, 6]),
  storageKey: "diaryData",
  urls: {
    holidays: "holidays.json",
    diary: "diary.json",
    githubEdit: "https://github.com/buzomo/diary/edit/main/diary.json"
  }
};

// State management
class DiaryState {
  constructor() {
    this.entryData = {};
    this.holidays = [];
    this.currentYear = new Date().getFullYear();
    this.activeDays = new Set(CONFIG.defaultActiveDays);
  }

  async initialize() {
    await this.loadJSONData();
  }

  async loadJSONData() {
    try {
      const [holidaysData, diaryData] = await Promise.all([
        this.fetchJSON(CONFIG.urls.holidays),
        this.fetchJSON(CONFIG.urls.diary)
      ]);

      this.holidays = holidaysData.holidays;
      this.mergeAndSaveData(diaryData);
    } catch (error) {
      console.error("データの読み込みに失敗:", error);
    }
  }

  async fetchJSON(url) {
    const response = await fetch(url);
    return await response.json();
  }

  mergeAndSaveData(diaryData) {
    const savedData = localStorage.getItem(CONFIG.storageKey);
    this.entryData = savedData ? JSON.parse(savedData) : {};

    // 既存のデータを優先しつつ、新しいデータを統合
    Object.entries(diaryData).forEach(([key, value]) => {
      if (!this.entryData[key] || this.entryData[key] === "") {
        this.entryData[key] = value;
      }
    });

    this.saveToLocalStorage();
  }

  saveToLocalStorage() {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(this.entryData));
  }

  updateEntry(date, content) {
    this.entryData[date] = content;
    this.saveToLocalStorage();
  }

  setCurrentYear(year) {
    this.currentYear = year;
  }
}

// UI Management
class DiaryUI {
  constructor(diaryState) {
    this.state = diaryState;
    this.elements = {
      diaryBody: document.getElementById("diaryBody"),
      currentYear: document.getElementById("currentYear"),
      prevYear: document.getElementById("prevYear"),
      nextYear: document.getElementById("nextYear")
    };
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.elements.prevYear.addEventListener("click", () => 
      this.loadYear(this.state.currentYear - 1));
    this.elements.nextYear.addEventListener("click", () => 
      this.loadYear(this.state.currentYear + 1));
    this.elements.diaryBody.addEventListener("input", (e) => {
      if (e.target.className === "editable") {
        const date = e.target.parentElement.cells[0].textContent;
        this.state.updateEntry(date, e.target.textContent);
      }
    });

    document.addEventListener("keydown", this.handleKeyboardShortcuts.bind(this));
  }

  async handleKeyboardShortcuts(e) {
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      await this.copyDataAndRedirect();
    }
  }

  async copyDataAndRedirect() {
    const formattedData = JSON.stringify(this.state.entryData, null, 2);
    try {
      await navigator.clipboard.writeText(formattedData);
      console.log("最新のデータをクリップボードにコピーしました！");
      setTimeout(() => {
        location.href = CONFIG.urls.githubEdit;
      }, 100);
    } catch (error) {
      alert("コピーに失敗しました: " + error);
    }
  }

  createTableRow(date) {
    const row = document.createElement("tr");
    const formattedDate = this.formatDate(date);
    // Create cells
    const dateCell = this.createCell(formattedDate);
    const dayCell = this.createCell(CONFIG.dayNames[date.getDay()]);
    const holidayCell = this.createCell();
    const contentCell = this.createEditableCell(this.state.entryData[formattedDate] || "");

    // Append cells
    row.append(dateCell, dayCell, holidayCell, contentCell);

    // Apply styling
    this.applyRowStyling(row, date, formattedDate);

    return row;
  }

  createCell(content = "") {
    const cell = document.createElement("td");
    cell.textContent = content;
    return cell;
  }

  createEditableCell(content) {
    const cell = this.createCell(content);
    cell.className = "editable";
    cell.contentEditable = true;
    return cell;
  }

  applyRowStyling(row, date, formattedDate) {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) row.classList.add("sunday");
    if (dayOfWeek === 6) row.classList.add("saturday");

    const holiday = this.state.holidays.find(h => h.date === formattedDate);
    if (holiday) {
      row.classList.add("holiday");
      row.cells[2].textContent = holiday.name;
    }
  }

  formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  highlightToday(table) {
    const todayFormatted = this.formatDate(new Date());
    const todayRow = Array.from(table.getElementsByTagName("tr"))
      .find(row => row.cells[0].textContent === todayFormatted);

    if (todayRow) {
      todayRow.scrollIntoView({ behavior: "smooth", block: "center" });
      todayRow.style.transition = "background-color 1s";
      todayRow.style.backgroundColor = "#ffeb3b50";
      setTimeout(() => {
        todayRow.style.backgroundColor = "";
      }, 2000);
    }
  }

  loadYear(year) {
    this.elements.diaryBody.innerHTML = "";
    this.state.setCurrentYear(year);
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const row = this.createTableRow(d);
      this.elements.diaryBody.appendChild(row);
    }

    this.elements.currentYear.textContent = year;
    this.highlightToday(this.elements.diaryBody);
    this.filterTable();
  }

  filterTable() {
    const rows = this.elements.diaryBody.querySelectorAll("tr");
    rows.forEach(row => {
      const dayOfWeek = row.cells[1].textContent;
      const dayIndex = CONFIG.dayNames.indexOf(dayOfWeek);
      row.classList.toggle("hidden", !this.state.activeDays.has(dayIndex));
    });
  }
}

// Application initialization
document.addEventListener("DOMContentLoaded", async () => {
  const diaryState = new DiaryState();
  const diaryUI = new DiaryUI(diaryState);
  await diaryState.initialize();
  diaryUI.loadYear(diaryState.currentYear);
});