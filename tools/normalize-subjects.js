// 과목명 표기 정규화: node tools/normalize-subjects.js
// newbt 원본은 회차마다 과목명 띄어쓰기가 달라("데이터분석" vs "데이터 분석")
// 과목별 통계·약점 저격·과목별 풀기가 같은 과목을 다르게 세는 문제가 있었다.
// data/*/exam*.js의 category를 CERTS.subjects의 표준 표기로 통일한다.
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

const MAP = {
  adsp: {
    "데이터분석 기획": "데이터 분석 기획",
    "데이터분석": "데이터 분석",
    "데이터 이해": "데이터 이해",
  },
  engineer: {},
  practical: {},
};

let changed = 0;
for (const cert of Object.keys(MAP)) {
  const dir = path.join(ROOT, "data", cert);
  if (!fs.existsSync(dir)) continue;
  const map = MAP[cert];
  if (!Object.keys(map).length) continue;

  for (const file of fs.readdirSync(dir)) {
    if (!file.startsWith("exam") || !file.endsWith(".js")) continue;
    const p = path.join(dir, file);
    const src = fs.readFileSync(p, "utf8");
    const win = { CERT_DATA: {} };
    new Function("window", src)(win);
    let touched = 0;
    for (const key of Object.keys(win.CERT_DATA)) {
      for (const q of win.CERT_DATA[key].questions) {
        if (q.category && map[q.category] && map[q.category] !== q.category) {
          q.category = map[q.category];
          touched++;
        }
      }
    }
    if (!touched) continue;
    const key = Object.keys(win.CERT_DATA)[0];
    const out = `window.CERT_DATA=window.CERT_DATA||{};window.CERT_DATA['${key}']=${JSON.stringify(win.CERT_DATA[key])};`;
    fs.writeFileSync(p, out, "utf8");
    console.log(`${cert}/${file}: ${touched}문제 과목명 정규화`);
    changed += touched;
  }
}
console.log(changed ? `총 ${changed}문제 수정 — tools/build-index.js를 다시 실행하세요.` : "수정할 항목이 없습니다.");
