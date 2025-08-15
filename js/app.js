// 전역 변수
let currentLeague = 'all';
let matches = [];
let news = [];

// 크롤링 설정
const CRAWLING_CONFIG = {
    // 프록시 서버 (CORS 우회용)
    PROXY_URL: 'https://api.allorigins.win/raw?url=',
    
    // 크롤링할 사이트들
    FOOTBALL_SITES: {
        kleague: 'https://www.kleague.com/schedule',
        premier: 'https://www.premierleague.com/fixtures',
        championship: 'https://www.efl.com/fixtures'
    },
    
    NEWS_SITES: [
        'https://www.espn.com/soccer/',
        'https://www.bbc.com/sport/football',
        'https://www.goal.com/en/news'
    ]
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

// 실제 경기 데이터 로드 (크롤링)
async function loadMatches() {
    matchesLoading.style.display = 'block';
    matchesGrid.innerHTML = '';

    try {
        matches = await crawlRealMatches();
        if (matches.length === 0) {
            // 크롤링 실패시 시뮬레이션 데이터 사용
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

// 실제 축구 사이트 크롤링
async function crawlRealMatches() {
    const allMatches = [];
    
    try {
        // K리그 크롤링 시도
        const kleagueMatches = await crawlKLeague();
        allMatches.push(...kleagueMatches);
        
        // 프리미어리그 크롤링 시도
        const premierMatches = await crawlPremierLeague();
        allMatches.push(...premierMatches);
        
        // 챔피언십 크롤링 시도
        const championshipMatches = await crawlChampionship();
        allMatches.push(...championshipMatches);
        
    } catch (error) {
        console.error('크롤링 중 오류 발생:', error);
    }
    
    return allMatches.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// K리그 크롤링
async function crawlKLeague() {
    try {
        const response = await fetch(CRAWLING_CONFIG.PROXY_URL + encodeURIComponent(CRAWLING_CONFIG.FOOTBALL_SITES.kleague));
        const html = await response.text();
        
        // HTML 파싱 (간단한 정규식 사용)
        const matches = [];
        const matchPattern = /<div[^>]*class="[^"]*match[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
        let match;
        
        while ((match = matchPattern.exec(html)) !== null) {
            const matchHtml = match[1];
            
            // 팀명 추출
            const homeTeamMatch = matchHtml.match(/<span[^>]*class="[^"]*home[^"]*"[^>]*>([^<]+)<\/span>/i);
            const awayTeamMatch = matchHtml.match(/<span[^>]*class="[^"]*away[^"]*"[^>]*>([^<]+)<\/span>/i);
            
            if (homeTeamMatch && awayTeamMatch) {
                const homeTeam = homeTeamMatch[1].trim();
                const awayTeam = awayTeamMatch[1].trim();
                
                // 날짜 추출
                const dateMatch = matchHtml.match(/<span[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/span>/i);
                const date = dateMatch ? new Date(dateMatch[1].trim()) : new Date();
                
                matches.push({
                    id: `kleague-${matches.length}`,
                    league: 'kleague',
                    leagueName: 'K리그',
                    homeTeam: homeTeam,
                    awayTeam: awayTeam,
                    homeScore: 0,
                    awayScore: 0,
                    date: date,
                    status: 'scheduled',
                    venue: 'K리그 경기장',
                    referee: '주심'
                });
            }
        }
        
        return matches.slice(0, 10); // 최대 10개 경기만 반환
        
    } catch (error) {
        console.error('K리그 크롤링 실패:', error);
        return [];
    }
}

// 프리미어리그 크롤링
async function crawlPremierLeague() {
    try {
        const response = await fetch(CRAWLING_CONFIG.PROXY_URL + encodeURIComponent(CRAWLING_CONFIG.FOOTBALL_SITES.premier));
        const html = await response.text();
        
        const matches = [];
        const matchPattern = /<div[^>]*class="[^"]*fixture[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
        let match;
        
        while ((match = matchPattern.exec(html)) !== null) {
            const matchHtml = match[1];
            
            // 팀명 추출
            const homeTeamMatch = matchHtml.match(/<span[^>]*class="[^"]*home[^"]*"[^>]*>([^<]+)<\/span>/i);
            const awayTeamMatch = matchHtml.match(/<span[^>]*class="[^"]*away[^"]*"[^>]*>([^<]+)<\/span>/i);
            
            if (homeTeamMatch && awayTeamMatch) {
                const homeTeam = homeTeamMatch[1].trim();
                const awayTeam = awayTeamMatch[1].trim();
                
                // 날짜 추출
                const dateMatch = matchHtml.match(/<span[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/span>/i);
                const date = dateMatch ? new Date(dateMatch[1].trim()) : new Date();
                
                matches.push({
                    id: `premier-${matches.length}`,
                    league: 'premier',
                    leagueName: '프리미어리그',
                    homeTeam: homeTeam,
                    awayTeam: awayTeam,
                    homeScore: 0,
                    awayScore: 0,
                    date: date,
                    status: 'scheduled',
                    venue: '프리미어리그 경기장',
                    referee: '주심'
                });
            }
        }
        
        return matches.slice(0, 10);
        
    } catch (error) {
        console.error('프리미어리그 크롤링 실패:', error);
        return [];
    }
}

// 챔피언십 크롤링
async function crawlChampionship() {
    try {
        const response = await fetch(CRAWLING_CONFIG.PROXY_URL + encodeURIComponent(CRAWLING_CONFIG.FOOTBALL_SITES.championship));
        const html = await response.text();
        
        const matches = [];
        const matchPattern = /<div[^>]*class="[^"]*fixture[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
        let match;
        
        while ((match = matchPattern.exec(html)) !== null) {
            const matchHtml = match[1];
            
            // 팀명 추출
            const homeTeamMatch = matchHtml.match(/<span[^>]*class="[^"]*home[^"]*"[^>]*>([^<]+)<\/span>/i);
            const awayTeamMatch = matchHtml.match(/<span[^>]*class="[^"]*away[^"]*"[^>]*>([^<]+)<\/span>/i);
            
            if (homeTeamMatch && awayTeamMatch) {
                const homeTeam = homeTeamMatch[1].trim();
                const awayTeam = awayTeamMatch[1].trim();
                
                // 날짜 추출
                const dateMatch = matchHtml.match(/<span[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/span>/i);
                const date = dateMatch ? new Date(dateMatch[1].trim()) : new Date();
                
                matches.push({
                    id: `championship-${matches.length}`,
                    league: 'championship',
                    leagueName: '챔피언십',
                    homeTeam: homeTeam,
                    awayTeam: awayTeam,
                    homeScore: 0,
                    awayScore: 0,
                    date: date,
                    status: 'scheduled',
                    venue: '챔피언십 경기장',
                    referee: '주심'
                });
            }
        }
        
        return matches.slice(0, 10);
        
    } catch (error) {
        console.error('챔피언십 크롤링 실패:', error);
        return [];
    }
}

// 시뮬레이션 경기 데이터 생성 (크롤링 실패시 사용)
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

// 실제 뉴스 로드 (크롤링)
async function loadNews() {
    newsLoading.style.display = 'block';
    newsGrid.innerHTML = '';

    try {
        news = await crawlRealNews();
        if (news.length === 0) {
            // 크롤링 실패시 시뮬레이션 데이터 사용
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

// 실제 뉴스 크롤링
async function crawlRealNews() {
    const allNews = [];
    
    try {
        // ESPN 크롤링
        const espnNews = await crawlESPN();
        allNews.push(...espnNews);
        
        // BBC 크롤링
        const bbcNews = await crawlBBC();
        allNews.push(...bbcNews);
        
        // Goal.com 크롤링
        const goalNews = await crawlGoal();
        allNews.push(...goalNews);
        
    } catch (error) {
        console.error('뉴스 크롤링 중 오류 발생:', error);
    }
    
    return allNews.sort((a, b) => b.publishedAt - a.publishedAt).slice(0, 6);
}

// ESPN 크롤링
async function crawlESPN() {
    try {
        const response = await fetch(CRAWLING_CONFIG.PROXY_URL + encodeURIComponent(CRAWLING_CONFIG.NEWS_SITES[0]));
        const html = await response.text();
        
        const news = [];
        const articlePattern = /<article[^>]*>([\s\S]*?)<\/article>/gi;
        let article;
        
        while ((article = articlePattern.exec(html)) !== null && news.length < 2) {
            const articleHtml = article[1];
            
            // 제목 추출
            const titleMatch = articleHtml.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i);
            if (titleMatch) {
                const title = titleMatch[1].trim();
                
                // 설명 추출
                const descMatch = articleHtml.match(/<p[^>]*>([^<]+)<\/p>/i);
                const description = descMatch ? descMatch[1].trim() : '';
                
                // 링크 추출
                const linkMatch = articleHtml.match(/<a[^>]*href="([^"]*)"[^>]*>/i);
                const url = linkMatch ? linkMatch[1] : '';
                
                news.push({
                    title: title,
                    description: description,
                    source: 'ESPN',
                    publishedAt: new Date(),
                    url: url.startsWith('http') ? url : 'https://www.espn.com' + url
                });
            }
        }
        
        return news;
        
    } catch (error) {
        console.error('ESPN 크롤링 실패:', error);
        return [];
    }
}

// BBC 크롤링
async function crawlBBC() {
    try {
        const response = await fetch(CRAWLING_CONFIG.PROXY_URL + encodeURIComponent(CRAWLING_CONFIG.NEWS_SITES[1]));
        const html = await response.text();
        
        const news = [];
        const articlePattern = /<article[^>]*>([\s\S]*?)<\/article>/gi;
        let article;
        
        while ((article = articlePattern.exec(html)) !== null && news.length < 2) {
            const articleHtml = article[1];
            
            // 제목 추출
            const titleMatch = articleHtml.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i);
            if (titleMatch) {
                const title = titleMatch[1].trim();
                
                // 설명 추출
                const descMatch = articleHtml.match(/<p[^>]*>([^<]+)<\/p>/i);
                const description = descMatch ? descMatch[1].trim() : '';
                
                // 링크 추출
                const linkMatch = articleHtml.match(/<a[^>]*href="([^"]*)"[^>]*>/i);
                const url = linkMatch ? linkMatch[1] : '';
                
                news.push({
                    title: title,
                    description: description,
                    source: 'BBC Sport',
                    publishedAt: new Date(),
                    url: url.startsWith('http') ? url : 'https://www.bbc.com' + url
                });
            }
        }
        
        return news;
        
    } catch (error) {
        console.error('BBC 크롤링 실패:', error);
        return [];
    }
}

// Goal.com 크롤링
async function crawlGoal() {
    try {
        const response = await fetch(CRAWLING_CONFIG.PROXY_URL + encodeURIComponent(CRAWLING_CONFIG.NEWS_SITES[2]));
        const html = await response.text();
        
        const news = [];
        const articlePattern = /<article[^>]*>([\s\S]*?)<\/article>/gi;
        let article;
        
        while ((article = articlePattern.exec(html)) !== null && news.length < 2) {
            const articleHtml = article[1];
            
            // 제목 추출
            const titleMatch = articleHtml.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i);
            if (titleMatch) {
                const title = titleMatch[1].trim();
                
                // 설명 추출
                const descMatch = articleHtml.match(/<p[^>]*>([^<]+)<\/p>/i);
                const description = descMatch ? descMatch[1].trim() : '';
                
                // 링크 추출
                const linkMatch = articleHtml.match(/<a[^>]*href="([^"]*)"[^>]*>/i);
                const url = linkMatch ? linkMatch[1] : '';
                
                news.push({
                    title: title,
                    description: description,
                    source: 'Goal.com',
                    publishedAt: new Date(),
                    url: url.startsWith('http') ? url : 'https://www.goal.com' + url
                });
            }
        }
        
        return news;
        
    } catch (error) {
        console.error('Goal.com 크롤링 실패:', error);
        return [];
    }
}

// 시뮬레이션 뉴스 데이터 생성 (크롤링 실패시 사용)
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