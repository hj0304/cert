/* 꿈라CBT 빅분기 필기 수집·변환 (2026-08-24 작성)
   1) 회차 목록: https://quiz.dreaming-ryan.com/subjects/bigdata-written/rounds 에서 /solve?exam={id} 링크 수집
   2) 문제+정답: GET https://quiz.dreaming-ryan.com/api/exams/{id}/questions  (인증 불필요, 80문항/회)
      -> bigdata-r{N}.json 으로 저장 (N=회차 번호)
   3) 이미지: body_html 의 /api/images/... 는 S3로 308 리다이렉트 — curl -L 필요.
      큰 사진(2-9, 3-25-v2)은 pillow로 900px WebP q82 재인코딩, 작은 도표 PNG는 원본 유지.
   4) node convert-bigdata.js  (같은 폴더에 npm i katex 필요)
   ※ 해설은 꿈라CBT의 유료 이용권 상품이라 수집하지 않음. 해설은 tools/add-explains.js로 직접 작성.
*/
const fs = require("fs");
const path = require("path");
const katex = require("katex");

const OUT_DIR = "C:/Users/SSAFY/Desktop/certificate/data/bigdata";
fs.mkdirSync(OUT_DIR, { recursive: true });

// 이미지 매핑: 원본 경로 → 로컬 파일 + MIME
const IMAGES = {
  "/api/images/quiz-bigdata-written/2-9.png": { file: "img-2-9.webp", mime: "image/webp" },
  "/api/images/quiz-bigdata-written/3-25-v2.png": { file: "img-3-25-v2.webp", mime: "image/webp" },
  "/api/images/quiz-bigdata-written/8c195db7211e.png": { file: "img-8c195db7211e.png", mime: "image/png" },
  "/api/images/quiz-bigdata-written/003f4eedfe36.png": { file: "img-003f4eedfe36.png", mime: "image/png" },
};
const dataUri = {};
for (const [src, { file, mime }] of Object.entries(IMAGES)) {
  dataUri[src] = `data:${mime};base64,${fs.readFileSync(file).toString("base64")}`;
}

let mathCount = 0, mathFail = 0;
function tex2mathml(tex, displayMode) {
  try {
    // 원본 HTML 안의 엔티티를 LaTeX 원문으로 복원 (\Pr[T&gt;t] 사례)
    tex = tex.replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");
    let out = katex.renderToString(tex, { output: "mathml", throwOnError: true, displayMode });
    out = out.replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, "");
    mathCount++;
    return out;
  } catch (e) {
    mathFail++;
    console.error("KATEX FAIL:", tex.slice(0, 80), "->", e.message.slice(0, 80));
    return tex; // 원문 유지
  }
}

function convertHtml(html) {
  if (!html) return "";
  let s = String(html);
  // 이미지 치환
  s = s.replace(/src="(\/api\/images\/[^"]+)"/g, (m, src) => {
    if (!dataUri[src]) { console.error("UNKNOWN IMG:", src); return m; }
    return `src="${dataUri[src]}"`;
  });
  // LaTeX 변환 — \( \) 인라인, \[ \] 디스플레이
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, (m, tex) => tex2mathml(tex, false));
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, (m, tex) => tex2mathml(tex, true));
  return s;
}

const rounds = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
let total = 0;
for (const r of rounds) {
  const d = JSON.parse(fs.readFileSync(`bigdata-r${r}.json`, "utf8"));
  const questions = d.questions
    .slice()
    .sort((a, b) => a.number - b.number)
    .map((q) => {
      if (q.type !== "객관식") throw new Error(`unexpected type ${q.type} at r${r}#${q.number}`);
      if (!(q.answer_no >= 1 && q.answer_no <= q.choices.length)) throw new Error(`bad answer r${r}#${q.number}`);
      return {
        id: q.id,
        number: q.number,
        category: q.group_name,
        type: "choice",
        subject: convertHtml(q.body_html),
        choices: q.choices.map((c) => ({ n: c.no, html: convertHtml(c.html) })),
        answer: [q.answer_no],
      };
    });
  if (questions.length !== 80) throw new Error(`r${r}: ${questions.length} != 80`);
  total += questions.length;
  const payload = { round: r, cert: "bigdata", questions };
  const out = `window.CERT_DATA=window.CERT_DATA||{};window.CERT_DATA['bigdata-${r}']=${JSON.stringify(payload)};`;
  fs.writeFileSync(path.join(OUT_DIR, `exam${r}.js`), out, "utf8");
  console.log(`exam${r}.js: ${questions.length}문제 ${(out.length / 1024).toFixed(0)}KB`);
}
console.log(`total ${total} / math ${mathCount} converted, ${mathFail} failed`);
