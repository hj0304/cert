// 배포 전 캐시 버스팅 버전 스탬프: node tools/bump.js
// index.html / exam.html 의 ?v= 값과 js/common.js 의 BUILD 상수를 현재 시각으로 갱신
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

const v = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12); // YYYYMMDDHHMM

for (const f of ["index.html", "exam.html"]) {
  const p = path.join(ROOT, f);
  const src = fs.readFileSync(p, "utf8").replace(/\?v=[A-Za-z0-9]+/g, "?v=" + v);
  fs.writeFileSync(p, src, "utf8");
}
const cj = path.join(ROOT, "js", "common.js");
fs.writeFileSync(cj, fs.readFileSync(cj, "utf8").replace(/const BUILD = "[^"]*"/, `const BUILD = "${v}"`), "utf8");
console.log("BUILD =", v);
