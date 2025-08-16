// 전역 변수
let currentFilter = 'upcoming';
let matches = [];
let articles = [];
let koreanNews = [];
let comments = {};

// 실제 크롤링을 위한 설정
const CRAWLING_CONFIG = {
    // 더 안정적인 프록시 서비스들
    PROXY_URLS: [
        'https://api.allorigins.win/raw?url=',
        'https://cors-anywhere.herokuapp.com/',
        'https://thingproxy.freeboard.io/fetch/',
        'https://api.codetabs.com/v1/proxy?quest=',
        'https://cors.bridged.cc/',
        'https://corsproxy.io/?'
    ],
    
    // 실제 크롤링 가능한 사이트들
    FOOTBALL_SITES: [
        'https://www.livescore.com/football/',
        'https://www.flashscore.com/football/',
        'https://www.transfermarkt.com/wettbewerbe/national',
        'https://www.soccerway.com/matches/',
        'https://www.whoscored.com/Regions/252/Tournaments/2/England-Premier-League'
    ],
    
    // 실제 뉴스 사이트들
    NEWS_SITES: [
        'https://www.bbc.com/sport/football',
        'https://www.espn.com/soccer/',
        'https://www.goal.com/en/news',
        'https://www.football365.com/',
        'https://www.90min.com/',
        'https://www.skysports.com/football'
    ],
    
    // User-Agent 목록
    USER_AGENTS: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    ],
    
    // 크롤링 설정
    CRAWLING_SETTINGS: {
        MAX_MATCHES_PER_LEAGUE: 20,
        MAX_NEWS_PER_SITE: 3,
        TIMEOUT: 15000,
        RETRY_ATTEMPTS: 3,
        DELAY_BETWEEN_REQUESTS: 2000
    }
};

// DOM 요소들
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');
const filterBtns = document.querySelectorAll('.filter-btn');
const matchesGrid = document.getElementById('matches-grid');
const articlesGrid = document.getElementById('articles-grid');
const koreanNewsGrid = document.getElementById('korean-news-grid');
const matchesLoading = document.getElementById('matches-loading');
const articlesLoading = document.getElementById('articles-loading');
const koreanNewsLoading = document.getElementById('korean-news-loading');
const refreshArticlesBtn = document.getElementById('refresh-articles');
const refreshKoreanNewsBtn = document.getElementById('refresh-korean-news');
const matchModal = document.getElementById('match-modal');
const matchModalBody = document.getElementById('match-modal-body');
const articleModal = document.getElementById('article-modal');
const articleModalBody = document.getElementById('article-modal-body');
const newsModal = document.getElementById('news-modal');
const newsModalBody = document.getElementById('news-modal-body');
const closeModal = document.querySelectorAll('.close');
const commentText = document.getElementById('comment-text');
const submitComment = document.getElementById('submit-comment');
const commentsList = document.getElementById('comments-list');
const newsCommentText = document.getElementById('news-comment-text');
const submitNewsComment = document.getElementById('submit-news-comment');
const newsCommentsList = document.getElementById('news-comments-list');

// 한국 축구 뉴스 관련 요소들
const newsSearch = document.getElementById('news-search');
const searchBtn = document.getElementById('search-btn');
const sourceFilter = document.getElementById('source-filter');
const totalNewsCount = document.getElementById('total-news-count');
const lastUpdate = document.getElementById('last-update');
const rssCount = document.getElementById('rss-count');

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadKoreanNews();
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
            currentFilter = btn.dataset.filter;
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            displayMatches();
        });
    });

    // 한국 축구 뉴스 이벤트
    if (refreshKoreanNewsBtn) {
        refreshKoreanNewsBtn.addEventListener('click', loadKoreanNews);
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', searchKoreanNews);
    }
    
    if (newsSearch) {
        newsSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchKoreanNews();
            }
        });
    }
    
    if (sourceFilter) {
        sourceFilter.addEventListener('change', filterKoreanNews);
    }

    // 해외 축구 기사 새로고침
    if (refreshArticlesBtn) {
        refreshArticlesBtn.addEventListener('click', loadArticles);
    }

    // 모달 닫기
    closeModal.forEach(close => {
        close.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });

    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', (e) => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    // 댓글 작성
    if (submitComment) {
        submitComment.addEventListener('click', addComment);
    }
    
    if (submitNewsComment) {
        submitNewsComment.addEventListener('click', addNewsComment);
    }
}

// 탭 전환
function switchTab(tabName) {
    navBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });

    tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === tabName) {
            content.classList.add('active');
        }
    });
}

// 한국 축구 뉴스 로드
async function loadKoreanNews() {
    try {
        showLoading('korean-news');
        
        // 캐시된 뉴스가 있으면 먼저 표시
        const cachedNews = window.koreanFootballNews.getCachedNews();
        if (cachedNews.length > 0) {
            koreanNews = cachedNews;
            displayKoreanNews();
            updateNewsStats();
        }
        
        // 새로운 뉴스 수집
        const news = await window.koreanFootballNews.collectAllNews();
        koreanNews = news;
        
        // 캐시 업데이트
        window.koreanFootballNews.updateCache(news);
        
        displayKoreanNews();
        updateNewsStats();
        
        hideLoading('korean-news');
        
    } catch (error) {
        console.error('한국 축구 뉴스 로드 실패:', error);
        hideLoading('korean-news');
        showError('korean-news', '뉴스를 불러오는 중 오류가 발생했습니다.');
    }
}

// 한국 축구 뉴스 표시
function displayKoreanNews(newsToDisplay = koreanNews) {
    if (!koreanNewsGrid) return;
    
    if (newsToDisplay.length === 0) {
        koreanNewsGrid.innerHTML = `
            <div class="no-data">
                <i class="fas fa-newspaper"></i>
                <p>표시할 뉴스가 없습니다.</p>
            </div>
        `;
        return;
    }
    
    koreanNewsGrid.innerHTML = newsToDisplay.map(news => `
        <div class="news-card" onclick="openNewsModal('${news.id}')">
            <div class="news-card-header">
                <h3 class="news-title">${news.title}</h3>
                <div class="news-meta">
                    <span class="news-source">${news.source}</span>
                    <span class="news-date">${formatDate(news.publishedAt)}</span>
                </div>
            </div>
            <div class="news-card-body">
                <p class="news-summary">${news.summary}</p>
                <div class="news-actions">
                    ${news.link !== '#' ? 
                        `<a href="${news.link}" target="_blank" class="btn btn-primary" onclick="event.stopPropagation()">
                            <i class="fas fa-external-link-alt"></i>
                            원문 보기
                        </a>` : 
                        `<span class="btn btn-secondary">
                            <i class="fas fa-info-circle"></i>
                            더미 뉴스
                        </span>`
                    }
                </div>
            </div>
        </div>
    `).join('');
}

// 뉴스 검색
function searchKoreanNews() {
    const keyword = newsSearch.value.trim();
    let filteredNews = koreanNews;
    
    if (keyword) {
        filteredNews = window.koreanFootballNews.searchNews(koreanNews, keyword);
    }
    
    displayKoreanNews(filteredNews);
}

// 소스별 필터링
function filterKoreanNews() {
    const selectedSource = sourceFilter.value;
    let filteredNews = koreanNews;
    
    if (selectedSource) {
        filteredNews = window.koreanFootballNews.filterBySource(koreanNews, selectedSource);
    }
    
    displayKoreanNews(filteredNews);
}

// 뉴스 통계 업데이트
function updateNewsStats() {
    if (totalNewsCount) {
        totalNewsCount.textContent = koreanNews.length;
    }
    
    if (lastUpdate) {
        const lastUpdateTime = window.koreanFootballNews.getLastUpdate();
        if (lastUpdateTime) {
            lastUpdate.textContent = formatDate(lastUpdateTime);
        } else {
            lastUpdate.textContent = '-';
        }
    }
    
    if (rssCount) {
        const rssNews = koreanNews.filter(news => news.type === 'rss');
        rssCount.textContent = rssNews.length;
    }
}

// 뉴스 모달 열기
function openNewsModal(newsId) {
    const news = koreanNews.find(n => n.id === newsId);
    if (!news || !newsModal) return;
    
    // 모달 내용 설정
    document.getElementById('modal-news-title').textContent = news.title;
    document.getElementById('modal-news-source').textContent = news.source;
    document.getElementById('modal-news-date').textContent = formatDate(news.publishedAt);
    document.getElementById('modal-news-summary').textContent = news.summary;
    document.getElementById('modal-news-link').href = news.link;
    
    // 댓글 로드
    loadNewsComments(newsId);
    
    // 모달 표시
    newsModal.style.display = 'block';
}

// 뉴스 댓글 로드
function loadNewsComments(newsId) {
    const newsComments = comments[`news-${newsId}`] || [];
    displayNewsComments(newsComments);
}

// 뉴스 댓글 표시
function displayNewsComments(newsComments) {
    if (!newsCommentsList) return;
    
    if (newsComments.length === 0) {
        newsCommentsList.innerHTML = '<p class="no-comments">아직 댓글이 없습니다.</p>';
        return;
    }
    
    newsCommentsList.innerHTML = newsComments.map(comment => `
        <div class="comment">
            <div class="comment-header">
                <span class="comment-author">${comment.author}</span>
                <span class="comment-date">${formatDate(comment.date)}</span>
            </div>
            <div class="comment-content">${comment.content}</div>
        </div>
    `).join('');
}

// 뉴스 댓글 추가
function addNewsComment() {
    const content = newsCommentText.value.trim();
    if (!content) return;
    
    const newsId = getCurrentNewsId();
    if (!newsId) return;
    
    const comment = {
        id: `comment-${Date.now()}`,
        content: content,
        author: '익명 사용자',
        date: new Date()
    };
    
    if (!comments[`news-${newsId}`]) {
        comments[`news-${newsId}`] = [];
    }
    comments[`news-${newsId}`].push(comment);
    
    // 로컬 스토리지에 저장
    localStorage.setItem('comments', JSON.stringify(comments));
    
    // 댓글 표시 업데이트
    displayNewsComments(comments[`news-${newsId}`]);
    
    // 입력 필드 초기화
    newsCommentText.value = '';
}

// 현재 뉴스 ID 가져오기
function getCurrentNewsId() {
    const title = document.getElementById('modal-news-title').textContent;
    return koreanNews.find(news => news.title === title)?.id;
}

// 로딩 표시
function showLoading(type) {
    const loadingElement = document.getElementById(`${type}-loading`);
    if (loadingElement) {
        loadingElement.style.display = 'flex';
    }
}

// 로딩 숨기기
function hideLoading(type) {
    const loadingElement = document.getElementById(`${type}-loading`);
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// 에러 표시
function showError(type, message) {
    const container = document.getElementById(`${type}-grid`);
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

// 날짜 포맷팅
function formatDate(date) {
    if (!date) return '-';
    
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    
    // 24시간 이내
    if (diff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (60 * 60 * 1000));
        if (hours === 0) {
            const minutes = Math.floor(diff / (60 * 1000));
            return `${minutes}분 전`;
        }
        return `${hours}시간 전`;
    }
    
    // 7일 이내
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        return `${days}일 전`;
    }
    
    // 그 외
    return d.toLocaleDateString('ko-KR');
}

// 경기 데이터 로드
async function loadMatches() {
    try {
        showLoading('matches');
        
        if (window.realCrawler) {
            matches = await window.realCrawler.crawlMatches();
        } else {
            // 폴백: 더미 데이터
            matches = generateDummyMatches();
        }
        
        displayMatches();
        hideLoading('matches');
        
    } catch (error) {
        console.error('경기 데이터 로드 실패:', error);
        hideLoading('matches');
        showError('matches', '경기 일정을 불러오는 중 오류가 발생했습니다.');
    }
}

// 경기 표시
function displayMatches() {
    if (!matchesGrid) return;
    
    let filteredMatches = matches;
    
    // 필터 적용
    switch (currentFilter) {
        case 'upcoming':
            filteredMatches = matches.filter(match => 
                new Date(match.date) > new Date()
            );
            break;
        case 'recent':
            filteredMatches = matches.filter(match => 
                new Date(match.date) <= new Date()
            );
            break;
    }
    
    if (filteredMatches.length === 0) {
        matchesGrid.innerHTML = `
            <div class="no-data">
                <i class="fas fa-calendar"></i>
                <p>표시할 경기가 없습니다.</p>
            </div>
        `;
        return;
    }
    
    matchesGrid.innerHTML = filteredMatches.map(match => `
        <div class="match-card" onclick="openMatchModal('${match.id}')">
            <div class="match-header">
                <span class="league-name">${match.leagueName}</span>
                <span class="match-status ${match.status}">${getStatusText(match.status)}</span>
            </div>
            <div class="match-teams">
                <div class="team home">
                    <span class="team-name">${match.homeTeam}</span>
                    <span class="score">${match.homeScore}</span>
                </div>
                <div class="vs">VS</div>
                <div class="team away">
                    <span class="team-name">${match.awayTeam}</span>
                    <span class="score">${match.awayScore}</span>
                </div>
            </div>
            <div class="match-info">
                <span class="match-date">${formatDate(match.date)}</span>
                <span class="match-venue">${match.venue}</span>
            </div>
        </div>
    `).join('');
}

// 기사 데이터 로드
async function loadArticles() {
    try {
        showLoading('articles');
        
        if (window.realCrawler) {
            articles = await window.realCrawler.crawlArticles();
        } else {
            // 폴백: 더미 데이터
            articles = generateDummyArticles();
        }
        
        displayArticles();
        hideLoading('articles');
        
    } catch (error) {
        console.error('기사 데이터 로드 실패:', error);
        hideLoading('articles');
        showError('articles', '기사를 불러오는 중 오류가 발생했습니다.');
    }
}

// 기사 표시
function displayArticles() {
    if (!articlesGrid) return;
    
    if (articles.length === 0) {
        articlesGrid.innerHTML = `
            <div class="no-data">
                <i class="fas fa-newspaper"></i>
                <p>표시할 기사가 없습니다.</p>
            </div>
        `;
        return;
    }
    
    articlesGrid.innerHTML = articles.map(article => `
        <div class="article-card" onclick="openArticleModal('${article.id}')">
            <div class="article-header">
                <h3 class="article-title">${article.title}</h3>
                <span class="article-source">${article.source}</span>
            </div>
            <div class="article-body">
                <p class="article-description">${article.description}</p>
                <div class="article-meta">
                    <span class="article-date">${formatDate(article.publishedAt)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// 댓글 로드
function loadComments() {
    const savedComments = localStorage.getItem('comments');
    if (savedComments) {
        comments = JSON.parse(savedComments);
    }
}

// 댓글 추가
function addComment() {
    const content = commentText.value.trim();
    if (!content) return;
    
    const articleId = getCurrentArticleId();
    if (!articleId) return;
    
    const comment = {
        id: `comment-${Date.now()}`,
        content: content,
        author: '익명 사용자',
        date: new Date()
    };
    
    if (!comments[articleId]) {
        comments[articleId] = [];
    }
    comments[articleId].push(comment);
    
    // 로컬 스토리지에 저장
    localStorage.setItem('comments', JSON.stringify(comments));
    
    // 댓글 표시 업데이트
    displayComments(comments[articleId]);
    
    // 입력 필드 초기화
    commentText.value = '';
}

// 댓글 표시
function displayComments(articleComments) {
    if (!commentsList) return;
    
    if (!articleComments || articleComments.length === 0) {
        commentsList.innerHTML = '<p class="no-comments">아직 댓글이 없습니다.</p>';
        return;
    }
    
    commentsList.innerHTML = articleComments.map(comment => `
        <div class="comment">
            <div class="comment-header">
                <span class="comment-author">${comment.author}</span>
                <span class="comment-date">${formatDate(comment.date)}</span>
            </div>
            <div class="comment-content">${comment.content}</div>
        </div>
    `).join('');
}

// 모달 열기 함수들
function openMatchModal(matchId) {
    const match = matches.find(m => m.id === matchId);
    if (!match || !matchModal) return;
    
    matchModalBody.innerHTML = `
        <h2>${match.homeTeam} vs ${match.awayTeam}</h2>
        <div class="match-details">
            <p><strong>리그:</strong> ${match.leagueName}</p>
            <p><strong>날짜:</strong> ${formatDate(match.date)}</p>
            <p><strong>경기장:</strong> ${match.venue}</p>
            <p><strong>주심:</strong> ${match.referee}</p>
            <p><strong>상태:</strong> ${getStatusText(match.status)}</p>
        </div>
    `;
    
    matchModal.style.display = 'block';
}

function openArticleModal(articleId) {
    const article = articles.find(a => a.id === articleId);
    if (!article || !articleModal) return;
    
    articleModalBody.innerHTML = `
        <div class="article-content">
            <h2>${article.title}</h2>
            <div class="article-meta">
                <span class="source">${article.source}</span>
                <span class="date">${formatDate(article.publishedAt)}</span>
            </div>
            <div class="article-text">
                <p>${article.content}</p>
            </div>
        </div>
    `;
    
    // 댓글 로드
    const articleComments = comments[articleId] || [];
    displayComments(articleComments);
    
    articleModal.style.display = 'block';
}

// 유틸리티 함수들
function getStatusText(status) {
    const statusMap = {
        'scheduled': '예정',
        'live': '진행중',
        'finished': '종료',
        'postponed': '연기',
        'cancelled': '취소'
    };
    return statusMap[status] || status;
}

function getCurrentArticleId() {
    const title = document.querySelector('#article-modal h2')?.textContent;
    return articles.find(article => article.title === title)?.id;
}

// 더미 데이터 생성 (폴백용)
function generateDummyMatches() {
    return [
        {
            id: 'match-1',
            homeTeam: '맨체스터 유나이티드',
            awayTeam: '리버풀',
            homeScore: 0,
            awayScore: 0,
            date: new Date(Date.now() + 24 * 60 * 60 * 1000),
            status: 'scheduled',
            venue: '올드 트래포드',
            referee: '마이클 올리버',
            leagueName: '프리미어 리그'
        }
    ];
}

function generateDummyArticles() {
    return [
        {
            id: 'article-1',
            title: '손흥민, 토트넘에서 활약',
            description: '한국 대표팀 주장 손흥민이 토트넘에서 좋은 활약을 보이고 있습니다.',
            source: 'BBC Sport',
            publishedAt: new Date(),
            content: '손흥민 선수가 토트넘에서 뛰어난 활약을 보이고 있습니다...'
        }
    ];
} 