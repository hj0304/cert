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

  /* 최근 학습 추이 바 (최근 14일, 일자별 로그 기반) */
  const bars = document.getElementById("accBars");
  const dayLog = store.get("days", {});
  const days = [];
  for (let i = 13; i >= 0; i--) {
    days.push(dayLog[dayKey(new Date(Date.now() - i * 86400000))] || 0);
  }
  const max = Math.max(...days, 1);
  bars.innerHTML = days
    .map((v) => `<span style="height:${Math.max(6, (v / max) * 100)}%" class="${v ? "hot" : ""}"></span>`)
    .join("");

  /* ---- 스트릭 배지 ---- */
  const streak = getStreak();
  if (streak.current > 0) {
    const el = document.getElementById("streakBadge");
    el.style.display = "";
    el.textContent = `🔥 ${streak.current}일 연속` + (streak.best > streak.current ? ` · 최고 ${streak.best}일` : streak.current >= 3 ? " — 자기최고!" : "");
    if (!streak.todayCount) el.textContent += " (오늘 아직 0문제)";
  }

  /* ---- 복습 알림 토글 ---- */
  const notifyBtn = document.getElementById("notifyBtn");
  const notifyHint = document.getElementById("notifyHint");
  function renderNotifyBtn() {
    const on = store.get("notify", false) && ("Notification" in window) && Notification.permission === "granted";
    notifyBtn.textContent = on ? "🔕 복습 알림 끄기" : "🔔 복습 알림 켜기";
    if (on) {
      notifyHint.style.display = "";
      notifyHint.textContent = "Chrome/Edge에선 백그라운드로도 하루 1회, 그 외 브라우저는 사이트를 열 때 알려드려요.";
    } else notifyHint.style.display = "none";
  }
  notifyBtn.addEventListener("click", async () => {
    const result = await toggleNotify();
    if (result === "on") toast("복습 알림을 켰어요 🔔");
    else if (result === "off") toast("복습 알림을 껐어요");
    else if (result === "denied") toast("브라우저에서 알림 권한이 거부됐어요 — 주소창 자물쇠에서 허용해 주세요");
    else toast("이 브라우저는 알림을 지원하지 않아요");
    renderNotifyBtn();
  });
  renderNotifyBtn();

  /* 알림이 켜져 있으면 방문 시 복습 체크 (하루 1회) */
  notifyOnVisit();

  /* ---- 기록 내보내기/가져오기 ---- */
  document.getElementById("exportBtn").addEventListener("click", () => {
    exportRecords();
    toast("학습 기록을 JSON 파일로 저장했어요");
  });
  const fileInput = document.getElementById("importFile");
  document.getElementById("importBtn").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    if (!fileInput.files.length) return;
    importRecords(fileInput.files[0], (ok) => {
      if (ok) { toast("가져오기 완료! 새로고침합니다"); setTimeout(() => location.reload(), 800); }
      fileInput.value = "";
    });
  });

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
        return `<span class="chip ${done >= need * 0.8 ? "done" : ""}">${roundLabel(r)}${done ? ` · ${done}` : ""}</span>`;
      })
      .join("");
    return ids;
  }
  const adspIds = renderCertCard(CERTS.adsp, "adspSolved", "adspProgress", "adspChips");
  const engIds = renderCertCard(CERTS.engineer, "engSolved", "engProgress", "engChips");
  const pracIds = renderCertCard(CERTS.practical, "pracSolved", "pracProgress", "pracChips");

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
  [["adsp", adspIds], ["engineer", engIds], ["practical", pracIds]].forEach(([cid, ids]) => {
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

  /* ---- 오늘의 복습 (SRS) ---- */
  const dueAdsp = getDueIds("adsp");
  const dueEng = getDueIds("engineer");
  const duePrac = getDueIds("practical");
  document.getElementById("dueNum").textContent = dueAdsp.length + dueEng.length + duePrac.length;
  if (dueAdsp.length) {
    document.getElementById("dueAdsp").style.display = "";
    document.getElementById("dueAdspN").textContent = dueAdsp.length;
  }
  if (dueEng.length) {
    document.getElementById("dueEng").style.display = "";
    document.getElementById("dueEngN").textContent = dueEng.length;
  }
  if (duePrac.length) {
    document.getElementById("duePrac").style.display = "";
    document.getElementById("duePracN").textContent = duePrac.length;
  }
  if (dueAdsp.length || dueEng.length || duePrac.length) document.getElementById("dueEmpty").style.display = "none";

  /* ---- 합격 예측 ---- */
  const predictRows = document.getElementById("predictRows");
  const predictHtml = [];
  ["adsp", "engineer", "practical"].forEach((cid) => {
    const cert = CERTS[cid];
    const perf = subjectPerformance(cid);
    const attempted = Object.values(perf).reduce((n, o) => n + o.a, 0);
    if (attempted < 30) return; // 표본 부족
    const subjScores = cert.subjects.map((c) => {
      const p = perf[c];
      return { name: c, score: p && p.a >= 5 ? Math.round(p.acc * 100) : null };
    });
    const known = subjScores.filter((s) => s.score !== null);
    if (!known.length) return;
    const avg = Math.round(known.reduce((n, s) => n + s.score, 0) / known.length);
    const fails = known.filter((s) => s.score < cert.failScore);
    const pass = avg >= cert.passScore && !fails.length && known.length === cert.subjects.length;
    const badge = pass
      ? `<span class="pill green">합격권 ✓</span>`
      : fails.length
        ? `<span class="pill red">과락 위험: ${fails.map((f) => esc(f.name)).join(", ")}</span>`
        : avg < cert.passScore
          ? `<span class="pill amber">평균 ${cert.passScore}점까지 ${cert.passScore - avg}점</span>`
          : `<span class="pill amber">모든 과목을 풀어보세요</span>`;
    predictHtml.push(`<div class="row-item"><span><b>${cert.name}</b> 예상 <b style="font-size:1.05rem">${avg}점</b></span><span>${badge}</span></div>`);
    subjScores.forEach((s) => {
      if (s.score === null) {
        predictHtml.push(`<div class="row-item"><span style="font-size:.84rem">${esc(s.name)}</span><span style="color:var(--ink-3);font-size:.8rem">표본 부족</span></div>`);
      } else {
        const color = s.score >= cert.passScore ? "var(--green)" : s.score >= cert.failScore ? "var(--amber)" : "var(--red)";
        predictHtml.push(`<div class="row-item"><span style="font-size:.84rem">${esc(s.name)}</span><span style="color:${color};font-weight:800">${s.score}점</span></div>`);
      }
    });
  });
  if (predictHtml.length) predictRows.innerHTML = predictHtml.join("");

  /* ---- 이어서 풀기 ---- */
  const last = store.get("lastSession", null);
  if (last && CERTS[last.cert]) {
    const btn = document.getElementById("continueBtn");
    btn.textContent = `이어서 풀기 — ${CERTS[last.cert].name} ${roundLabel(last.round, last.cert)} ${last.number}번 →`;
    btn.href = `exam.html?cert=${last.cert}&round=${last.round}&mode=${last.mode || "practice"}#q${last.number}`;
  }

  /* 복습 대기가 있으면 히어로에 CTA 추가 */
  const totalDue = dueAdsp.length + dueEng.length + duePrac.length;
  if (totalDue) {
    const foot = document.querySelector(".hero-foot");
    const a = document.createElement("a");
    a.className = "btn ghost-hero";
    const counts = [["adsp", dueAdsp.length], ["engineer", dueEng.length], ["practical", duePrac.length]];
    const target = counts.sort((x, y) => y[1] - x[1])[0][0];
    a.href = `exam.html?cert=${target}&mode=review`;
    a.textContent = `🌱 오늘의 복습 ${totalDue}문제`;
    foot.insertBefore(a, foot.children[1]);
  }
})();
