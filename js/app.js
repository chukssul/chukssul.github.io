// 전역 변수
let currentFilter = 'upcoming';
let matches = [];
let articles = [];
let comments = {};

// 크롤링 설정
const CRAWLING_CONFIG = {
    // 프록시 서버 (CORS 우회용)
    PROXY_URL: 'https://api.allorigins.win/raw?url=',
    
    // 크롤링할 사이트들 (더 안정적인 사이트들로 변경)
    FOOTBALL_SITES: [
        'https://www.transfermarkt.com/wettbewerbe/national',
        'https://www.soccerway.com/matches/',
        'https://www.flashscore.com/football/'
    ],
    
    // 크롤링할 뉴스 사이트들
    NEWS_SITES: [
        'https://www.goal.com/en/news',
        'https://www.football365.com/',
        'https://www.90min.com/'
    ]
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

// 실제 경기 데이터 로드 (크롤링)
async function loadMatches() {
    matchesLoading.style.display = 'block';
    matchesGrid.innerHTML = '';

    try {
        // 크롤링 시도 (타임아웃 설정)
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('크롤링 타임아웃')), 5000)
        );
        
        const crawlingPromise = crawlRealMatches();
        
        matches = await Promise.race([crawlingPromise, timeoutPromise]);
        
        if (matches.length === 0) {
            // 크롤링 실패시 시뮬레이션 데이터 사용
            matches = generateMockMatches();
        }
        
        // 시간 기준으로 정렬
        matches.sort((a, b) => new Date(a.date) - new Date(b.date));
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

// 실제 축구 사이트 크롤링 (개선된 버전)
async function crawlRealMatches() {
    const allMatches = [];
    
    try {
        // 여러 사이트에서 동시에 크롤링 시도
        const crawlingPromises = CRAWLING_CONFIG.FOOTBALL_SITES.map(async (site) => {
            try {
                const response = await fetch(CRAWLING_CONFIG.PROXY_URL + encodeURIComponent(site), {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const html = await response.text();
                return parseMatchesFromHTML(html, site);
                
            } catch (error) {
                console.error(`사이트 크롤링 실패: ${site}`, error);
                return [];
            }
        });
        
        const results = await Promise.allSettled(crawlingPromises);
        
        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                allMatches.push(...result.value);
            }
        });
        
    } catch (error) {
        console.error('크롤링 중 오류 발생:', error);
    }
    
    return allMatches;
}

// HTML에서 경기 정보 파싱 (개선된 버전)
function parseMatchesFromHTML(html, site) {
    const matches = [];
    
    try {
        // 다양한 패턴으로 경기 정보 추출 시도
        const patterns = [
            // 일반적인 경기 패턴
            /<div[^>]*class="[^"]*(match|fixture|game)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
            // 테이블 형태의 경기 정보
            /<tr[^>]*class="[^"]*(match|fixture)[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi,
            // 링크 형태의 경기 정보
            /<a[^>]*href="[^"]*(match|fixture)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi
        ];
        
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(html)) !== null && matches.length < 10) {
                const matchHtml = match[2] || match[1];
                
                // 팀명 추출 (다양한 패턴 시도)
                const teamPatterns = [
                    /<span[^>]*class="[^"]*(home|away|team)[^"]*"[^>]*>([^<]+)<\/span>/gi,
                    /<td[^>]*class="[^"]*(home|away|team)[^"]*"[^>]*>([^<]+)<\/td>/gi,
                    /<div[^>]*class="[^"]*(home|away|team)[^"]*"[^>]*>([^<]+)<\/div>/gi
                ];
                
                let homeTeam = null;
                let awayTeam = null;
                
                teamPatterns.forEach(teamPattern => {
                    let teamMatch;
                    while ((teamMatch = teamPattern.exec(matchHtml)) !== null) {
                        const teamName = teamMatch[2].trim();
                        if (teamMatch[1].includes('home') && !homeTeam) {
                            homeTeam = teamName;
                        } else if (teamMatch[1].includes('away') && !awayTeam) {
                            awayTeam = teamName;
                        }
                    }
                });
                
                if (homeTeam && awayTeam && homeTeam !== awayTeam) {
                    // 날짜 추출
                    const datePatterns = [
                        /<span[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/span>/i,
                        /<td[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/td>/i,
                        /(\d{1,2}\/\d{1,2}\/\d{4})/i,
                        /(\d{4}-\d{2}-\d{2})/i
                    ];
                    
                    let matchDate = new Date();
                    datePatterns.forEach(datePattern => {
                        const dateMatch = matchHtml.match(datePattern);
                        if (dateMatch) {
                            const parsedDate = new Date(dateMatch[1]);
                            if (!isNaN(parsedDate.getTime())) {
                                matchDate = parsedDate;
                            }
                        }
                    });
                    
                    // 리그명 추출
                    const leaguePatterns = [
                        /<span[^>]*class="[^"]*league[^"]*"[^>]*>([^<]+)<\/span>/i,
                        /<td[^>]*class="[^"]*league[^"]*"[^>]*>([^<]+)<\/td>/i
                    ];
                    
                    let leagueName = '축구 리그';
                    leaguePatterns.forEach(leaguePattern => {
                        const leagueMatch = matchHtml.match(leaguePattern);
                        if (leagueMatch) {
                            leagueName = leagueMatch[1].trim();
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
                        leagueName: leagueName
                    });
                }
            }
        });
        
    } catch (error) {
        console.error('HTML 파싱 실패:', error);
    }
    
    return matches;
}

// 시뮬레이션 경기 데이터 생성 (크롤링 실패시 사용)
function generateMockMatches() {
    const leagues = ['K리그', '프리미어리그', '챔피언십', '라리가', '분데스리가', '세리에A', '리그앙', '에레디비지'];
    const teams = [
        '울산현대', '전북현대', 'FC서울', '수원삼성', '포항스틸러스', '인천유나이티드',
        '맨체스터시티', '아스널', '맨체스터유나이티드', '리버풀', '첼시', '토트넘',
        '레스터시티', '리즈유나이티드', '사우샘프턴', '번리', '미들즈브러', '왓포드',
        '레알마드리드', '바르셀로나', '아틀레티코마드리드', '세비야', '바이에른뮌헨',
        '도르트문트', '레버쿠젠', '인터밀란', 'AC밀란', '유벤투스', '나폴리'
    ];

    const matches = [];
    const statuses = ['scheduled', 'live', 'finished'];
    
    for (let i = 0; i < 25; i++) {
        const team1 = teams[Math.floor(Math.random() * teams.length)];
        const team2 = teams[Math.floor(Math.random() * teams.length)];
        const league = leagues[Math.floor(Math.random() * leagues.length)];
        
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
                id: `match-${i}`,
                homeTeam: team1,
                awayTeam: team2,
                homeScore: score1,
                awayScore: score2,
                date: date,
                status: status,
                venue: `${team1} 홈구장`,
                referee: '주심',
                leagueName: league
            });
        }
    }

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

// 실제 기사 로드 (크롤링)
async function loadArticles() {
    articlesLoading.style.display = 'block';
    articlesGrid.innerHTML = '';

    try {
        // 크롤링 시도 (타임아웃 설정)
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('크롤링 타임아웃')), 5000)
        );
        
        const crawlingPromise = crawlRealArticles();
        
        articles = await Promise.race([crawlingPromise, timeoutPromise]);
        
        if (articles.length === 0) {
            // 크롤링 실패시 시뮬레이션 데이터 사용
            articles = generateMockArticles();
        }
        displayArticles(articles);
    } catch (error) {
        console.error('기사 데이터 로드 실패:', error);
        // 에러 발생시 시뮬레이션 데이터 사용
        articles = generateMockArticles();
        displayArticles(articles);
    } finally {
        articlesLoading.style.display = 'none';
    }
}

// 실제 기사 크롤링 (개선된 버전)
async function crawlRealArticles() {
    const allArticles = [];
    
    try {
        // 여러 사이트에서 동시에 크롤링 시도
        const crawlingPromises = CRAWLING_CONFIG.NEWS_SITES.map(async (site) => {
            try {
                const response = await fetch(CRAWLING_CONFIG.PROXY_URL + encodeURIComponent(site), {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const html = await response.text();
                return parseArticlesFromHTML(html, site);
                
            } catch (error) {
                console.error(`기사 크롤링 실패: ${site}`, error);
                return [];
            }
        });
        
        const results = await Promise.allSettled(crawlingPromises);
        
        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                allArticles.push(...result.value);
            }
        });
        
    } catch (error) {
        console.error('기사 크롤링 중 오류 발생:', error);
    }
    
    return allArticles.sort((a, b) => b.publishedAt - a.publishedAt);
}

// HTML에서 기사 정보 파싱 (개선된 버전)
function parseArticlesFromHTML(html, site) {
    const articles = [];
    
    try {
        // 다양한 패턴으로 기사 정보 추출 시도
        const patterns = [
            /<article[^>]*>([\s\S]*?)<\/article>/gi,
            /<div[^>]*class="[^"]*(article|news|post)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
            /<div[^>]*class="[^"]*item[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
        ];
        
        patterns.forEach(pattern => {
            let article;
            while ((article = pattern.exec(html)) !== null && articles.length < 4) {
                const articleHtml = article[1] || article[2];
                
                // 제목 추출 (다양한 패턴 시도)
                const titlePatterns = [
                    /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i,
                    /<a[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/a>/i,
                    /<span[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/span>/i
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
                    const descPatterns = [
                        /<p[^>]*>([^<]+)<\/p>/i,
                        /<div[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)<\/div>/i,
                        /<span[^>]*class="[^"]*excerpt[^"]*"[^>]*>([^<]+)<\/span>/i
                    ];
                    
                    let description = '';
                    descPatterns.forEach(descPattern => {
                        const descMatch = articleHtml.match(descPattern);
                        if (descMatch && descMatch[1].trim().length > 20) {
                            description = descMatch[1].trim();
                        }
                    });
                    
                    // 링크 추출
                    const linkPatterns = [
                        /<a[^>]*href="([^"]*)"[^>]*>/i,
                        /<a[^>]*href='([^']*)'[^>]*>/i
                    ];
                    
                    let url = '';
                    linkPatterns.forEach(linkPattern => {
                        const linkMatch = articleHtml.match(linkPattern);
                        if (linkMatch && linkMatch[1]) {
                            url = linkMatch[1];
                        }
                    });
                    
                    articles.push({
                        id: `article-${articles.length}`,
                        title: title,
                        description: description || title,
                        source: getSourceFromUrl(site),
                        publishedAt: new Date(),
                        url: url.startsWith('http') ? url : site + url,
                        content: description || title
                    });
                }
            }
        });
        
    } catch (error) {
        console.error('기사 HTML 파싱 실패:', error);
    }
    
    return articles;
}

// URL에서 소스 추출
function getSourceFromUrl(url) {
    if (url.includes('goal')) return 'Goal.com';
    if (url.includes('football365')) return 'Football365';
    if (url.includes('90min')) return '90min';
    return '축구 뉴스';
}

// 시뮬레이션 기사 데이터 생성 (크롤링 실패시 사용)
function generateMockArticles() {
    const mockArticles = [
        {
            id: 'article-1',
            title: "손흥민, 프리미어리그 득점왕 경쟁에서 선두",
            description: "토트넘의 손흥민이 이번 시즌 프리미어리그 득점왕 경쟁에서 선두를 달리고 있다. 지난 경기에서도 멀티골을 기록하며 팀의 승리를 이끌었다.",
            source: "ESPN",
            publishedAt: new Date(Date.now() - Math.random() * 86400000 * 7),
            url: "#",
            content: "토트넘의 손흥민이 이번 시즌 프리미어리그 득점왕 경쟁에서 선두를 달리고 있다. 지난 경기에서도 멀티골을 기록하며 팀의 승리를 이끌었다. 손흥민은 현재 15골을 기록하며 득점왕 경쟁에서 1위를 달리고 있으며, 팀의 핵심 공격수로서 맹활약을 펼치고 있다."
        },
        {
            id: 'article-2',
            title: "K리그 1, 2024 시즌 개막전 성황리에 마무리",
            description: "2024 K리그 1 시즌이 성황리에 개막했다. 개막전에서 울산현대와 전북현대의 대결이 가장 큰 관심을 받았다.",
            source: "스포츠조선",
            publishedAt: new Date(Date.now() - Math.random() * 86400000 * 7),
            url: "#",
            content: "2024 K리그 1 시즌이 성황리에 개막했다. 개막전에서 울산현대와 전북현대의 대결이 가장 큰 관심을 받았다. 두 팀은 치열한 경기를 펼쳤으며, 결국 2-2 무승부로 마무리되었다. 팬들은 올 시즌도 흥미진진할 것으로 기대하고 있다."
        },
        {
            id: 'article-3',
            title: "맨체스터시티, 챔피언스리그 4강 진출 확정",
            description: "맨체스터시티가 챔피언스리그 8강에서 승리하며 4강 진출을 확정지었다. 하알란드의 해트트릭이 승리의 주역이었다.",
            source: "BBC Sport",
            publishedAt: new Date(Date.now() - Math.random() * 86400000 * 7),
            url: "#",
            content: "맨체스터시티가 챔피언스리그 8강에서 승리하며 4강 진출을 확정지었다. 하알란드의 해트트릭이 승리의 주역이었다. 시티는 홈에서 3-0 승리를 거두며 압도적인 경기력을 보여주었고, 이제 4강에서 더욱 치열한 경쟁을 펼칠 예정이다."
        },
        {
            id: 'article-4',
            title: "김민재, 바이에른 뮌헨에서 안정적인 활약",
            description: "바이에른 뮌헨의 김민재가 부상 복귀 후 안정적인 활약을 보이고 있다. 팀의 수비 안정성에 큰 기여를 하고 있다.",
            source: "Kicker",
            publishedAt: new Date(Date.now() - Math.random() * 86400000 * 7),
            url: "#",
            content: "바이에른 뮌헨의 김민재가 부상 복귀 후 안정적인 활약을 보이고 있다. 팀의 수비 안정성에 큰 기여를 하고 있다. 김민재는 최근 경기에서 뛰어난 수비력을 보여주며 팀의 승리에 기여하고 있으며, 팬들과 전문가들로부터 높은 평가를 받고 있다."
        },
        {
            id: 'article-5',
            title: "챔피언십 리그, 승격 플레이오프 경쟁 치열",
            description: "영국 챔피언십 리그에서 승격 플레이오프 진출을 위한 경쟁이 치열하다. 상위권 팀들 간의 점수 차이가 미세하다.",
            source: "Sky Sports",
            publishedAt: new Date(Date.now() - Math.random() * 86400000 * 7),
            url: "#",
            content: "영국 챔피언십 리그에서 승격 플레이오프 진출을 위한 경쟁이 치열하다. 상위권 팀들 간의 점수 차이가 미세하다. 레스터시티, 리즈유나이티드, 사우샘프턴 등이 치열한 경쟁을 펼치고 있으며, 시즌 마지막까지 승격 경쟁이 이어질 것으로 예상된다."
        },
        {
            id: 'article-6',
            title: "이강인, PSG에서 주전 경쟁 치열",
            description: "파리 생제르맹의 이강인이 팀 내 주전 경쟁에서 좋은 모습을 보이고 있다. 최근 경기에서도 좋은 활약을 펼쳤다.",
            source: "L'Equipe",
            publishedAt: new Date(Date.now() - Math.random() * 86400000 * 7),
            url: "#",
            content: "파리 생제르맹의 이강인이 팀 내 주전 경쟁에서 좋은 모습을 보이고 있다. 최근 경기에서도 좋은 활약을 펼쳤다. 이강인은 기술적인 플레이와 창의적인 패스로 팀의 공격에 활기를 불어넣고 있으며, 감독과 팀 동료들로부터 신뢰를 받고 있다."
        }
    ];

    return mockArticles.sort((a, b) => b.publishedAt - a.publishedAt);
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