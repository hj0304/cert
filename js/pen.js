/* 연습장 펜 — 문제 카드 위에 직접 필기하는 캔버스 오버레이.
   실제 시험지에 펜으로 풀듯 계산·코드 추적을 손으로 할 수 있다.

   - 스트로크 단위로 저장해 실행취소가 가능하고, 지우개는 destination-out으로 그린다.
   - 필기는 문제 id별로 세션 메모리에 보관 → 문제를 오가도 그대로 남는다 (새로고침 시 초기화).
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
    if (!inkByQid.has(qid)) inkByQid.set(qid, []);
    return inkByQid.get(qid);
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
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = s.color;
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
      : tool === "highlight" ? { mode: "highlight", color: HIGHLIGHT.color, width: HIGHLIGHT.width, points: [pos(e)] }
      : { mode: "pen", color: isDark() ? pen.colorDark : pen.color, width: pen.width, points: [pos(e)] };
    strokes().push(curStroke);
    redraw();
  }

  function onMove(e) {
    if (!drawing || !curStroke) return;
    e.preventDefault();
    // coalesced events로 빠른 손글씨도 매끈하게 (빈 배열을 주는 경우가 있어 폴백)
    let evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    if (!evs.length) evs = [e];
    for (const ev of evs) curStroke.points.push(pos(ev));
    redraw();
  }

  function onUp() {
    drawing = false;
    curStroke = null;
    updateToolbar();
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
      else if (act === "undo") { strokes().pop(); redraw(); }
      else if (act === "clear") { if (!strokes().length || confirm("이 문제의 필기를 모두 지울까요?")) { inkByQid.set(qid, []); redraw(); } }
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
        else if (active && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { strokes().pop(); redraw(); updateToolbar(); }
      });

      // 문제 내용이 바뀌어 카드 높이가 변해도 캔버스가 따라가게
      resizeObs = new ResizeObserver(fitCanvas);
      resizeObs.observe(card);
      fitCanvas();
    },

    /* 문제가 바뀔 때마다 호출: 해당 문제의 필기를 불러온다 */
    setQuestion(id) {
      qid = String(id);
      drawing = false;
      curStroke = null;
      // 렌더 직후 카드 높이가 확정된 뒤 맞춘다
      requestAnimationFrame(() => { fitCanvas(); redraw(); updateToolbar(); });
    },
  };
})();
