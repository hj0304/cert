/* 홈 대시보드 */

(function () {
  const stats = getStats();
  const wrong = getWrongNote();
  const bookmarks = getBookmarks();
  const qIndex = getQIndex();

  /* ---- 전체 통계 ---- */
  const qids = Object.keys(stats);
  const attempts = qids.reduce((n, id) => n + stats[id].a, 0);
  const wrongs = qids.reduce((n, id) => n + stats[id].w, 0);
  const acc = attempts ? Math.round(((attempts - wrongs) / attempts) * 100) : null;

  document.getElementById("accNum").textContent = acc === null ? "–" : acc;
  document.getElementById("solvedNum").textContent = attempts;
  document.getElementById("wrongTotal").textContent = wrong.length;
  document.getElementById("wrongNum").textContent = wrong.length;
  document.getElementById("bmNum").textContent = bookmarks.length;

  /* 최근 학습 추이 바 (최근 14일, 일별 풀이 수) */
  const bars = document.getElementById("accBars");
  const byDay = {};
  qids.forEach((id) => {
    if (!stats[id].t) return;
    const d = new Date(stats[id].t);
    const key = d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
    byDay[key] = (byDay[key] || 0) + 1;
  });
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(byDay[d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate()] || 0);
  }
  const max = Math.max(...days, 1);
  bars.innerHTML = days
    .map((v, i) => `<span style="height:${Math.max(6, (v / max) * 100)}%" class="${i === 13 && v ? "hot" : v ? "hot" : ""}"></span>`)
    .join("");

  /* ---- 자격증별 진행률 & 회차 칩 ---- */
  function renderCertCard(cert, solvedElId, progressElId, chipsElId) {
    const ids = qids.filter((id) => qIndex[id] && qIndex[id].cert === cert.id);
    const solvedEl = document.getElementById(solvedElId);
    if (!solvedEl) return ids;
    solvedEl.textContent = ids.length;
    document.getElementById(progressElId).style.width = Math.min(100, (ids.length / cert.total) * 100) + "%";

    const solvedByRound = {};
    ids.forEach((id) => { const r = qIndex[id].round; solvedByRound[r] = (solvedByRound[r] || 0) + 1; });
    document.getElementById(chipsElId).innerHTML = cert.rounds
      .map((r) => {
        const done = solvedByRound[r] || 0;
        const need = ((cert.roundInfo || {})[r] || {}).count || 50;
        return `<span class="chip ${done >= need * 0.8 ? "done" : ""}">${roundLabel(r).replace(" (1·2회 통합)", "")}${done ? ` · ${done}` : ""}</span>`;
      })
      .join("");
    return ids;
  }
  const adspIds = renderCertCard(CERTS.adsp, "adspSolved", "adspProgress", "adspChips");
  const engIds = renderCertCard(CERTS.engineer, "engSolved", "engProgress", "engChips");

  /* ---- 오답노트 미리보기 ---- */
  const wrongRows = document.getElementById("wrongRows");
  const preview = wrong.slice(-3).reverse();
  if (preview.length) {
    wrongRows.innerHTML = preview
      .map((id) => {
        const m = qIndex[id];
        const certName = m && CERTS[m.cert] ? CERTS[m.cert].name : "";
        return `<div class="row-item"><span>${m ? `<b>${certName} ${roundLabel(m.round)}</b> ${m.number}번` : "문제 " + id}</span><span style="color:var(--red)">✗ ${stats[id] ? stats[id].w : 1}회</span></div>`;
      })
      .join("");
  }

  /* ---- 과목별 정답률 (자격증 통합) ---- */
  const subjRows = document.getElementById("subjectRows");
  const rowsHtml = [];
  [["adsp", adspIds], ["engineer", engIds]].forEach(([cid, ids]) => {
    const cert = CERTS[cid];
    const bySubject = {};
    ids.forEach((id) => {
      const cat = qIndex[id].cat || "기타";
      const s = (bySubject[cat] = bySubject[cat] || { a: 0, w: 0 });
      s.a += stats[id].a;
      s.w += stats[id].w;
    });
    const cats = Object.keys(bySubject);
    if (!cats.length) return;
    rowsHtml.push(`<div class="row-item" style="border-top:none"><span style="color:var(--ink-3);font-size:.78rem;font-weight:700">${cert.name}</span></div>`);
    cert.subjects
      .concat(cats.filter((c) => !cert.subjects.includes(c)))
      .filter((c) => bySubject[c])
      .forEach((c) => {
        const s = bySubject[c];
        const rate = s.a ? Math.round(((s.a - s.w) / s.a) * 100) : 0;
        const color = rate >= 60 ? "var(--green)" : rate >= 40 ? "var(--amber)" : "var(--red)";
        rowsHtml.push(`<div class="row-item"><span><b>${esc(c)}</b></span><span style="color:${color};font-weight:800">${rate}%</span></div>`);
      });
  });
  if (rowsHtml.length) subjRows.innerHTML = rowsHtml.join("");

  /* ---- D-day ---- */
  function renderDday() {
    const d = store.get("dday", null);
    const numEl = document.getElementById("ddayNum");
    const descEl = document.getElementById("ddayDesc");
    if (!d) {
      numEl.textContent = "설정";
      descEl.textContent = "카드를 눌러 시험일을 설정하세요";
      return;
    }
    const target = new Date(d.date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((target - today) / 86400000);
    numEl.textContent = diff > 0 ? "D-" + diff : diff === 0 ? "D-DAY" : "D+" + -diff;
    descEl.textContent = (d.label || "시험") + " · " + d.date;

    const hero = document.getElementById("heroMsg");
    if (diff > 0) hero.innerHTML = `${esc(d.label || "시험")}까지 <b>${diff}일</b>,<br />오늘도 한 걸음 더`;
    else if (diff === 0) hero.innerHTML = "오늘이 바로 그날!<br />차분하게, 아는 것부터";
  }
  document.getElementById("ddayCard").addEventListener("click", () => {
    const cur = store.get("dday", { date: "", label: "ADsP" });
    const date = prompt("시험일을 입력하세요 (YYYY-MM-DD)", cur.date || "2026-08-30");
    if (!date) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return toast("날짜 형식이 올바르지 않아요 (YYYY-MM-DD)");
    const label = prompt("시험 이름", cur.label || "ADsP") || "시험";
    store.set("dday", { date, label });
    renderDday();
    toast("D-day가 설정되었습니다");
  });
  renderDday();

  /* ---- 이어서 풀기 ---- */
  const last = store.get("lastSession", null);
  if (last && CERTS[last.cert]) {
    const btn = document.getElementById("continueBtn");
    btn.textContent = `이어서 풀기 — ${CERTS[last.cert].name} ${roundLabel(last.round)} ${last.number}번 →`;
    btn.href = `exam.html?cert=${last.cert}&round=${last.round}&mode=${last.mode || "practice"}#q${last.number}`;
  }
})();
