/* 정보처리기사 과목별 요약집.
   기출 1,175문항(필기 799 · 실기 376)에서 반복 출제되는 것 위주로 정리했다.
   표기는 현행 출제기준(2020년 개정, 2026년까지 유효) 기준. */

window.CERT_NOTES = {
  engineer: [
    {
      subject: "소프트웨어 설계",
      intro: "요구사항 분석과 설계 이론이 중심. 응집도·결합도, UML, 디자인 패턴은 거의 매 회차 나온다.",
      sections: [
        {
          h: "요구사항 개발 프로세스",
          body: `<p><b>도출(Elicitation) → 분석(Analysis) → 명세(Specification) → 확인(Validation)</b> 순서. 순서를 묻는 문제가 자주 나온다.</p>
<table><thead><tr><th>구분</th><th>기능 요구사항</th><th>비기능 요구사항</th></tr></thead>
<tbody>
<tr><td>내용</td><td>시스템이 <b>무엇을</b> 하는가</td><td><b>어떻게</b> 동작하는가(품질)</td></tr>
<tr><td>예</td><td>회원가입, 결제, 조회</td><td>성능, 보안, 가용성, 사용성</td></tr>
</tbody></table>
<p class="tip">요구사항 확인 기법: 요구사항 검토(peer review), 프로토타이핑, 모델 검증, 인수 테스트.</p>`
        },
        {
          h: "개발 모델",
          body: `<table><thead><tr><th>모델</th><th>특징</th></tr></thead><tbody>
<tr><td>폭포수(Waterfall)</td><td>선형 순차. 앞 단계 완료 후 진행, 되돌아가기 어려움</td></tr>
<tr><td>프로토타입</td><td>견본을 먼저 만들어 요구사항 확인</td></tr>
<tr><td>나선형(Spiral)</td><td><b>계획 → 위험 분석 → 개발 → 고객 평가</b> 반복. <b>위험 분석</b>이 핵심</td></tr>
<tr><td>RAD</td><td>짧은 개발 주기(60~90일), CASE 도구 활용</td></tr>
<tr><td>애자일</td><td>변화 대응 중심, 짧은 반복(Iteration)</td></tr>
</tbody></table>
<p class="tip">나선형에서 <b>위험 분석</b>이 빠진 보기는 오답. 순서도 자주 물어본다.</p>`
        },
        {
          h: "애자일 — XP · 스크럼",
          body: `<p><b>XP 5가지 가치</b>: 용기(Courage), 단순성(Simplicity), 의사소통(Communication), 피드백(Feedback), <b>존중(Respect)</b></p>
<p><b>XP 주요 실천항목</b>: Pair Programming, Test Driven Development, Whole Team, Continuous Integration, Refactoring, Small Releases</p>
<p><b>스크럼 용어</b></p>
<ul>
<li><b>스프린트</b> — 2~4주 반복 주기</li>
<li><b>백로그(Backlog)</b> — 요구사항 목록. 제품 백로그 / 스프린트 백로그</li>
<li><b>번다운 차트</b> — 남은 작업량을 시간에 따라 표시</li>
<li><b>스크럼 마스터</b> — 팀을 관리하는 사람이 아니라 <b>장애물을 제거</b>하는 조력자</li>
<li><b>일일 스크럼</b> — 15분 내외 진행 상황 공유</li>
</ul>
<p class="tip">애자일 선언문: <b>공동체(개인과 상호작용) &gt; 프로세스와 도구 / 작동하는 SW &gt; 문서 / 고객 협력 &gt; 계약 협상 / 변화 대응 &gt; 계획</b></p>`
        },
        {
          h: "UML",
          body: `<p><b>구성 요소</b>: 사물(Things), 관계(Relationships), 다이어그램(Diagrams)</p>
<p><b>관계 6가지</b></p>
<table><thead><tr><th>관계</th><th>의미</th><th>표기</th></tr></thead><tbody>
<tr><td>연관(Association)</td><td>서로 사용 관계</td><td>실선</td></tr>
<tr><td>집합(Aggregation)</td><td>부분이 독립적으로 존재</td><td>속 빈 마름모</td></tr>
<tr><td>포함(Composition)</td><td>전체가 사라지면 부분도 사라짐</td><td>속 찬 마름모</td></tr>
<tr><td>일반화(Generalization)</td><td>상속 관계</td><td>속 빈 삼각형</td></tr>
<tr><td>의존(Dependency)</td><td>잠깐만 사용</td><td>점선 화살표</td></tr>
<tr><td>실체화(Realization)</td><td>인터페이스 구현</td><td>점선 + 빈 삼각형</td></tr>
</tbody></table>
<p><b>다이어그램 분류</b></p>
<ul>
<li><b>구조적(정적)</b> — 클래스, 객체, 컴포넌트, 배치(Deployment), 복합체 구조, 패키지</li>
<li><b>행위적(동적)</b> — 유스케이스, 시퀀스, 커뮤니케이션, 상태, 활동, 타이밍</li>
</ul>
<p class="tip">"배치(Deployment) 다이어그램이 동적인가?" → <b>아니다, 정적</b>. 자주 나오는 함정.</p>
<p><b>접근제어자 표기</b>: <code>+</code> public, <code>-</code> private, <code>#</code> protected, <code>~</code> package</p>`
        },
        {
          h: "디자인 패턴 (GoF 23)",
          body: `<table><thead><tr><th>분류</th><th>개수</th><th>패턴</th></tr></thead><tbody>
<tr><td><b>생성</b></td><td>5</td><td>Factory Method, Abstract Factory, Builder, Prototype, <b>Singleton</b></td></tr>
<tr><td><b>구조</b></td><td>7</td><td>Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy</td></tr>
<tr><td><b>행위</b></td><td>11</td><td>Chain of Responsibility, Command, Interpreter, Iterator, Mediator, Memento, <b>Observer</b>, State, <b>Strategy</b>, Template Method, Visitor</td></tr>
</tbody></table>
<p><b>자주 나오는 것</b></p>
<ul>
<li><b>Singleton</b> — 인스턴스를 하나만. 전역 접근점 제공</li>
<li><b>Observer</b> — 상태가 변하면 의존 객체들에게 <b>자동 통보</b></li>
<li><b>Strategy</b> — 알고리즘군을 캡슐화해 교체 가능하게</li>
<li><b>Factory Method</b> — 객체 생성을 서브클래스에 위임</li>
<li><b>Adapter</b> — 인터페이스가 다른 클래스를 함께 쓰게 변환</li>
<li><b>Facade</b> — 복잡한 서브시스템에 단순한 창구 제공</li>
<li><b>Proxy</b> — 대리 객체로 접근 제어</li>
<li><b>Bridge</b> — 기능과 구현을 분리해 독립적으로 확장</li>
</ul>
<p class="tip">암기: 생성 5개만 외우면 나머지 구분이 쉬워진다 — <b>추·빌·팩·프·싱</b>.</p>`
        },
        {
          h: "아키텍처 패턴",
          body: `<ul>
<li><b>계층화(Layered)</b> — 상위 계층이 하위 계층 사용. OSI 참조 모델</li>
<li><b>클라이언트-서버</b> — 서비스 제공자와 요청자 분리</li>
<li><b>파이프-필터</b> — 데이터 스트림을 단계별 처리. UNIX 셸 파이프</li>
<li><b>MVC</b> — Model(데이터) / View(표현) / Controller(제어). 상호 의존성이 낮아 유지보수 유리</li>
<li><b>브로커</b> — 분산 환경에서 컴포넌트 간 통신 중재</li>
<li><b>마스터-슬레이브</b> — 마스터가 작업 분배, 슬레이브가 처리</li>
<li><b>피어투피어</b> — 각 노드가 클라이언트이자 서버</li>
</ul>`
        },
        {
          h: "★ 응집도와 결합도",
          body: `<p><b>좋은 설계 = 응집도는 높게(strong), 결합도는 낮게(loose)</b></p>
<p><b>응집도 — 높은 순서</b> (기능 &gt; 순차 &gt; 교환 &gt; 절차 &gt; 시간 &gt; 논리 &gt; 우연)</p>
<table><thead><tr><th>응집도</th><th>설명</th></tr></thead><tbody>
<tr><td>기능적(Functional)</td><td>모든 요소가 단일 기능 수행 — <b>가장 좋음</b></td></tr>
<tr><td>순차적(Sequential)</td><td>한 요소의 출력이 다음 요소의 입력</td></tr>
<tr><td>교환(통신)적(Communication)</td><td>같은 입력·출력 자료를 사용</td></tr>
<tr><td>절차적(Procedural)</td><td>여러 기능을 순차적으로 수행</td></tr>
<tr><td>시간적(Temporal)</td><td>같은 시간대에 실행 (초기화 모듈 등)</td></tr>
<tr><td>논리적(Logical)</td><td>유사한 성격의 처리를 모아둠</td></tr>
<tr><td>우연적(Coincidental)</td><td>관련 없는 요소들 — <b>가장 나쁨</b></td></tr>
</tbody></table>
<p class="tip">암기: <b>우논시절통순기</b> (나쁜 것 → 좋은 것)</p>
<p><b>결합도 — 낮은 순서</b> (자료 &lt; 스탬프 &lt; 제어 &lt; 외부 &lt; 공통 &lt; 내용)</p>
<table><thead><tr><th>결합도</th><th>설명</th></tr></thead><tbody>
<tr><td>자료(Data)</td><td>파라미터로 값만 전달 — <b>가장 좋음</b></td></tr>
<tr><td>스탬프(Stamp)</td><td>배열·구조체 등 자료구조를 전달</td></tr>
<tr><td>제어(Control)</td><td><b>제어 신호</b>를 전달해 흐름을 좌우. 권리 전도 현상 발생</td></tr>
<tr><td>외부(External)</td><td>외부 데이터 형식·통신 프로토콜을 공유</td></tr>
<tr><td>공통(Common)</td><td><b>전역 변수</b>를 함께 사용</td></tr>
<tr><td>내용(Content)</td><td>다른 모듈 내부를 <b>직접 참조·수정</b> — <b>가장 나쁨</b></td></tr>
</tbody></table>
<p class="tip">암기: <b>자스제외공내</b> (좋은 것 → 나쁜 것)</p>`
        },
        {
          h: "인터페이스 · 미들웨어",
          body: `<p><b>EAI 구축 유형</b></p>
<ul>
<li><b>Point-to-Point</b> — 1:1 직접 연결. 변경·재사용 어려움</li>
<li><b>Hub &amp; Spoke</b> — 중앙 허브 경유. 허브 장애 시 전체 영향</li>
<li><b>Message Bus(ESB)</b> — 미들웨어를 두고 처리. 확장성 좋음</li>
<li><b>Hybrid</b> — 그룹 내부는 Hub&amp;Spoke, 그룹 간은 Message Bus</li>
</ul>
<p><b>미들웨어 종류</b>: DB 접속(ODBC), RPC, MOM(비동기 메시지), TP monitor(트랜잭션), ORB(객체 요청 브로커), WAS</p>
<p class="tip">인터페이스 데이터 표준: <b>JSON</b>(경량, 속성-값 쌍), <b>XML</b>(태그 기반), <b>YAML</b>. AJAX는 비동기 통신 방식.</p>`
        }
      ]
    },

    {
      subject: "소프트웨어 개발",
      intro: "자료구조·정렬·테스트가 축. 트리 순회와 정렬 과정 추적은 실기에도 그대로 나온다.",
      sections: [
        {
          h: "자료구조 분류",
          body: `<ul>
<li><b>선형</b> — 배열, 연결 리스트, 스택, 큐, 데크</li>
<li><b>비선형</b> — 트리, 그래프</li>
</ul>
<table><thead><tr><th>구조</th><th>방식</th><th>활용</th></tr></thead><tbody>
<tr><td>스택(Stack)</td><td>LIFO (후입선출)</td><td>재귀 호출, 수식 계산, 인터럽트 처리, 되돌리기</td></tr>
<tr><td>큐(Queue)</td><td>FIFO (선입선출)</td><td>작업 스케줄링, 버퍼</td></tr>
<tr><td>데크(Deque)</td><td>양쪽에서 삽입·삭제</td><td>스크롤, 히스토리</td></tr>
</tbody></table>
<p class="tip">스택 오버플로: 꽉 찬 스택에 push. 언더플로: 빈 스택에서 pop.</p>`
        },
        {
          h: "★ 트리 순회와 수식 표기",
          body: `<p><b>순회 방식</b> — 루트(Root)를 언제 방문하는가로 구분</p>
<ul>
<li><b>전위(Preorder)</b> — <b>Root</b> → Left → Right</li>
<li><b>중위(Inorder)</b> — Left → <b>Root</b> → Right</li>
<li><b>후위(Postorder)</b> — Left → Right → <b>Root</b></li>
</ul>
<p><b>수식 표기 변환</b></p>
<p>중위 <code>A + B * C</code> 를 후위로 → 연산자 우선순위대로 괄호를 친 뒤 연산자를 괄호 밖으로 옮긴다.</p>
<pre>A + B * C
= A + (B * C)          우선순위대로 묶고
= A + (B C *)          곱셈을 후위로
= (A (B C *) +)        덧셈을 후위로
→ A B C * +</pre>
<p><b>후위 → 중위</b>는 스택으로 푼다. 피연산자는 쌓고, 연산자를 만나면 위에서 두 개를 꺼내 계산.</p>
<pre>3 4 * 5 6 * +
→ (3*4) = 12,  (5*6) = 30,  12+30 = 42</pre>
<p><b>트리 용어</b>: 차수(Degree, 자식 수), 단말 노드(Leaf, 차수 0), 깊이(Depth), 레벨(Level)</p>`
        },
        {
          h: "★ 정렬 알고리즘",
          body: `<table><thead><tr><th>정렬</th><th>평균</th><th>최악</th><th>특징</th></tr></thead><tbody>
<tr><td>선택(Selection)</td><td>O(n²)</td><td>O(n²)</td><td>최솟값을 찾아 앞과 교환</td></tr>
<tr><td>버블(Bubble)</td><td>O(n²)</td><td>O(n²)</td><td>인접한 둘을 비교·교환</td></tr>
<tr><td>삽입(Insertion)</td><td>O(n²)</td><td>O(n²)</td><td>앞의 정렬된 부분에 끼워 넣음</td></tr>
<tr><td><b>퀵(Quick)</b></td><td>O(n log n)</td><td><b>O(n²)</b></td><td>피벗 기준 분할. 평균 가장 빠름</td></tr>
<tr><td>합병(Merge)</td><td>O(n log n)</td><td>O(n log n)</td><td>분할 후 병합. 안정 정렬</td></tr>
<tr><td>힙(Heap)</td><td>O(n log n)</td><td>O(n log n)</td><td>힙 자료구조 이용</td></tr>
</tbody></table>
<p class="tip"><b>퀵 정렬의 최악은 O(n²)</b> — 가장 자주 나오는 함정. 이미 정렬된 배열에서 피벗을 끝값으로 잡을 때 발생.</p>
<p><b>1회전 결과 추적</b>이 단골. 예로 <code>8, 5, 6, 2, 4</code> 를 삽입 정렬하면</p>
<pre>1회전: 5를 앞에 삽입 →  5, 8, 6, 2, 4
2회전: 6을 삽입       →  5, 6, 8, 2, 4
3회전: 2를 맨 앞으로   →  2, 5, 6, 8, 4</pre>
<p>선택 정렬 1회전은 <b>최솟값을 맨 앞과 교환</b>하므로 <code>2, 5, 6, 8, 4</code> 가 된다. 어떤 정렬인지부터 확인할 것.</p>`
        },
        {
          h: "검색과 해싱",
          body: `<p><b>이진 검색</b> — 정렬된 데이터에만 사용. O(log n). 중간값과 비교해 절반씩 줄인다.</p>
<p><b>해싱 함수</b>: 제산법(나머지), 제곱법, 폴딩법, 기수 변환법, 대수적 코딩법, 계수 분석법, 무작위법</p>
<p><b>충돌 해결</b></p>
<ul>
<li><b>개방 주소법(Open Addressing)</b> — 선형 조사, 이차 조사, 이중 해싱</li>
<li><b>체이닝(Chaining)</b> — 연결 리스트로 연결</li>
</ul>
<p class="tip">동의어(Synonym): 같은 해시값을 갖는 서로 다른 키. 버킷이 다 차면 오버플로 발생.</p>`
        },
        {
          h: "★ 테스트 기법",
          body: `<p><b>화이트박스</b> — 내부 구조·로직을 보고 설계</p>
<ul>
<li>기초 경로 검사(Basis Path), 조건 검사, 루프 검사, 데이터 흐름 검사</li>
</ul>
<p><b>블랙박스</b> — 입력과 출력만 보고 설계</p>
<ul>
<li><b>동치 분할(Equivalence Partitioning)</b> — 입력을 그룹으로 나눠 대표값 테스트</li>
<li><b>경계값 분석(Boundary Value)</b> — 경계 바로 위·아래를 테스트</li>
<li>원인-효과 그래프, 오류 예측, 비교 검사, 결정 테이블</li>
</ul>
<p><b>테스트 커버리지 — 강도 순서</b></p>
<p>구문(문장) &lt; 결정(분기) &lt; 조건 &lt; 조건/결정 &lt; <b>변형 조건/결정(MC/DC)</b> &lt; 다중 조건</p>
<p><b>테스트 레벨</b>: 단위 → 통합 → 시스템 → 인수</p>
<table><thead><tr><th>통합 방식</th><th>보조 모듈</th></tr></thead><tbody>
<tr><td><b>하향식(Top-down)</b></td><td><b>스텁(Stub)</b> — 하위 모듈 대신</td></tr>
<tr><td><b>상향식(Bottom-up)</b></td><td><b>드라이버(Driver)</b> — 상위 모듈 대신</td></tr>
</tbody></table>
<p class="tip">헷갈리면: <b>하향식이니까 아래(하위)가 없어서 스텁</b>. 상향식은 위가 없어서 드라이버.</p>
<p><b>V 모델</b>: 단위↔상세설계, 통합↔아키텍처설계, 시스템↔요구분석, 인수↔요구사항</p>`
        },
        {
          h: "품질과 형상관리",
          body: `<p><b>ISO/IEC 9126 품질 특성 6가지</b>: 기능성, 신뢰성, 사용성, 효율성, 유지보수성, 이식성</p>
<p><b>형상관리(SCM) 절차</b>: 형상 식별 → 형상 통제(변경 관리) → 형상 감사 → 형상 기록(상태 보고)</p>
<table><thead><tr><th>도구</th><th>방식</th></tr></thead><tbody>
<tr><td>CVS / SVN</td><td>중앙 집중형. 서버에 저장소 하나</td></tr>
<tr><td>Git</td><td>분산형. 각 개발자가 전체 이력 보유</td></tr>
</tbody></table>
<p><b>주요 명령</b>: <code>check-out</code>(가져오기) / <code>check-in</code>(저장) / <code>commit</code>(확정) / <code>merge</code>(병합)</p>
<p class="tip">형상관리 대상: 소스코드뿐 아니라 <b>문서·설계서·라이브러리</b>도 포함. "코드만 대상"이라는 보기는 오답.</p>`
        },
        {
          h: "제품 소프트웨어 패키징",
          body: `<p><b>DRM(디지털 저작권 관리) 구성 요소</b>: 콘텐츠 제공자, 패키저, 클리어링 하우스, 콘텐츠 소비자, DRM 컨트롤러, 보안 컨테이너</p>
<p><b>기술 요소</b>: 암호화, 키 관리, 식별 기술(DOI, URI), 저작권 표현(XrML), 정책 관리, 크랙 방지, 인증</p>
<p><b>매뉴얼</b>: 설치 매뉴얼(설치 과정), 사용자 매뉴얼(사용법)</p>`
        }
      ]
    },

    {
      subject: "데이터베이스 구축",
      intro: "정규화·키·SQL·트랜잭션이 반복 출제. SQL은 실기 필답형에도 그대로 나온다.",
      sections: [
        {
          h: "설계 단계",
          body: `<p><b>요구조건 분석 → 개념적 설계 → 논리적 설계 → 물리적 설계 → 구현</b></p>
<table><thead><tr><th>단계</th><th>산출물</th></tr></thead><tbody>
<tr><td>개념적 설계</td><td><b>E-R 다이어그램</b>, 개념 스키마</td></tr>
<tr><td>논리적 설계</td><td>테이블 설계, <b>정규화</b>, 논리 스키마</td></tr>
<tr><td>물리적 설계</td><td>인덱스·접근 경로 설계, <b>반정규화</b></td></tr>
</tbody></table>
<p><b>3단계 스키마</b>: 외부(사용자 관점) / 개념(전체 조직 관점) / 내부(물리적 저장 관점)</p>`
        },
        {
          h: "★ 키(Key)",
          body: `<ul>
<li><b>슈퍼키</b> — 유일성 O, 최소성 X</li>
<li><b>후보키</b> — 유일성 O, <b>최소성 O</b></li>
<li><b>기본키(PK)</b> — 후보키 중 선택. <b>NULL 불가, 중복 불가</b></li>
<li><b>대체키</b> — 후보키 중 기본키가 아닌 것</li>
<li><b>외래키(FK)</b> — 다른 릴레이션의 기본키를 참조</li>
</ul>
<p><b>무결성 제약</b></p>
<table><thead><tr><th>종류</th><th>내용</th></tr></thead><tbody>
<tr><td><b>개체 무결성</b></td><td>기본키는 NULL이거나 중복될 수 없다</td></tr>
<tr><td><b>참조 무결성</b></td><td>외래키는 참조 릴레이션의 기본키이거나 NULL</td></tr>
<tr><td><b>도메인 무결성</b></td><td>속성값은 정의된 도메인에 속해야 한다</td></tr>
</tbody></table>`
        },
        {
          h: "★ 정규화",
          body: `<p><b>이상 현상(Anomaly)</b>: 삽입 이상, 삭제 이상, 갱신 이상 — 정규화로 제거</p>
<table><thead><tr><th>단계</th><th>조건</th></tr></thead><tbody>
<tr><td><b>1NF</b></td><td>모든 속성이 <b>원자값</b> (도메인이 원자값)</td></tr>
<tr><td><b>2NF</b></td><td>1NF + <b>부분 함수 종속 제거</b> (완전 함수 종속)</td></tr>
<tr><td><b>3NF</b></td><td>2NF + <b>이행적 함수 종속 제거</b></td></tr>
<tr><td><b>BCNF</b></td><td>3NF + 모든 결정자가 후보키</td></tr>
<tr><td><b>4NF</b></td><td>다치(다중값) 종속 제거</td></tr>
<tr><td><b>5NF</b></td><td>조인 종속 제거</td></tr>
</tbody></table>
<p class="tip">암기: <b>원부이결다조</b> — <u>원</u>자값 → <u>부</u>분함수종속 제거 → <u>이</u>행함수종속 제거 → <u>결</u>정자 → <u>다</u>치종속 → <u>조</u>인종속</p>
<p><b>반정규화</b>: 성능을 위해 일부러 중복 허용 — 테이블 병합·분할, 중복 컬럼 추가, 이력 테이블 추가</p>`
        },
        {
          h: "★ SQL",
          body: `<table><thead><tr><th>분류</th><th>명령</th></tr></thead><tbody>
<tr><td><b>DDL</b></td><td>CREATE, ALTER, DROP, TRUNCATE</td></tr>
<tr><td><b>DML</b></td><td>SELECT, INSERT, UPDATE, DELETE</td></tr>
<tr><td><b>DCL</b></td><td>GRANT, REVOKE, COMMIT, ROLLBACK</td></tr>
</tbody></table>
<p><b>기본 형식</b></p>
<pre>SELECT   컬럼        -- DISTINCT 로 중복 제거
FROM     테이블
WHERE    조건        -- 행 단위 조건
GROUP BY 컬럼
HAVING   조건        -- 그룹 단위 조건
ORDER BY 컬럼 ASC|DESC;</pre>
<p><b>자주 틀리는 것</b></p>
<ul>
<li><code>DELETE FROM 테이블;</code> — 행만 삭제, 테이블 구조는 남음. <code>DROP</code> 은 테이블 자체 삭제</li>
<li><code>WHERE</code> 는 그룹 함수를 쓸 수 없다 → <code>HAVING</code> 사용</li>
<li><code>NULL</code> 비교는 <code>= NULL</code> 이 아니라 <b><code>IS NULL</code></b></li>
<li><code>COUNT(*)</code> 는 NULL 포함, <code>COUNT(컬럼)</code> 은 NULL 제외</li>
<li><code>LIKE</code> 와일드카드: <code>%</code>(0자 이상), <code>_</code>(1자)</li>
</ul>
<p><b>JOIN</b></p>
<ul>
<li><b>INNER JOIN</b> — 양쪽에 다 있는 행</li>
<li><b>LEFT/RIGHT OUTER JOIN</b> — 한쪽 기준으로 없으면 NULL</li>
<li><b>CROSS JOIN</b> — 카티션 곱</li>
<li><b>SELF JOIN</b> — 자기 자신과 조인</li>
</ul>
<p><b>권한</b>: <code>GRANT 권한 ON 테이블 TO 사용자 [WITH GRANT OPTION];</code> / <code>REVOKE ... FROM ...;</code></p>`
        },
        {
          h: "관계 대수",
          body: `<table><thead><tr><th>연산</th><th>기호</th><th>의미</th></tr></thead><tbody>
<tr><td>Select</td><td>σ (시그마)</td><td>조건에 맞는 <b>행</b> 추출</td></tr>
<tr><td>Project</td><td>π (파이)</td><td>지정한 <b>열</b> 추출</td></tr>
<tr><td>Join</td><td>⋈</td><td>두 릴레이션 결합</td></tr>
<tr><td>Division</td><td>÷</td><td>나누기</td></tr>
</tbody></table>
<p class="tip">σ는 <b>행(수평)</b>, π는 <b>열(수직)</b>. 관계 대수는 <b>절차적</b>, 관계 해석은 <b>비절차적</b>.</p>`
        },
        {
          h: "★ 트랜잭션",
          body: `<p><b>ACID</b></p>
<table><thead><tr><th>특성</th><th>의미</th></tr></thead><tbody>
<tr><td><b>원자성(Atomicity)</b></td><td>전부 반영되거나 전혀 반영되지 않음</td></tr>
<tr><td><b>일관성(Consistency)</b></td><td>실행 전후로 일관된 상태 유지</td></tr>
<tr><td><b>격리성(Isolation)</b></td><td>실행 중 다른 트랜잭션이 끼어들 수 없음</td></tr>
<tr><td><b>영속성(Durability)</b></td><td>완료된 결과는 영구히 반영</td></tr>
</tbody></table>
<p><b>상태</b>: 활동 → 부분 완료 → 완료 / 실패 → 철회</p>
<p><b>로킹(Locking)</b></p>
<ul>
<li>로킹 단위가 <b>커지면</b> — 락 수 감소, 병행성 <b>저하</b>, 오버헤드 감소</li>
<li>로킹 단위가 <b>작아지면</b> — 병행성 <b>향상</b>, 오버헤드 증가</li>
<li><b>2단계 로킹(2PL)</b> — 확장 단계와 축소 단계 분리. 직렬성 보장하지만 <b>교착상태 가능</b></li>
</ul>
<p><b>회복 기법</b>: 로그 기반(즉시 갱신·지연 갱신), 검사점(Checkpoint), 그림자 페이징</p>`
        },
        {
          h: "분산 데이터베이스 · 뷰 · 인덱스",
          body: `<p><b>분산 데이터베이스 목표 4가지 (투명성)</b></p>
<ul>
<li><b>위치 투명성</b> — 데이터가 어디 있는지 몰라도 됨</li>
<li><b>중복(복제) 투명성</b> — 여러 곳에 복제돼 있어도 하나처럼</li>
<li><b>병행 투명성</b> — 여러 트랜잭션이 동시 수행돼도 결과 일관</li>
<li><b>장애 투명성</b> — 일부 장애가 나도 정확히 처리</li>
</ul>
<p><b>뷰(View)</b>: 가상 테이블. 논리적 독립성 제공, 보안에 유리. <b>인덱스를 가질 수 없고</b>, 정의 변경 불가(삭제 후 재생성). 기본 테이블이 삭제되면 뷰도 자동 삭제.</p>
<p><b>인덱스</b>: 검색 속도 향상. 너무 많으면 삽입·삭제 성능 저하.</p>`
        }
      ]
    },

    {
      subject: "프로그래밍 언어 활용",
      intro: "C·Java·Python 출력값 추적과 운영체제·네트워크가 반반. 코드 문제는 손으로 따라가며 표를 그리는 게 가장 빠르다.",
      sections: [
        {
          h: "C — 포인터와 배열",
          body: `<pre>int a[5] = {1,2,3,4,5};
int *p = a;          // p 는 a[0] 의 주소

*p        →  1       // p가 가리키는 값
*(p+2)    →  3       // a[2]
p[2]      →  3       // 같은 표현
*p + 2    →  3       // 값(1)에 2를 더함 — 괄호 위치 주의!
&amp;a[0]     →  a        // 배열 이름 = 첫 원소의 주소</pre>
<p class="tip"><code>*(p+2)</code> 와 <code>*p+2</code> 는 완전히 다르다. 이걸 노린 문제가 매 회차 나온다.</p>
<p><b>문자열</b></p>
<pre>char *p = "KOREA";
printf("%s", p);      → KOREA
printf("%s", p+3);    → EA        // 4번째 문자부터
printf("%c", *p);     → K
printf("%c", *(p+3)); → E
printf("%c", *p+2);   → M         // 'K'(75) + 2 = 77 = 'M'</pre>`
        },
        {
          h: "C — 연산자와 제어문",
          body: `<p><b>우선순위</b>: <code>()</code> &gt; <code>단항(!, ++, --, *, &amp;)</code> &gt; <code>산술(* / %)</code> &gt; <code>산술(+ -)</code> &gt; <code>시프트</code> &gt; <code>관계</code> &gt; <code>비트</code> &gt; <code>논리(&amp;&amp; ||)</code> &gt; <code>삼항</code> &gt; <code>대입</code></p>
<pre>i++   // 후위: 값을 쓰고 나서 증가
++i   // 전위: 증가시키고 나서 값을 씀

int i = 7, j = 9;
k = (i &gt; j) ? i - j : i + j;   // 7&gt;9 거짓 → 16</pre>
<p><b>switch 의 fall-through</b> — <code>break</code> 가 없으면 아래로 계속 흐른다. 자주 나오는 함정.</p>
<pre>int c = 1;
switch(3) {
  case 1: c += 3;
  case 2: c++;
  case 3: c = 0;     // 여기부터 시작
  case 4: c += 3;    // c = 3
  case 5: c -= 10;   // c = -7
  default: c--;      // c = -8
}                    // 결과: -8</pre>`
        },
        {
          h: "Java 핵심",
          body: `<table><thead><tr><th>구분</th><th>오버로딩(Overloading)</th><th>오버라이딩(Overriding)</th></tr></thead><tbody>
<tr><td>위치</td><td>같은 클래스 내</td><td>상속 관계</td></tr>
<tr><td>조건</td><td>이름 같고 <b>매개변수 다름</b></td><td>이름·매개변수·반환형 <b>모두 같음</b></td></tr>
</tbody></table>
<p><b>접근 제어자 — 넓은 순서</b>: <code>public</code> &gt; <code>protected</code> &gt; <code>default</code>(package) &gt; <code>private</code></p>
<ul>
<li><code>protected</code> — 같은 패키지 + <b>다른 패키지의 자식 클래스</b></li>
<li><code>default</code> — 같은 패키지만</li>
</ul>
<p><b>주요 키워드</b></p>
<ul>
<li><code>static</code> — 객체 생성 없이 사용, 모든 인스턴스가 공유</li>
<li><code>final</code> — 클래스(상속 불가) / 메소드(오버라이딩 불가) / 변수(상수)</li>
<li><code>super</code> — 부모 참조, <code>this</code> — 자기 자신</li>
<li><code>abstract</code> — 추상 클래스·메소드</li>
</ul>
<p class="tip">배열 기본값: <code>int[]</code> 은 0, <code>String[]</code> 등 참조형은 <code>null</code>, <code>boolean[]</code> 은 <code>false</code>.</p>`
        },
        {
          h: "Python 핵심",
          body: `<table><thead><tr><th>자료형</th><th>표기</th><th>특징</th></tr></thead><tbody>
<tr><td>리스트</td><td><code>[1,2,3]</code></td><td>순서 O, 변경 O</td></tr>
<tr><td>튜플</td><td><code>(1,2,3)</code></td><td>순서 O, <b>변경 X</b></td></tr>
<tr><td>딕셔너리</td><td><code>{'a':1}</code></td><td>키-값 쌍</td></tr>
<tr><td>세트</td><td><code>{1,2,3}</code></td><td>중복 X, 순서 X</td></tr>
</tbody></table>
<p><b>슬라이싱</b> — <code>a[시작:끝:간격]</code>, 끝 인덱스는 <b>포함하지 않는다</b></p>
<pre>a = [0,1,2,3,4,5]
a[1:4]    → [1,2,3]
a[:3]     → [0,1,2]
a[::2]    → [0,2,4]
a[::-1]   → [5,4,3,2,1,0]   # 뒤집기</pre>
<p class="tip">Python은 들여쓰기가 문법이다. <code>range(1,5)</code> 는 1,2,3,4 (5 제외).</p>`
        },
        {
          h: "★ 운영체제 — 스케줄링",
          body: `<table><thead><tr><th>기법</th><th>선점</th><th>기준</th></tr></thead><tbody>
<tr><td>FCFS</td><td>비선점</td><td>도착 순서</td></tr>
<tr><td>SJF</td><td>비선점</td><td>실행 시간이 짧은 것 먼저</td></tr>
<tr><td>SRT</td><td><b>선점</b></td><td>남은 시간이 짧은 것 먼저</td></tr>
<tr><td>HRN</td><td>비선점</td><td>우선순위 계산식</td></tr>
<tr><td>라운드 로빈(RR)</td><td><b>선점</b></td><td>타임 슬라이스 순환</td></tr>
</tbody></table>
<p><b>HRN 우선순위 계산식</b> — 값이 <b>클수록</b> 우선순위 높음</p>
<pre>우선순위 = (대기시간 + 서비스시간) / 서비스시간</pre>
<p><b>교착상태(Deadlock) 4대 조건</b> — 하나라도 깨면 예방된다</p>
<ol><li><b>상호 배제</b>(Mutual Exclusion)</li><li><b>점유와 대기</b>(Hold and Wait)</li><li><b>비선점</b>(Non-preemption)</li><li><b>환형 대기</b>(Circular Wait)</li></ol>
<p class="tip">해결 방법: 예방(Prevention) / 회피(Avoidance, <b>은행원 알고리즘</b>) / 발견(Detection) / 회복(Recovery)</p>`
        },
        {
          h: "★ 메모리 관리",
          body: `<p><b>배치 전략</b></p>
<ul>
<li><b>최초 적합(First Fit)</b> — 처음 만나는 충분한 공간</li>
<li><b>최적 적합(Best Fit)</b> — 남는 공간이 가장 적은 곳</li>
<li><b>최악 적합(Worst Fit)</b> — 남는 공간이 가장 큰 곳</li>
</ul>
<p><b>페이지 교체 알고리즘</b>: FIFO, <b>LRU</b>(가장 오래 사용 안 된 것), LFU(사용 빈도 최소), OPT(최적, 이론값), NUR</p>
<p><b>핵심 용어</b></p>
<ul>
<li><b>스래싱(Thrashing)</b> — 페이지 교체가 지나치게 잦아 처리 시간보다 교체 시간이 더 커지는 현상</li>
<li><b>워킹 셋(Working Set)</b> — 일정 시간 동안 자주 참조하는 페이지 집합. 스래싱 방지에 사용</li>
<li><b>구역성(Locality)</b> — 시간 구역성(최근 참조한 것 재참조: 반복문, 스택) / 공간 구역성(인접한 것 참조: 배열 순회)</li>
<li><b>페이지 부재(Page Fault)</b> — 참조할 페이지가 주기억장치에 없는 상태</li>
</ul>
<p class="tip">페이징은 <b>고정 크기</b>로 나눠 내부 단편화 발생, 세그먼테이션은 <b>논리 단위</b>로 나눠 외부 단편화 발생.</p>`
        },
        {
          h: "★ 네트워크 — OSI 7계층",
          body: `<table><thead><tr><th>계층</th><th>이름</th><th>장비 / 프로토콜</th></tr></thead><tbody>
<tr><td>7</td><td>응용(Application)</td><td>HTTP, FTP, SMTP, DNS</td></tr>
<tr><td>6</td><td>표현(Presentation)</td><td>암호화, 압축, 형식 변환</td></tr>
<tr><td>5</td><td>세션(Session)</td><td>연결 설정·해제, 동기화</td></tr>
<tr><td>4</td><td>전송(Transport)</td><td><b>TCP, UDP</b> — 종단 간 신뢰성</td></tr>
<tr><td>3</td><td>네트워크(Network)</td><td><b>IP, ICMP, ARP</b> / <b>라우터</b></td></tr>
<tr><td>2</td><td>데이터링크(Data Link)</td><td>HDLC, PPP / <b>브리지, 스위치</b></td></tr>
<tr><td>1</td><td>물리(Physical)</td><td>RS-232C / <b>리피터, 허브</b></td></tr>
</tbody></table>
<p class="tip">암기: <b>물데네전세표응</b> (아래→위)</p>
<table><thead><tr><th></th><th>TCP</th><th>UDP</th></tr></thead><tbody>
<tr><td>연결</td><td>연결형 (3-way handshake)</td><td>비연결형</td></tr>
<tr><td>신뢰성</td><td>높음 (재전송·흐름제어)</td><td>낮음</td></tr>
<tr><td>속도</td><td>느림</td><td>빠름</td></tr>
<tr><td>용도</td><td>파일 전송, 웹</td><td>스트리밍, DNS</td></tr>
</tbody></table>
<p><b>IP 주소 클래스</b>: A(1~126, /8) · B(128~191, /16) · C(192~223, /24) · D(224~239, 멀티캐스트) · E(연구용)</p>
<p><b>서브넷</b>: <code>/24</code> 는 256개 주소(사용 가능 254개), <code>/26</code> 은 64개씩 4개 서브넷.</p>
<p><b>IPv6</b>: 128비트, 16진수 8부분. 헤더 단순화, 보안·QoS 기본 지원. 유니캐스트·멀티캐스트·<b>애니캐스트</b>(브로드캐스트 없음)</p>`
        }
      ]
    },

    {
      subject: "정보시스템 구축관리",
      intro: "보안 용어와 신기술 용어 비중이 크다. 용어 문제는 키워드 하나로 갈리므로 특징어를 함께 외우는 게 효율적이다.",
      sections: [
        {
          h: "★ 비용 산정 모형",
          body: `<p><b>하향식</b>: 전문가 감정, 델파이(Delphi)</p>
<p><b>상향식</b>: LOC(원시 코드 라인 수), 개발 단계별 인월수</p>
<p><b>수학적 모형</b>: COCOMO, Putnam(<b>Rayleigh-Norden 곡선</b>), 기능점수(FP)</p>
<p><b>COCOMO 유형</b></p>
<table><thead><tr><th>유형</th><th>규모</th><th>설명</th></tr></thead><tbody>
<tr><td><b>조직형(Organic)</b></td><td>5만 라인 이하</td><td>단순·소규모, 사무처리용</td></tr>
<tr><td><b>반분리형(Semi-detached)</b></td><td>30만 라인 이하</td><td>중간 규모, 컴파일러·인터프리터</td></tr>
<tr><td><b>내장형(Embedded)</b></td><td>30만 라인 이상</td><td>초대형, 실시간 처리·미사일 유도</td></tr>
</tbody></table>
<p><b>LOC 계산</b>: 노력(인월) = 개발 기간 × 투입 인원 = LOC ÷ 1인당 월평균 생산 코드 라인 수</p>
<p class="tip">예: 30,000 LOC, 개발자 5명, 1인당 월 300라인 → 30000/300 = 100인월 → 100/5 = <b>20개월</b></p>`
        },
        {
          h: "일정 관리와 프로세스 성숙도",
          body: `<p><b>PERT</b>: 비관치·낙관치·기대치로 예측 (불확실성 고려), <b>CPM</b>: 임계 경로(Critical Path)로 최소 기간 산출</p>
<p><b>CMMI 5단계</b>: 초기(Initial) → 관리(Managed) → 정의(Defined) → <b>정량적 관리</b>(Quantitatively Managed) → 최적화(Optimizing)</p>
<p><b>SPICE(ISO/IEC 15504) 6단계</b>: 불완전(0) → 수행(1) → 관리(2) → 확립(3) → 예측(4) → 최적화(5)</p>`
        },
        {
          h: "★ 암호화",
          body: `<table><thead><tr><th>구분</th><th>대칭키(비밀키)</th><th>비대칭키(공개키)</th></tr></thead><tbody>
<tr><td>키</td><td>암·복호화 키가 <b>같음</b></td><td>공개키/개인키 <b>쌍</b></td></tr>
<tr><td>속도</td><td>빠름</td><td>느림</td></tr>
<tr><td>키 개수</td><td>n(n-1)/2</td><td>2n</td></tr>
<tr><td>알고리즘</td><td><b>DES, AES, SEED, ARIA, IDEA, RC4</b></td><td><b>RSA, ECC, ElGamal, Diffie-Hellman</b></td></tr>
</tbody></table>
<p><b>블록 vs 스트림</b>: 블록 암호(DES, AES, SEED, ARIA, IDEA) / 스트림 암호(RC4, LFSR)</p>
<p><b>해시(단방향)</b>: <b>MD5, SHA-1, SHA-256, HAVAL, N-NASH</b> — 복호화 불가, 무결성 검증에 사용</p>
<p class="tip">"RSA가 대칭키인가?" → <b>아니다, 비대칭</b>. "SHA가 암호화 알고리즘인가?" → <b>해시 함수</b>. 단골 함정.</p>
<p><b>솔트(Salt)</b>: 해시 전에 덧붙이는 무작위 값. 레인보우 테이블 공격 방어.</p>`
        },
        {
          h: "★ 서비스 공격 유형",
          body: `<table><thead><tr><th>공격</th><th>수법</th></tr></thead><tbody>
<tr><td><b>Ping of Death</b></td><td>규정 크기 이상의 ICMP 패킷으로 마비</td></tr>
<tr><td><b>SYN Flooding</b></td><td>SYN만 보내고 응답 안 함 → 연결 대기열 고갈</td></tr>
<tr><td><b>Smurf</b></td><td>출발지를 피해자로 위장해 브로드캐스트 → 응답 폭주</td></tr>
<tr><td><b>Land</b></td><td>출발지와 목적지 IP를 <b>같게</b> 만들어 자기 자신에 응답</td></tr>
<tr><td><b>Teardrop</b></td><td>패킷 <b>오프셋 값</b>을 겹치게 조작해 재조립 오류 유발</td></tr>
<tr><td><b>Session Hijacking</b></td><td>인증된 세션을 가로챔</td></tr>
<tr><td><b>SQL Injection</b></td><td>입력값에 SQL을 삽입. 웹앱과 DB 연동 지점에서 발생</td></tr>
<tr><td><b>XSS</b></td><td>악성 스크립트를 삽입해 <b>사용자 브라우저</b>에서 실행</td></tr>
<tr><td><b>CSRF</b></td><td>인증된 사용자가 의도치 않은 요청을 보내게 함</td></tr>
<tr><td><b>스니핑</b></td><td><b>훔쳐보기</b> (수동적)</td></tr>
<tr><td><b>스푸핑</b></td><td><b>속이기</b> (신분 위장)</td></tr>
</tbody></table>
<p><b>랜섬웨어·악성코드</b>: 웜(자기 복제·전파), 트로이 목마(정상 위장, 자기 복제 X), 백도어(우회 통로), 루트킷(은폐)</p>`
        },
        {
          h: "접근 통제와 인증",
          body: `<table><thead><tr><th>정책</th><th>기준</th></tr></thead><tbody>
<tr><td><b>DAC</b> (임의적)</td><td>데이터 <b>소유자</b>가 접근 권한 부여</td></tr>
<tr><td><b>MAC</b> (강제적)</td><td><b>보안 등급(레이블)</b> 기준. 관리자가 부여</td></tr>
<tr><td><b>RBAC</b> (역할 기반)</td><td>사용자의 <b>역할</b>에 따라 부여</td></tr>
</tbody></table>
<p><b>인증(Authentication) 유형</b></p>
<ul>
<li><b>지식</b> 기반 — 아는 것 (패스워드, PIN)</li>
<li><b>소유</b> 기반 — 가진 것 (OTP, 스마트카드, 공인인증서)</li>
<li><b>존재(생체)</b> 기반 — 신체 특징 (지문, 홍채, 정맥)</li>
<li><b>행위</b> 기반 — 하는 것 (<b>서명, 음성, 걸음걸이</b>)</li>
</ul>
<p><b>보안 3요소(CIA)</b>: 기밀성(Confidentiality), 무결성(Integrity), 가용성(Availability)</p>`
        },
        {
          h: "보안 솔루션",
          body: `<ul>
<li><b>방화벽(Firewall)</b> — 내·외부 트래픽 필터링</li>
<li><b>IDS</b> — 침입 <b>탐지</b>. 오용 탐지(시그니처) / 이상 탐지(행위 기반)</li>
<li><b>IPS</b> — 침입 <b>차단</b>까지</li>
<li><b>VPN</b> — 공중망에 가상 사설망 구성</li>
<li><b>NAC</b> — 단말기 보안 상태 검증 후 네트워크 접근 통제</li>
<li><b>ESM / SIEM</b> — 통합 보안 관제. SIEM은 빅데이터 기반 상관 분석</li>
<li><b>DLP</b> — 데이터 유출 방지</li>
<li><b>허니팟(Honeypot)</b> — 의도적으로 취약한 시스템을 두어 공격 유인·분석</li>
</ul>`
        },
        {
          h: "신기술 용어",
          body: `<ul>
<li><b>SDN</b> — 네트워크의 <b>제어부와 전송부를 분리</b>해 소프트웨어로 제어</li>
<li><b>NFV</b> — 네트워크 기능을 가상화</li>
<li><b>메시 네트워크</b> — 대규모 무선 환경에서 노드끼리 그물망 연결</li>
<li><b>MQTT</b> — <b>발행/구독(Pub-Sub)</b> 기반 경량 메시지 프로토콜. IoT·저대역폭 환경</li>
<li><b>블록체인</b> — 분산 원장. 위·변조 방지</li>
<li><b>디지털 트윈</b> — 현실 사물을 가상에 쌍둥이로 구현해 시뮬레이션</li>
<li><b>도커(Docker)</b> — 컨테이너 기반 가상화. <b>쿠버네티스</b>는 컨테이너 오케스트레이션</li>
<li><b>하둡(Hadoop)</b> — 대용량 분산 처리. <b>HDFS</b>(저장) + <b>맵리듀스</b>(처리)</li>
<li><b>스쿱(Sqoop)</b> — RDB와 하둡 간 데이터 전송</li>
<li><b>레인보우 테이블</b> — 해시값-원문 대응표를 이용한 크래킹</li>
<li><b>Tensorflow</b> — 구글 머신러닝 라이브러리</li>
<li><b>N-Screen</b> — 여러 기기에서 이어서 이용</li>
<li><b>Zing</b> — 근거리 무선 데이터 전송(NFC 유사, 초고속)</li>
</ul>`
        },
        {
          h: "시큐어 코딩 · 소프트웨어 개발 보안",
          body: `<p><b>보안 약점 분류(SW 개발 보안 가이드)</b></p>
<ul>
<li><b>입력 데이터 검증 및 표현</b> — SQL 삽입, XSS, 버퍼 오버플로</li>
<li><b>보안 기능</b> — 부적절한 인가, 취약한 암호화</li>
<li><b>시간 및 상태</b> — <b>TOCTOU</b> 경쟁 조건(Race Condition)</li>
<li><b>에러 처리</b> — 오류 메시지로 정보 노출</li>
<li><b>코드 오류</b> — 널 포인터 역참조, 자원 반환 누락</li>
<li><b>캡슐화</b> — 제거되지 않은 디버그 코드</li>
<li><b>API 오용</b> — 위험한 함수 사용(<code>strcpy</code>, <code>gets</code>)</li>
</ul>
<p class="tip">버퍼 오버플로 방어: <code>strcpy</code> 대신 <b><code>strncpy</code></b>, <code>gets</code> 대신 <b><code>fgets</code></b> 사용.</p>`
        }
      ]
    }
  ],

  practical: [
    {
      subject: "실기 — 필답형 대비",
      intro: "20문항 필답형. 필기 5과목 범위가 그대로 나오되 '쓸 수 있어야' 한다. 배점이 큰 코드 출력값과 SQL부터 잡는 게 효율적이다.",
      sections: [
        {
          h: "출제 경향 (2020~2025 기출 376문항 기준)",
          body: `<table><thead><tr><th>영역</th><th>비중</th><th>형태</th></tr></thead><tbody>
<tr><td><b>프로그래밍 언어 (C/Java/Python)</b></td><td>가장 높음</td><td>코드 출력값 쓰기, 빈칸 채우기</td></tr>
<tr><td><b>SQL</b></td><td>높음</td><td>쿼리 작성, 결과 행 수</td></tr>
<tr><td>보안·네트워크 용어</td><td>높음</td><td>설명을 읽고 용어 쓰기(영문 약어 포함)</td></tr>
<tr><td>디자인 패턴 / 응집도·결합도</td><td>중간</td><td>명칭 쓰기</td></tr>
<tr><td>테스트 / UML</td><td>중간</td><td>기법 명칭, 다이어그램 종류</td></tr>
</tbody></table>
<p class="tip">코드 문제는 부분 점수가 없다. 값 하나만 틀려도 0점이므로 <b>변수 표를 그려 한 줄씩 추적</b>하는 습관이 중요하다.</p>`
        },
        {
          h: "답안 작성 요령",
          body: `<ul>
<li><b>영문 약어는 대문자로</b> 정확히 — RARP, SQL Injection, XSS</li>
<li>한글·영문 병기가 안전하다 — "결합도(Coupling)"</li>
<li>출력값 문제는 <b>공백·줄바꿈까지</b> 요구할 수 있다. <code>printf("%d ", x)</code> 처럼 공백이 있으면 답에도 반영</li>
<li>SQL은 <b>세미콜론</b>까지 쓰고, 대소문자는 채점에 영향 없지만 키워드는 대문자 관례</li>
<li>빈칸 채우기는 <b>그 자리에 들어갈 것만</b> — 문장 전체를 다시 쓰지 말 것</li>
</ul>`
        },
        {
          h: "코드 출력값 — 추적 요령",
          body: `<p>변수 표를 그리는 게 가장 확실하다.</p>
<pre>int a[4] = {0, 2, 4, 8};
int sum = 0, *p1;
for (i = 1; i &lt; 4; i++) {
    p1 = a + i;
    sum += *p1;
}
</pre>
<table><thead><tr><th>i</th><th>p1</th><th>*p1</th><th>sum</th></tr></thead><tbody>
<tr><td>1</td><td>&amp;a[1]</td><td>2</td><td>2</td></tr>
<tr><td>2</td><td>&amp;a[2]</td><td>4</td><td>6</td></tr>
<tr><td>3</td><td>&amp;a[3]</td><td>8</td><td>14</td></tr>
</tbody></table>
<p><b>자주 나오는 함정</b></p>
<ul>
<li><code>i++</code> vs <code>++i</code> — 대입문 안에서 결과가 달라진다</li>
<li><code>switch</code> 의 <code>break</code> 누락 (fall-through)</li>
<li>배열 인덱스는 <b>0부터</b>. <code>a[4]</code> 는 <code>a[0]~a[3]</code></li>
<li>Java 정수 나눗셈 <code>5/2 = 2</code> (소수점 버림)</li>
<li>Python 슬라이싱의 끝 인덱스는 <b>미포함</b></li>
<li>재귀 함수는 <b>호출 스택</b>을 그려서 되돌아오는 순서를 확인</li>
</ul>`
        },
        {
          h: "SQL 필답 — 자주 나오는 형태",
          body: `<pre>-- 중복 제거 조회
SELECT DISTINCT 학과 FROM 학생;

-- 개수 세기 (중복 제거 후)
SELECT COUNT(DISTINCT 학과) FROM 학생 WHERE 학과 = '컴퓨터공학';

-- 삽입
INSERT INTO 학생(학번, 이름, 학년) VALUES(2024001, '홍길동', 1);

-- 수정
UPDATE 학생 SET 학년 = 4 WHERE 학번 = 2024001;

-- 삭제
DELETE FROM 학생 WHERE 학번 = 2024001;

-- 권한 부여
GRANT SELECT, UPDATE ON 학생 TO PARK WITH GRANT OPTION;

-- 뷰 생성
CREATE VIEW 컴공학생 AS SELECT * FROM 학생 WHERE 학과 = '컴퓨터공학';

-- 인덱스 생성
CREATE INDEX idx_name ON 학생(이름);</pre>
<p class="tip"><code>COUNT(*)</code> 의 결과 <b>행 수</b>를 묻는 문제는 GROUP BY가 있는지부터 확인. GROUP BY가 있으면 그룹 개수만큼 행이 나온다.</p>`
        },
        {
          h: "용어 쓰기 — 빈출 목록",
          body: `<p><b>네트워크</b></p>
<ul>
<li><b>ARP</b> — IP 주소 → MAC 주소 / <b>RARP</b> — MAC → IP</li>
<li><b>ICMP</b> — 오류·상태 보고 (ping)</li>
<li><b>DHCP</b> — IP 자동 할당</li>
<li><b>NAT</b> — 사설 IP ↔ 공인 IP 변환</li>
<li><b>SSH</b>(22), <b>HTTP</b>(80), <b>HTTPS</b>(443), <b>FTP</b>(21), <b>SMTP</b>(25), <b>DNS</b>(53)</li>
</ul>
<p><b>보안</b></p>
<ul>
<li><b>SQL Injection</b>, <b>XSS</b>, <b>CSRF</b>, <b>Ransomware</b></li>
<li><b>SSO</b> — 한 번 인증으로 여러 시스템 이용</li>
<li><b>OAuth</b> — 인가(권한 위임) 프로토콜</li>
<li><b>Salt</b>, <b>Digital Signature</b>(디지털 서명), <b>PKI</b></li>
</ul>
<p><b>설계·개발</b></p>
<ul>
<li>응집도 7단계 / 결합도 6단계 <b>명칭 쓰기</b></li>
<li>디자인 패턴 이름 (<b>Singleton, Observer, Factory Method, Bridge</b>)</li>
<li><b>스텁(Stub)</b> / <b>드라이버(Driver)</b></li>
<li><b>정규화 단계</b>(1NF~BCNF)와 각 조건</li>
<li>테스트 기법 — <b>동치 분할, 경계값 분석</b></li>
</ul>`
        }
      ]
    }
  ]
};
