/* 단답형 자동 채점용 허용 답안(grade) 생성 — 정처기 실기
 *
 *   node tools/build-accept.js            → 미리보기 (형태별 집계 + 전체 목록)
 *   node tools/build-accept.js --write    → data/practical/*.js 의 각 문항에 grade 필드 기록
 *
 * 저장된 shortAnswer(사람이 읽는 정답)를 기계가 비교할 수 있는 형태로 바꾼다.
 *   { t: "one",   a: ["isms", "informationsecuritymanagementsystem"] }      단일 답 — 표기 중 하나면 정답
 *   { t: "multi", l: ["①","②"], a: [["스텁","stub"], ["드라이버","driver"]] }  빈칸별 입력칸 + 각각 비교
 *   { t: "self" }                                                           '~설명하시오' 서술형 — 자가채점 유지
 *
 * 정규화 규칙(norm)은 js/exam.js 의 normAnswer 와 반드시 같아야 한다. 이 파일이 원본.
 *   - 소문자화, 따옴표류 제거, 쉼표·가운뎃점은 공백으로 본 뒤 공백 전부 제거, 끝의 ; . 제거
 *   - 부호(-)·연산자·괄호·슬래시는 남긴다. "-8"을 "8"로 만들면 틀린 답을 맞다고 하게 된다.
 *
 * 설계 원칙: 틀린 답을 맞다고 하는 쪽(거짓 양성)이 자가채점보다 나쁘다.
 * 그래서 괄호 안을 동의어로 푸는 조건을 보수적으로 잡고, 자신 없는 문항은 MANUAL 로 손으로 적는다.
 */
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "data", "practical");
const WRITE = process.argv.includes("--write");

/* ---------- 정규화 (exam.js normAnswer 와 동일하게 유지) ---------- */
function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[“”"'‘’`]/g, "")
    .replace(/[,，、·]/g, " ")
    .replace(/\s+/g, "")
    .replace(/[;.]+$/, "");
}

function plain(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, " ").replace(/<[^>]*>/g, " ")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&#0?39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&rarr;/g, "→").replace(/&larr;/g, "←").replace(/&divide;/g, "÷").replace(/&times;/g, "×")
    .replace(/&nbsp;|&emsp;|&ensp;/g, " ")
    .replace(/\s+/g, " ").trim();
}

/* ---------- 손으로 적은 예외 (문항 id 기준) ----------
   자동 규칙으로는 거짓 양성이 나거나 구조가 특이한 문항. */
const MANUAL = {
  // "[아래 모두 답] SSO / Single Sign On / 싱글 사인 온"
  "27214": { t: "one", a: ["sso", "singlesignon", "싱글사인온", "싱글사인온(sso)", "sso(singlesignon)"] },
  // "[1] 스텁 [2] 드라이버 (테스트 스텁, 테스트 드라이버)" — 괄호가 두 칸의 별칭을 한꺼번에 담고 있음
  "56469": { t: "multi", l: ["[1]", "[2]"], a: [["스텁", "테스트스텁", "stub", "teststub"], ["드라이버", "테스트드라이버", "driver", "testdriver"]] },
  // "(A) n > 0 or n >=1 or i < 8 or i <= 7  (B) n%2 or n&1" — 'or' 로 나열된 복수 정답
  "16107": { t: "multi", l: ["(A)", "(B)"], a: [["n>0", "n>=1", "i<8", "i<=7"], ["n%2", "n&1"]] },
  // "(a) %, (b) 10 or 5 or 2  또는  (a) &, (b) 1" — 두 칸이 짝으로 묶인 대안이라 칸별 비교로는 교차 조합을 걸러낼 수 없음
  "48402": { t: "self" },
  // "① 카디널리티 : 5 ② 디그리 : 4" — 숫자만 써도 정답
  "73400": { t: "multi", l: ["① 카디널리티", "② 디그리"], a: [["5", "카디널리티:5", "카디널리티(cardinality):5"], ["4", "디그리:4", "디그리(degree):4"]] },
};

/* ---------- 빈칸 라벨 ----------
   정답이 아니라 "몇 번째 칸"을 가리키는 표시. 종류(family)별로 따로 찾고,
   가장 많이 등장하면서 순서대로 늘어나는 한 종류만 라벨로 인정한다.
   (딕셔너리 출력 "{0: (15, 5), 1: (10, 3)}" 의 "5)" 가 라벨로 오인되는 것을 막는다) */
const CIRC = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";
const KOR = "ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ";
const KPAR = "가나다라마바사아자차카타파하";
const FAMILIES = [
  { re: /[①-⑳]/g, rank: (m) => CIRC.indexOf(m) + 1 },
  { re: /[㉠-㉭]/g, rank: (m) => m.charCodeAt(0) - 0x3260 + 1 },
  { re: /\((\d{1,2})\)/g, rank: (m) => +m.slice(1, -1) },
  { re: /\[(\d{1,2})\]/g, rank: (m) => +m.slice(1, -1) },
  { re: /\(([가-하])\)/g, rank: (m) => KPAR.indexOf(m[1]) + 1 },
  { re: /\(([ㄱ-ㅎ])\)/g, rank: (m) => KOR.indexOf(m[1]) + 1 },
  { re: /\(([A-Ea-e])\)/g, rank: (m) => m[1].toLowerCase().charCodeAt(0) - 96 },
  { re: /(?:^|\s)(\d{1,2})\s*[.)](?!\d)/g, rank: (m) => +m.trim().replace(/[.)]$/, "") },
  { re: /(?:^|\s)([ㄱ-ㅎ])\s*[.)]/g, rank: (m) => KOR.indexOf(m.trim()[0]) + 1 },
  { re: /(?:^|\s)([A-Ea-e])\s*[.)](?![a-z])/g, rank: (m) => m.trim()[0].toLowerCase().charCodeAt(0) - 96 },
];

function findLabels(a) {
  let best = null;
  for (const f of FAMILIES) {
    f.re.lastIndex = 0;
    const ms = [...a.matchAll(f.re)].map((m) => ({ idx: m.index, len: m[0].length, text: m[0].trim(), rank: f.rank(m[0]) }));
    if (ms.length < 2) continue;
    const increasing = ms.every((m, i) => i === 0 || m.rank > ms[i - 1].rank);
    if (!increasing) continue;                 // "{0: (15, 5), 1: (10, 3)}" 의 "5) 3)" 같은 우연한 일치
    if (!best || ms.length > best.length) best = ms;
  }
  return best;
}

/* ---------- 괄호 동의어 ----------
   "RARP (Reverse Address Resolution Protocol)", "헤더(머릿말)" 처럼 괄호 묶음이 **하나뿐**일 때만 다룬다.
   - 괄호를 뺀 바깥 표기("RARP")는 인정
   - 괄호 **안**의 표기는 묶음이 문자열 맨 끝에 있을 때만 인정 ("제어(control) 결합도" 의 "control" 은 아님)
   - 수식·SQL의 괄호, "(순서 무관)" 같은 지시문은 아님 */
const NOT_ALIAS = /^(순서\s*무관|둘\s*중|중\s*하나|택\s*1|모두\s*정답|예\s*[:)]|예시)/;
function parenAliases(v) {
  const groups = [...v.matchAll(/\(([^()]*)\)/g)];
  if (!groups.length) return null;
  if (groups.length > 1) {                                           // "삽입 이상(…) 삭제 이상(…) 갱신 이상(…)"
    const outer = v.replace(/\([^()]*\)/g, " ").replace(/\s+/g, " ").trim();
    if (!outer || /[+\-*/=<>|&%{}\[\]:]/.test(v) || !/[가-힣A-Za-z]{2,}/.test(outer)) return null;   // 코드·딕셔너리 출력은 제외
    if (/(select|insert|update|delete|create|alter|from|where|values|count|index)/i.test(outer)) return null;
    return { outer, inner: [] };
  }
  const g = groups[0];
  const before = v.slice(0, g.index), after = v.slice(g.index + g[0].length);
  const outer = (before + " " + after).replace(/\s+/g, " ").trim();
  const inner = g[1].trim();
  if (!outer) return null;                                           // 바깥이 비면 수식
  if (/[+\-*/=<>|&%]/.test(outer)) return null;                      // 바깥에 연산자 → 수식·코드
  if (/\b(select|insert|update|delete|create|alter|from|where|values|count|index)\b/i.test(outer)) return null;
  if (NOT_ALIAS.test(inner)) return { outer, inner: [] };           // "(순서 무관)" 은 떼고 바깥만
  if (!(/^[A-Za-z][A-Za-z0-9 .\-;:,/]*$/.test(inner) || /^[가-힣A-Za-z0-9 ,·/;]+$/.test(inner))) return null;
  const terminal = !after.trim();
  const res = { outer, inner: [] };
  if (terminal) res.inner = inner.split(/\s*(?:또는|;|,|\/)\s*/).map((t) => t.replace(/\s*등$/, "")).filter(Boolean);
  // "정보(I) 프레임" → "I 프레임" 도 인정 (괄호 안이 짧은 약칭이고 뒤에 말이 이어질 때)
  if (!terminal && inner.length <= 4 && /^[A-Za-z0-9]+$/.test(inner)) res.alt = inner + after;
  return res;
}

/* 한 칸의 정답 문자열 → 허용 표기 목록 */
function aliases(v) {
  v = v.replace(/^\s*[:：]\s*/, "").trim();                          // "(1) : 6" 의 앞 콜론
  const out = new Set();
  const add = (t) => { t = norm(t); if (t) out.add(t); };
  // 맨 앞에 보기 기호 하나가 붙어 있으면 ("ㄱ. 동치분할 (…)") 기호만 써도, 기호 없이 써도 정답
  const lead = v.match(/^(?:([ㄱ-ㅎ])\s*[.)]|([㉠-㉭])|\(([ㄱ-ㅎ가-하])\))\s+(.+)$/);
  if (lead) {
    add(lead[1] || lead[2] || lead[3]);
    for (const t of aliases(lead[4])) out.add(t);
  }
  add(v);                                                            // 통째로 쓴 것은 항상 정답
  const pa = parenAliases(v);
  if (pa) { add(pa.outer); pa.inner.forEach(add); if (pa.alt) add(pa.alt); }
  const base = pa ? pa.outer : v;
  const alts = base.split(/\s*또는\s*/);                              // "A 또는 B" 는 둘 다 인정
  if (alts.length > 1) alts.forEach(add);
  // "6.5ms", "12회", "1024바이트" — 발문에 단위가 적혀 있으면 숫자만 써도 정답
  const unit = base.match(/^(-?\d+(?:\.\d+)?)\s*(ms|초|분|개|회|번|바이트|byte|bytes|bit|bits|비트|kb|mb|gb|%|점|명|행|개월|일)$/i);
  if (unit) add(unit[1]);
  return [...out];
}

function build(q) {
  if (MANUAL[String(q.id)]) return { ...MANUAL[String(q.id)], why: "manual" };
  const a = plain(q.shortAnswer);
  const subj = plain(q.subject);
  if (!a) return { t: "self", why: "정답 없음" };
  // 서술형: 발문이 '설명/서술하시오'면 사람이 문장으로 쓰는 답 → 자가채점
  if (/(설명|서술|기술)(을|에 대한 설명을)?\s*(하|작성하)시오/.test(subj) && a.length >= 15) return { t: "self", why: "서술형" };

  const marks = findLabels(a);
  if (marks) {
    const labels = [], parts = [];
    for (let i = 0; i < marks.length; i++) {
      const s = marks[i].idx + marks[i].len;
      const e = i + 1 < marks.length ? marks[i + 1].idx : a.length;
      const v = a.slice(s, e).trim();
      if (!v) continue;
      labels.push(marks[i].text);
      parts.push(aliases(v));
    }
    if (parts.length >= 2 && parts.every((p) => p.length)) return { t: "multi", l: labels, a: parts };
  }
  const al = aliases(a);
  if (al.length && al[0].length <= 200) return { t: "one", a: al };
  return { t: "self", why: "너무 김" };
}

/* ---------- 실행 ---------- */
const tally = {};
const rows = [];
let files = 0;
for (const file of fs.readdirSync(DIR).sort()) {
  const full = path.join(DIR, file);
  const src = fs.readFileSync(full, "utf8");
  const m = src.match(/^([\s\S]*?window\.CERT_DATA\['[^']+'\]=)([\s\S]*)$/);
  if (!m) { console.log("!! 형식 불일치:", file); continue; }
  const payload = JSON.parse(m[2].replace(/;\s*$/, ""));
  for (const q of payload.questions) {
    const g = build(q);
    const key = g.t === "self" ? `self (${g.why})` : g.t + (g.why === "manual" ? " (manual)" : "");
    tally[key] = (tally[key] || 0) + 1;
    rows.push([payload.round, q.number, g, plain(q.shortAnswer)]);
    if (WRITE) { const { why, ...clean } = g; q.grade = clean; }
  }
  if (WRITE) { fs.writeFileSync(full, m[1] + JSON.stringify(payload) + ";\n"); files++; }
}

console.log("=== 형태별 집계 ===");
for (const [k, v] of Object.entries(tally).sort((x, y) => y[1] - x[1])) console.log(`  ${String(v).padStart(3)}  ${k}`);
if (!WRITE) {
  console.log("\n=== 전체 목록 (회차 #번호  저장정답  →  허용표기) ===");
  for (const [r, n, g, a] of rows) {
    const show = g.t === "one" ? JSON.stringify(g.a) : g.t === "multi" ? g.l.map((l, i) => l + JSON.stringify(g.a[i])).join(" ") : `self(${g.why})`;
    console.log(`${r} #${String(n).padStart(2)}  ${a.slice(0, 48).padEnd(48)}  →  ${show}`);
  }
  console.log("\n--write 를 붙이면 반영합니다.");
} else {
  console.log(`\n반영: ${files}개 파일에 grade 기록`);
}
