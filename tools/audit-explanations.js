// AI 해설 신뢰도 감사: node tools/audit-explanations.js [--write]
//
// newbt의 AI 해설은 "정답을 미리 보고 그 답에 맞춰" 작성된다. 그래서 복원 기출의
// 정답이 잘못되었거나 지문이 깨진 경우 AI가 틀린 답을 그럴듯하게 옹호하는 해설을 쓴다.
// 텍스트만으로 객관적으로 검출 가능한 신호를 찾아 플래그를 남긴다.
//
// --write 를 주면 각 문제에 exWarn: ["mismatch", ...] 을 기록한다.
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const WRITE = process.argv.includes("--write");
const CERTS = ["adsp", "engineer", "practical"];

const CIRCLED = { "①": 1, "②": 2, "③": 3, "④": 4, "⑤": 5 };

function toText(html) {
  return String(html || "")
    .replace(/<img[^>]*>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .trim();
}

const num = (s) => (CIRCLED[s] ? CIRCLED[s] : parseInt(s, 10));

/* 해설이 "정답"이라고 주장하는 보기 번호들 */
function claimedAnswers(text) {
  const found = new Set();
  const pats = [
    /정답\s*(?:은|는|이)?\s*[:：]?\s*([0-9①-⑤])\s*번/g,
    /답\s*(?:은|는|이)?\s*[:：]?\s*([0-9①-⑤])\s*번/g,
    /([0-9①-⑤])\s*번\s*(?:이|가)?\s*(?:정답|답)/g,
    /정답\s*[:：]\s*([0-9①-⑤])/g,
    /따라서\s*(?:정답은)?\s*([0-9①-⑤])\s*번/g,
  ];
  for (const re of pats) {
    let m;
    while ((m = re.exec(text))) {
      const n = num(m[1]);
      if (n >= 1 && n <= 9) found.add(n);
    }
  }
  return [...found];
}

/* AI가 스스로 문제·정답에 이상이 있다고 말하는 표현 */
const DOUBT = [
  "정답이 없", "정답이 존재하지", "모두 정답", "모두 옳", "모두 맞",
  "문제가 잘못", "문제에 오류", "오류가 있", "잘못된 문제", "출제 오류",
  "확인할 수 없", "알 수 없", "판단할 수 없", "명확하지 않", "불명확",
  "죄송", "제공된 정보로는", "지문이 불완전", "보기가 누락",
];

function audit(q) {
  const flags = [];
  const ex = q.explain || {};
  const ai = (ex.ai || []).map(toText).join("\n").trim();
  if (!ai) return flags;

  // 1) 정답 불일치 — 저장된 정답과 다른 번호를 정답이라고 설명 (객관식만)
  if (q.type === "choice" && Array.isArray(q.answer) && q.answer.length) {
    const claims = claimedAnswers(ai);
    if (claims.length) {
      const real = new Set(q.answer);
      const agree = claims.some((c) => real.has(c));
      if (!agree) flags.push("mismatch");
      else if (claims.length > 1 && claims.filter((c) => !real.has(c)).length) flags.push("ambiguous");
    }
    // 2) 존재하지 않는 보기 번호를 정답이라 주장
    const maxN = (q.choices || []).length;
    if (maxN && claims.some((c) => c > maxN)) flags.push("outofrange");
  }

  // 3) AI 스스로 문제·정답에 문제가 있다고 지적
  if (DOUBT.some((d) => ai.includes(d))) flags.push("doubt");

  // 4) 전국 정답률이 매우 낮은 문제.
  //    AI 해설은 저장된 정답에 맞춰 작성되므로, 그 정답이 틀렸다면 해설도 틀린 답을
  //    그럴듯하게 정당화한다. 응시자 다수가 틀린 문제는 (a)정말 어렵거나
  //    (b)복원된 정답이 틀렸을 수 있어 어느 쪽이든 교차 확인이 필요하다.
  //    (실측 최저 정답률이 31%라 무작위 수준(25%) 이하로 붕괴된 문제는 없었다)
  if (q.type === "choice" && q.rate != null && (q.rateN || 0) >= 1000 && q.rate < 40) {
    flags.push("lowrate");
  }

  // 5) 근거 없이 너무 짧음
  if (ai.length < 45) flags.push("tooshort");

  // 6) 문장이 끊긴 채 끝남
  if (ai.length >= 45 && !/[.!?…"'”’)\]}다요음임함됨줌]$/.test(ai)) flags.push("truncated");

  // 7) 한국어가 아닌 문자가 섞임.
  //    해설을 만든 AI가 문장 중간에 다른 언어로 코드 스위칭한 흔적이다
  //    ("결함을 早期에 발견", "개발过程를 개선", "복잡한 hệ thống"...).
  //    tools/fix-foreign.js 로 일괄 교정했지만, 새 회차를 수집하면 다시 생길 수 있어
  //    감사 항목으로 남겨 둔다. 라틴 확장(터키어·체코어 등)까지 포함해야 한다.
  if (/[一-鿿㐀-䶿぀-ヿЀ-ӿḀ-ỿĀ-ɏ]/.test(ai))
    flags.push("foreign");

  return [...new Set(flags)];
}

const REASON_LABEL = {
  mismatch: "정답과 다른 번호를 정답이라 설명",
  ambiguous: "정답 번호를 여러 개로 혼동",
  outofrange: "존재하지 않는 보기 번호 언급",
  doubt: "AI가 문제·정답에 이상이 있다고 지적",
  lowrate: "전국 정답률 40% 미만 — 정답·해설 교차 확인 권장",
  tooshort: "설명이 너무 짧음",
  truncated: "문장이 중간에 끊김",
  foreign: "한국어가 아닌 문자가 섞임 (AI 코드 스위칭)",
};

const tally = {};
const perCert = {};
let totalFlagged = 0, totalAI = 0;
const samples = {};

for (const cert of CERTS) {
  const dir = path.join(ROOT, "data", cert);
  perCert[cert] = { ai: 0, flagged: 0 };
  for (const file of fs.readdirSync(dir)) {
    if (!file.startsWith("exam") || !file.endsWith(".js")) continue;
    const p = path.join(dir, file);
    const win = { CERT_DATA: {} };
    new Function("window", fs.readFileSync(p, "utf8"))(win);
    const key = Object.keys(win.CERT_DATA)[0];
    let touched = false;

    for (const q of win.CERT_DATA[key].questions) {
      const hasAI = !!(q.explain && q.explain.ai && q.explain.ai.length);
      if (hasAI) { totalAI++; perCert[cert].ai++; }
      const flags = audit(q);
      if (flags.length) {
        totalFlagged++; perCert[cert].flagged++;
        flags.forEach((f) => {
          tally[f] = (tally[f] || 0) + 1;
          if (!samples[f]) samples[f] = `${cert} ${key.split("-").slice(1).join("-")} ${q.number}번`;
        });
        if (WRITE) { q.exWarn = flags; touched = true; }
      } else if (WRITE && q.exWarn) { delete q.exWarn; touched = true; }
    }

    if (WRITE && touched) {
      fs.writeFileSync(p, `window.CERT_DATA=window.CERT_DATA||{};window.CERT_DATA['${key}']=${JSON.stringify(win.CERT_DATA[key])};`, "utf8");
    }
  }
}

console.log(`AI 해설 ${totalAI}개 중 ${totalFlagged}개에 신뢰도 경고 (${((totalFlagged / totalAI) * 100).toFixed(1)}%)`);
console.log("\n사유별:");
Object.entries(tally).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
  console.log(`  ${String(v).padStart(4)}  ${k.padEnd(11)} ${REASON_LABEL[k]}  (예: ${samples[k]})`);
});
console.log("\n자격증별:", JSON.stringify(perCert));
if (WRITE) console.log("\n→ data 파일에 exWarn 기록 완료. tools/build-index.js, tools/bump.js를 다시 실행하세요.");
else console.log("\n(분석만 수행. 기록하려면 --write)");
