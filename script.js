let entrydata = {};
let holidays = [];
const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let activeDays = new Set([0, 1, 2, 3, 4, 5, 6]);
const yearControl = document.getElementById("yearControl");
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

// 以下のコードは変更なし
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

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

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
  document.getElementById("currentYear").textContent = year;
  if (todayRow) {
    todayRow.scrollIntoView({ behavior: "smooth", block: "center" });
    todayRow.style.transition = "background-color 1s";
    todayRow.style.backgroundColor = "#ffeb3b50";
    setTimeout(() => {
      todayRow.style.backgroundColor = "";
    }, 2000);
  }
}

document
  .getElementById("prevYear")
  .addEventListener("click", () => loadYear(currentYear - 1));
document
  .getElementById("nextYear")
  .addEventListener("click", () => loadYear(currentYear + 1));

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
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  await loadJSONData();
  loadYear(currentYear);
});
