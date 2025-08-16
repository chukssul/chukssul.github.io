# 한국 축구 뉴스 & 경기 일정 📰⚽

한국의 모든 축구 뉴스를 완전 무료로 수집하고 표시하는 웹 애플리케이션입니다.

## 🌟 주요 기능

### 🇰🇷 한국 축구 뉴스 수집
- **RSS 피드 기반 수집**: 네이버 스포츠, 다음 스포츠, 조선일보, 중앙일보, 한겨레 등 주요 언론사
- **안전한 크롤링**: RSS가 없는 사이트는 공개 데이터만 수집
- **실시간 업데이트**: 최신 뉴스 자동 수집
- **검색 및 필터링**: 키워드 검색, 소스별 필터링
- **저작권 안전**: 원문 링크만 제공, 전문 저장 금지

### 📊 뉴스 통계
- 총 뉴스 수
- 마지막 업데이트 시간
- RSS 소스별 수집 현황

### ⚽ 경기 일정
- 실시간 경기 정보
- 예정/최근 경기 필터링
- 상세 경기 정보 모달

### 💬 댓글 시스템
- 뉴스별 댓글 작성
- 로컬 스토리지 저장
- 실시간 댓글 표시

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **뉴스 수집**: RSS 피드, CORS 프록시
- **데이터 처리**: XML 파싱, HTML 파싱
- **스토리지**: LocalStorage (댓글)
- **UI/UX**: 반응형 디자인, 모던 인터페이스

## 📡 수집 대상 사이트

### RSS 피드 (80%)
- 네이버 스포츠 축구
- 다음 스포츠 축구
- 조선일보 스포츠
- 중앙일보 스포츠
- 한겨레 스포츠
- 경향신문 스포츠
- 인터풋볼
- 풋볼리스트
- 베스트일레븐
- K리그 공식

### 크롤링 (20%)
- RSS가 없는 사이트
- 공개 데이터만 수집
- robots.txt 준수

## 🚀 설치 및 실행

1. **저장소 클론**
```bash
git clone https://github.com/your-username/korean-football-news.git
cd korean-football-news
```

2. **웹 서버 실행**
```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

3. **브라우저에서 접속**
```
http://localhost:8000
```

## 📁 프로젝트 구조

```
chukssul/
├── index.html              # 메인 HTML 파일
├── css/
│   └── styles.css          # 스타일시트
├── js/
│   ├── app.js              # 메인 애플리케이션
│   ├── korean-football-news.js  # 한국 축구 뉴스 수집기
│   ├── real-crawler.js     # 경기 데이터 크롤러
│   └── translator.js       # 번역 기능
├── images/                 # 이미지 파일
├── docs/                   # 문서
└── README.md              # 프로젝트 설명
```

## 🔧 설정

### RSS 피드 추가
`js/korean-football-news.js` 파일에서 RSS_FEEDS 배열에 새로운 피드를 추가할 수 있습니다:

```javascript
RSS_FEEDS: [
    'https://your-site.com/rss/축구.xml',
    // 추가 RSS 피드...
]
```

### 크롤링 사이트 추가
CRAWL_SITES 배열에 새로운 사이트를 추가할 수 있습니다:

```javascript
CRAWL_SITES: [
    {
        name: '사이트명',
        url: 'https://your-site.com/football',
        selector: '.news-list li'
    }
]
```

## 🛡️ 저작권 및 법적 고지

- 이 애플리케이션은 RSS 피드와 공개 데이터만을 사용합니다
- 뉴스 전문은 저장하지 않고 제목, 요약, 원문 링크만 제공합니다
- 원문은 각 언론사 사이트에서 확인하실 수 있습니다
- 모든 저작권은 해당 언론사에 있습니다

## 📈 성능 최적화

- **캐싱**: 수집된 뉴스는 메모리에 캐시
- **중복 제거**: 동일한 뉴스 자동 필터링
- **지연 로딩**: 필요시에만 데이터 로드
- **프록시 로테이션**: CORS 우회를 위한 다중 프록시

## 🔍 검색 기능

- **키워드 검색**: 제목, 내용, 소스에서 검색
- **소스별 필터링**: 특정 언론사 뉴스만 표시
- **실시간 검색**: 입력과 동시에 결과 표시

## 📱 반응형 디자인

- 모바일, 태블릿, 데스크톱 지원
- 터치 친화적 인터페이스
- 적응형 그리드 레이아웃

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.

---

**한국 축구 뉴스 & 경기 일정** - 완전 무료, 저작권 안전한 축구 뉴스 수집기 ⚽📰 