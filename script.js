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

  const startDate = new Date(2023, 5, 1);
  const endDate = new Date(2031, 11, 31);

  const fragment = document.createDocumentFragment();

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const row = document.createElement("tr");
    const dateCell = document.createElement("td");
    const dayCell = document.createElement("td");
    const holidayCell = document.createElement("td");
    const contentCell = document.createElement("td");

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

    row.appendChild(dateCell);
    row.appendChild(dayCell);
    row.appendChild(holidayCell);
    row.appendChild(contentCell);
    fragment.appendChild(row);
  }

  table.appendChild(fragment);
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
    const dataToCopy = JSON.stringify(entrydata, null, 2);
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
    document.getElementById("searchInput").value = "";
  } else if (e.key) {
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

const highlightWords = [
  "購入",
  "全休",
  "散歩",
  "作業",
  "本",
  "業務",
  "ランチ",
  "発見",
  "カード",
  "電車",
  "睡眠",
  "午後",
  "日記",
  "資格",
  "お昼",
  "アプリ",
  "職場",
  "体調",
  "久々",
  "休",
  "遅延",
  "整理",
  "薬",
  "仕事",
  "昼休み",
  "会話",
  "普段",
  "写真",
  "朝",
  "社内",
  "勤務",
  "自転車",
  "地元",
  "帰り",
  "帰宅",
  "場所",
  "休み",
  "toeic",
  "休暇",
  "不調",
  "鑑賞",
  "自宅",
  "スーパー",
  "環境",
  "コーヒー",
  "調子",
  "メンバー",
  "興味",
  "スマホ",
  "散髪",
  "書店",
  "デスク",
  "リフレッシュ",
  "pc",
  "図書館",
  "スタッフ",
  "変更",
  "撮影",
  "コンビニ",
  "苦手",
  "確認",
  "周り",
  "部屋",
  "元気",
  "結局",
  "好き",
  "chatgpt",
  "newdays",
  "べらぼう",
  "ギャラリー",
  "満足感",
  "在宅",
  "ワード",
  "唐揚げ",
  "体験",
  "注文",
  "ほか",
  "活動",
  "ポイント",
  "更新",
  "対応",
  "設定",
  "親",
  "ベッド",
  "必要",
  "最初",
  "今度",
  "イベント",
  "以外",
  "絶対",
  "楽しみ",
  "最近",
  "atcoder",
  "セブンティーンアイス",
  "サブスク",
  "メンバ",
  "js",
  "プロダクト",
  "プレーヤー",
  "電動",
  "過去問",
  "通院",
  "美術館",
  "早退",
  "自販機",
  "ホット",
  "最寄り",
  "キーボード",
  "ドリンク",
  "コート",
  "ノート",
  "ボス",
  "飲み会",
  "夕飯",
  "ページ",
  "鍋",
  "スーツ",
  "システム",
  "パターン",
  "鍵",
  "イオン",
  "データ",
  "後悔",
  "以前",
  "一つ",
  "今月",
  "満足",
  "駅",
  "追加",
  "ラーメン",
  "昼",
  "途中",
  "最後",
  "予定",
  "曲",
  "todoist",
  "pikmin",
  "bloom",
  "拡張機能",
  "昇降",
  "伏せ字",
  "bad",
  "モナカ",
  "cd",
  "日報",
  "投資信託",
  "家電量販店",
  "ジャーナル",
  "通勤時間",
  "nhk",
  "ラベル",
  "あずき",
  "倦怠感",
  "半休",
  "プロモーション",
  "ブック",
  "サイクリング",
  "百貨店",
  "つながり",
  "雑貨",
  "不眠",
  "入会",
  "銭湯",
  "居場所",
  "新調",
  "部署",
  "読書",
  "手帳",
  "コミュニケーション",
  "アイデア",
  "決済",
  "ココア",
  "ツール",
  "電子書籍",
  "点数",
  "学習",
  "豆",
  "ビル",
  "引きこもり",
  "美味",
  "手持ち",
  "有料",
  "カレンダー",
  "ネコ",
  "閉店",
  "加入",
  "悪さ",
  "マイ",
  "印刷",
  "依頼",
  "同級生",
  "そば",
  "ミルク",
  "サラダ",
  "単位",
  "オンライン",
  "コード",
  "処理",
  "確保",
  "試験",
  "会議",
  "冊",
  "午前中",
  "都内",
  "おにぎり",
  "店舗",
  "非常",
  "表示",
  "不足",
  "実装",
  "仕様",
  "紙",
  "休日",
  "野菜",
  "メモ",
  "目標",
  "スキル",
  "便利",
  "週末",
  "弁当",
  "YouTube",
  "テーブル",
  "開始",
  "一日",
  "復活",
  "微妙",
  "メール",
  "意識",
  "休憩",
  "ドラマ",
  "ぶり",
  "終了",
  "不安",
  "旅行",
  "存在",
  "家族",
  "余裕",
  "作品",
];

function highlightContent(content) {
  highlightWords.forEach((word) => {
    const regex = new RegExp(`(${word})`, "gi");
    content = content.replace(regex, `<span class="highlight">$1</span>`);
  });
  return content;
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

  document.querySelectorAll(".editable").forEach((cell) => {
    cell.innerHTML = highlightContent(cell.textContent);
    cell.addEventListener("click", (e) => {
      if (e.target.classList.contains("highlight")) {
        const searchInput = document.getElementById("searchInput");
        searchInput.value = e.target.textContent;
        searchInput.dispatchEvent(new Event("input"));
      }
    });
  });
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

document.getElementById("searchInput").addEventListener("keydown", (e) => {
  const query = e.target.value;
  if (query.length > 0) {
    if (e.key === "Enter") {
      e.preventDefault();
      window.open(
        "https://search.yahoo.co.jp/realtime/search?p=" +
          encodeURIComponent(query),
        null,
        "width=990,height=1000,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=yes"
      );
    } else if (e.key="ctrlKey") {
      e.preventDefault();
      window.open(
        "https://www.google.com/search?btnI=I&q=" + encodeURIComponent(query),
        null,
        "width=990,height=1000,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=yes"
      );
    }
  }
});

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
