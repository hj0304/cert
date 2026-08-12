/* 직접 작성한 해설을 data/ 에 병합한다.
 *
 *   node tools/add-explains.js notes/batch-01.json          → 미리보기
 *   node tools/add-explains.js notes/batch-01.json --write   → 반영
 *
 * 입력 JSON 형식 — 키는 문제 id (문자열), 값은 해설 HTML
 *   { "12345": "<p>…</p>", "12346": "<p>…</p><span class=\"flag\">…</span>" }
 *
 * 해설은 explain.mine 에 들어가고, exam.js가 '✍️ 해설'로 맨 위에 보여준다.
 * 같은 id를 다시 넣으면 덮어쓴다(수정 가능).
 */

const fs = require("fs");
const path = require("path");

const DATA = path.join(__dirname, "..", "data");
const CERTS = ["engineer", "practical"]; // 정보처리기사만 (ADsP 제외)

const inFile = process.argv[2];
const WRITE = process.argv.includes("--write");
if (!inFile) {
  console.error("사용법: node tools/add-explains.js <해설 JSON> [--write]");
  process.exit(1);
}
const incoming = JSON.parse(fs.readFileSync(inFile, "utf8"));
const ids = Object.keys(incoming);
console.log(`입력 해설 ${ids.length}건`);

let applied = 0, overwritten = 0, changedFiles = 0;
const seen = new Set();

for (const cert of CERTS) {
  const dir = path.join(DATA, cert);
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const src = fs.readFileSync(full, "utf8");
    const m = src.match(/^([\s\S]*?window\.CERT_DATA\['[^']+'\]=)([\s\S]*)$/);
    if (!m) { console.log("!! 형식 불일치:", file); continue; }
    const payload = JSON.parse(m[2].replace(/;\s*$/, ""));
    let touched = false;

    for (const q of payload.questions) {
      const html = incoming[String(q.id)];
      if (html == null) continue;
      seen.add(String(q.id));
      q.explain = q.explain || {};
      if (q.explain.mine) overwritten++;
      q.explain.mine = html;
      applied++;
      touched = true;
    }
    if (touched) {
      changedFiles++;
      if (WRITE) fs.writeFileSync(full, m[1] + JSON.stringify(payload) + ";", "utf8");
    }
  }
}

const missing = ids.filter((id) => !seen.has(id));
console.log(`${WRITE ? "반영" : "미리보기"}: ${applied}건 적용 (덮어쓰기 ${overwritten}) / 파일 ${changedFiles}개`);
if (missing.length) {
  console.log(`⚠ 데이터에서 못 찾은 id ${missing.length}개:`, missing.slice(0, 20).join(", "));
}

/* 전체 진행률 */
global.window = {};
for (const cert of CERTS)
  for (const f of fs.readdirSync(path.join(DATA, cert)))
    eval(fs.readFileSync(path.join(DATA, cert, f), "utf8"));
const D = global.window.CERT_DATA;
const stat = {};
for (const k in D) {
  const d = D[k];
  stat[d.cert] = stat[d.cert] || { done: 0, total: 0 };
  for (const q of d.questions) {
    stat[d.cert].total++;
    if (q.explain && q.explain.mine) stat[d.cert].done++;
  }
}
console.log("\n=== 내 해설 진행률 ===");
let td = 0, tt = 0;
for (const c in stat) {
  const s = stat[c];
  td += s.done; tt += s.total;
  const pct = ((s.done / s.total) * 100).toFixed(1);
  console.log(`  ${c.padEnd(10)} ${String(s.done).padStart(4)} / ${s.total}  (${pct}%)`);
}
console.log(`  ${"합계".padEnd(9)} ${String(td).padStart(4)} / ${tt}  (${((td / tt) * 100).toFixed(1)}%)`);
if (!WRITE) console.log("\n반영하려면 --write 를 붙이세요.");
