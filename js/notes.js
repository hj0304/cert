/* 과목별 요약집 렌더링.
   data/notes.js 의 CERT_NOTES 를 좌측 목차 + 본문으로 펼친다.
   과목·단원 선택은 URL(?cert=&s=)에 반영해 링크를 공유·북마크할 수 있게 한다. */

(function () {
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);

  let curCert = params.get("cert") === "practical" ? "practical" : "engineer";
  let curSubject = params.get("s") || null;

  const slug = (s) => s.replace(/\s+/g, "-");

  function subjectsOf(cert) {
    return (window.CERT_NOTES && window.CERT_NOTES[cert]) || [];
  }

  function render() {
    const list = subjectsOf(curCert);
    if (!list.length) {
      $("notesBody").innerHTML = '<p style="color:var(--ink-3)">요약집을 불러오지 못했어요.</p>';
      return;
    }
    // 선택된 과목이 이 자격증에 없으면 첫 과목으로
    let idx = list.findIndex((s) => s.subject === curSubject);
    if (idx < 0) { idx = 0; curSubject = list[0].subject; }
    const cur = list[idx];

    // 좌측: 과목 목록 + 현재 과목의 단원
    $("notesNav").innerHTML =
      `<div class="nn-group">과목</div>` +
      list.map((s, i) =>
        `<button class="nn-subject${i === idx ? " on" : ""}" data-subject="${esc(s.subject)}">
           ${esc(s.subject)}<span class="nn-count">${s.sections.length}</span>
         </button>`).join("") +
      `<div class="nn-group">단원</div>` +
      cur.sections.map((sec, i) =>
        `<a class="nn-sec" href="#sec-${i}">${esc(sec.h)}</a>`).join("");

    $("notesBody").innerHTML =
      `<div class="notes-intro"><h2>${esc(cur.subject)}</h2><p>${esc(cur.intro)}</p></div>` +
      cur.sections.map((sec, i) =>
        `<section class="note-sec" id="sec-${i}">
           <h3>${esc(sec.h)}</h3>
           <div class="note-body">${sec.body}</div>
         </section>`).join("");

    // 상단 세그먼트 상태
    document.querySelectorAll("#certSeg button").forEach((b) =>
      b.classList.toggle("on", b.dataset.cert === curCert));

    const u = new URL(location.href);
    u.searchParams.set("cert", curCert);
    u.searchParams.set("s", curSubject);
    history.replaceState(null, "", u);
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  document.addEventListener("click", (e) => {
    const sub = e.target.closest(".nn-subject");
    if (sub) { curSubject = sub.dataset.subject; render(); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    const seg = e.target.closest("#certSeg button");
    if (seg) { curCert = seg.dataset.cert; curSubject = null; render(); }
  });

  // 스킨 적용·피커 주입은 common.js가 DOMContentLoaded에서 알아서 한다.
  // 여기서 또 부르면 🎨 버튼이 두 개 생긴다.
  render();
})();
