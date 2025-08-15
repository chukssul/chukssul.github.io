// 전역 변수
let currentFilter = 'upcoming';
let matches = [];
let articles = [];
let comments = {};

// 크롤링 설정 - config.js에서 가져오기
const CRAWLING_CONFIG = window.CONFIG || {
    PROXY_URLS: ['https://api.allorigins.win/raw?url='],
    FOOTBALL_SITES: ['https://www.livescore.com/football/'],
    NEWS_SITES: ['https://www.bbc.com/sport/football']
};

// DOM 요소들
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');
const filterBtns = document.querySelectorAll('.filter-btn');
const matchesGrid = document.getElementById('matches-grid');
const articlesGrid = document.getElementById('articles-grid');
const matchesLoading = document.getElementById('matches-loading');
const articlesLoading = document.getElementById('articles-loading');
const refreshArticlesBtn = document.getElementById('refresh-articles');
const matchModal = document.getElementById('match-modal');
const matchModalBody = document.getElementById('match-modal-body');
const articleModal = document.getElementById('article-modal');
const articleModalBody = document.getElementById('article-modal-body');
const closeModal = document.querySelectorAll('.close');
const commentText = document.getElementById('comment-text');
const submitComment = document.getElementById('submit-comment');
const commentsList = document.getElementById('comments-list');

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadMatches();
    loadArticles();
    loadComments();
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

    // 경기 필터
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            filterMatches(filter);
        });
    });

    // 기사 새로고침
    refreshArticlesBtn.addEventListener('click', loadArticles);

    // 모달 닫기
    closeModal.forEach(close => {
        close.addEventListener('click', () => {
            matchModal.style.display = 'none';
            articleModal.style.display = 'none';
        });
    });

    // 모달 외부 클릭시 닫기
    matchModal.addEventListener('click', (e) => {
        if (e.target === matchModal) {
            matchModal.style.display = 'none';
        }
    });

    articleModal.addEventListener('click', (e) => {
        if (e.target === articleModal) {
            articleModal.style.display = 'none';
        }
    });

    // 댓글 작성
    submitComment.addEventListener('click', addComment);
}

// 탭 전환
function switchTab(tabName) {
    navBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// 실제 경기 데이터 로드 (개선된 크롤링)
async function loadMatches() {
    matchesLoading.style.display = 'block';
    matchesGrid.innerHTML = '';

    try {
        // 실제 크롤링 시도 (타임아웃 설정)
        const timeout = CRAWLING_CONFIG.CRAWLING_SETTINGS?.TIMEOUT || 20000;
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('크롤링 타임아웃')), timeout)
        );
        
        const crawlingPromise = crawlRealMatches();
        
        matches = await Promise.race([crawlingPromise, timeoutPromise]);
        
        if (matches.length === 0) {
            // 크롤링 실패시 빈 화면 표시
            matchesGrid.innerHTML = '<div class="no-data">실제 경기 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</div>';
            return;
        }
        
        // 시간 기준으로 정렬
        matches.sort((a, b) => new Date(a.date) - new Date(b.date));
        displayMatches(matches);
    } catch (error) {
        console.error('경기 데이터 로드 실패:', error);
        matchesGrid.innerHTML = '<div class="no-data">실제 경기 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</div>';
    } finally {
        matchesLoading.style.display = 'none';
    }
}

// 실제 축구 사이트 크롤링 (개선된 버전)
async function crawlRealMatches() {
    const allMatches = [];
    
    // 실제 웹사이트 크롤링만 시도
    for (let i = 0; i < CRAWLING_CONFIG.FOOTBALL_SITES.length; i++) {
        const site = CRAWLING_CONFIG.FOOTBALL_SITES[i];
        const proxyUrl = CRAWLING_CONFIG.PROXY_URLS[i % CRAWLING_CONFIG.PROXY_URLS.length];
        
        try {
            console.log(`웹 크롤링 시도: ${site}`);
            
            // User-Agent 랜덤 선택
            const userAgent = CRAWLING_CONFIG.USER_AGENTS ? 
                CRAWLING_CONFIG.USER_AGENTS[Math.floor(Math.random() * CRAWLING_CONFIG.USER_AGENTS.length)] :
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
            
            const response = await fetch(proxyUrl + encodeURIComponent(site), {
                method: 'GET',
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'User-Agent': userAgent,
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const html = await response.text();
            console.log(`크롤링 성공: ${site}, HTML 길이: ${html.length}`);
            
            const siteMatches = parseMatchesFromHTML(html, site);
            allMatches.push(...siteMatches);
            
            if (allMatches.length >= (CRAWLING_CONFIG.CRAWLING_SETTINGS?.MAX_MATCHES_PER_LEAGUE || 20)) break;
            
            // 요청 간 지연시간
            if (CRAWLING_CONFIG.CRAWLING_SETTINGS?.DELAY_BETWEEN_REQUESTS) {
                await new Promise(resolve => setTimeout(resolve, CRAWLING_CONFIG.CRAWLING_SETTINGS.DELAY_BETWEEN_REQUESTS));
            }
            
        } catch (error) {
            console.error(`사이트 크롤링 실패: ${site}`, error);
            continue; // 다음 사이트로 계속
        }
    }
    
    console.log(`총 ${allMatches.length}개의 경기 데이터 수집 완료`);
    return allMatches;
}

// 경기 상태 변환
function getFixtureStatus(status) {
    const statusMap = {
        'SCHEDULED': 'scheduled',
        'LIVE': 'live',
        'FINISHED': 'finished',
        'POSTPONED': 'scheduled',
        'CANCELLED': 'scheduled'
    };
    return statusMap[status] || 'scheduled';
}

// HTML에서 경기 정보 파싱 (실제 작동하는 버전)
function parseMatchesFromHTML(html, site) {
    const matches = [];
    
    try {
        // 사이트별 특화 파싱
        if (site.includes('transfermarkt')) {
            matches.push(...parseTransfermarktMatches(html));
        } else if (site.includes('soccerway')) {
            matches.push(...parseSoccerwayMatches(html));
        } else if (site.includes('flashscore')) {
            matches.push(...parseFlashscoreMatches(html));
        } else if (site.includes('livescore')) {
            matches.push(...parseLivescoreMatches(html));
        } else {
            // 일반적인 패턴으로 파싱
            matches.push(...parseGenericMatches(html));
        }
        
    } catch (error) {
        console.error('HTML 파싱 실패:', error);
    }
    
    return matches;
}

// Transfermarkt 사이트 파싱
function parseTransfermarktMatches(html) {
    const matches = [];
    
    // Transfermarkt 특화 패턴
    const matchPattern = /<div[^>]*class="[^"]*match[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    let match;
    
    while ((match = matchPattern.exec(html)) !== null && matches.length < 10) {
        const matchHtml = match[1];
        
        // 팀명 추출
        const homeTeamMatch = matchHtml.match(/<span[^>]*class="[^"]*home[^"]*"[^>]*>([^<]+)<\/span>/i);
        const awayTeamMatch = matchHtml.match(/<span[^>]*class="[^"]*away[^"]*"[^>]*>([^<]+)<\/span>/i);
        
        if (homeTeamMatch && awayTeamMatch) {
            const homeTeam = homeTeamMatch[1].trim();
            const awayTeam = awayTeamMatch[1].trim();
            
            if (homeTeam !== awayTeam) {
                matches.push({
                    id: `match-${matches.length}`,
                    homeTeam: homeTeam,
                    awayTeam: awayTeam,
                    homeScore: 0,
                    awayScore: 0,
                    date: new Date(),
                    status: 'scheduled',
                    venue: '경기장',
                    referee: '주심',
                    leagueName: '축구 리그'
                });
            }
        }
    }
    
    return matches;
}

// Soccerway 사이트 파싱
function parseSoccerwayMatches(html) {
    const matches = [];
    
    // Soccerway 특화 패턴
    const matchPattern = /<tr[^>]*class="[^"]*match[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
    let match;
    
    while ((match = matchPattern.exec(html)) !== null && matches.length < 10) {
        const matchHtml = match[1];
        
        // 팀명 추출
        const teamPattern = /<td[^>]*class="[^"]*team[^"]*"[^>]*>([^<]+)<\/td>/gi;
        const teams = [];
        let teamMatch;
        
        while ((teamMatch = teamPattern.exec(matchHtml)) !== null && teams.length < 2) {
            teams.push(teamMatch[1].trim());
        }
        
        if (teams.length === 2 && teams[0] !== teams[1]) {
            matches.push({
                id: `match-${matches.length}`,
                homeTeam: teams[0],
                awayTeam: teams[1],
                homeScore: 0,
                awayScore: 0,
                date: new Date(),
                status: 'scheduled',
                venue: '경기장',
                referee: '주심',
                leagueName: '축구 리그'
            });
        }
    }
    
    return matches;
}

// Flashscore 사이트 파싱
function parseFlashscoreMatches(html) {
    const matches = [];
    
    // Flashscore 특화 패턴
    const matchPattern = /<div[^>]*class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    let match;
    
    while ((match = matchPattern.exec(html)) !== null && matches.length < 10) {
        const matchHtml = match[1];
        
        // 팀명 추출
        const homeTeamMatch = matchHtml.match(/<span[^>]*class="[^"]*home[^"]*"[^>]*>([^<]+)<\/span>/i);
        const awayTeamMatch = matchHtml.match(/<span[^>]*class="[^"]*away[^"]*"[^>]*>([^<]+)<\/span>/i);
        
        if (homeTeamMatch && awayTeamMatch) {
            const homeTeam = homeTeamMatch[1].trim();
            const awayTeam = awayTeamMatch[1].trim();
            
            if (homeTeam !== awayTeam) {
                matches.push({
                    id: `match-${matches.length}`,
                    homeTeam: homeTeam,
                    awayTeam: awayTeam,
                    homeScore: 0,
                    awayScore: 0,
                    date: new Date(),
                    status: 'scheduled',
                    venue: '경기장',
                    referee: '주심',
                    leagueName: '축구 리그'
                });
            }
        }
    }
    
    return matches;
}

// Livescore 사이트 파싱
function parseLivescoreMatches(html) {
    const matches = [];
    
    // Livescore 특화 패턴들
    const patterns = [
        /<div[^>]*class="[^"]*match[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
        /<tr[^>]*class="[^"]*match[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi
    ];
    
    patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(html)) !== null && matches.length < 10) {
            const matchHtml = match[1];
            
            // 팀명 추출
            const teamPattern = /<span[^>]*class="[^"]*team[^"]*"[^>]*>([^<]+)<\/span>/gi;
            const teams = [];
            let teamMatch;
            
            while ((teamMatch = teamPattern.exec(matchHtml)) !== null && teams.length < 2) {
                teams.push(teamMatch[1].trim());
            }
            
            if (teams.length === 2 && teams[0] !== teams[1]) {
                // 날짜 추출
                const datePattern = /(\d{1,2}\/\d{1,2}\/\d{4})|(\d{4}-\d{2}-\d{2})/i;
                const dateMatch = matchHtml.match(datePattern);
                const matchDate = dateMatch ? new Date(dateMatch[0]) : new Date();
                
                matches.push({
                    id: `match-${matches.length}`,
                    homeTeam: teams[0],
                    awayTeam: teams[1],
                    homeScore: 0,
                    awayScore: 0,
                    date: matchDate,
                    status: 'scheduled',
                    venue: '경기장',
                    referee: '주심',
                    leagueName: '축구 리그'
                });
            }
        }
    });
    
    return matches;
}

// 일반적인 패턴으로 파싱
function parseGenericMatches(html) {
    const matches = [];
    
    // 다양한 패턴으로 경기 정보 추출
    const patterns = [
        /<div[^>]*class="[^"]*(match|fixture|game)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
        /<tr[^>]*class="[^"]*(match|fixture)[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi,
        /<li[^>]*class="[^"]*(match|fixture)[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
        /<article[^>]*class="[^"]*(match|fixture)[^"]*"[^>]*>([\s\S]*?)<\/article>/gi
    ];
    
    patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(html)) !== null && matches.length < 8) {
            const matchHtml = match[2] || match[1];
            
            // 팀명 추출 - 더 다양한 패턴
            const teamPatterns = [
                /<span[^>]*class="[^"]*(home|away|team)[^"]*"[^>]*>([^<]+)<\/span>/gi,
                /<td[^>]*class="[^"]*(home|away|team)[^"]*"[^>]*>([^<]+)<\/td>/gi,
                /<div[^>]*class="[^"]*(home|away|team)[^"]*"[^>]*>([^<]+)<\/div>/gi,
                /<a[^>]*class="[^"]*(home|away|team)[^"]*"[^>]*>([^<]+)<\/a>/gi,
                /<strong[^>]*>([^<]+)<\/strong>/gi,
                /<b[^>]*>([^<]+)<\/b>/gi
            ];
            
            let homeTeam = null;
            let awayTeam = null;
            const teams = [];
            
            teamPatterns.forEach(teamPattern => {
                let teamMatch;
                while ((teamMatch = teamPattern.exec(matchHtml)) !== null) {
                    const teamName = teamMatch[2] || teamMatch[1];
                    const cleanTeamName = teamName.trim().replace(/[^\w\s가-힣]/g, '');
                    
                    if (cleanTeamName.length > 2 && cleanTeamName.length < 30 && !teams.includes(cleanTeamName)) {
                        teams.push(cleanTeamName);
                    }
                }
            });
            
            // VS 패턴으로 팀 분리
            const vsPattern = /vs|VS|v\.|V\./;
            const vsIndex = teams.findIndex(team => vsPattern.test(team));
            
            if (teams.length >= 2) {
                if (vsIndex !== -1 && vsIndex > 0 && vsIndex < teams.length - 1) {
                    homeTeam = teams[vsIndex - 1];
                    awayTeam = teams[vsIndex + 1];
                } else if (teams.length >= 2) {
                    homeTeam = teams[0];
                    awayTeam = teams[1];
                }
            }
            
            if (homeTeam && awayTeam && homeTeam !== awayTeam) {
                // 날짜 추출
                const datePatterns = [
                    /(\d{1,2}\/\d{1,2}\/\d{4})/,
                    /(\d{4}-\d{2}-\d{2})/,
                    /(\d{1,2}\.\d{1,2}\.\d{4})/,
                    /(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/i
                ];
                
                let matchDate = new Date();
                datePatterns.forEach(pattern => {
                    const dateMatch = matchHtml.match(pattern);
                    if (dateMatch) {
                        const parsedDate = new Date(dateMatch[0]);
                        if (!isNaN(parsedDate.getTime())) {
                            matchDate = parsedDate;
                        }
                    }
                });
                
                matches.push({
                    id: `match-${matches.length}`,
                    homeTeam: homeTeam,
                    awayTeam: awayTeam,
                    homeScore: 0,
                    awayScore: 0,
                    date: matchDate,
                    status: 'scheduled',
                    venue: '경기장',
                    referee: '주심',
                    leagueName: '축구 리그'
                });
            }
        }
    });
    
    return matches;
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
    
    const statusText = getStatusText(match.status);
    const statusClass = `status-${match.status}`;
    const dateStr = formatDate(match.date);
    const timeUntil = getTimeUntil(match.date);
    
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
        ${match.status === 'scheduled' ? `<div class="time-until">${timeUntil}</div>` : ''}
    `;
    
    card.addEventListener('click', () => openMatchModal(match));
    return card;
}

// 경기 필터링
function filterMatches(filter) {
    currentFilter = filter;
    
    filterBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    let filteredMatches = [];
    const now = new Date();
    
    switch (filter) {
        case 'upcoming':
            filteredMatches = matches.filter(match => new Date(match.date) > now);
            break;
        case 'recent':
            filteredMatches = matches.filter(match => new Date(match.date) <= now);
            break;
        case 'all':
        default:
            filteredMatches = matches;
            break;
    }
    
    displayMatches(filteredMatches);
}

// 실제 기사 로드 (개선된 크롤링)
async function loadArticles() {
    articlesLoading.style.display = 'block';
    articlesGrid.innerHTML = '';

    try {
        // 실제 크롤링 시도 (타임아웃 설정)
        const timeout = CRAWLING_CONFIG.CRAWLING_SETTINGS?.TIMEOUT || 20000;
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('크롤링 타임아웃')), timeout)
        );
        
        const crawlingPromise = crawlRealArticles();
        
        articles = await Promise.race([crawlingPromise, timeoutPromise]);
        
        if (articles.length === 0) {
            // 크롤링 실패시 빈 화면 표시
            articlesGrid.innerHTML = '<div class="no-data">실제 뉴스 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</div>';
            return;
        }
        displayArticles(articles);
    } catch (error) {
        console.error('기사 데이터 로드 실패:', error);
        articlesGrid.innerHTML = '<div class="no-data">실제 뉴스 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</div>';
    } finally {
        articlesLoading.style.display = 'none';
    }
}

// 실제 기사 크롤링 (개선된 버전)
async function crawlRealArticles() {
    const allArticles = [];
    
    // 실제 웹사이트 크롤링만 시도
    for (let i = 0; i < CRAWLING_CONFIG.NEWS_SITES.length; i++) {
        const site = CRAWLING_CONFIG.NEWS_SITES[i];
        const proxyUrl = CRAWLING_CONFIG.PROXY_URLS[i % CRAWLING_CONFIG.PROXY_URLS.length];
        
        try {
            console.log(`뉴스 웹 크롤링 시도: ${site}`);
            
            // User-Agent 랜덤 선택
            const userAgent = CRAWLING_CONFIG.USER_AGENTS ? 
                CRAWLING_CONFIG.USER_AGENTS[Math.floor(Math.random() * CRAWLING_CONFIG.USER_AGENTS.length)] :
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
            
            const response = await fetch(proxyUrl + encodeURIComponent(site), {
                method: 'GET',
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'User-Agent': userAgent,
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const html = await response.text();
            console.log(`뉴스 크롤링 성공: ${site}, HTML 길이: ${html.length}`);
            
            const siteArticles = parseArticlesFromHTML(html, site);
            allArticles.push(...siteArticles);
            
            if (allArticles.length >= (CRAWLING_CONFIG.CRAWLING_SETTINGS?.MAX_NEWS_PER_SITE * 5 || 15)) break;
            
            // 요청 간 지연시간
            if (CRAWLING_CONFIG.CRAWLING_SETTINGS?.DELAY_BETWEEN_REQUESTS) {
                await new Promise(resolve => setTimeout(resolve, CRAWLING_CONFIG.CRAWLING_SETTINGS.DELAY_BETWEEN_REQUESTS));
            }
            
        } catch (error) {
            console.error(`뉴스 크롤링 실패: ${site}`, error);
            continue; // 다음 사이트로 계속
        }
    }
    
    console.log(`총 ${allArticles.length}개의 기사 데이터 수집 완료`);
    return allArticles.sort((a, b) => b.publishedAt - a.publishedAt);
}

// HTML에서 기사 정보 파싱 (실제 작동하는 버전)
function parseArticlesFromHTML(html, site) {
    const articles = [];
    
    try {
        // 사이트별 특화 파싱
        if (site.includes('goal.com')) {
            articles.push(...parseGoalArticles(html));
        } else if (site.includes('football365')) {
            articles.push(...parseFootball365Articles(html));
        } else if (site.includes('90min')) {
            articles.push(...parse90minArticles(html));
        } else if (site.includes('espn.com')) {
            articles.push(...parseEspnArticles(html));
        } else if (site.includes('bbc.com')) {
            articles.push(...parseBbcArticles(html));
        } else {
            // 일반적인 패턴으로 파싱
            articles.push(...parseGenericArticles(html));
        }
        
    } catch (error) {
        console.error('기사 HTML 파싱 실패:', error);
    }
    
    return articles;
}

// Goal.com 사이트 파싱
function parseGoalArticles(html) {
    const articles = [];
    
    const patterns = [
        /<article[^>]*>([\s\S]*?)<\/article>/gi,
        /<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
    ];
    
    patterns.forEach(pattern => {
        let article;
        while ((article = pattern.exec(html)) !== null && articles.length < 4) {
            const articleHtml = article[1];
            
            // 제목 추출
            const titlePatterns = [
                /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i,
                /<a[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/a>/i
            ];
            
            let title = null;
            titlePatterns.forEach(titlePattern => {
                const titleMatch = articleHtml.match(titlePattern);
                if (titleMatch && titleMatch[1].trim().length > 10) {
                    title = titleMatch[1].trim();
                }
            });
            
            if (title) {
                // 설명 추출
                const descPattern = /<p[^>]*>([^<]+)<\/p>/i;
                const descMatch = articleHtml.match(descPattern);
                const description = descMatch ? descMatch[1].trim() : title;
                
                articles.push({
                    id: `article-${articles.length}`,
                    title: title,
                    description: description,
                    source: 'Goal.com',
                    publishedAt: new Date(),
                    url: '#',
                    content: description
                });
            }
        }
    });
    
    return articles;
}

// Football365 사이트 파싱
function parseFootball365Articles(html) {
    const articles = [];
    
    const patterns = [
        /<article[^>]*>([\s\S]*?)<\/article>/gi,
        /<div[^>]*class="[^"]*post[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
    ];
    
    patterns.forEach(pattern => {
        let article;
        while ((article = pattern.exec(html)) !== null && articles.length < 4) {
            const articleHtml = article[1];
            
            // 제목 추출
            const titlePattern = /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i;
            const titleMatch = articleHtml.match(titlePattern);
            
            if (titleMatch && titleMatch[1].trim().length > 10) {
                const title = titleMatch[1].trim();
                
                // 설명 추출
                const descPattern = /<p[^>]*>([^<]+)<\/p>/i;
                const descMatch = articleHtml.match(descPattern);
                const description = descMatch ? descMatch[1].trim() : title;
                
                articles.push({
                    id: `article-${articles.length}`,
                    title: title,
                    description: description,
                    source: 'Football365',
                    publishedAt: new Date(),
                    url: '#',
                    content: description
                });
            }
        }
    });
    
    return articles;
}

// 90min 사이트 파싱
function parse90minArticles(html) {
    const articles = [];
    
    const patterns = [
        /<article[^>]*>([\s\S]*?)<\/article>/gi,
        /<div[^>]*class="[^"]*news[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
    ];
    
    patterns.forEach(pattern => {
        let article;
        while ((article = pattern.exec(html)) !== null && articles.length < 4) {
            const articleHtml = article[1];
            
            // 제목 추출
            const titlePattern = /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i;
            const titleMatch = articleHtml.match(titlePattern);
            
            if (titleMatch && titleMatch[1].trim().length > 10) {
                const title = titleMatch[1].trim();
                
                // 설명 추출
                const descPattern = /<p[^>]*>([^<]+)<\/p>/i;
                const descMatch = articleHtml.match(descPattern);
                const description = descMatch ? descMatch[1].trim() : title;
                
                articles.push({
                    id: `article-${articles.length}`,
                    title: title,
                    description: description,
                    source: '90min',
                    publishedAt: new Date(),
                    url: '#',
                    content: description
                });
            }
        }
    });
    
    return articles;
}

// ESPN 사이트 파싱
function parseEspnArticles(html) {
    const articles = [];
    
    const patterns = [
        /<article[^>]*>([\s\S]*?)<\/article>/gi,
        /<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
    ];
    
    patterns.forEach(pattern => {
        let article;
        while ((article = pattern.exec(html)) !== null && articles.length < 4) {
            const articleHtml = article[1];
            
            // 제목 추출
            const titlePatterns = [
                /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i,
                /<a[^>]*class="[^"]*headline[^"]*"[^>]*>([^<]+)<\/a>/i
            ];
            
            let title = null;
            titlePatterns.forEach(titlePattern => {
                const titleMatch = articleHtml.match(titlePattern);
                if (titleMatch && titleMatch[1].trim().length > 10) {
                    title = titleMatch[1].trim();
                }
            });
            
            if (title) {
                // 설명 추출
                const descPattern = /<p[^>]*>([^<]+)<\/p>/i;
                const descMatch = articleHtml.match(descPattern);
                const description = descMatch ? descMatch[1].trim() : title;
                
                articles.push({
                    id: `article-${articles.length}`,
                    title: title,
                    description: description,
                    source: 'ESPN',
                    publishedAt: new Date(),
                    url: '#',
                    content: description
                });
            }
        }
    });
    
    return articles;
}

// BBC 사이트 파싱
function parseBbcArticles(html) {
    const articles = [];
    
    const patterns = [
        /<article[^>]*>([\s\S]*?)<\/article>/gi,
        /<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
    ];
    
    patterns.forEach(pattern => {
        let article;
        while ((article = pattern.exec(html)) !== null && articles.length < 4) {
            const articleHtml = article[1];
            
            // 제목 추출
            const titlePatterns = [
                /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i,
                /<a[^>]*class="[^"]*headline[^"]*"[^>]*>([^<]+)<\/a>/i
            ];
            
            let title = null;
            titlePatterns.forEach(titlePattern => {
                const titleMatch = articleHtml.match(titlePattern);
                if (titleMatch && titleMatch[1].trim().length > 10) {
                    title = titleMatch[1].trim();
                }
            });
            
            if (title) {
                // 설명 추출
                const descPattern = /<p[^>]*>([^<]+)<\/p>/i;
                const descMatch = articleHtml.match(descPattern);
                const description = descMatch ? descMatch[1].trim() : title;
                
                articles.push({
                    id: `article-${articles.length}`,
                    title: title,
                    description: description,
                    source: 'BBC',
                    publishedAt: new Date(),
                    url: '#',
                    content: description
                });
            }
        }
    });
    
    return articles;
}

// 일반적인 패턴으로 파싱
function parseGenericArticles(html) {
    const articles = [];
    
    const patterns = [
        /<article[^>]*>([\s\S]*?)<\/article>/gi,
        /<div[^>]*class="[^"]*(article|news|post)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
        /<div[^>]*class="[^"]*(story|headline)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
        /<li[^>]*class="[^"]*(article|news)[^"]*"[^>]*>([\s\S]*?)<\/li>/gi
    ];
    
    patterns.forEach(pattern => {
        let article;
        while ((article = pattern.exec(html)) !== null && articles.length < 6) {
            const articleHtml = article[1] || article[2];
            
            // 제목 추출 - 더 다양한 패턴
            const titlePatterns = [
                /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i,
                /<a[^>]*class="[^"]*(title|headline)[^"]*"[^>]*>([^<]+)<\/a>/i,
                /<span[^>]*class="[^"]*(title|headline)[^"]*"[^>]*>([^<]+)<\/span>/i,
                /<strong[^>]*>([^<]+)<\/strong>/i,
                /<b[^>]*>([^<]+)<\/b>/i
            ];
            
            let title = null;
            titlePatterns.forEach(titlePattern => {
                const titleMatch = articleHtml.match(titlePattern);
                if (titleMatch && (titleMatch[1] || titleMatch[2]).trim().length > 10) {
                    title = (titleMatch[1] || titleMatch[2]).trim();
                }
            });
            
            if (title) {
                // 설명 추출 - 더 다양한 패턴
                const descPatterns = [
                    /<p[^>]*>([^<]+)<\/p>/i,
                    /<div[^>]*class="[^"]*(summary|excerpt)[^"]*"[^>]*>([^<]+)<\/div>/i,
                    /<span[^>]*class="[^"]*(summary|excerpt)[^"]*"[^>]*>([^<]+)<\/span>/i
                ];
                
                let description = title;
                descPatterns.forEach(descPattern => {
                    const descMatch = articleHtml.match(descPattern);
                    if (descMatch && (descMatch[1] || descMatch[2]).trim().length > 20) {
                        description = (descMatch[1] || descMatch[2]).trim();
                    }
                });
                
                // 날짜 추출
                const datePatterns = [
                    /(\d{1,2}\/\d{1,2}\/\d{4})/,
                    /(\d{4}-\d{2}-\d{2})/,
                    /(\d{1,2}\.\d{1,2}\.\d{4})/,
                    /(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/i
                ];
                
                let publishedAt = new Date();
                datePatterns.forEach(pattern => {
                    const dateMatch = articleHtml.match(pattern);
                    if (dateMatch) {
                        const parsedDate = new Date(dateMatch[0]);
                        if (!isNaN(parsedDate.getTime())) {
                            publishedAt = parsedDate;
                        }
                    }
                });
                
                articles.push({
                    id: `article-${articles.length}`,
                    title: title,
                    description: description,
                    source: '축구 뉴스',
                    publishedAt: publishedAt,
                    url: '#',
                    content: description
                });
            }
        }
    });
    
    return articles;
}

// 기사 표시
function displayArticles(articlesToShow) {
    articlesGrid.innerHTML = '';
    
    if (articlesToShow.length === 0) {
        articlesGrid.innerHTML = '<div class="no-data">표시할 기사가 없습니다.</div>';
        return;
    }
    
    articlesToShow.forEach(article => {
        const articleCard = createArticleCard(article);
        articlesGrid.appendChild(articleCard);
    });
}

// 기사 카드 생성
function createArticleCard(article) {
    const card = document.createElement('div');
    card.className = 'article-card';
    
    const timeAgo = getTimeAgo(article.publishedAt);
    
    card.innerHTML = `
        <div class="article-image">
            <i class="fas fa-newspaper"></i>
        </div>
        <div class="article-content">
            <h3 class="article-title">${article.title}</h3>
            <p class="article-description">${article.description}</p>
            <div class="article-meta">
                <span class="article-source">${article.source}</span>
                <span class="article-time">${timeAgo}</span>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => openArticleModal(article));
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

// 기사 모달 열기
function openArticleModal(article) {
    const articleContent = document.querySelector('#article-modal-body .article-content');
    const timeAgo = getTimeAgo(article.publishedAt);
    
    articleContent.innerHTML = `
        <h2>${article.title}</h2>
        <div class="article-meta">
            <span class="article-source">${article.source}</span>
            <span class="article-time">${timeAgo}</span>
        </div>
        <div class="article-text">
            <p>${article.content}</p>
        </div>
    `;
    
    // 댓글 로드
    loadArticleComments(article.id);
    
    articleModal.style.display = 'block';
}

// 댓글 로드
function loadComments() {
    const savedComments = localStorage.getItem('footballComments');
    if (savedComments) {
        comments = JSON.parse(savedComments);
    }
}

// 기사별 댓글 로드
function loadArticleComments(articleId) {
    const articleComments = comments[articleId] || [];
    displayComments(articleComments);
}

// 댓글 표시
function displayComments(articleComments) {
    commentsList.innerHTML = '';
    
    if (articleComments.length === 0) {
        commentsList.innerHTML = '<p style="text-align: center; color: #666;">아직 댓글이 없습니다.</p>';
        return;
    }
    
    articleComments.forEach(comment => {
        const commentElement = createCommentElement(comment);
        commentsList.appendChild(commentElement);
    });
}

// 댓글 요소 생성
function createCommentElement(comment) {
    const div = document.createElement('div');
    div.className = 'comment-item';
    
    const timeAgo = getTimeAgo(comment.timestamp);
    
    div.innerHTML = `
        <div class="comment-header">
            <span class="comment-author">${comment.author}</span>
            <span class="comment-time">${timeAgo}</span>
        </div>
        <div class="comment-text">${comment.text}</div>
    `;
    
    return div;
}

// 댓글 추가
function addComment() {
    const text = commentText.value.trim();
    if (!text) {
        alert('댓글을 입력해주세요.');
        return;
    }
    
    // 현재 열린 기사 ID 찾기
    const currentArticleId = getCurrentArticleId();
    if (!currentArticleId) return;
    
    const comment = {
        id: Date.now(),
        author: '익명 사용자',
        text: text,
        timestamp: new Date()
    };
    
    if (!comments[currentArticleId]) {
        comments[currentArticleId] = [];
    }
    
    comments[currentArticleId].push(comment);
    
    // 로컬 스토리지에 저장
    localStorage.setItem('footballComments', JSON.stringify(comments));
    
    // 댓글 목록 새로고침
    loadArticleComments(currentArticleId);
    
    // 입력창 초기화
    commentText.value = '';
}

// 현재 열린 기사 ID 가져오기
function getCurrentArticleId() {
    // 모달에서 기사 ID를 추출하는 로직
    // 실제로는 모달을 열 때 기사 ID를 저장해야 함
    return 'article-1'; // 임시로 첫 번째 기사 ID 반환
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

function getTimeUntil(date) {
    const now = new Date();
    const diff = new Date(date) - now;
    
    if (diff < 0) return '경기 종료';
    
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (days > 0) return `${days}일 후`;
    if (hours > 0) return `${hours}시간 후`;
    if (minutes > 0) return `${minutes}분 후`;
    return '곧 시작';
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
    if (document.getElementById('articles').classList.contains('active')) {
        loadArticles();
    }
}, 300000); 