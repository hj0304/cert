/* 공용: 테마, 저장소, 자격증 레지스트리 */

const CERTS = {
  adsp: {
    id: "adsp",
    name: "ADsP",
    fullName: "데이터분석 준전문가",
    icon: "📊",
    passScore: 60,
    failScore: 40, // 과목별 과락 (%)
    rounds: [42, 41, 40, 39, 38, 37, 36, 35, 34, 33, 32, 31],
    roundInfo: {
      42: { count: 50, short: 0 }, 41: { count: 50, short: 0 }, 40: { count: 50, short: 0 },
      39: { count: 50, short: 0 }, 38: { count: 50, short: 10 }, 37: { count: 50, short: 10 },
      36: { count: 47, short: 3 }, 35: { count: 50, short: 10 }, 34: { count: 49, short: 10 },
      33: { count: 44, short: 4 }, 32: { count: 50, short: 10 }, 31: { count: 20, short: 0 },
    },
    subjects: ["데이터 이해", "데이터 분석 기획", "데이터 분석"],
    ready: true,
  },
  engineer: {
    id: "engineer",
    name: "정보처리기사",
    fullName: "정보처리기사 필기",
    icon: "💻",
    passScore: 60,
    failScore: 40,
    rounds: [],
    subjects: [],
    ready: false,
  },
};

/* ---------- localStorage helpers ---------- */
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem("cert." + key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem("cert." + key, JSON.stringify(value));
    } catch (e) {}
  },
  remove(key) {
    try {
      localStorage.removeItem("cert." + key);
    } catch (e) {}
  },
};

/* 통계 구조:
   stats = { [qid]: { a: attempts, w: wrongCount, last: "o"|"x" } }
   wrongNote = [qid, ...]  북마크 = [qid, ...]
   qIndex = { [qid]: {cert, round, number} }  — 문제 위치 역추적용 */

function getStats() { return store.get("stats", {}); }
function setStats(s) { store.set("stats", s); }
function getWrongNote() { return store.get("wrong", []); }
function setWrongNote(list) { store.set("wrong", [...new Set(list)]); }
function getBookmarks() { return store.get("bookmarks", []); }
function setBookmarks(list) { store.set("bookmarks", [...new Set(list)]); }
function getQIndex() { return store.get("qindex", {}); }
function setQIndex(ix) { store.set("qindex", ix); }

function recordResult(qid, correct, meta) {
  const stats = getStats();
  const s = stats[qid] || { a: 0, w: 0 };
  s.a += 1;
  if (!correct) s.w += 1;
  s.last = correct ? "o" : "x";
  s.t = Date.now();
  stats[qid] = s;
  setStats(stats);

  const wrong = getWrongNote();
  if (!correct) {
    if (!wrong.includes(qid)) { wrong.push(qid); setWrongNote(wrong); }
  } else {
    const i = wrong.indexOf(qid);
    if (i >= 0) { wrong.splice(i, 1); setWrongNote(wrong); }
  }

  if (meta) {
    const ix = getQIndex();
    ix[qid] = meta;
    setQIndex(ix);
  }
}

/* ---------- 테마 ---------- */
function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  store.set("theme", t);
  const btn = document.getElementById("themeBtn");
  if (btn) btn.textContent = t === "dark" ? "☀️" : "🌙";
}
function initTheme() {
  const saved = store.get("theme", null);
  const t = saved || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(t);
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  applyTheme(cur === "dark" ? "light" : "dark");
}
initTheme();

/* ---------- 데이터 로딩 (script 태그 주입 — file:// 에서도 동작) ---------- */
window.CERT_DATA = window.CERT_DATA || {};
function loadExamData(certId, round) {
  const key = certId + "-" + round;
  if (window.CERT_DATA[key]) return Promise.resolve(window.CERT_DATA[key]);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "data/" + certId + "/exam" + round + ".js";
    s.onload = () => {
      if (window.CERT_DATA[key]) resolve(window.CERT_DATA[key]);
      else reject(new Error("데이터 형식 오류: " + key));
    };
    s.onerror = () => reject(new Error("데이터를 불러올 수 없습니다: " + key));
    document.head.appendChild(s);
  });
}

/* ---------- 유틸 ---------- */
function toast(msg) {
  let t = document.querySelector(".toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), 2200);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
