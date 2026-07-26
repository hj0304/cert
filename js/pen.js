/* 연습장 펜 — 문제 카드 위에 직접 필기하는 캔버스 오버레이.
   실제 시험지에 펜으로 풀듯 계산·코드 추적을 손으로 할 수 있다.

   - 스트로크 단위로 저장해 실행취소가 가능하고, 지우개는 destination-out으로 그린다.
   - 필기는 문제 id별로 localStorage(cert.ink)에 영구 저장 → 새로고침해도 남는다.
     저장 시점의 카드 폭을 함께 기록해, 창 크기가 달라지면 비율대로 스케일해 복원한다.
   - Pointer Events로 마우스·터치·스타일러스를 함께 지원한다. */

(function () {
  const PENS = [
    { id: "black", color: "#1a1a1e", colorDark: "#f0f0f2", width: 2.2 },
    { id: "red", color: "#e5484d", colorDark: "#ff6369", width: 2.2 },
    { id: "blue", color: "#3b62e0", colorDark: "#7c9bff", width: 2.2 },
  ];
  const HIGHLIGHT = { color: "rgba(255, 213, 0, 0.35)", width: 16 };
  const ERASER_WIDTH = 26;

  let canvas = null, ctx = null, card = null, toolbar = null, penBtn = null;
  let active = false;            // 펜 모드 on/off
  let tool = "pen";              // pen | highlight | eraser
  let penColorIdx = 0;
  let drawing = false;
  let curStroke = null;
  let qid = null;
  const inkByQid = new Map();    // qid -> strokes[]
  let resizeObs = null;

  const isDark = () => document.documentElement.getAttribute("data-theme") === "dark";

  function strokes() {
    if (!qid) return [];
    if (!inkByQid.has(qid)) inkByQid.set(qid, saved[qid] ? hydrate(qid) : []);
    return inkByQid.get(qid);
  }

  /* ---------- 영구 저장 (localStorage) ---------- */
  const INK_KEY = "cert.ink";
  const INK_BUDGET = 1500000; // 문자 수 ≈ 1.5MB. localStorage 한도(보통 5MB) 대비 여유
  let saved = {};             // qid -> { t: 마지막 사용, w: 저장 시 카드 폭, s: [압축 스트로크] }
  let saveTimer = null;

  function loadSaved() {
    try { saved = JSON.parse(localStorage.getItem(INK_KEY)) || {}; } catch (e) { saved = {}; }
  }

  function pack(s) {
    const p = [];
    for (const pt of s.points) p.push(Math.round(pt.x * 10) / 10, Math.round(pt.y * 10) / 10);
    const o = { m: s.mode === "eraser" ? "e" : s.mode === "highlight" ? "h" : "p", w: s.width, p };
    if (o.m === "p") o.c = s.pen;
    return o;
  }

  function unpack(o, k) {
    const points = [];
    for (let i = 0; i < o.p.length; i += 2) points.push({ x: o.p[i] * k, y: o.p[i + 1] * k });
    return o.m === "e" ? { mode: "eraser", width: o.w, points }
      : o.m === "h" ? { mode: "highlight", width: o.w, points }
      : { mode: "pen", pen: o.c || "black", width: o.w, points };
  }

  function hydrate(id) {
    const e = saved[id];
    if (!e || !e.s) return [];
    // 저장 당시와 카드 폭이 다르면 비율대로 스케일 (텍스트 리플로우까진 못 따라가는 근사치)
    const k = (e.w > 0 && card && card.clientWidth > 0) ? card.clientWidth / e.w : 1;
    return e.s.map((o) => unpack(o, k));
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveInk, 400);
  }

  function saveInk() {
    clearTimeout(saveTimer);
    saveTimer = null;
    if (!qid || !card) return;
    const list = inkByQid.get(qid) || [];
    if (!list.length) delete saved[qid];
    else saved[qid] = { t: Date.now(), w: card.clientWidth, s: list.map(pack) };
    writeSaved();
  }

  function writeSaved() {
    let json = JSON.stringify(saved);
    while (json.length > INK_BUDGET && dropOldest()) json = JSON.stringify(saved);
    try {
      localStorage.setItem(INK_KEY, json);
    } catch (e) {
      // 쿼터 초과 — 오래 안 본 필기를 지우고 재시도
      if (dropOldest()) writeSaved();
    }
  }

  function dropOldest() {
    let oldest = null;
    for (const id in saved) {
      if (id === qid) continue; // 지금 보는 문제는 마지막까지 지킨다
      if (!oldest || (saved[id].t || 0) < (saved[oldest].t || 0)) oldest = id;
    }
    if (!oldest) return false;
    delete saved[oldest];
    inkByQid.delete(oldest);
    return true;
  }

  /* ---------- 캔버스 크기 = 카드 크기 (레티나 대응) ---------- */
  function fitCanvas() {
    if (!canvas || !card) return;
    const w = card.clientWidth, h = card.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width === Math.round(w * dpr) && canvas.height === Math.round(h * dpr)) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }

  function redraw() {
    if (!ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    for (const s of strokes()) paintStroke(s);
  }

  function paintStroke(s) {
    if (s.points.length < 2) {
      // 점 하나짜리 탭도 잉크가 남게
      const p = s.points[0];
      if (!p) return;
      ctx.save();
      applyStyle(s);
      ctx.beginPath();
      ctx.arc(p.x, p.y, (s.width || 2) / 2, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      if (s.mode !== "eraser") ctx.fill();
      ctx.restore();
      return;
    }
    ctx.save();
    applyStyle(s);
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    // 중간점 보간으로 곡선을 부드럽게
    for (let i = 1; i < s.points.length - 1; i++) {
      const midX = (s.points[i].x + s.points[i + 1].x) / 2;
      const midY = (s.points[i].y + s.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(s.points[i].x, s.points[i].y, midX, midY);
    }
    const last = s.points[s.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    ctx.restore();
  }

  function applyStyle(s) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = s.width;
    if (s.mode === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else if (s.mode === "highlight") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = HIGHLIGHT.color;
    } else {
      // 색은 그릴 때마다 테마에 맞춰 결정 — 저장된 필기도 다크모드 전환을 따라간다
      const pen = PENS.find((p) => p.id === s.pen) || PENS[0];
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = isDark() ? pen.colorDark : pen.color;
    }
  }

  /* ---------- 입력 ---------- */
  function pos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function onDown(e) {
    if (!active) return;
    e.preventDefault();
    // 포인터가 카드 밖으로 나가도 스트로크가 이어지게. (일부 상황에선 throw할 수 있어 방어)
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    drawing = true;
    const pen = PENS[penColorIdx];
    curStroke =
      tool === "eraser" ? { mode: "eraser", width: ERASER_WIDTH, points: [pos(e)] }
      : tool === "highlight" ? { mode: "highlight", width: HIGHLIGHT.width, points: [pos(e)] }
      : { mode: "pen", pen: pen.id, width: pen.width, points: [pos(e)] };
    strokes().push(curStroke);
    redraw();
  }

  function onMove(e) {
    if (!drawing || !curStroke) return;
    e.preventDefault();
    // coalesced events로 빠른 손글씨도 매끈하게 (빈 배열을 주는 경우가 있어 폴백)
    let evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    if (!evs.length) evs = [e];
    for (const ev of evs) {
      const pt = pos(ev);
      const last = curStroke.points[curStroke.points.length - 1];
      // 1px 미만 이동은 버려 저장 용량을 줄인다 (곡선 품질엔 영향 없음)
      if (!last || Math.abs(pt.x - last.x) + Math.abs(pt.y - last.y) > 0.8) curStroke.points.push(pt);
    }
    redraw();
  }

  function onUp() {
    drawing = false;
    curStroke = null;
    updateToolbar();
    scheduleSave();
  }

  /* ---------- 툴바 ---------- */
  function buildToolbar() {
    toolbar = document.createElement("div");
    toolbar.className = "pen-toolbar";
    toolbar.innerHTML =
      PENS.map((p, i) => `<button class="pen-btn pen-color" data-act="pen" data-idx="${i}" title="펜"><span class="dot" style="background:${p.color}"></span></button>`).join("") +
      `<button class="pen-btn" data-act="highlight" title="형광펜">🖍️</button>
       <button class="pen-btn" data-act="eraser" title="지우개">🧽</button>
       <span class="pen-sep"></span>
       <button class="pen-btn" data-act="undo" title="실행 취소 (Ctrl+Z)">↩️</button>
       <button class="pen-btn" data-act="clear" title="전체 지우기">🗑️</button>
       <button class="pen-btn" data-act="close" title="펜 끝내기">✕</button>`;
    toolbar.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      const act = b.dataset.act;
      if (act === "pen") { tool = "pen"; penColorIdx = +b.dataset.idx; }
      else if (act === "highlight") tool = "highlight";
      else if (act === "eraser") tool = "eraser";
      else if (act === "undo") { strokes().pop(); redraw(); scheduleSave(); }
      else if (act === "clear") { if (!strokes().length || confirm("이 문제의 필기를 모두 지울까요?")) { inkByQid.set(qid, []); redraw(); scheduleSave(); } }
      else if (act === "close") setActive(false);
      updateToolbar();
    });
    return toolbar;
  }

  function updateToolbar() {
    if (!toolbar) return;
    toolbar.querySelectorAll(".pen-btn").forEach((b) => {
      const act = b.dataset.act;
      const on =
        (act === "pen" && tool === "pen" && +b.dataset.idx === penColorIdx) ||
        (act === "highlight" && tool === "highlight") ||
        (act === "eraser" && tool === "eraser");
      b.classList.toggle("on", on);
      if (act === "undo") b.disabled = !strokes().length;
    });
  }

  function setActive(on) {
    active = on;
    canvas.classList.toggle("pen-on", on);
    toolbar.style.display = on ? "" : "none";
    if (penBtn) {
      penBtn.classList.toggle("pen-active", on);
      penBtn.title = on ? "펜 끝내기 (P)" : "연습장 펜 (P)";
    }
    updateToolbar();
  }

  /* ---------- 공개 API ---------- */
  window.penTool = {
    /* exam.js가 최초 1회 호출: 카드에 캔버스·툴바 부착 */
    init(cardEl, toggleBtn) {
      card = cardEl;
      penBtn = toggleBtn;
      loadSaved();
      canvas = document.createElement("canvas");
      canvas.className = "pen-canvas";
      ctx = canvas.getContext("2d");
      card.appendChild(canvas);
      card.appendChild(buildToolbar());
      toolbar.style.display = "none";

      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointercancel", onUp);

      penBtn.addEventListener("click", () => setActive(!active));
      document.addEventListener("keydown", (e) => {
        if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
        if (e.key.toLowerCase() === "p") setActive(!active);
        else if (active && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { strokes().pop(); redraw(); updateToolbar(); scheduleSave(); }
      });

      // 저장 디바운스가 걸린 채 탭을 닫거나 이동해도 필기가 유실되지 않게
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden" && saveTimer) saveInk();
      });
      window.addEventListener("pagehide", () => { if (saveTimer) saveInk(); });

      // 문제 내용이 바뀌어 카드 높이가 변해도 캔버스가 따라가게
      resizeObs = new ResizeObserver(fitCanvas);
      resizeObs.observe(card);
      fitCanvas();
    },

    /* 문제가 바뀔 때마다 호출: 해당 문제의 필기를 불러온다 */
    setQuestion(id) {
      if (saveTimer) saveInk(); // 이전 문제의 저장 대기분을 먼저 확정 (qid가 바뀌기 전에)
      qid = String(id);
      drawing = false;
      curStroke = null;
      // 렌더 직후 카드 높이가 확정된 뒤 맞춘다
      requestAnimationFrame(() => { fitCanvas(); redraw(); updateToolbar(); });
    },
  };
})();
