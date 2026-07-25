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
    total: 560,
    ready: true,
  },
  engineer: {
    id: "engineer",
    name: "정보처리기사",
    fullName: "정보처리기사 필기",
    icon: "💻",
    passScore: 60,
    failScore: 40,
    // 2020년 개정(현행 출제기준) 이후 공개 기출 전체.
    // 2022년 3회부터 CBT 전환으로 기출 비공개 — 2026년까지 현행 기준 유지, 2027년 전면 개편 예정.
    rounds: ["2022-2", "2022-1", "2021-3", "2021-2", "2021-1", "2020-4", "2020-3", "2020-1"],
    roundInfo: {
      "2022-2": { count: 100 }, "2022-1": { count: 100 },
      "2021-3": { count: 100 }, "2021-2": { count: 99 }, "2021-1": { count: 100 },
      "2020-4": { count: 100 }, "2020-3": { count: 100 }, "2020-1": { count: 100 },
    },
    subjects: ["소프트웨어 설계", "소프트웨어 개발", "데이터베이스 구축", "프로그래밍 언어 활용", "정보시스템 구축관리"],
    total: 799,
    ready: true,
  },
};

/* 오늘 복습할 문제 (SRS due 도래) — certId 지정 시 해당 자격증만 */
function getDueIds(certId) {
  const stats = getStats();
  const qIndex = getQIndex();
  const now = Date.now();
  return Object.keys(stats)
    .filter((id) => stats[id].due && stats[id].due <= now)
    .filter((id) => !certId || (qIndex[id] && qIndex[id].cert === certId))
    .sort((a, b) => (stats[a].due || 0) - (stats[b].due || 0));
}

/* 과목별 성취도: {과목: {a, w, acc}} — 최근 기록일수록 가중 */
function subjectPerformance(certId) {
  const stats = getStats();
  const qIndex = getQIndex();
  const by = {};
  const now = Date.now();
  Object.keys(stats).forEach((id) => {
    const m = qIndex[id];
    if (!m || m.cert !== certId) return;
    const s = stats[id];
    // 30일 이상 지난 기록은 가중치 절반
    const weight = s.t && now - s.t > 30 * 86400000 ? 0.5 : 1;
    const o = (by[m.cat] = by[m.cat] || { a: 0, w: 0 });
    o.a += s.a * weight;
    o.w += s.w * weight;
  });
  Object.values(by).forEach((o) => { o.acc = o.a ? (o.a - o.w) / o.a : 0; });
  return by;
}

/* 회차 표시 라벨: 42 → "42회", "2020-1" → "2020년 1회" */
function roundLabel(r) {
  const s = String(r);
  const m = s.match(/^(\d{4})-(\d)$/);
  if (m) return m[1] + "년 " + m[2] + "회" + (s === "2020-1" ? " (1·2회 통합)" : "");
  return s + "회";
}

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

/* 간격 반복(Spaced Repetition) — 라이트너 방식.
   맞히면 다음 복습 간격이 늘어나고(1→3→7→21일), 틀리면 1일로 리셋. */
const SRS_INTERVALS = [1, 3, 7, 21]; // 일 단위

function recordResult(qid, correct, meta) {
  const stats = getStats();
  const s = stats[qid] || { a: 0, w: 0 };
  s.a += 1;
  if (!correct) s.w += 1;
  s.last = correct ? "o" : "x";
  s.t = Date.now();
  s.iv = correct ? Math.min((s.iv == null ? -1 : s.iv) + 1, SRS_INTERVALS.length - 1) : 0;
  s.due = Date.now() + SRS_INTERVALS[s.iv] * 86400000;
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
