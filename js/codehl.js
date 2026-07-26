/* 코드 문법 하이라이팅 — 외부 라이브러리 없음.
   실기 문제의 C/Java/Python/SQL 코드 블록을 감지해 색을 입히고 줄번호를 붙인다.
   일반 지문·표가 들어간 pre는 건드리지 않는다. */

(function () {
  const KEYWORDS = {
    c: "auto break case char const continue default do double else enum extern float for goto if int long register return short signed sizeof static struct switch typedef union unsigned void volatile while include define printf scanf main NULL",
    java: "abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while var String System out println print length",
    python: "and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield print len range str int float list dict set self",
    sql: "select from where group by having order asc desc insert into values update set delete create table alter drop add primary key foreign references not null distinct join inner left right outer on as and or in between like count sum avg max min union all grant revoke commit rollback view index char varchar number date",
  };
  const KW_SET = {};
  Object.keys(KEYWORDS).forEach((k) => { KW_SET[k] = new Set(KEYWORDS[k].split(/\s+/)); });

  const TYPES = new Set(["int", "char", "float", "double", "long", "short", "void", "boolean", "byte", "String", "var", "unsigned", "signed", "struct"]);

  /* 코드로 볼 만한 강한 시그널 */
  const SIGNALS = [
    /#include\b/, /\bprintf\s*\(/, /\bscanf\s*\(/, /\bint\s+main\s*\(/, /\bvoid\s+main\s*\(/,
    /\bpublic\s+(?:static\s+)?(?:class|void|int)\b/, /\bSystem\s*\.\s*out\s*\./, /\bclass\s+\w+\s*(?:\{|extends|:)/,
    /\bdef\s+\w+\s*\(/, /\bprint\s*\(/, /\bfor\s*\(.*;.*;.*\)/, /\bwhile\s*\(.+\)\s*\{/,
    /\bselect\b[\s\S]*\bfrom\b/i, /\bcreate\s+table\b/i, /\bmain\s*\(\s*\)\s*\{/,
  ];

  function looksLikeCode(text) {
    if (!text || text.length < 20) return false;
    if (text.split("\n").length < 2) return false;
    // 한글이 많으면 코드가 아니라 조건·지문 설명이다 (기출 코드에는 한글 주석이 거의 없음)
    const ko = (text.match(/[가-힣]/g) || []).length;
    if (ko / text.length > 0.3) return false;
    let hits = 0;
    for (const re of SIGNALS) if (re.test(text)) hits++;
    if (hits >= 1) return true;
    // 시그널이 없어도 중괄호·세미콜론 밀도가 높으면 코드로 본다
    const braces = (text.match(/[{}]/g) || []).length;
    const semis = (text.match(/;/g) || []).length;
    return braces >= 2 && semis >= 2;
  }

  function detectLang(text) {
    if (/#include\b|\bprintf\s*\(|\bscanf\s*\(/.test(text)) return "c";
    if (/\bpublic\s+class\b|\bSystem\s*\.\s*out\b|\bnew\s+\w+\s*\[|\bimport\s+java/.test(text)) return "java";
    if (/\bdef\s+\w+\s*\(|\belif\b|\bprint\s*\(.*\)\s*$|:\s*\n\s+/m.test(text) && !/[;{]/.test(text)) return "python";
    if (/\bselect\b[\s\S]*\bfrom\b|\bcreate\s+table\b|\binsert\s+into\b/i.test(text)) return "sql";
    if (/\bdef\s+\w+\s*\(/.test(text)) return "python";
    return "c"; // 기본: C 계열 (실기 다수)
  }

  function esc(s) {
    return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }

  /* 토큰 단위로 순회하며 이스케이프 + span 조립 (정규식으로 HTML을 덧칠하지 않아 안전) */
  function tokenize(code, lang) {
    const kw = KW_SET[lang] || KW_SET.c;
    const isPython = lang === "python";
    const isSql = lang === "sql";
    // 주석: C/Java = // /* */, Python = #, SQL = --
    const commentPart = isPython ? "#[^\\n]*" : isSql ? "--[^\\n]*" : "\\/\\*[\\s\\S]*?\\*\\/|\\/\\/[^\\n]*";
    const re = new RegExp(
      "(" + commentPart + ")" +                       // 1 주석
      "|(\"(?:[^\"\\\\\\n]|\\\\.)*\"|'(?:[^'\\\\\\n]|\\\\.)*')" + // 2 문자열
      "|(\\b\\d+(?:\\.\\d+)?\\b)" +                   // 3 숫자
      "|([A-Za-z_$][\\w$]*)" +                        // 4 식별자
      "|(#[A-Za-z]+)",                                // 5 전처리기(C)
      "g"
    );
    let out = "", last = 0, m;
    while ((m = re.exec(code))) {
      out += esc(code.slice(last, m.index));
      const t = m[0];
      if (m[1]) out += `<span class="tk-com">${esc(t)}</span>`;
      else if (m[2]) out += `<span class="tk-str">${esc(t)}</span>`;
      else if (m[3]) out += `<span class="tk-num">${esc(t)}</span>`;
      else if (m[5]) out += `<span class="tk-pre">${esc(t)}</span>`;
      else {
        const word = t;
        const lower = isSql ? word.toLowerCase() : word;
        const after = code.slice(m.index + word.length).match(/^\s*\(/);
        if (kw.has(lower)) {
          out += `<span class="${TYPES.has(word) ? "tk-type" : "tk-kw"}">${esc(word)}</span>`;
        } else if (after) {
          out += `<span class="tk-fn">${esc(word)}</span>`;
        } else out += esc(word);
      }
      last = m.index + t.length;
      if (re.lastIndex === m.index) re.lastIndex++; // 빈 매치 방어
    }
    out += esc(code.slice(last));
    return out;
  }

  function renderCode(text, lang) {
    const lines = text.replace(/\r\n?/g, "\n").replace(/\n+$/, "").split("\n");
    const body = lines
      .map((line, i) => `<span class="code-ln">${i + 1}</span><span class="code-src">${tokenize(line, lang) || "&nbsp;"}</span>`)
      .join("");
    return `<div class="code-grid">${body}</div>`;
  }

  const LANG_LABEL = { c: "C", java: "Java", python: "Python", sql: "SQL" };

  /* 컨테이너 안의 pre를 검사해 코드만 하이라이팅 */
  window.highlightCodeIn = function (root) {
    if (!root) return;
    root.querySelectorAll("pre").forEach((pre) => {
      if (pre.dataset.hl) return;                  // 중복 처리 방지
      if (pre.querySelector("table, img")) return; // 표·이미지가 든 pre는 원본 유지
      const text = pre.textContent;
      if (!looksLikeCode(text)) return;
      const lang = detectLang(text);
      pre.dataset.hl = lang;
      pre.classList.add("code-block");
      pre.innerHTML = `<span class="code-lang">${LANG_LABEL[lang] || lang}</span>` + renderCode(text, lang);
    });
  };
})();
