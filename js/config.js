// 축썰 앱 설정 파일
const APP_CONFIG = {
    // 앱 기본 설정
    APP_NAME: '축썰',
    VERSION: '1.0.0',
    
    // API 설정
    API_TIMEOUT: 15000,
    MAX_RETRY_ATTEMPTS: 3,
    
    // 뉴스 설정
    NEWS_CACHE_DURATION: 5 * 60 * 1000, // 5분
    MAX_NEWS_PER_PAGE: 20,
    
    // 크롤링 설정
    CRAWLING_DELAY: 2000,
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    
    // 프록시 설정
    PROXY_URLS: [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?',
        'https://cors-anywhere.herokuapp.com/',
        'https://thingproxy.freeboard.io/fetch/',
        'https://api.codetabs.com/v1/proxy?quest=',
        'https://cors.bridged.cc/'
    ]
};

// 전역 설정 객체로 내보내기
window.APP_CONFIG = APP_CONFIG;
