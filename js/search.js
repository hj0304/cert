/* 문제 검색 — data/index.js(경량 인덱스)를 로드해 클라이언트에서 검색 */

(function () {
  const $ = (id) => document.getElementById(id);
  let INDEX = [];
  let certFilter = "";
  let typeFilter = "";
  const MAX_RESULTS = 60;

  /* 인덱스 로드 */
  const s = document.createElement("script");
  s.src = "data/index.js?v=" + BUILD;
  s.onload = () => {
    INDEX = window.CERT_INDEX || [];
    $("loading").style.display = "none";
    $("totalCount").textContent = INDEX.length.toLocaleString() + "문제";
    // URL ?q= 로 진입 지원
    const urlQ = new URLSearchParams(location.search).get("q");
    if (urlQ) { $("q").value = urlQ; run(); }
  };
  s.onerror = () => { $("loading").textContent = "검색 인덱스를 불러올 수 없어요."; };
  document.head.appendChild(s);

  /* 검색어 파싱: "정확한 문구" + 개별 단어 */
  function parseQuery(raw) {
    const phrases = [];
    const rest = raw.replace(/"([^"]+)"/g, (_, p) => { phrases.push(p.trim().toLowerCase()); return " "; });
    const words = rest.split(/\s+/).map((w) => w.trim().toLowerCase()).filter((w) => w.length >= 1);
    return { phrases, words };
  }

  function score(item, q) {
    const t = item.t.toLowerCase();
    for (const p of q.phrases) if (!t.includes(p)) return -1;
    for (const w of q.words) if (!t.includes(w)) return -1;
    // 앞부분(지문)에 등장하면 가점
    let sc = 0;
    [...q.phrases, ...q.words].forEach((term) => {
      const pos = t.indexOf(term);
      if (pos >= 0) sc += pos < 80 ? 3 : 1;
    });
    return sc;
  }

  function highlight(text, q) {
    const terms = [...q.phrases, ...q.words].filter(Boolean).sort((a, b) => b.length - a.length);
    let out = esc(text);
    terms.forEach((term) => {
      const re = new RegExp("(" + term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
      out = out.replace(re, "<mark>$1</mark>");
    });
    return out;
  }

  /* 검색어가 처음 등장하는 위치 중심으로 미리보기 자르기 */
  function snippet(item, q) {
    const terms = [...q.phrases, ...q.words].filter(Boolean);
    const lower = item.t.toLowerCase();
    let first = item.t.length;
    terms.forEach((term) => {
      const p = lower.indexOf(term);
      if (p >= 0 && p < first) first = p;
    });
    const start = Math.max(0, first - 40);
    const text = (start > 0 ? "…" : "") + item.t.slice(start, start + 200) + (item.t.length > start + 200 ? "…" : "");
    return highlight(text, q);
  }

  function run() {
    const raw = $("q").value.trim();
    if (!raw) {
      $("results").innerHTML = "";
      $("resultMeta").textContent = "";
      $("quickPlay").innerHTML = "";
      return;
    }
    const q = parseQuery(raw);
    const hits = [];
    for (const item of INDEX) {
      if (certFilter && item.c !== certFilter) continue;
      if (typeFilter && item.y !== typeFilter) continue;
      const sc = score(item, q);
      if (sc >= 0) hits.push({ item, sc });
    }
    hits.sort((a, b) => b.sc - a.sc);

    /* 자격증별 "전체 풀기" 버튼 */
    const byCert = {};
    hits.forEach((h) => { (byCert[h.item.c] = byCert[h.item.c] || []).push(h.item); });
    $("quickPlay").innerHTML = Object.keys(byCert).length
      ? Object.keys(byCert)
          .map((c) => `<button class="btn sm primary" data-play="${c}">${CERTS[c].name} ${byCert[c].length}문제 풀기 →</button>`)
          .join("")
      : "";
    $("quickPlay").querySelectorAll("button[data-play]").forEach((b) => {
      b.addEventListener("click", () => {
        const cert = b.dataset.play;
        // 회차 정보까지 넘겨야 exam.js가 해당 회차만 로드할 수 있음
        const ids = byCert[cert].map((x) => ({ i: x.i, r: x.r }));
        sessionStorage.setItem("cert.searchIds", JSON.stringify(ids));
        sessionStorage.setItem("cert.searchQuery", raw);
        location.href = `exam.html?cert=${cert}&mode=search`;
      });
    });

    $("resultMeta").innerHTML = hits.length
      ? `<b>${hits.length}</b>개 문제를 찾았어요` + (hits.length > MAX_RESULTS ? ` (상위 ${MAX_RESULTS}개 표시)` : "")
      : `검색 결과가 없어요. 더 짧은 키워드로 시도해 보세요.`;

    $("results").innerHTML = hits
      .slice(0, MAX_RESULTS)
      .map(({ item }) => {
        const cert = CERTS[item.c];
        return `<a class="search-hit" href="exam.html?cert=${item.c}&round=${item.r}&mode=practice#q${item.n}">
          <div class="hit-meta">
            <span class="pill ${item.c === "adsp" ? "accent" : item.c === "engineer" ? "teal" : "amber"}">${cert.name}</span>
            <span class="hit-round">${roundLabel(item.r, item.c)} · ${item.n}번</span>
            <span class="hit-cat">${esc(item.s)}</span>
            ${item.y === "s" ? '<span class="pill muted">단답형</span>' : ""}
          </div>
          <div class="hit-text">${snippet(item, q)}</div>
        </a>`;
      })
      .join("");
  }

  /* 입력 디바운스 */
  let h = null;
  $("q").addEventListener("input", () => { clearTimeout(h); h = setTimeout(run, 180); });

  $("certFilter").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    certFilter = b.dataset.cert;
    $("certFilter").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
    run();
  });
  $("typeFilter").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    typeFilter = b.dataset.type;
    $("typeFilter").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
    run();
  });
})();
