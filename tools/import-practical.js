/* 정처기 실기 회차 가져오기 — 꿈라CBT 공개 API(JSON)를 data/practical/*.js 형태로 변환한다.
   원본 JSON은 notes/practical-api/<round>.json 에 그대로 보관한다.

     node tools/import-practical.js 2026-1 2026-2 ...

   같은 회차 파일이 이미 있으면 문항 본문을 대조해 기존 id·해설(explain/wiki)을 그대로 물려준다.
   (사이트가 복원 문항을 손보면서 번호·문장이 바뀌어도 학습 기록이 날아가지 않도록) */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const API_DIR = path.join(ROOT, "notes", "practical-api");
const OUT_DIR = path.join(ROOT, "data", "practical");

/* ---------- 본문 HTML 변환 ---------- */

/* 사이트 마크업 → 이 저장소 마크업
   - pre.qcode > code.language-*  →  pre.contents (codehl.js가 언어를 자동 판별한다)
   - div.q-sql  > code.language-sql →  pre.contents
   나머지(q-spec 보기 상자, q-tbl 표, q-tbl-title)는 css/style.css가 이미 지원한다. */
function normalizeHtml(html) {
  return String(html || "")
    .replace(/<pre class="qcode">\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/g,
      (_, code) => `<pre class="contents">${code.replace(/^\n+|\n+$/g, "")}</pre>`)
    .replace(/<div class="q-sql"[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/div>/g,
      (_, code) => `<pre class="contents">${code.replace(/^\n+|\n+$/g, "")}</pre>`);
}

/* 발문(subject)과 지문(extra)을 나눈다.
   본문은 <div class="q-text">발문</div> + 보기/코드/표 순서라, 첫 블록 요소를 경계로 자른다. */
function splitBody(html) {
  const body = normalizeHtml(html);
  const m = /<(div class="q-spec"|pre class="contents"|table|div class="tables-row"|div class="q-tbl-title")/.exec(body);
  let head = m ? body.slice(0, m.index) : body;
  let tail = m ? body.slice(m.index) : "";
  // 발문을 감싼 q-text div는 벗겨내고(닫는 태그가 뒤쪽에 남아도 정리), 남은 태그 짝은 맞춘다.
  head = head.replace(/^\s*<div class="q-text">/, "").replace(/<\/div>\s*$/, "");
  tail = tail.replace(/(<\/div>)\s*$/, "");
  const subject = head.replace(/(<br\s*\/?>|\s)+$/i, "").trim();
  return { subject, extra: tail.trim() };
}

/* ---------- 기존 문항과 대조 ---------- */

function textOf(s) {
  return String(s || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").toLowerCase();
}
function tokens(s) {
  return new Set(textOf(s).match(/[가-힣]{2,}|[a-z_]{3,}|\d+/g) || []);
}
function similarity(a, b) {
  let hit = 0;
  for (const t of a) if (b.has(t)) hit++;
  return hit / Math.max(1, Math.min(a.size, b.size));
}

function loadExisting(round) {
  const file = path.join(OUT_DIR, `exam${round}.js`);
  if (!fs.existsSync(file)) return [];
  const sandbox = { window: {} };
  new Function("window", fs.readFileSync(file, "utf8")).call(sandbox, sandbox.window);
  const data = sandbox.window.CERT_DATA[`practical-${round}`];
  return data ? data.questions : [];
}

/* 모든 회차를 훑어 다음 id를 정한다 (문항 id는 자격증 전체에서 유일해야 한다) */
function nextIdSeed() {
  let max = 0;
  for (const dir of fs.readdirSync(path.join(ROOT, "data"))) {
    const full = path.join(ROOT, "data", dir);
    if (!fs.statSync(full).isDirectory()) continue;
    for (const f of fs.readdirSync(full)) {
      const src = fs.readFileSync(path.join(full, f), "utf8");
      for (const m of src.matchAll(/"id":"(\d+)"/g)) max = Math.max(max, Number(m[1]));
    }
  }
  return max + 1;
}

/* 사이트가 문장을 통째로 고쳐 쓴 회차는 자동 대조가 어긋나므로 손으로 짝을 지어 둔다.
   { 사이트 문항번호: 기존 파일의 문항번호, null = 우리 데이터에 없던 문항 } */
const MANUAL_MAP = {
  "2024-3": {
    1: 4, 2: 5, 3: 8, 4: 13, 5: 11, 6: 9, 7: 15, 8: 10, 9: 7, 10: 20,
    11: null, 12: 12, 13: 1, 14: 2, 15: null, 16: 18, 17: 14, 18: 6, 19: 16, 20: 17,
  },
  "2025-3": {
    1: 1, 2: 2, 3: 19, 4: 3, 5: 4, 6: 11, 7: 13, 8: 18, 9: 14, 10: 16,
    11: null, 12: null, 13: 6, 14: 17, 15: 9, 16: 7, 17: 12, 18: 15, 19: 8, 20: 5,
  },
};

/* ---------- 변환 ---------- */

function convert(round, seedRef) {
  const api = JSON.parse(fs.readFileSync(path.join(API_DIR, `${round}.json`), "utf8"));
  const old = loadExisting(round).map((q) => ({ q, t: tokens(q.subject + " " + (q.extra || "")) }));
  const used = new Set();
  const carried = [];
  const fresh = [];

  const questions = api.questions
    .slice()
    .sort((a, b) => a.number - b.number)
    .map((raw) => {
      const { subject, extra } = splitBody(raw.body_html);
      const t = tokens(subject + " " + extra);

      const manual = MANUAL_MAP[round];
      let match = null;
      if (manual && raw.number in manual) {
        const n = manual[raw.number];
        match = n == null ? null : (old.find((c) => c.q.number === n) || {}).q || null;
      } else {
        let best = null, bestScore = 0;
        for (const cand of old) {
          if (used.has(cand.q.id)) continue;
          const s = similarity(t, cand.t);
          if (s > bestScore) { bestScore = s; best = cand; }
        }
        match = bestScore >= 0.45 ? best.q : null;
      }
      if (match) { used.add(match.id); carried.push(raw.number); }
      else fresh.push(raw.number);

      const q = {
        id: match ? match.id : String(seedRef.next++),
        number: raw.number,
        category: "실기",
        type: "short",
        subject,
      };
      if (extra) q.extra = extra;
      q.shortAnswer = raw.answer_text || (match && match.shortAnswer) || "";
      if (match && match.wiki) q.wiki = match.wiki;
      if (match && match.explain) q.explain = match.explain;
      return q;
    });

  const dropped = old.filter((c) => !used.has(c.q.id)).map((c) => c.q.number);
  return { questions, carried, fresh, dropped };
}

function write(round, questions) {
  const payload = { round, cert: "practical", questions };
  const js = `window.CERT_DATA=window.CERT_DATA||{};window.CERT_DATA['practical-${round}']=${JSON.stringify(payload)};\n`;
  fs.writeFileSync(path.join(OUT_DIR, `exam${round}.js`), js);
}

const rounds = process.argv.slice(2);
if (!rounds.length) {
  console.error("usage: node tools/import-practical.js <round> [<round> ...]");
  process.exit(1);
}
const seedRef = { next: nextIdSeed() };
for (const round of rounds) {
  const { questions, carried, fresh, dropped } = convert(round, seedRef);
  write(round, questions);
  console.log(
    `${round}: ${questions.length}문항 — 기존 승계 ${carried.length}, 신규 ${fresh.length} [${fresh}]` +
    (dropped.length ? `, 사이트에서 사라진 옛 문항 ${dropped.length} [${dropped}]` : "")
  );
}
