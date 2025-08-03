// Service Worker for 캐시 제어
const CACHE_NAME = 'chukssul-v2.1';
const urlsToCache = [
  '/',
  '/css/styles.css',
  '/js/script.js',
  '/js/firebase-realtime.js',
  '/js/cloudinary-storage.js'
];

// 설치 시 캐시 생성
self.addEventListener('install', event => {
  console.log('🔄 Service Worker 설치 중...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ 캐시가 열렸습니다');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ 모든 리소스가 캐시되었습니다');
        return self.skipWaiting();
      })
  );
});

// 활성화 시 이전 캐시 삭제
self.addEventListener('activate', event => {
  console.log('🔄 Service Worker 활성화 중...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ 이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ 이전 캐시가 모두 삭제되었습니다');
      return self.clients.claim();
    })
  );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', event => {
  // HTML 페이지는 항상 네트워크에서 가져오기 (캐시 방지)
  if (event.request.url.includes('.html') || event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          // 응답을 캐시에 저장하지 않음
          return response;
        })
        .catch(() => {
          // 네트워크 실패 시 캐시에서 가져오기
          return caches.match(event.request);
        })
    );
    return;
  }

  // CSS, JS 파일은 네트워크 우선 전략 사용 (캐시 방지)
  if (event.request.url.includes('.css') || event.request.url.includes('.js')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          // 네트워크에서 가져온 최신 파일 반환
          return response;
        })
        .catch(() => {
          // 네트워크 실패 시에만 캐시에서 가져오기
          return caches.match(event.request);
        })
    );
    return;
  }

  // 기타 리소스는 네트워크 우선 전략 사용
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then(response => {
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// 메시지 처리 (캐시 삭제 요청)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log('🗑️ 캐시 삭제 요청:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        console.log('✅ 모든 캐시가 삭제되었습니다');
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
      })
    );
  }
}); 