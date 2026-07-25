/* 문제 풀이 화면 */

(function () {
  const params = new URLSearchParams(location.search);
  const certId = params.get("cert") || "adsp";
  const cert = CERTS[certId];
  const mode = params.get("mode") || (params.get("round") ? "practice" : null);
  const round = params.get("round") || null; // ADsP: "42", 정처기: "2022-1"

  const $ = (id) => document.getElementById(id);
  const setupView = $("setupView"), examView = $("examView"), loadingView = $("loadingView");

  if (!cert || !cert.ready) {
    loadingView.innerHTML = "<p style='padding:60px 0;text-align:center;color:var(--ink-3)'>아직 준비 중인 자격증이에요. <a href='index.html'>홈으로</a></p>";
    return;
  }

  /* ============ 회차 선택 화면 ============ */
  if (!round && !["random", "wrong", "bookmark"].includes(mode)) {
    loadingView.style.display = "none";
    setupView.style.display = "block";
    $("setupTitle").textContent = cert.name + " 기출문제";
    $("setupCount").textContent = cert.rounds.length + "회분";

    let selMode = "practice";
    $("modeSeg").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      selMode = b.dataset.mode;
      $("modeSeg").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
      renderRounds();
    });

    const stats = getStats(), qIndex = getQIndex();
    const solvedByRound = {};
    Object.keys(stats).forEach((id) => {
      const m = qIndex[id];
      if (m && m.cert === certId) solvedByRound[m.round] = (solvedByRound[m.round] || 0) + 1;
    });

    function renderRounds() {
      $("roundGrid").innerHTML = cert.rounds
        .map((r) => {
          const done = solvedByRound[r] || 0;
          const info = (cert.roundInfo || {})[r] || {};
          const metaBits = [
            info.count ? info.count + "문제" : "",
            info.short ? "단답형 " + info.short : "",
            done ? done + "문제 학습함" : "",
          ].filter(Boolean).join(" · ");
          return `<div class="card round-card">
            <h3>${roundLabel(r)}</h3>
            <div class="meta">${metaBits || "아직 안 풀었어요"}</div>
            <div class="go-row">
              <a class="btn sm primary" href="exam.html?cert=${certId}&round=${r}&mode=${selMode}">${selMode === "exam" ? "실전 응시" : "연습 시작"}</a>
            </div>
          </div>`;
        })
        .join("");
    }
    renderRounds();
    return;
  }

  /* ============ 문제 데이터 로딩 ============ */
  let questions = [];   // [{...q, round}]
  let title = "";

  async function loadQuestions() {
    if (round) {
      const data = await loadExamData(certId, round);
      questions = data.questions.map((q) => ({ ...q, round }));
      title = cert.name + " " + roundLabel(round);
    } else if (mode === "random") {
      const all = [];
      for (const r of cert.rounds) {
        const data = await loadExamData(certId, r);
        data.questions.forEach((q) => { if (q.type === "choice") all.push({ ...q, round: r }); });
      }
      questions = shuffle(all).slice(0, 20);
      title = cert.name + " 랜덤 20문제";
    } else {
      // wrong / bookmark
      const ids = mode === "wrong" ? getWrongNote() : getBookmarks();
      const qIndex = getQIndex();
      const byRound = {};
      ids.forEach((id) => {
        const m = qIndex[id];
        if (m && m.cert === certId) (byRound[m.round] = byRound[m.round] || []).push(String(id));
      });
      for (const r of Object.keys(byRound)) {
        const data = await loadExamData(certId, r);
        data.questions.forEach((q) => {
          if (byRound[r].includes(String(q.id))) questions.push({ ...q, round: r });
        });
      }
      title = cert.name + (mode === "wrong" ? " 오답노트" : " 북마크");
    }
  }

  /* ============ 상태 ============ */
  const isExamMode = mode === "exam";
  let cur = 0;
  let submitted = false;
  const sel = {};      // qid -> Set(선택 번호)
  const graded = {};   // qid -> true(정답)/false — 채점된 문제만
  let fontScale = 1;

  /* ============ 렌더링 ============ */
  function q() { return questions[cur]; }

  function renderQuestion() {
    const Q = q();
    if (!Q) return;
    $("qNumber").textContent = (mode === "random" || mode === "wrong" || mode === "bookmark" ? roundLabel(Q.round) + " · " : "") + Q.number + "번";
    $("qCategory").textContent = Q.category || "기타";
    $("qTypeBadge").style.display = Q.type === "short" ? "" : "none";
    $("qSubject").innerHTML = Q.subject;
    $("qExtra").innerHTML = Q.extra || "";
    $("qExtra").style.display = Q.extra ? "" : "none";

    const fb = $("qFeedback");
    fb.className = "q-feedback";
    fb.textContent = "";

    // 북마크
    updateBmBtn();

    // wiki
    $("wikiLinks").innerHTML = (Q.wiki && Q.wiki.length)
      ? "참고: " + Q.wiki.map((w) => `<a href="${esc(w.url)}" target="_blank" rel="noopener">${esc(w.title)}</a>`).join("")
      : "";

    // 보기 or 단답
    const list = $("choiceList"), shortBox = $("shortBox");
    if (Q.type === "choice") {
      list.style.display = "";
      shortBox.style.display = "none";
      const mySel = sel[Q.id] || new Set();
      list.innerHTML = Q.choices
        .map((c) => `<li class="choice" data-n="${c.n}"><span class="num">${c.n}</span><span class="txt">${c.html}</span></li>`)
        .join("");
      list.querySelectorAll(".choice").forEach((el) => {
        const n = parseInt(el.dataset.n, 10);
        if (mySel.has(n)) el.classList.add("selected");
        el.addEventListener("click", () => onPick(n));
      });
      if (Q.id in graded) revealChoiceResult();
      if ((Q.answer || []).length > 1) {
        fb.className = "q-feedback";
        $("qCategory").insertAdjacentHTML("afterend", "");
      }
    } else {
      list.style.display = "none";
      list.innerHTML = "";
      shortBox.style.display = "";
      $("shortInput").value = (store.get("shortDraft." + Q.id, "")) || "";
      const revealed = Q.id in graded || (!isExamMode && $("shortReveal").dataset.qid === String(Q.id) && $("shortReveal").style.display !== "none");
      $("shortReveal").style.display = "none";
      $("selfGrade").style.display = "none";
      $("shortShowBtn").style.display = "";
      if (Q.id in graded) {
        showShortAnswer(false);
        fb.className = "q-feedback " + (graded[Q.id] ? "ok" : "no");
        fb.textContent = graded[Q.id] ? "맞았어요! 잘하고 있어요 ✓" : "틀렸어요 — 정답: " + Q.shortAnswer;
      }
    }

    $("checkBtn").style.display = (!isExamMode && Q.type === "choice" && !(Q.id in graded) && (Q.answer || []).length > 1) ? "" : "none";
    $("prevBtn").disabled = cur === 0;
    $("nextBtn").textContent = cur === questions.length - 1 ? "끝 ✓" : "다음 →";

    renderPalette();
    saveSession();
    window.scrollTo({ top: 0 });
  }

  function updateBmBtn() {
    const bm = getBookmarks().map(String);
    const on = bm.includes(String(q().id));
    const btn = $("bmBtn");
    btn.textContent = on ? "★" : "☆";
    btn.classList.toggle("bm-active", on);
  }

  function renderPalette() {
    const pal = $("palette");
    pal.innerHTML = questions
      .map((Q, i) => {
        let cls = "pal-btn";
        if (Q.id in graded) cls += graded[Q.id] ? " ok" : " no";
        else if (sel[Q.id] && sel[Q.id].size) cls += " answered";
        else if (Q.type === "short" && store.get("shortDraft." + Q.id, "")) cls += " answered";
        if (i === cur) cls += " current";
        const bm = getBookmarks().map(String).includes(String(Q.id)) ? "<span class='bm'>⭐</span>" : "";
        return `<button class="${cls}" data-i="${i}">${Q.number}${bm}</button>`;
      })
      .join("");
    pal.querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", () => { cur = parseInt(b.dataset.i, 10); renderQuestion(); })
    );
  }

  /* ============ 채점 로직 ============ */
  function meta(Q) { return { cert: certId, round: Q.round, number: Q.number, cat: Q.category }; }

  function onPick(n) {
    const Q = q();
    if (Q.id in graded && !isExamMode) return; // 이미 채점됨
    if (submitted) return;
    const multi = (Q.answer || []).length > 1;
    const s = (sel[Q.id] = sel[Q.id] || new Set());
    if (multi) {
      s.has(n) ? s.delete(n) : s.add(n);
      // 다시 그려서 선택 표시
      $("choiceList").querySelectorAll(".choice").forEach((el) => {
        el.classList.toggle("selected", s.has(parseInt(el.dataset.n, 10)));
      });
      renderPalette();
      return; // multi는 채점하기 버튼으로
    }
    s.clear(); s.add(n);
    $("choiceList").querySelectorAll(".choice").forEach((el) => {
      el.classList.toggle("selected", s.has(parseInt(el.dataset.n, 10)));
    });
    if (isExamMode) { renderPalette(); return; }
    gradeChoice();
  }

  function gradeChoice(silent) {
    const Q = q();
    const ans = (Q.answer || []).slice().sort().join(",");
    if (!ans) { toast("정답 정보가 없는 문제예요"); return; }
    const mine = [...(sel[Q.id] || [])].sort().join(",");
    if (!mine) { toast("보기를 먼저 선택하세요"); return; }
    const correct = mine === ans;
    graded[Q.id] = correct;
    recordResult(String(Q.id), correct, meta(Q));
    revealChoiceResult();
    if (!silent) renderPalette();
  }

  function revealChoiceResult() {
    const Q = q();
    const ansSet = new Set(Q.answer || []);
    const mySel = sel[Q.id] || new Set();
    $("choiceList").querySelectorAll(".choice").forEach((el) => {
      const n = parseInt(el.dataset.n, 10);
      el.classList.remove("selected");
      if (ansSet.has(n)) el.classList.add("correct");
      else if (mySel.has(n)) el.classList.add("wrong");
      else el.classList.add("dim");
    });
    const fb = $("qFeedback");
    const ok = graded[Q.id];
    fb.className = "q-feedback " + (ok ? "ok" : "no");
    fb.textContent = ok ? "정답이에요! ✓" : "아쉬워요 — 정답은 " + [...ansSet].join(", ") + "번";
  }

  function showShortAnswer(focusGrade = true) {
    const Q = q();
    const rev = $("shortReveal");
    rev.textContent = "정답: " + (Q.shortAnswer || "(등록된 정답 없음)");
    rev.style.display = "";
    rev.dataset.qid = Q.id;
    $("shortShowBtn").style.display = "none";
    if (!(Q.id in graded) && focusGrade) $("selfGrade").style.display = "flex";
  }

  function selfGradeShort(ok) {
    const Q = q();
    graded[Q.id] = ok;
    recordResult(String(Q.id), ok, meta(Q));
    $("selfGrade").style.display = "none";
    const fb = $("qFeedback");
    fb.className = "q-feedback " + (ok ? "ok" : "no");
    fb.textContent = ok ? "맞았어요! ✓" : "괜찮아요, 오답노트에 담아뒀어요";
    renderPalette();
  }

  /* ============ 제출 (실전 모드/전체 채점) ============ */
  function submit() {
    if (!questions.length) return;
    const unanswered = questions.filter((Q) => {
      if (Q.id in graded) return false;
      if (Q.type === "choice") return !(sel[Q.id] && sel[Q.id].size);
      return !store.get("shortDraft." + Q.id, "") && !(Q.id in graded);
    }).length;
    if (unanswered && !confirm(`안 푼 문제가 ${unanswered}개 있어요. 그래도 제출할까요?`)) return;

    submitted = true;
    stopTimer();

    questions.forEach((Q, i) => {
      if (Q.id in graded) return;
      if (Q.type === "choice") {
        const ans = (Q.answer || []).slice().sort().join(",");
        const mine = [...(sel[Q.id] || [])].sort().join(",");
        if (!ans) return;
        const correct = !!mine && mine === ans;
        graded[Q.id] = correct;
        recordResult(String(Q.id), correct, meta(Q));
      }
      // 단답형은 자가채점 필요 — 결과에서 안내
    });

    renderQuestion();
    showResult();
  }

  function showResult() {
    const bySubj = {};
    let right = 0, total = 0, shortsPending = 0;
    questions.forEach((Q) => {
      const cat = Q.category || "기타";
      const s = (bySubj[cat] = bySubj[cat] || { total: 0, right: 0 });
      s.total++; total++;
      if (Q.id in graded) { if (graded[Q.id]) { s.right++; right++; } }
      else if (Q.type === "short") shortsPending++;
    });
    const score = total ? Math.round((right / total) * 100) : 0;
    $("resultScore").textContent = score;

    const failedSubj = Object.keys(bySubj).filter((c) => {
      const s = bySubj[c];
      return (s.right / s.total) * 100 < cert.failScore;
    });
    const pass = score >= cert.passScore && failedSubj.length === 0;
    $("resultBadge").innerHTML = pass
      ? `<span class="pill green">합격권이에요! 🎉</span>`
      : `<span class="pill red">${score < cert.passScore ? `합격 기준 ${cert.passScore}점 미달` : "과락 발생: " + failedSubj.join(", ")}</span>`;

    $("resultBody").innerHTML = Object.keys(bySubj)
      .map((c) => {
        const s = bySubj[c];
        const rate = Math.round((s.right / s.total) * 100);
        const color = rate < cert.failScore ? "var(--red)" : "var(--ink)";
        return `<tr><td>${esc(c)}</td><td class="num">${s.right}</td><td class="num">${s.total}</td><td class="num" style="color:${color}">${rate}점</td></tr>`;
      })
      .join("");

    $("resultNote").textContent =
      (shortsPending ? `단답형 ${shortsPending}문제는 아직 자가채점 전이에요. 닫고 정답을 확인한 뒤 직접 채점하면 점수에 반영돼요. ` : "") +
      `합격 ${cert.passScore}점 이상 · 과목별 ${cert.failScore}% 미만 과락 기준.`;
    $("resultModal").classList.add("show");
  }

  /* ============ 타이머 ============ */
  let timerH = null, elapsed = 0;
  function startTimer() {
    timerH = setInterval(() => {
      elapsed++;
      const m = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const s = String(elapsed % 60).padStart(2, "0");
      $("timer").textContent = m + ":" + s;
    }, 1000);
  }
  function stopTimer() { clearInterval(timerH); }

  function saveSession() {
    if (round) store.set("lastSession", { cert: certId, round: q().round, number: q().number, mode: mode || "practice" });
  }

  /* ============ 이벤트 ============ */
  $("prevBtn").addEventListener("click", () => { if (cur > 0) { cur--; renderQuestion(); } });
  $("nextBtn").addEventListener("click", () => {
    if (cur < questions.length - 1) { cur++; renderQuestion(); }
    else if (!submitted) submit();
  });
  $("checkBtn").addEventListener("click", () => gradeChoice());
  $("submitBtn").addEventListener("click", submit);
  $("bmBtn").addEventListener("click", () => {
    const Q = q();
    const bm = getBookmarks().map(String);
    const i = bm.indexOf(String(Q.id));
    if (i >= 0) { bm.splice(i, 1); toast("북마크 해제"); }
    else {
      bm.push(String(Q.id));
      const ix = getQIndex(); ix[String(Q.id)] = meta(Q); setQIndex(ix);
      toast("북마크 저장 ⭐");
    }
    setBookmarks(bm);
    updateBmBtn();
    renderPalette();
  });
  $("shortShowBtn").addEventListener("click", () => {
    if (isExamMode && !submitted) { toast("실전 모드에선 제출 후에 볼 수 있어요"); return; }
    showShortAnswer();
  });
  $("selfOk").addEventListener("click", () => selfGradeShort(true));
  $("selfNo").addEventListener("click", () => selfGradeShort(false));
  $("shortInput").addEventListener("input", (e) => {
    store.set("shortDraft." + q().id, e.target.value);
  });

  $("fontUp").addEventListener("click", () => { fontScale = Math.min(1.3, fontScale + 0.1); applyFont(); });
  $("fontDown").addEventListener("click", () => { fontScale = Math.max(0.85, fontScale - 0.1); applyFont(); });
  function applyFont() { $("qCard").style.fontSize = fontScale + "rem"; }

  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
    if (e.key >= "1" && e.key <= "5" && q() && q().type === "choice") {
      const n = parseInt(e.key, 10);
      if (q().choices.some((c) => c.n === n)) onPick(n);
    } else if (e.key === "ArrowLeft" && cur > 0) { cur--; renderQuestion(); }
    else if (e.key === "ArrowRight" && cur < questions.length - 1) { cur++; renderQuestion(); }
    else if (e.key === "Enter" && q() && q().type === "choice" && !(q().id in graded) && !isExamMode) gradeChoice();
    else if (e.key.toLowerCase() === "b") $("bmBtn").click();
  });

  /* ============ 시작 ============ */
  loadQuestions()
    .then(() => {
      if (!questions.length) {
        loadingView.innerHTML = `<p style='padding:60px 0;text-align:center;color:var(--ink-3)'>
          ${mode === "wrong" ? "오답노트가 비어 있어요! 완벽하네요 👏" : mode === "bookmark" ? "북마크한 문제가 아직 없어요" : "문제를 찾지 못했어요"}
          <br/><br/><a class="btn primary" href="index.html">홈으로</a></p>`;
        return;
      }
      loadingView.style.display = "none";
      examView.style.display = "block";
      $("backToSetup").href = "exam.html?cert=" + certId;
      $("goWrongNote").href = "exam.html?cert=" + certId + "&mode=wrong";
      $("examTitle").textContent = title;
      $("examModeBadge").textContent = isExamMode ? "실전 모드" : mode === "wrong" ? "오답 복습" : mode === "bookmark" ? "북마크" : mode === "random" ? "랜덤" : "연습 모드";
      // 해시로 특정 번호 이동 (#q17)
      const hm = location.hash.match(/^#q(\d+)$/);
      if (hm) {
        const i = questions.findIndex((Q) => Q.number === parseInt(hm[1], 10));
        if (i >= 0) cur = i;
      }
      renderQuestion();
      startTimer();
    })
    .catch((e) => {
      loadingView.innerHTML = `<p style='padding:60px 0;text-align:center;color:var(--ink-3)'>데이터 로딩 실패: ${esc(e.message)}<br/><br/><a class="btn primary" href="index.html">홈으로</a></p>`;
    });
})();
