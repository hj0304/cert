/* 문제 텍스트 표기 오류 일괄 교정.
 *
 *   node tools/fix-text.js          → 무엇을 바꿀지만 출력 (dry-run)
 *   node tools/fix-text.js --write  → data/ 에 실제 반영
 *
 * 고치는 것
 *   1) 전각문자   ＝ ； ＜ ＋ … → = ; &lt; +      (코드가 문법적으로 틀리게 보이던 원인)
 *   2) 백슬래시 유실  printf("%sn") → printf("%s\n"),  NUL 문자 → '\0'
 *   3) #include 헤더 유실  #include  → #include &lt;stdio.h&gt;
 *   4) 한국어 오타 4건 + 띄어쓰기·구두점
 *   5) 보이지 않는 문자(ZWSP/NBSP), <pre> 중첩
 *
 * 원본(newbt)이 코드의 꺾쇠를 이스케이프하지 않아 <stdio.h> 같은 표기가 태그로 먹혀
 * 사라졌다. 그래서 우리가 넣는 꺾쇠는 반드시 &lt; &gt; 로 써야 같은 사고가 재발하지 않는다.
 *
 * 이 파일에는 보이지 않는 문자를 리터럴로 넣지 않는다 (\uXXXX 이스케이프만 사용).
 * 리터럴로 두면 편집 도구를 거치는 동안 조용히 사라지거나 깨진다.
 */

const fs = require("fs");
const path = require("path");

const DATA = path.join(__dirname, "..", "data");
const WRITE = process.argv.includes("--write");
const CERTS = ["adsp", "engineer", "practical"];

/* ---------------- 통계 ---------------- */
const stat = {};
const samples = {};
function bump(cat, loc, before, after) {
  stat[cat] = (stat[cat] || 0) + 1;
  (samples[cat] = samples[cat] || []);
  if (samples[cat].length < 4) samples[cat].push({ loc, before, after });
}

/* ---------------- 전각 → 반각 ----------------
   꺾쇠·앰퍼샌드는 HTML 엔티티로 넣는다 (raw 로 넣으면 태그로 먹힌다) */
const FW = {
  "＝": "=", "；": ";", "：": ":", "，": ",", "．": ".",
  "＋": "+", "－": "-", "＊": "*", "／": "/",
  "（": "(", "）": ")", "｛": "{", "｝": "}", "［": "[", "］": "]",
  "％": "%", "！": "!", "＃": "#", "＄": "$", "＠": "@",
  "｜": "|", "＾": "^", "～": "~", "＿": "_", "＇": "'", "＂": '"',
  "＜": "&lt;", "＞": "&gt;", "＆": "&amp;",
};
const FW_RE = new RegExp("[" + Object.keys(FW).join("") + "]", "g");

/* 코드 안에서만 정리하는 것 — 산문의 곡선 인용부호는 정상 조판이라 건드리지 않는다 */
const CODE_QUOTES = {
  "“": '"', "”": '"', "‘": "'", "’": "'", "′": "'", "″": '"',
  "–": "-", "—": "-", "−": "-",
};
const CQ_RE = new RegExp("[" + Object.keys(CODE_QUOTES).join("") + "]", "g");

const ZERO_WIDTH = /[\u200b-\u200f\u2028\u2029\ufeff]/g;
const NBSP = /\u00a0/g;
const NUL = /\u0000/g;

/* ---------------- 헤더 추론 ---------------- */
const HEADER_SIGNS = [
  [/\b(printf|scanf|puts|putchar|getchar|sprintf|fopen|FILE|fprintf)\b/, "stdio.h"],
  [/\b(strlen|strcpy|strcmp|strcat|strncpy|strrev|memset|memcpy)\b/, "string.h"],
  [/\b(malloc|calloc|realloc|free|atoi|exit|rand|srand)\b/, "stdlib.h"],
  [/\b(isupper|islower|isalpha|isdigit|toupper|tolower)\b/, "ctype.h"],
  [/\b(sqrt|pow|fabs|floor|ceil)\b/, "math.h"],
];
function inferHeaders(code, count) {
  const found = HEADER_SIGNS.filter(([re]) => re.test(code)).map(([, h]) => h);
  // C 시험 코드는 관례상 stdio.h 를 항상 포함한다 (출력문이 없어도)
  if (!found.includes("stdio.h")) found.unshift("stdio.h");
  while (found.length < count) found.push("stdlib.h");
  return found.slice(0, count);
}

/* ---------------- pre 블록 단위 처리 ----------------
   코드(<pre>)와 산문에 서로 다른 규칙을 적용해야 하므로 조각으로 나눠 처리한다 */
function mapSegments(html, fnCode, fnProse) {
  const parts = String(html).split(/(<pre[\s\S]*?<\/pre>)/i);
  return parts.map((p) => (/^<pre/i.test(p) ? fnCode(p) : fnProse(p))).join("");
}

/* 태그와 속성은 절대 건드리지 않는다. 텍스트 노드에만 fn 을 적용한다.
   (이걸 빼먹으면 <img src="data:image/png;base64,iVBOR…"> 의 base64 가
    쉼표 규칙에 걸려 이미지가 깨진다 — 실제로 한 번 그랬다) */
function mapTextNodes(html, fn) {
  return String(html).split(/(<[^>]*>)/).map((p) => (p.startsWith("<") ? p : fn(p))).join("");
}

/* 코드처럼 생긴 텍스트인가 — 곡선 인용부호·대시를 반각으로 펴도 되는지 판단 */
function isCodeLike(s) {
  const t = String(s).replace(/<[^>]*>/g, " ");
  return /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|GRANT|int|char|float|double|void|class|public|static|return|printf|scanf|struct|typedef|import|include)\b/.test(t)
      || /[;{}]\s/.test(t) || /\w\s*=\s*\w/.test(t);
}

/* ---------------- 개별 교정 ---------------- */
function fixInvisible(s) {
  return s.replace(ZERO_WIDTH, "").replace(NBSP, " ");
}
function fixNul(s) {
  // '\0' 이 실제 NUL 문자로 저장돼 화면에서 공백처럼 보였던 것을 텍스트로 복원
  return s.replace(NUL, "\\0");
}
function fixPrintf(s) {
  // "…%s" 뒤에 붙은 n 은 유실된 \n (닫는 따옴표가 바로 뒤인 경우만 (안전))
  return s.replace(/(%[-+ #0-9.]*(?:ll|l|h)?[sdciuxXoeEgGf])n(?=")/g, "$1\\n");
}
function fixFullwidthCode(s) {
  return s.replace(FW_RE, (c) => FW[c]).replace(CQ_RE, (c) => CODE_QUOTES[c]);
}
function fixFullwidthProse(s) {
  return s.replace(FW_RE, (c) => FW[c]); // 곡선 인용부호는 유지
}
function flattenPre(s) {
  // 내부 pre 도 속성을 가질 수 있다 (<pre class='sh'>)
  return s.replace(/(<pre[^>]*>)\s*<pre[^>]*>/gi, "$1").replace(/<\/pre>\s*<\/pre>/gi, "</pre>");
}
function fixIncludes(s) {
  const blanks = [...s.matchAll(/#include[ \t]*(?=\r?\n|<|$)/g)];
  if (!blanks.length) return s;
  const headers = inferHeaders(s, blanks.length);
  let i = 0;
  return s.replace(/#include[ \t]*(?=\r?\n|<|$)/g, () => `#include &lt;${headers[i++]}&gt;`);
}

/* 한국어 표기 — 산문에만 적용 */
const TYPOS = [
  [/빅데이트/g, "빅데이터"],
  [/에측 표본/g, "예측 표본"],
  [/아용하여/g, "이용하여"],
  [/들어가 단어를/g, "들어갈 단어를"],
];
function fixKorean(s) {
  let out = s;
  for (const [re, to] of TYPOS) out = out.replace(re, to);
  // 의존명사 '것' — 앞 음절이 관형사형 어미인 경우만. '이것/그것'(한 단어)은 건드리지 않는다.
  out = out.replace(/([은는린닌난운든한된인을릴할될없있])것(은|을|이|으로|과|의|도|만)/g, "$1 것$2");
  // 의존명사 '수'  ('할수록' 처럼 붙여 쓰는 어미는 건드리지 않는다)
  out = out.replace(/ 수(있|없)/g, " 수 $1");
  out = out.replace(/([할볼줄릴들을])수 (있|없)/g, "$1 수 $2");
  // '~지 않'
  out = out.replace(/([가-힣])지않([게고은을아았다음])/g, "$1지 않$2");
  // '다음 중' / '에 대한'
  out = out.replace(/다음중/g, "다음 중").replace(/보기중/g, "보기 중").replace(/설명중/g, "설명 중");
  out = out.replace(/에대한/g, "에 대한").replace(/에대해/g, "에 대해")
           .replace(/에관한/g, "에 관한").replace(/에의한/g, "에 의한");
  // 구두점 — 순서가 중요하다. 뒤 공백을 먼저 넣고 나서 앞 공백을 지워야
  // "이름 ,성별" 처럼 앞뒤가 동시에 틀린 경우가 "이름, 성별" 로 제대로 정리된다.
  // (앞 공백 제거를 먼저 하면 쉼표 뒤가 한글이라 규칙이 안 걸려 " , " 가 남았다)
  out = out.replace(/,(?=[가-힣A-Za-z])/g, ", ");
  out = out.replace(/ +([,.])/g, "$1");
  out = out.replace(/([,.]) {2,}/g, "$1 ");
  return out;
}

/* ---------------- 필드 하나 처리 ---------------- */
function fixField(html, loc, opts = {}) {
  if (html == null) return html;
  const orig = String(html);
  let s = orig;

  const b = s; s = flattenPre(s);
  if (s !== b) bump("pre 중첩 정리", loc, "<pre …><pre>", "<pre …>");

  const bInv = s; s = fixInvisible(s);
  if (s !== bInv) bump("보이지 않는 문자 제거", loc, "(ZWSP/NBSP 포함)", "(제거됨)");

  const bNul = s; s = fixNul(s);
  if (s !== bNul) bump("NUL → '\\0' 복원", loc, "'(빈칸으로 보임)'", "'\\0'");

  const codey = isCodeLike(s);

  s = mapSegments(
    s,
    (code) => {
      let c = code;
      const b0 = c;
      c = mapTextNodes(c, (t) => (isCodeLike(code) ? fixFullwidthCode(t) : fixFullwidthProse(t)));
      if (c !== b0) bump("전각문자 → 반각 (코드)", loc, snip(b0), snip(c));
      const b1 = c; c = mapTextNodes(c, fixPrintf);
      if (c !== b1) bump("printf \\n 복원", loc, snip(b1, /%\w+n"/), snip(c, /%\w+\\n"/));
      const b2 = c; c = mapTextNodes(c, fixIncludes);
      if (c !== b2) bump("#include 헤더 복원", loc, "#include (빈칸)", (c.match(/#include &lt;[^&]*&gt;/) || [""])[0]);
      return c;
    },
    (pr) => {
      let p = pr;
      const b0 = p;
      // 코드성 보기(SQL·C 수식)는 곡선 인용부호·대시까지 반각으로 펴 준다
      p = mapTextNodes(p, (t) => (codey ? fixFullwidthCode(t) : fixFullwidthProse(t)));
      if (p !== b0) bump("전각문자 → 반각 (보기·산문)", loc, snip(b0), snip(p));
      if (!opts.skipKorean) {
        const b1 = p; p = mapTextNodes(p, fixKorean);
        if (p !== b1) bump("한국어 표기 교정", loc, snip(b1), snip(p));
      }
      // #include 는 <pre> 밖(해설 본문·지문)에도 나온다
      const b2 = p; p = mapTextNodes(p, fixIncludes);
      if (p !== b2) bump("#include 헤더 복원", loc, "#include (빈칸)", (p.match(/#include &lt;[^&]*&gt;/) || [""])[0]);
      return p;
    }
  );
  return s;
}

function snip(s, re) {
  const t = String(s).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  if (re) { const m = t.match(re); if (m) return "…" + m[0] + "…"; }
  return t.slice(0, 70);
}

/* ---------------- 파일 순회 ---------------- */
let changedFiles = 0, changedQ = 0;
for (const cert of CERTS) {
  const dir = path.join(DATA, cert);
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const src = fs.readFileSync(full, "utf8");
    // window.CERT_DATA['key']={...}  형태 — 접두부는 그대로 두고 JSON 부분만 교체
    const m = src.match(/^([\s\S]*?window\.CERT_DATA\['[^']+'\]=)([\s\S]*)$/);
    if (!m) { console.log("!! 형식 불일치:", file); continue; }
    const json = m[2].replace(/;\s*$/, "");
    let payload;
    try { payload = JSON.parse(json); } catch (e) { console.log("!! JSON 파싱 실패:", file, e.message); continue; }
    let touched = false;

    for (const q of payload.questions) {
      const base = `${payload.cert} ${payload.round}회 ${q.number}번`;
      const before = JSON.stringify(q);

      q.subject = fixField(q.subject, base + " 지문");
      if (q.extra != null) q.extra = fixField(q.extra, base + " 보조지문");
      // 정답도 띄어쓰기·구두점을 정리한다. SQL이 답인 경우가 있지만 쉼표 뒤 공백은
      // 의미가 전혀 바뀌지 않고(SELECT 학번, 이름), 숫자 뒤 쉼표는 규칙이 건드리지 않는다.
      if (q.shortAnswer != null) q.shortAnswer = fixField(q.shortAnswer, base + " 정답");
      (q.choices || []).forEach((c) => { c.html = fixField(c.html, base + ` 보기${c.n}`); });
      // 해설도 같은 띄어쓰기·구두점 규칙을 적용한다 (본문과 표기가 어긋나면 더 어색하다).
      // 다만 shortAnswer(정답)는 SQL 같은 코드가 답인 경우가 있어 손대지 않는다.
      if (q.explain) {
        for (const kind of ["ai", "user"]) {
          if (Array.isArray(q.explain[kind]))
            q.explain[kind] = q.explain[kind].map((t) => fixField(t, base + ` 해설(${kind})`));
        }
      }
      if (JSON.stringify(q) !== before) { touched = true; changedQ++; }
    }

    if (touched) {
      changedFiles++;
      if (WRITE) fs.writeFileSync(full, m[1] + JSON.stringify(payload) + ";", "utf8");
    }
  }
}

/* ---------------- 보고 ---------------- */
console.log(WRITE ? "=== 적용 완료 ===" : "=== DRY RUN (반영 안 됨) ===");
console.log(`파일 ${changedFiles}개 / 문제 ${changedQ}개 변경\n`);
const rows = Object.entries(stat).sort((a, b) => b[1] - a[1]);
for (const [k, v] of rows) console.log(String(v).padStart(5) + "  " + k);
console.log(String(rows.reduce((a, b) => a + b[1], 0)).padStart(5) + "  합계 (필드 단위)");

console.log("\n=== 유형별 샘플 ===");
for (const [k] of rows) {
  console.log(`\n## ${k}`);
  for (const s of samples[k]) {
    console.log(`  [${s.loc}]`);
    console.log(`    before: ${s.before}`);
    console.log(`    after : ${s.after}`);
  }
}
if (!WRITE) console.log("\n반영하려면: node tools/fix-text.js --write");
