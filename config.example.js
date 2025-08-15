// API 키 설정 예시 파일
// 이 파일을 config.js로 복사하고 실제 API 키를 입력하세요

const CONFIG = {
    // 축구 데이터 API (API-Football)
    // https://www.api-football.com/ 에서 무료 API 키 발급 가능
    FOOTBALL_API_KEY: 'YOUR_API_FOOTBALL_KEY',
    
    // 뉴스 API (NewsAPI)
    // https://newsapi.org/ 에서 무료 API 키 발급 가능 (하루 1,000회 요청)
    NEWS_API_KEY: 'YOUR_NEWS_API_KEY',
    
    // Google Translate API
    // https://cloud.google.com/translate 에서 API 키 발급 가능
    TRANSLATE_API_KEY: 'YOUR_GOOGLE_TRANSLATE_KEY'
};

// 사용법:
// 1. 이 파일을 config.js로 복사: cp config.example.js config.js
// 2. 각 서비스에서 API 키를 발급받으세요
// 3. config.js 파일에서 'YOUR_XXX_KEY'를 실제 API 키로 교체하세요
