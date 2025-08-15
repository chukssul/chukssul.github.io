// 전역 변수
let currentLeague = 'all';
let matches = [];
let news = [];

// API 키들 (config.js에서 가져옴)
const API_KEYS = {
    FOOTBALL: CONFIG.FOOTBALL_API_KEY,
    NEWS: CONFIG.NEWS_API_KEY,
    TRANSLATE: CONFIG.TRANSLATE_API_KEY
};

// DOM 요소들
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');
const filterBtns = document.querySelectorAll('.filter-btn');
const matchesGrid = document.getElementById('matches-grid');
const newsGrid = document.getElementById('news-grid');
const matchesLoading = document.getElementById('matches-loading');
const newsLoading = document.getElementById('news-loading');
const refreshNewsBtn = document.getElementById('refresh-news');
const matchModal = document.getElementById('match-modal');
const matchModalBody = document.getElementById('match-modal-body');
const closeModal = document.querySelector('.close');

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadMatches();
    loadNews();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 탭 전환
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            switchTab(targetTab);
        });
    });

    // 리그 필터
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const league = btn.dataset.league;
            filterMatches(league);
        });
    });

    // 뉴스 새로고침
    refreshNewsBtn.addEventListener('click', loadNews);

    // 모달 닫기
    closeModal.addEventListener('click', closeMatchModal);
    matchModal.addEventListener('click', (e) => {
        if (e.target === matchModal) {
            closeMatchModal();
        }
    });
}

// 탭 전환
function switchTab(tabName) {
    navBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// 실제 경기 데이터 로드
async function loadMatches() {
    matchesLoading.style.display = 'block';
    matchesGrid.innerHTML = '';

    try {
        // API 키가 설정되어 있으면 실제 데이터 가져오기
        if (API_KEYS.FOOTBALL !== 'YOUR_API_FOOTBALL_KEY') {
            matches = await fetchRealMatches();
        } else {
            // API 키가 없으면 시뮬레이션 데이터 사용
            matches = generateMockMatches();
        }
        
        displayMatches(matches);
    } catch (error) {
        console.error('경기 데이터 로드 실패:', error);
        // 에러 발생시 시뮬레이션 데이터 사용
        matches = generateMockMatches();
        displayMatches(matches);
    } finally {
        matchesLoading.style.display = 'none';
    }
}

// 실제 축구 API 호출
async function fetchRealMatches() {
    const leagues = [
        { id: 'kleague', apiId: 572, name: 'K리그' },
        { id: 'premier', apiId: 39, name: '프리미어리그' },
        { id: 'championship', apiId: 40, name: '챔피언십' }
    ];

    const allMatches = [];
    const today = new Date();
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (const league of leagues) {
        try {
            const response = await fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures?league=${league.apiId}&season=2024&from=${today.toISOString().split('T')[0]}&to=${nextMonth.toISOString().split('T')[0]}`, {
                headers: {
                    'X-RapidAPI-Key': API_KEYS.FOOTBALL,
                    'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.response) {
                data.response.forEach(fixture => {
                    allMatches.push({
                        id: fixture.fixture.id,
                        league: league.id,
                        leagueName: league.name,
                        homeTeam: fixture.teams.home.name,
                        awayTeam: fixture.teams.away.name,
                        homeScore: fixture.goals.home || 0,
                        awayScore: fixture.goals.away || 0,
                        date: new Date(fixture.fixture.date),
                        status: getFixtureStatus(fixture.fixture.status.short),
                        venue: fixture.fixture.venue?.name || '미정',
                        referee: fixture.fixture.referee || '미정'
                    });
                });
            }
        } catch (error) {
            console.error(`${league.name} 데이터 로드 실패:`, error);
        }
    }

    return allMatches.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// 경기 상태 변환
function getFixtureStatus(apiStatus) {
    const statusMap = {
        'NS': 'scheduled',    // Not Started
        '1H': 'live',         // First Half
        '2H': 'live',         // Second Half
        'HT': 'live',         // Half Time
        'FT': 'finished',     // Full Time
        'AET': 'finished',    // After Extra Time
        'PEN': 'finished',    // Penalties
        'BT': 'live',         // Break Time
        'SUSP': 'live',       // Suspended
        'INT': 'live',        // Interrupted
        'PST': 'scheduled',   // Postponed
        'CANC': 'scheduled',  // Cancelled
        'ABD': 'finished',    // Abandoned
        'AWD': 'finished',    // Technical Loss
        'WO': 'finished'      // Walkover
    };
    return statusMap[apiStatus] || 'scheduled';
}

// 시뮬레이션 경기 데이터 생성 (API 키가 없을 때 사용)
function generateMockMatches() {
    const leagues = [
        { id: 'kleague', name: 'K리그', teams: ['울산현대', '전북현대', 'FC서울', '수원삼성', '포항스틸러스', '인천유나이티드', '대구FC', '광주FC', '제주유나이티드', '부산아이파크'] },
        { id: 'premier', name: '프리미어리그', teams: ['맨체스터시티', '아스널', '맨체스터유나이티드', '리버풀', '첼시', '토트넘', '뉴캐슬', '브라이튼', '애스턴빌라', '웨스트햄'] },
        { id: 'championship', name: '챔피언십', teams: ['레스터시티', '리즈유나이티드', '사우샘프턴', '번리', '미들즈브러', '왓포드', '헐시티', '스토크시티', '카디프시티', '브리스톨시티'] }
    ];

    const matches = [];
    const statuses = ['scheduled', 'live', 'finished'];
    
    leagues.forEach(league => {
        for (let i = 0; i < 8; i++) {
            const team1 = league.teams[Math.floor(Math.random() * league.teams.length)];
            const team2 = league.teams[Math.floor(Math.random() * league.teams.length)];
            
            if (team1 !== team2) {
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                const date = new Date();
                date.setDate(date.getDate() + Math.floor(Math.random() * 30) - 15);
                
                let score1 = 0, score2 = 0;
                if (status === 'finished') {
                    score1 = Math.floor(Math.random() * 5);
                    score2 = Math.floor(Math.random() * 5);
                } else if (status === 'live') {
                    score1 = Math.floor(Math.random() * 3);
                    score2 = Math.floor(Math.random() * 3);
                }

                matches.push({
                    id: `${league.id}-${i}`,
                    league: league.id,
                    leagueName: league.name,
                    homeTeam: team1,
                    awayTeam: team2,
                    homeScore: score1,
                    awayScore: score2,
                    date: date,
                    status: status,
                    venue: `${team1} 홈구장`,
                    referee: '주심 이름'
                });
            }
        }
    });

    return matches.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// 경기 표시
function displayMatches(matchesToShow) {
    matchesGrid.innerHTML = '';
    
    if (matchesToShow.length === 0) {
        matchesGrid.innerHTML = '<div class="no-data">표시할 경기가 없습니다.</div>';
        return;
    }
    
    matchesToShow.forEach(match => {
        const matchCard = createMatchCard(match);
        matchesGrid.appendChild(matchCard);
    });
}

// 경기 카드 생성
function createMatchCard(match) {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.dataset.league = match.league;
    
    const statusText = getStatusText(match.status);
    const statusClass = `status-${match.status}`;
    const dateStr = formatDate(match.date);
    
    card.innerHTML = `
        <div class="match-header">
            <span class="league-badge">${match.leagueName}</span>
            <span class="match-date">${dateStr}</span>
        </div>
        <div class="teams">
            <div class="team">
                <div class="team-logo">${match.homeTeam.charAt(0)}</div>
                <div class="team-name">${match.homeTeam}</div>
            </div>
            <div class="vs">VS</div>
            <div class="team">
                <div class="team-logo">${match.awayTeam.charAt(0)}</div>
                <div class="team-name">${match.awayTeam}</div>
            </div>
        </div>
        ${match.status !== 'scheduled' ? `<div class="score">${match.homeScore} - ${match.awayScore}</div>` : ''}
        <div class="match-status ${statusClass}">${statusText}</div>
    `;
    
    card.addEventListener('click', () => openMatchModal(match));
    return card;
}

// 경기 필터링
function filterMatches(league) {
    currentLeague = league;
    
    filterBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-league="${league}"]`).classList.add('active');
    
    const filteredMatches = league === 'all' 
        ? matches 
        : matches.filter(match => match.league === league);
    
    displayMatches(filteredMatches);
}

// 실제 뉴스 로드
async function loadNews() {
    newsLoading.style.display = 'block';
    newsGrid.innerHTML = '';

    try {
        // API 키가 설정되어 있으면 실제 데이터 가져오기
        if (API_KEYS.NEWS !== 'YOUR_NEWS_API_KEY') {
            news = await fetchRealNews();
        } else {
            // API 키가 없으면 시뮬레이션 데이터 사용
            news = generateMockNews();
        }
        
        displayNews(news);
    } catch (error) {
        console.error('뉴스 데이터 로드 실패:', error);
        // 에러 발생시 시뮬레이션 데이터 사용
        news = generateMockNews();
        displayNews(news);
    } finally {
        newsLoading.style.display = 'none';
    }
}

// 실제 뉴스 API 호출
async function fetchRealNews() {
    try {
        const response = await fetch(`https://newsapi.org/v2/everything?q=soccer+football&language=en&sortBy=publishedAt&pageSize=12&apiKey=${API_KEYS.NEWS}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.articles) {
            const translatedNews = [];
            
            for (const article of data.articles.slice(0, 6)) {
                try {
                    // 제목과 설명을 한글로 번역
                    const translatedTitle = await translateText(article.title);
                    const translatedDescription = await translateText(article.description || '');
                    
                    translatedNews.push({
                        title: translatedTitle,
                        description: translatedDescription,
                        source: article.source.name,
                        publishedAt: new Date(article.publishedAt),
                        url: article.url
                    });
                } catch (error) {
                    console.error('번역 실패:', error);
                    // 번역 실패시 원본 사용
                    translatedNews.push({
                        title: article.title,
                        description: article.description || '',
                        source: article.source.name,
                        publishedAt: new Date(article.publishedAt),
                        url: article.url
                    });
                }
            }
            
            return translatedNews;
        }
        
        return [];
    } catch (error) {
        console.error('뉴스 API 호출 실패:', error);
        throw error;
    }
}

// 텍스트 번역 (Google Translate API 사용)
async function translateText(text) {
    if (API_KEYS.TRANSLATE === 'YOUR_GOOGLE_TRANSLATE_KEY') {
        return text; // API 키가 없으면 원본 반환
    }

    try {
        const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${API_KEYS.TRANSLATE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text,
                target: 'ko',
                source: 'en'
            })
        });

        if (!response.ok) {
            throw new Error(`Translation API error: ${response.status}`);
        }

        const data = await response.json();
        return data.data.translations[0].translatedText;
    } catch (error) {
        console.error('번역 API 호출 실패:', error);
        return text; // 번역 실패시 원본 반환
    }
}

// 시뮬레이션 뉴스 데이터 생성 (API 키가 없을 때 사용)
function generateMockNews() {
    const mockNews = [
        {
            title: "손흥민, 프리미어리그 득점왕 경쟁에서 선두",
            description: "토트넘의 손흥민이 이번 시즌 프리미어리그 득점왕 경쟁에서 선두를 달리고 있다. 지난 경기에서도 멀티골을 기록하며 팀의 승리를 이끌었다.",
            source: "ESPN",
            publishedAt: new Date(Date.now() - Math.random() * 86400000 * 7)
        },
        {
            title: "K리그 1, 2024 시즌 개막전 성황리에 마무리",
            description: "2024 K리그 1 시즌이 성황리에 개막했다. 개막전에서 울산현대와 전북현대의 대결이 가장 큰 관심을 받았다.",
            source: "스포츠조선",
            publishedAt: new Date(Date.now() - Math.random() * 86400000 * 7)
        },
        {
            title: "맨체스터시티, 챔피언스리그 4강 진출 확정",
            description: "맨체스터시티가 챔피언스리그 8강에서 승리하며 4강 진출을 확정지었다. 하알란드의 해트트릭이 승리의 주역이었다.",
            source: "BBC Sport",
            publishedAt: new Date(Date.now() - Math.random() * 86400000 * 7)
        },
        {
            title: "김민재, 바이에른 뮌헨에서 안정적인 활약",
            description: "바이에른 뮌헨의 김민재가 부상 복귀 후 안정적인 활약을 보이고 있다. 팀의 수비 안정성에 큰 기여를 하고 있다.",
            source: "Kicker",
            publishedAt: new Date(Date.now() - Math.random() * 86400000 * 7)
        },
        {
            title: "챔피언십 리그, 승격 플레이오프 경쟁 치열",
            description: "영국 챔피언십 리그에서 승격 플레이오프 진출을 위한 경쟁이 치열하다. 상위권 팀들 간의 점수 차이가 미세하다.",
            source: "Sky Sports",
            publishedAt: new Date(Date.now() - Math.random() * 86400000 * 7)
        },
        {
            title: "이강인, PSG에서 주전 경쟁 치열",
            description: "파리 생제르맹의 이강인이 팀 내 주전 경쟁에서 좋은 모습을 보이고 있다. 최근 경기에서도 좋은 활약을 펼쳤다.",
            source: "L'Equipe",
            publishedAt: new Date(Date.now() - Math.random() * 86400000 * 7)
        }
    ];

    return mockNews.sort((a, b) => b.publishedAt - a.publishedAt);
}

// 뉴스 표시
function displayNews(newsToShow) {
    newsGrid.innerHTML = '';
    
    if (newsToShow.length === 0) {
        newsGrid.innerHTML = '<div class="no-data">표시할 뉴스가 없습니다.</div>';
        return;
    }
    
    newsToShow.forEach(article => {
        const newsCard = createNewsCard(article);
        newsGrid.appendChild(newsCard);
    });
}

// 뉴스 카드 생성
function createNewsCard(article) {
    const card = document.createElement('div');
    card.className = 'news-card';
    
    const timeAgo = getTimeAgo(article.publishedAt);
    
    card.innerHTML = `
        <div class="news-image">
            <i class="fas fa-newspaper"></i>
        </div>
        <div class="news-content">
            <h3 class="news-title">${article.title}</h3>
            <p class="news-description">${article.description}</p>
            <div class="news-meta">
                <span class="news-source">${article.source}</span>
                <span class="news-time">${timeAgo}</span>
            </div>
        </div>
    `;
    
    // 뉴스 링크가 있으면 클릭시 새 탭에서 열기
    if (article.url) {
        card.addEventListener('click', () => {
            window.open(article.url, '_blank');
        });
    }
    
    return card;
}

// 경기 모달 열기
function openMatchModal(match) {
    const statusText = getStatusText(match.status);
    const dateStr = formatDate(match.date);
    const timeStr = formatTime(match.date);
    
    matchModalBody.innerHTML = `
        <h2>${match.homeTeam} vs ${match.awayTeam}</h2>
        <div class="match-details">
            <p><strong>리그:</strong> ${match.leagueName}</p>
            <p><strong>날짜:</strong> ${dateStr}</p>
            <p><strong>시간:</strong> ${timeStr}</p>
            <p><strong>경기장:</strong> ${match.venue}</p>
            <p><strong>주심:</strong> ${match.referee}</p>
            <p><strong>상태:</strong> <span class="${match.status !== 'scheduled' ? `status-${match.status}` : ''}">${statusText}</span></p>
            ${match.status !== 'scheduled' ? `<p><strong>스코어:</strong> ${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}</p>` : ''}
        </div>
    `;
    
    matchModal.style.display = 'block';
}

// 경기 모달 닫기
function closeMatchModal() {
    matchModal.style.display = 'none';
}

// 유틸리티 함수들
function getStatusText(status) {
    const statusMap = {
        'scheduled': '예정',
        'live': '진행중',
        'finished': '종료'
    };
    return statusMap[status] || status;
}

function formatDate(date) {
    return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    }).format(date);
}

function formatTime(date) {
    return new Intl.DateTimeFormat('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
}

// 자동 새로고침 (5분마다)
setInterval(() => {
    if (document.getElementById('matches').classList.contains('active')) {
        loadMatches();
    }
    if (document.getElementById('news').classList.contains('active')) {
        loadNews();
    }
}, 300000); 