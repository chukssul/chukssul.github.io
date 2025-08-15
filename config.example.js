// 크롤링 설정 예시 파일
// 이 파일을 config.js로 복사하여 사용하세요

const CONFIG = {
    // 프록시 서버 (CORS 우회용)
    PROXY_URL: 'https://api.allorigins.win/raw?url=',
    
    // 크롤링할 축구 사이트들
    FOOTBALL_SITES: {
        kleague: 'https://www.kleague.com/schedule',
        premier: 'https://www.premierleague.com/fixtures',
        championship: 'https://www.efl.com/fixtures'
    },
    
    // 크롤링할 뉴스 사이트들
    NEWS_SITES: [
        'https://www.espn.com/soccer/',
        'https://www.bbc.com/sport/football',
        'https://www.goal.com/en/news'
    ],
    
    // 크롤링 설정
    CRAWLING_SETTINGS: {
        MAX_MATCHES_PER_LEAGUE: 10,  // 리그당 최대 경기 수
        MAX_NEWS_PER_SITE: 2,        // 사이트당 최대 뉴스 수
        TIMEOUT: 10000,              // 요청 타임아웃 (ms)
        RETRY_ATTEMPTS: 3            // 재시도 횟수
    }
};

// 사용법:
// 1. 이 파일을 config.js로 복사: cp config.example.js config.js
// 2. 필요에 따라 크롤링할 사이트나 설정을 수정하세요
// 3. 웹페이지를 새로고침하면 크롤링이 시작됩니다

// 주의사항:
// - 웹사이트 구조가 변경되면 크롤링이 실패할 수 있습니다
// - 과도한 크롤링은 서버에 부담을 줄 수 있으니 적절히 사용하세요
// - 일부 사이트는 크롤링을 차단할 수 있습니다
