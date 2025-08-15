// 전역 변수
let currentLeague = 'all';
let matches = [];
let news = [];

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

// 경기 데이터 로드 (시뮬레이션)
function loadMatches() {
    matchesLoading.style.display = 'block';
    matchesGrid.innerHTML = '';

    // 실제 API 호출 대신 시뮬레이션 데이터 사용
    setTimeout(() => {
        matches = generateMockMatches();
        displayMatches(matches);
        matchesLoading.style.display = 'none';
    }, 1000);
}

// 시뮬레이션 경기 데이터 생성
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

// 뉴스 로드 (시뮬레이션)
function loadNews() {
    newsLoading.style.display = 'block';
    newsGrid.innerHTML = '';

    // 실제 API 호출 대신 시뮬레이션 데이터 사용
    setTimeout(() => {
        news = generateMockNews();
        displayNews(news);
        newsLoading.style.display = 'none';
    }, 1500);
}

// 시뮬레이션 뉴스 데이터 생성
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

// 실제 API 연동을 위한 함수들 (향후 구현)
async function fetchRealMatches() {
    // 실제 축구 API 호출 로직
    // 예: API-Football, Football-Data.org 등
    console.log('실제 경기 데이터를 가져오는 기능은 향후 구현 예정');
}

async function fetchRealNews() {
    // 실제 뉴스 API 호출 로직
    // 예: NewsAPI, Google News 등
    console.log('실제 뉴스 데이터를 가져오는 기능은 향후 구현 예정');
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