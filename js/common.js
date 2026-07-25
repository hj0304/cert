/* 공용: 테마, 저장소, 자격증 레지스트리 */

/* 배포 시 갱신되는 캐시 버스팅 버전 (index/exam.html의 ?v= 와 함께 관리) */
const BUILD = "202607251620";

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

/* 로컬 기준 일자 키: "2026-07-25" */
function dayKey(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

/* 학습 스트릭: {current, best, todayCount}
   오늘 안 풀었어도 어제까지 이어졌으면 스트릭은 살아있는 것으로 계산 */
function getStreak() {
  const days = store.get("days", {});
  const keys = Object.keys(days).sort();
  if (!keys.length) return { current: 0, best: 0, todayCount: 0 };

  let best = 0, run = 0, prev = null;
  for (const k of keys) {
    if (prev) {
      const gap = Math.round((new Date(k + "T00:00:00") - new Date(prev + "T00:00:00")) / 86400000);
      run = gap === 1 ? run + 1 : 1;
    } else run = 1;
    if (run > best) best = run;
    prev = k;
  }

  const today = dayKey(new Date());
  const yest = dayKey(new Date(Date.now() - 86400000));
  let current = 0;
  if (days[today] || days[yest]) {
    let d = days[today] ? new Date() : new Date(Date.now() - 86400000);
    while (days[dayKey(d)]) { current++; d = new Date(d.getTime() - 86400000); }
  }
  return { current, best, todayCount: days[today] || 0 };
}

/* ---------- 복습 알림 ----------
   서비스 워커는 localStorage를 못 읽으므로, 복습 스케줄(due 타임스탬프)을
   IndexedDB에 미러링해두고 SW가 그걸 읽어 알림을 띄운다. */
function idbSetKV(key, val) {
  return new Promise((res, rej) => {
    const r = indexedDB.open("cert-db", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("kv");
    r.onsuccess = () => {
      const db = r.result;
      const tx = db.transaction("kv", "readwrite");
      tx.objectStore("kv").put(val, key);
      tx.oncomplete = () => { db.close(); res(); };
      tx.onerror = () => { db.close(); rej(tx.error); };
    };
    r.onerror = () => rej(r.error);
  });
}

function idbGetKV(key) {
  return new Promise((res, rej) => {
    const r = indexedDB.open("cert-db", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("kv");
    r.onsuccess = () => {
      const db = r.result;
      const tx = db.transaction("kv", "readonly");
      const rq = tx.objectStore("kv").get(key);
      rq.onsuccess = () => { db.close(); res(rq.result); };
      rq.onerror = () => { db.close(); rej(rq.error); };
    };
    r.onerror = () => rej(r.error);
  });
}

async function syncReviewToIDB() {
  if (!("indexedDB" in window)) return;
  try {
    const stats = getStats();
    const dues = Object.values(stats).map((s) => s.due).filter(Boolean);
    const prev = (await idbGetKV("review")) || {};
    // lastNotified는 SW가 갱신했을 수 있으니 더 최신 값 유지
    const mine = store.get("notifyLast", null);
    const last = [prev.lastNotified, mine].filter(Boolean).sort().pop() || null;
    if (last && last !== mine) store.set("notifyLast", last);
    await idbSetKV("review", { enabled: store.get("notify", false), dues, lastNotified: last });
  } catch (e) {}
}

function registerSW() {
  if (!("serviceWorker" in navigator)) return Promise.resolve(null);
  return navigator.serviceWorker.register("sw.js").catch(() => null);
}

/* 알림 토글. 반환: "on" | "off" | "denied" | "unsupported" */
async function toggleNotify() {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return "unsupported";
  if (store.get("notify", false)) {
    store.set("notify", false);
    await syncReviewToIDB();
    return "off";
  }
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return "denied";
  store.set("notify", true);
  await registerSW();
  await syncReviewToIDB();
  try {
    const reg = await navigator.serviceWorker.ready;
    if ("periodicSync" in reg) {
      const st = await navigator.permissions.query({ name: "periodic-background-sync" });
      if (st.state === "granted") await reg.periodicSync.register("review-check", { minInterval: 12 * 3600 * 1000 });
    }
  } catch (e) { /* periodic sync 미지원 브라우저 — 방문 시 알림으로 폴백 */ }
  return "on";
}

/* 사이트 방문 시 알림 체크 (모든 브라우저 폴백) */
async function notifyOnVisit() {
  if (!store.get("notify", false)) return;
  if (!("serviceWorker" in navigator) || Notification.permission !== "granted") return;
  const today = dayKey(new Date());
  if (store.get("notifyLast", null) === today) return;
  await registerSW();
  await syncReviewToIDB();
  const reg = await navigator.serviceWorker.ready;
  if (getDueIds().length > 0 && reg.active) {
    reg.active.postMessage({ type: "check-now" });
    store.set("notifyLast", today); // SW쪽 lastNotified와 별개로 페이지 쪽에서도 하루 1회 제한
  }
}

/* ---------- 학습 기록 백업 ---------- */
const BACKUP_KEYS = ["stats", "wrong", "bookmarks", "qindex", "days", "dday", "lastSession"];

function exportRecords() {
  const data = {};
  BACKUP_KEYS.forEach((k) => {
    const v = store.get(k, null);
    if (v !== null) data[k] = v;
  });
  const payload = { app: "cert-bank", version: 1, exportedAt: new Date().toISOString(), data };
  const blob = new Blob([JSON.stringify(payload, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "cert-학습기록-" + dayKey(new Date()) + ".json";
  a.click();
  URL.revokeObjectURL(a.href);
}

function importRecords(file, onDone) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      if (!payload || payload.app !== "cert-bank" || !payload.data) throw new Error("형식이 다른 파일");
      if (!confirm("가져오면 이 브라우저의 기존 학습 기록을 덮어씁니다. 계속할까요?\n(백업 시점: " + (payload.exportedAt || "?") + ")")) return;
      BACKUP_KEYS.forEach((k) => {
        if (payload.data[k] !== undefined) store.set(k, payload.data[k]);
        else store.remove(k);
      });
      onDone && onDone(true);
    } catch (e) {
      alert("가져오기에 실패했어요: " + e.message);
      onDone && onDone(false);
    }
  };
  reader.readAsText(file);
}

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

  // 일자별 학습 로그 (스트릭·활동 그래프용)
  const days = store.get("days", {});
  const dk = dayKey(new Date());
  days[dk] = (days[dk] || 0) + 1;
  store.set("days", days);

  // 복습 스케줄을 알림용 IndexedDB에 미러링 (비동기, 실패 무시)
  if (store.get("notify", false)) syncReviewToIDB();

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

/* ---------- 디자인 스킨 ---------- */
const SKINS = [
  { id: "bento", name: "기본", en: "Bento", dot: "#5b5bd6" },
  { id: "glass", name: "글래스", en: "Glassmorphism", dot: "linear-gradient(135deg,#a8c0f0,#d8b8ee)" },
  { id: "clay", name: "클레이", en: "Claymorphism", dot: "#7b6cf6" },
  { id: "skeuo", name: "스큐어", en: "Skeuomorphic", dot: "linear-gradient(180deg,#f8f4e8,#8a7857)" },
  { id: "grainy", name: "그레이니", en: "Grainy", dot: "#c96f3b" },
  { id: "brutalist", name: "브루탈", en: "Brutalist", dot: "#ffe600" },
  { id: "cyber", name: "사이버펑크", en: "Cyberpunk", dot: "linear-gradient(90deg,#00e5ff,#ff2bd6)" },
  { id: "y2k", name: "Y2K", en: "Y2K", dot: "linear-gradient(135deg,#ff8ad8,#6ad0ff)" },
  { id: "retro", name: "레트로퓨처", en: "Retro-Futurism", dot: "linear-gradient(180deg,#e0592a,#6a3577)" },
  { id: "duo", name: "듀오톤", en: "Duotone", dot: "linear-gradient(90deg,#16123f 50%,#ffd150 50%)" },
];

function applySkin(id) {
  if (!SKINS.some((s) => s.id === id)) id = "bento";
  if (id === "bento") document.documentElement.removeAttribute("data-skin");
  else document.documentElement.setAttribute("data-skin", id);
  store.set("skin", id);
  document.querySelectorAll(".skin-menu button").forEach((b) => b.classList.toggle("current", b.dataset.skin === id));
}

function initSkinPicker() {
  const actions = document.querySelector(".topbar .actions");
  if (!actions) return;
  const wrap = document.createElement("div");
  wrap.className = "skin-wrap";
  const btn = document.createElement("button");
  btn.className = "icon-btn";
  btn.title = "디자인 스킨 변경";
  btn.textContent = "🎨";
  const menu = document.createElement("div");
  menu.className = "skin-menu";
  const cur = store.get("skin", "bento");
  menu.innerHTML = SKINS.map((s) =>
    `<button data-skin="${s.id}" class="${s.id === cur ? "current" : ""}">
      <span class="dot" style="background:${s.dot}"></span>${s.name}<span class="skin-label-en">${s.en}</span>
    </button>`
  ).join("");
  menu.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-skin]");
    if (!b) return;
    applySkin(b.dataset.skin);
    menu.classList.remove("open");
  });
  btn.addEventListener("click", (e) => { e.stopPropagation(); menu.classList.toggle("open"); });
  document.addEventListener("click", () => menu.classList.remove("open"));
  wrap.appendChild(btn);
  wrap.appendChild(menu);
  actions.insertBefore(wrap, actions.firstChild);
}

(function initSkin() {
  // URL로 스킨 미리보기/공유 가능: ?skin=cyber (저장하지는 않음)
  const urlSkin = new URLSearchParams(location.search).get("skin");
  const id = urlSkin && SKINS.some((s) => s.id === urlSkin) ? urlSkin : store.get("skin", "bento");
  if (id !== "bento" && SKINS.some((s) => s.id === id)) document.documentElement.setAttribute("data-skin", id);
})();
document.addEventListener("DOMContentLoaded", initSkinPicker);

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
    s.src = "data/" + certId + "/exam" + round + ".js?v=" + BUILD;
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
