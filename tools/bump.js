// 배포 전 캐시 버스팅 버전 스탬프: node tools/bump.js
// HTML의 ?v= 값과 js/common.js·sw.js의 BUILD 상수를 현재 시각으로 갱신한다.
// sw.js가 빠지면 서비스 워커 캐시 이름이 그대로여서 구버전 자산이 계속 서빙되므로 반드시 포함.
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

const v = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12); // YYYYMMDDHHMM

const HTML = ["index.html", "exam.html", "search.html"];
const BUILD_CONST = [path.join("js", "common.js"), "sw.js"];

for (const f of HTML) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) { console.warn("건너뜀 (없음):", f); continue; }
  fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace(/\?v=[A-Za-z0-9]+/g, "?v=" + v), "utf8");
}
for (const f of BUILD_CONST) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) { console.warn("건너뜀 (없음):", f); continue; }
  const src = fs.readFileSync(p, "utf8");
  if (!/const BUILD = "[^"]*"/.test(src)) { console.warn("BUILD 상수 없음:", f); continue; }
  fs.writeFileSync(p, src.replace(/const BUILD = "[^"]*"/, `const BUILD = "${v}"`), "utf8");
}

// sw.js의 SHELL 목록에 있는 파일이 실제로 존재하는지 점검 (오프라인 셸 누락 방지)
const sw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
const shellBlock = sw.match(/const SHELL = \[([\s\S]*?)\];/);
if (shellBlock) {
  const missing = shellBlock[1]
    .match(/["'`]\.\/([^"'`?]+)/g) || [];
  missing
    .map((m) => m.replace(/^["'`]\.\//, ""))
    .filter((f) => f && !fs.existsSync(path.join(ROOT, f)))
    .forEach((f) => console.warn("⚠ SHELL에 있으나 파일 없음:", f));
}

console.log("BUILD =", v);
