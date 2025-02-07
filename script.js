let entrydata = {};
let holidays = [];
const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let activeDays = new Set([0, 1, 2, 3, 4, 5, 6]);
const diaryBody = document.getElementById("diaryBody");

async function loadJSONData() {
  try {
    const [holidaysResponse, diaryResponse] = await Promise.all([
      fetch("holidays.json"),
      fetch("diary.json"),
    ]);

    const [holidaysData, diaryData] = await Promise.all([
      holidaysResponse.json(),
      diaryResponse.json(),
    ]);

    holidays = holidaysData.holidays;

    // LocalStorageのデータとJSONのデータを統合
    const savedData = localStorage.getItem("diaryData");
    entrydata = savedData ? JSON.parse(savedData) : {};

    for (let key in diaryData) {
      if (!entrydata[key] || entrydata[key] === "") {
        entrydata[key] = diaryData[key];
      }
    }

    saveToLocalStorage();
  } catch (e) {
    console.error("データの読み込みに失敗", e);
  }
}

function saveToLocalStorage() {
  localStorage.setItem("diaryData", JSON.stringify(entrydata));
}

function filterTable() {
  const rows = document.querySelectorAll("#diaryBody tr");
  rows.forEach((row) => {
    const dayOfWeek = row.cells[1].textContent;
    const dayIndex = dayNames.indexOf(dayOfWeek);
    const contentCell = row.cells[3];
    const content = contentCell.textContent.toLowerCase();
    const matchDay = activeDays.has(dayIndex);

    if (matchDay) {
      row.classList.remove("hidden");
      contentCell.textContent = contentCell.textContent;
    } else {
      row.classList.add("hidden");
    }
  });
}

function loadYear(year) {
  currentYear = year;
  const table = document.getElementById("diaryBody");
  table.innerHTML = "";

  const startDate = new Date(2024, 5, 1);
  const endDate = new Date(2031, 11, 31);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const row = table.insertRow();
    const dateCell = row.insertCell(0);
    const dayCell = row.insertCell(1);
    const holidayCell = row.insertCell(2);
    const contentCell = row.insertCell(3);

    const formattedDate = `${d.getFullYear()}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
    dateCell.textContent = formattedDate;
    dayCell.textContent = dayNames[d.getDay()];

    contentCell.className = "editable";
    contentCell.contentEditable = true;
    contentCell.textContent = entrydata[formattedDate] || "";

    if (d.getDay() === 0) {
      row.classList.add("sunday");
    } else if (d.getDay() === 6) {
      row.classList.add("saturday");
    }

    const holiday = holidays.find((h) => h.date === formattedDate);
    if (holiday) {
      row.classList.add("holiday");
      holidayCell.textContent = holiday.name;
    }
  }

  filterTable();
  const today = new Date();
  const todayFormatted = `${today.getFullYear()}-${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;
  const todayRow = Array.from(table.getElementsByTagName("tr")).find(
    (row) => row.cells[0].textContent === todayFormatted
  );
  if (todayRow) {
    todayRow.scrollIntoView({ behavior: "smooth", block: "center" });
    todayRow.style.transition = "background-color 0.5s";
    todayRow.style.backgroundColor = "#ffeb3b50";
    setTimeout(() => {
      todayRow.style.backgroundColor = "";
    }, 200);
  }
}

document.getElementById("diaryBody").addEventListener("input", (e) => {
  if (e.target.className === "editable") {
    const row = e.target.parentElement;
    const date = row.cells[0].textContent;
    const content = e.target.textContent;
    entrydata[date] = content;
    saveToLocalStorage();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "s") {
    e.preventDefault();
    const dataToCopy = JSON.stringify(entrydata, null, 2); // 第3引数に2を指定してインデントを追加
    navigator.clipboard
      .writeText(dataToCopy)
      .then(() => {
        console.log("最新のデータをクリップボードにコピーしました！");
      })
      .catch((err) => {
        alert("コピーに失敗しました: " + err);
      });
    setTimeout(() => {
      location.href = "https://github.com/buzomo/diary/edit/main/diary.json";
    }, 100);
  } else if (e.key >= "1" && e.key <= "7") {
    const dayIndex = parseInt(e.key) - 1;
    if (activeDays.has(dayIndex)) {
      activeDays.delete(dayIndex);
    } else {
      activeDays.add(dayIndex);
    }
    filterTable();
  } else if (e.key === "Escape") {
    filterRows(() => true);
  } else if (e.key ) {
    const searchContainer = document.getElementById("searchContainer");
    searchContainer.classList.remove("hidden");
    const searchInput = document.getElementById("searchInput");
    searchInput.focus();
  }
});

function filterRows(predicate) {
  const rows = document.querySelectorAll("#diaryBody tr");
  rows.forEach((row) => {
    if (predicate(row)) {
      row.classList.remove("hidden");
    } else {
      row.classList.add("hidden");
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadJSONData();
  loadYear(currentYear);

  const today = new Date();
  const todayFormatted = `${today.getFullYear()}-${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;
  const todayRow = Array.from(diaryBody.getElementsByTagName("tr")).find(
    (row) => row.cells[0].textContent === todayFormatted
  );

  if (todayRow) {
    todayRow.scrollIntoView({ behavior: "smooth", block: "center" });
    todayRow.style.transition = "background-color 0.5s";
    todayRow.style.backgroundColor = "#ffeb3b50";
    setTimeout(() => {
      todayRow.style.backgroundColor = "";
    }, 200);

    todayRow.cells[0].addEventListener("click", () => filterSameDate(today));
    todayRow.cells[1].addEventListener("click", () => filterSameDay(today));
  }
});

function filterSameDate(today) {
  const todayMonthDay = `${today.getMonth() + 1}-${today.getDate()}`;
  filterRows((row) => {
    const date = row.cells[0].textContent;
    const [year, month, day] = date.split("-");
    return (
      `${month}-${day}` === todayMonthDay ||
      row.cells[0].textContent === todayFormatted
    );
  });
}

function filterSameDay(today) {
  const todayDay = today.getDay();
  filterRows((row) => {
    const dayOfWeek = row.cells[1].textContent;
    const dayIndex = ["月", "火", "水", "木", "金", "土", "日"].indexOf(
      dayOfWeek
    );
    const rowDate = new Date(row.cells[0].textContent);
    return (
      (dayIndex === todayDay &&
        rowDate <= today &&
        row.cells[3].textContent.trim().length > 0) ||
      row.cells[0].textContent === todayFormatted
    );
  });
}

document.getElementById("searchInput").addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  if (searchTerm === "") {
    const today = new Date();
    const todayFormatted = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;
    const todayRow = Array.from(diaryBody.getElementsByTagName("tr")).find(
      (row) => row.cells[0].textContent === todayFormatted
    );
    if (todayRow) {
      todayRow.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
  filterRows((row) => {
    const content = row.cells[3].textContent.toLowerCase();
    if (content.includes(searchTerm)) {
      row.classList.remove("hidden");
      row.cells[3].innerHTML = row.cells[3].textContent.replace(
        new RegExp(searchTerm, "gi"),
        (match) => `<span class="highlight">${match}</span>`
      );
      return true;
    } else {
      row.classList.add("hidden");
      return false;
    }
  });
});
