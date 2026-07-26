// 검색 인덱스 생성: data/*/exam*.js → data/index.js
// 실행: node tools/build-index.js
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

const CERTS = ["adsp", "engineer", "practical"];

function stripToText(html) {
  return String(html || "")
    .replace(/<img[^>]*>/gi, " ")          // base64 이미지 제거
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")              // 나머지 태그
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

const index = [];
for (const cert of CERTS) {
  const dir = path.join(ROOT, "data", cert);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir)) {
    if (!file.startsWith("exam") || !file.endsWith(".js")) continue;
    const src = fs.readFileSync(path.join(dir, file), "utf8");
    const win = { CERT_DATA: {} };
    new Function("window", src)(win);
    for (const key of Object.keys(win.CERT_DATA)) {
      const payload = win.CERT_DATA[key];
      for (const q of payload.questions) {
        const parts = [stripToText(q.subject), stripToText(q.extra)];
        if (q.choices) q.choices.forEach((c) => parts.push(stripToText(c.html)));
        if (q.shortAnswer) parts.push(stripToText(q.shortAnswer));
        const text = parts.filter(Boolean).join(" ");
        index.push({
          i: String(q.id),
          c: cert,
          r: String(payload.round),
          n: q.number,
          s: q.category || "",
          y: q.type === "short" ? "s" : "c",
          t: text.slice(0, 600),
        });
      }
    }
  }
}

index.sort((a, b) => (a.c + a.r).localeCompare(b.c + b.r) || a.n - b.n);
const out = `window.CERT_INDEX=${JSON.stringify(index)};`;
fs.writeFileSync(path.join(ROOT, "data", "index.js"), out, "utf8");
console.log(`${index.length}문제 인덱싱 · ${(out.length / 1024).toFixed(0)}KB`);
console.log("자격증별:", CERTS.map((c) => `${c} ${index.filter((x) => x.c === c).length}`).join(" / "));

/* 과목별 문제 수 — 회차 선택 화면에서 과목 칩에 표시한다 (작은 파일이라 항상 로드) */
const counts = {};
for (const item of index) {
  const byCert = (counts[item.c] = counts[item.c] || {});
  byCert[item.s] = (byCert[item.s] || 0) + 1;
}
fs.writeFileSync(path.join(ROOT, "data", "meta.js"), `window.CERT_META={subjectCounts:${JSON.stringify(counts)}};`, "utf8");
console.log("과목별 문제 수:", JSON.stringify(counts));
