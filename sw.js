/* 서비스 워커 — 복습 알림 담당.
   페이지가 IndexedDB에 미러링해둔 복습 스케줄을 읽어,
   주기적 백그라운드 체크(periodicsync) 또는 페이지 요청(check-now) 시 알림을 띄운다. */

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

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

/* 설치 가능(PWA) 조건용 — 캐싱은 하지 않고 네트워크 그대로 통과 */
self.addEventListener("fetch", () => {});

self.addEventListener("periodicsync", (e) => {
  if (e.tag === "review-check") e.waitUntil(checkAndNotify(false));
});

self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "check-now") e.waitUntil ? e.waitUntil(checkAndNotify(false)) : checkAndNotify(false);
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
