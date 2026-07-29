/* 서비스 워커 — 복습 알림 + 오프라인 캐싱.
   BUILD는 tools/bump.js가 배포 전에 갱신한다. 캐시 이름에 BUILD가 들어가므로
   새 배포가 뜨면 구버전 캐시는 activate에서 전부 삭제된다. */

const BUILD = "202607291049";
const SHELL_CACHE = "cert-shell-" + BUILD;
const DATA_CACHE = "cert-data-" + BUILD;

/* 앱 셸 — 설치 시 미리 받아둔다 (?v=BUILD 포함해야 페이지 요청과 키가 일치) */
const SHELL = [
  "./",
  "./index.html",
  "./exam.html",
  "./search.html",
  "./manifest.webmanifest",
  "./icon.svg",
  `./css/style.css?v=${BUILD}`,
  `./css/skins.css?v=${BUILD}`,
  `./js/common.js?v=${BUILD}`,
  `./js/home.js?v=${BUILD}`,
  `./js/exam.js?v=${BUILD}`,
  `./js/search.js?v=${BUILD}`,
  `./js/codehl.js?v=${BUILD}`,
  `./js/pen.js?v=${BUILD}`,
];

const DB = "cert-db";

function idbOpen() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("kv");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function idbGet(key) {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const tx = db.transaction("kv", "readonly");
    const rq = tx.objectStore("kv").get(key);
    rq.onsuccess = () => { db.close(); res(rq.result); };
    rq.onerror = () => { db.close(); rej(rq.error); };
  });
}
async function idbSet(key, val) {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(val, key);
    tx.oncomplete = () => { db.close(); res(); };
    tx.onerror = () => { db.close(); rej(tx.error); };
  });
}

function dayKey(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

async function checkAndNotify(force) {
  const data = await idbGet("review");
  if (!data || !data.enabled) return;
  const now = Date.now();
  const due = (data.dues || []).filter((t) => t <= now).length;
  const today = dayKey(new Date());
  if (due > 0 && (force || data.lastNotified !== today)) {
    await self.registration.showNotification("🌱 복습 시간이에요!", {
      body: `오늘 복습할 문제가 ${due}개 기다리고 있어요. 망각곡선이 이기기 전에!`,
      icon: "icon.svg",
      badge: "icon.svg",
      tag: "cert-review",
    });
    data.lastNotified = today;
    await idbSet("review", data);
  }
}

/* ---------- 설치 / 활성화 ---------- */
self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // cache.add()는 요청 옵션에 따라 조용히 실패할 수 있어 fetch→put으로 직접 담는다.
      // 개별 실패가 설치 전체를 막지 않게 각각 catch한다.
      await Promise.all(
        SHELL.map(async (u) => {
          try {
            const res = await fetch(u, { cache: "reload" });
            if (res.ok) await cache.put(u, res.clone());
          } catch (err) { /* 개별 자산 실패는 무시 */ }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL_CACHE && k !== DATA_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* ---------- fetch 전략 ----------
   문제 데이터(data/*.js)는 버전 쿼리가 붙은 불변 파일 → cache-first (오프라인 학습의 핵심)
   HTML은 network-first (배포 즉시 반영), 실패 시 캐시
   그 외 정적 자산은 cache-first + 백그라운드 갱신 */
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 폰트 CDN 등은 브라우저에 맡김

  const isData = url.pathname.includes("/data/");
  const isHTML = req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/");

  if (isData) {
    e.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch (err) {
          return new Response("/* offline: 이 회차는 아직 저장되지 않았어요 */", {
            status: 503, headers: { "Content-Type": "text/javascript; charset=utf-8" },
          });
        }
      })
    );
    return;
  }

  if (isHTML) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            // 쿼리 없는 경로 키로 저장한다. exam.html?cert=... 같은 요청이 오프라인
            // 폴백(ignoreSearch)에서 항상 최신 문서를 찾도록 하고, 쿼리 조합마다
            // 사본이 쌓이는 것도 막는다.
            const canonical = new URL(req.url).pathname;
            caches.open(SHELL_CACHE).then((c) => c.put(canonical, res.clone()));
          }
          return res;
        })
        .catch(async () => {
          // exam.html?cert=... 처럼 쿼리가 붙은 주소도 같은 문서로 취급해야 한다
          return (
            (await caches.match(req, { ignoreSearch: true })) ||
            (await caches.match("./index.html")) ||
            new Response("<h1>오프라인</h1><p>이 페이지는 아직 저장되지 않았어요.</p>", {
              status: 503, headers: { "Content-Type": "text/html; charset=utf-8" },
            })
          );
        })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok) caches.open(SHELL_CACHE).then((c) => c.put(req, res.clone()));
        return res;
      });
    })
  );
});

/* ---------- 페이지 메시지 ---------- */
self.addEventListener("message", (e) => {
  const msg = e.data || {};
  if (msg.type === "check-now") {
    e.waitUntil ? e.waitUntil(checkAndNotify(false)) : checkAndNotify(false);
  } else if (msg.type === "cache-all") {
    // 전 회차 데이터를 미리 받아 오프라인 대비 (진행률을 페이지로 회신)
    e.waitUntil(cacheAll(msg.urls || [], e.source));
  } else if (msg.type === "cache-status") {
    e.waitUntil(reportStatus(msg.urls || [], e.source));
  }
});

async function cacheAll(urls, client) {
  const cache = await caches.open(DATA_CACHE);
  let done = 0, failed = 0;
  for (const u of urls) {
    const hit = await cache.match(u);
    if (!hit) {
      try {
        const res = await fetch(u, { cache: "reload" });
        if (res.ok) await cache.put(u, res.clone()); else failed++;
      } catch (err) { failed++; }
    }
    done++;
    if (client && (done % 3 === 0 || done === urls.length)) {
      client.postMessage({ type: "cache-progress", done, total: urls.length, failed });
    }
  }
  if (client) client.postMessage({ type: "cache-done", done, total: urls.length, failed });
}

async function reportStatus(urls, client) {
  const cache = await caches.open(DATA_CACHE);
  let cached = 0;
  for (const u of urls) if (await cache.match(u)) cached++;
  if (client) client.postMessage({ type: "cache-status", cached, total: urls.length });
}

self.addEventListener("periodicsync", (e) => {
  if (e.tag === "review-check") e.waitUntil(checkAndNotify(false));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) if (c.url.includes("/cert") || c.url.includes("index.html")) return c.focus();
      return self.clients.openWindow("./index.html");
    })
  );
});
