// 전역 변수
let currentFilter = 'upcoming';
let matches = [];
let articles = [];
let koreanNews = [];
let internationalNews = [];

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
const refreshInternationalNewsBtn = document.getElementById('refresh-international-news');
const matchModal = document.getElementById('match-modal');
const matchModalBody = document.getElementById('match-modal-body');
const articleModal = document.getElementById('article-modal');
const articleModalBody = document.getElementById('article-modal-body');
const newsModal = document.getElementById('news-modal');
const newsModalBody = document.getElementById('news-modal-body');
const closeModal = document.querySelectorAll('.close');
// 채팅 관련 요소들은 chat.js에서 처리

// 한국 축구 뉴스 관련 요소들
const newsSearch = document.getElementById('news-search');
const searchBtn = document.getElementById('search-btn');

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    
    // 초기 로딩 메시지 표시
    showLoading('korean-news');
    showLoading('international-news');
    
    loadKoreanNews();
    loadInternationalNews();
    // loadMatches(); // 향후 개발 예정
    // loadArticles(); // 향후 개발 예정
    // 채팅 시스템은 chat.js에서 처리
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
    
    // 해외 축구 뉴스 이벤트
    if (refreshInternationalNewsBtn) {
        refreshInternationalNewsBtn.addEventListener('click', refreshInternationalNews);
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', searchKoreanNews);
    }
    
    // 국내 축구 뉴스 검색 이벤트 (ID 수정)
    const koreanNewsSearch = document.getElementById('korean-news-search');
    if (koreanNewsSearch) {
        koreanNewsSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchKoreanNews();
            }
        });
    }
    
    // 해외 축구 뉴스 검색 이벤트
    const internationalNewsSearch = document.getElementById('international-news-search');
    if (internationalNewsSearch) {
        internationalNewsSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchInternationalNews();
            }
        });
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
            // 채팅 종료
            stopChat();
        });
    });

    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', (e) => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
                // 채팅 종료
                stopChat();
            }
        });
    });

    // 채팅 시스템은 chat.js에서 처리
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
            await loadNewsStats(cachedNews);
            displayKoreanNews(cachedNews);
        }
        
        // 새로운 뉴스 수집
        const news = await window.koreanFootballNews.collectAllNews();
        koreanNews = news;
        
        // 캐시 업데이트
        window.koreanFootballNews.updateCache(news);
        
        // 통계 데이터 로드
        await loadNewsStats(news);
        displayKoreanNews(news);
        
        hideLoading('korean-news');
        
    } catch (error) {
        console.error('한국 축구 뉴스 로드 실패:', error);
        hideLoading('korean-news');
        showError('korean-news', '뉴스를 불러오는 중 오류가 발생했습니다.');
    }
}

// 한국 축구 뉴스 새로고침
async function refreshKoreanNews() {
    try {
        showLoading('korean-news');
        
        if (window.koreanFootballNews) {
            const news = await window.koreanFootballNews.collectAllNews();
            koreanNews = news;
            displayKoreanNews(news);
        }
        
        hideLoading('korean-news');
    } catch (error) {
        console.error('뉴스 새로고침 실패:', error);
        hideLoading('korean-news');
    }
}

// 해외 축구 뉴스 로드
async function loadInternationalNews() {
    try {
        showLoading('international-news');
        
        // 캐시된 뉴스가 있으면 먼저 표시
        const cachedNews = window.internationalFootballNews.getCachedNews();
        if (cachedNews.length > 0) {
            internationalNews = cachedNews;
            await loadNewsStats(cachedNews);
            displayInternationalNews(cachedNews);
        }
        
        // 새로운 뉴스 수집
        const news = await window.internationalFootballNews.collectAllNews();
        internationalNews = news;
        
        // 캐시 업데이트
        window.internationalFootballNews.updateCache(news);
        
        // 통계 데이터 로드
        await loadNewsStats(news);
        displayInternationalNews(news);
        
        hideLoading('international-news');
        
    } catch (error) {
        console.error('해외 축구 뉴스 로드 실패:', error);
        hideLoading('international-news');
        showError('international-news', '뉴스를 불러오는 중 오류가 발생했습니다.');
    }
}

// 해외 축구 뉴스 새로고침
async function refreshInternationalNews() {
    try {
        showLoading('international-news');
        
        if (window.internationalFootballNews) {
            const news = await window.internationalFootballNews.collectAllNews();
            internationalNews = news;
            displayInternationalNews(news);
        }
        
        hideLoading('international-news');
    } catch (error) {
        console.error('해외 축구 뉴스 새로고침 실패:', error);
        hideLoading('international-news');
        showError('international-news', '뉴스를 새로고침하는 중 오류가 발생했습니다.');
    }
}

// 한국 축구 뉴스 표시
function displayKoreanNews(newsToDisplay) {
    const koreanNewsGrid = document.getElementById('korean-news-grid');
    
    if (!newsToDisplay || newsToDisplay.length === 0) {
        koreanNewsGrid.innerHTML = `
            <div class="no-data">
                <i class="fas fa-search"></i>
                <p>검색 결과가 없습니다.</p>
            </div>
        `;
        return;
    }
    
    koreanNewsGrid.innerHTML = newsToDisplay.map(news => `
        <div class="news-card" onclick="openNewsModal('${news.id}')">
            <div class="news-card-header">
                <h3 class="news-title">${news.title}</h3>
                <div class="news-meta">
                    <div class="news-source-group">
                        <span class="news-source">${news.source}</span>
                        ${news.reporter ? `<span class="news-reporter">${news.reporter} 기자</span>` : ''}
                    </div>
                    <span class="news-date">${formatDate(news.publishedAt)}</span>
                </div>
            </div>
            <div class="news-card-body">
                <p class="news-summary">${news.summary}</p>
                <div class="news-stats">
                    <div class="news-stats-item">
                        <i class="fas fa-eye"></i>
                        <span class="view-count" data-news-id="${news.id}">${news.viewCount || 0}</span>
                    </div>
                    <div class="news-stats-item">
                        <button class="like-btn ${news.isLiked ? 'liked' : ''}" onclick="toggleLike('${news.id}', event)">
                            <i class="fas fa-heart"></i>
                            <span class="like-count" data-news-id="${news.id}">${news.likeCount || 0}</span>
                        </button>
                    </div>
                    ${news.hasChat ? '<div class="chat-indicator"><i class="fas fa-comments"></i> 채팅</div>' : ''}
                </div>
                <div class="news-actions">
                    <a href="${news.link}" target="_blank" class="btn btn-primary" onclick="event.stopPropagation()">
                        <i class="fas fa-external-link-alt"></i>
                        원문 보기
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

// 한국 축구 뉴스 수집 완료 후 처리
async function onKoreanNewsCollected(news) {
    // 각 뉴스에 대한 통계 데이터 로드
    await loadNewsStats(news);
    displayKoreanNews(news);
}

// 한국 축구 뉴스 검색
function searchKoreanNews() {
    const searchTerm = document.getElementById('korean-news-search').value.toLowerCase();
    
    if (!koreanNews || koreanNews.length === 0) {
        return;
    }
    
    const filteredNews = koreanNews.filter(news => 
        news.title.toLowerCase().includes(searchTerm) ||
        news.description.toLowerCase().includes(searchTerm) ||
        news.source.toLowerCase().includes(searchTerm)
    );
    
    displayKoreanNews(filteredNews);
}

// 한국 축구 뉴스 새로고침 (중복 제거)

// 좋아요 토글 함수
async function toggleLike(newsId, event) {
    event.stopPropagation();
    
    try {
        const userId = getUserId();
        const safeNewsId = sanitizeFirebasePath(newsId);
        const likeRef = database.ref(`news/${safeNewsId}/likes/${userId}`);
        const likeSnapshot = await likeRef.once('value');
        
        if (likeSnapshot.exists()) {
            // 이미 좋아요를 눌렀다면 제거
            await likeRef.remove();
            await updateLikeCount(newsId, -1);
            updateLikeButtonUI(newsId, false);
        } else {
            // 좋아요 추가
            await likeRef.set({
                timestamp: Date.now(),
                userId: userId
            });
            await updateLikeCount(newsId, 1);
            updateLikeButtonUI(newsId, true);
        }
    } catch (error) {
        console.error('좋아요 처리 중 오류:', error);
    }
}

// 좋아요 수 업데이트
async function updateLikeCount(newsId, change) {
    try {
        const safeNewsId = sanitizeFirebasePath(newsId);
        const newsRef = database.ref(`news/${safeNewsId}`);
        const newsSnapshot = await newsRef.once('value');
        
        if (newsSnapshot.exists()) {
            const currentCount = newsSnapshot.val().likeCount || 0;
            const newCount = Math.max(0, currentCount + change);
            await newsRef.update({ likeCount: newCount });
            
            // UI 업데이트
            const likeCountElement = document.querySelector(`[data-news-id="${newsId}"].like-count`);
            if (likeCountElement) {
                likeCountElement.textContent = newCount;
            }
        }
    } catch (error) {
        console.error('좋아요 수 업데이트 중 오류:', error);
    }
}

// 좋아요 버튼 UI 업데이트
function updateLikeButtonUI(newsId, isLiked) {
    const likeBtn = document.querySelector(`[onclick*="${newsId}"]`);
    if (likeBtn) {
        if (isLiked) {
            likeBtn.classList.add('liked');
        } else {
            likeBtn.classList.remove('liked');
        }
    }
}

// 조회수 증가 함수
async function incrementViewCount(newsId) {
    try {
        const safeNewsId = sanitizeFirebasePath(newsId);
        const newsRef = database.ref(`news/${safeNewsId}`);
        const newsSnapshot = await newsRef.once('value');
        
        if (newsSnapshot.exists()) {
            const currentCount = newsSnapshot.val().viewCount || 0;
            const newCount = currentCount + 1;
            await newsRef.update({ viewCount: newCount });
            
            // UI 업데이트
            const viewCountElement = document.querySelector(`[data-news-id="${newsId}"].view-count`);
            if (viewCountElement) {
                viewCountElement.textContent = newCount;
            }
        } else {
            // 뉴스가 존재하지 않으면 새로 생성
            await newsRef.set({
                viewCount: 1,
                likeCount: 0,
                createdAt: Date.now()
            });
        }
    } catch (error) {
        console.error('조회수 증가 중 오류:', error);
    }
}

// 채팅 존재 여부 확인 및 표시
async function checkAndDisplayChatStatus(newsId) {
    try {
        const safeNewsId = sanitizeFirebasePath(newsId);
        const chatRef = database.ref(`chats/${safeNewsId}`);
        const chatSnapshot = await chatRef.once('value');
        
        if (chatSnapshot.exists()) {
            const messages = chatSnapshot.val();
            const hasMessages = Object.keys(messages).length > 0;
            
            if (hasMessages) {
                // 뉴스 데이터에 채팅 표시 플래그 추가
                const safeNewsId = sanitizeFirebasePath(newsId);
                const newsRef = database.ref(`news/${safeNewsId}`);
                await newsRef.update({ hasChat: true });
                
                // UI에 채팅 표시 추가
                const newsCard = document.querySelector(`[onclick*="${newsId}"]`);
                if (newsCard && !newsCard.querySelector('.chat-indicator')) {
                    const newsStats = newsCard.querySelector('.news-stats');
                    if (newsStats) {
                        const chatIndicator = document.createElement('div');
                        chatIndicator.className = 'chat-indicator';
                        chatIndicator.innerHTML = '<i class="fas fa-comments"></i> 채팅';
                        newsStats.appendChild(chatIndicator);
                    }
                }
            }
        }
    } catch (error) {
        console.error('채팅 상태 확인 중 오류:', error);
    }
}

// 사용자 ID 생성/가져오기
function getUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        userId = userId.replace(/[.#$\[\]]/g, '_');
        localStorage.setItem('userId', userId);
    }
    return userId;
}

// Firebase 경로를 안전하게 만드는 함수
function sanitizeFirebasePath(path) {
    return path.replace(/[.#$\[\]]/g, '_').replace(/-/g, '_');
}

// 뉴스 통계 데이터 로드
async function loadNewsStats(newsArray) {
    try {
        const userId = getUserId();
        
        for (const news of newsArray) {
            // Firebase에서 뉴스 통계 데이터 가져오기
            const safeNewsId = sanitizeFirebasePath(news.id);
            const newsRef = database.ref(`news/${safeNewsId}`);
            const newsSnapshot = await newsRef.once('value');
            
            if (newsSnapshot.exists()) {
                const stats = newsSnapshot.val();
                news.viewCount = stats.viewCount || 0;
                news.likeCount = stats.likeCount || 0;
                
                // 사용자의 좋아요 상태 확인
                if (stats.likes && stats.likes[userId]) {
                    news.isLiked = true;
                } else {
                    news.isLiked = false;
                }
                
                // 채팅 존재 여부 확인
                news.hasChat = stats.hasChat || false;
            } else {
                // 기본값 설정
                news.viewCount = 0;
                news.likeCount = 0;
                news.isLiked = false;
                news.hasChat = false;
            }
        }
    } catch (error) {
        console.error('뉴스 통계 로드 중 오류:', error);
    }
}

// 해외 축구 뉴스 표시
function displayInternationalNews(newsToDisplay) {
    const internationalNewsGrid = document.getElementById('international-news-grid');
    
    if (!newsToDisplay || newsToDisplay.length === 0) {
        internationalNewsGrid.innerHTML = `
            <div class="no-data">
                <i class="fas fa-search"></i>
                <p>검색 결과가 없습니다.</p>
            </div>
        `;
        return;
    }
    
    internationalNewsGrid.innerHTML = newsToDisplay.map(news => `
        <div class="news-card" onclick="openInternationalNewsModal('${news.id}')">
            <div class="news-card-header">
                <h3 class="news-title">${news.title}</h3>
                <div class="news-meta">
                    <div class="news-source-group">
                        <span class="news-source">${news.source}</span>
                        ${news.reporter ? `<span class="news-reporter">${news.reporter} 기자</span>` : ''}
                    </div>
                    <span class="news-date">${formatDate(news.publishedAt)}</span>
                </div>
            </div>
            <div class="news-card-body">
                <p class="news-summary">${news.summary}</p>
                <div class="news-stats">
                    <div class="news-stats-item">
                        <i class="fas fa-eye"></i>
                        <span class="view-count" data-news-id="${news.id}">${news.viewCount || 0}</span>
                    </div>
                    <div class="news-stats-item">
                        <button class="like-btn ${news.isLiked ? 'liked' : ''}" onclick="toggleLike('${news.id}', event)">
                            <i class="fas fa-heart"></i>
                            <span class="like-count" data-news-id="${news.id}">${news.likeCount || 0}</span>
                        </button>
                    </div>
                    ${news.hasChat ? '<div class="chat-indicator"><i class="fas fa-comments"></i> 채팅</div>' : ''}
                </div>
                <div class="news-actions">
                    <a href="${news.link}" target="_blank" class="btn btn-primary" onclick="event.stopPropagation()">
                        <i class="fas fa-external-link-alt"></i>
                        원문 보기
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

// 해외 축구 뉴스 검색
function searchInternationalNews() {
    const searchTerm = document.getElementById('international-news-search').value.toLowerCase();
    
    if (!internationalNews || internationalNews.length === 0) {
        return;
    }
    
    const filteredNews = internationalNews.filter(news => 
        news.title.toLowerCase().includes(searchTerm) ||
        news.description.toLowerCase().includes(searchTerm) ||
        news.source.toLowerCase().includes(searchTerm)
    );
    
    displayInternationalNews(filteredNews);
}

// 뉴스 모달 열기
async function openNewsModal(newsId) {
    const news = koreanNews.find(n => n.id === newsId);
    if (!news || !newsModal) return;
    
    // 조회수 증가
    await incrementViewCount(newsId);
    
    // 채팅 상태 확인 및 표시
    await checkAndDisplayChatStatus(newsId);
    
    // 모달 내용 설정
    document.getElementById('modal-news-title').textContent = news.title;
    document.getElementById('modal-news-source').textContent = news.source;
    document.getElementById('modal-news-date').textContent = formatDate(news.publishedAt);
    document.getElementById('modal-news-summary').textContent = news.summary;
    document.getElementById('modal-news-link').href = news.link;
    
    // 채팅 시작 (뉴스 제목과 함께)
    startNewsChat(newsId, news.title);
    
    // 모달 표시
    newsModal.style.display = 'block';
}

// 채팅 시스템은 chat.js에서 처리

// 뉴스 모달 열기
async function openInternationalNewsModal(newsId) {
    const news = internationalNews.find(n => n.id === newsId);
    if (!news || !newsModal) return;
    
    // 조회수 증가
    await incrementViewCount(newsId);
    
    // 채팅 상태 확인 및 표시
    await checkAndDisplayChatStatus(newsId);
    
    // 모달 내용 설정
    document.getElementById('modal-news-title').textContent = news.title;
    document.getElementById('modal-news-source').textContent = news.source;
    document.getElementById('modal-news-date').textContent = formatDate(news.publishedAt);
    document.getElementById('modal-news-summary').textContent = news.summary;
    document.getElementById('modal-news-link').href = news.link;
    
    // 채팅 시작 (뉴스 제목과 함께)
    startNewsChat(newsId, news.title);
    
    // 모달 표시
    newsModal.style.display = 'block';
}

// 로딩 표시
function showLoading(type) {
    const loadingElement = document.getElementById(`${type}-loading`);
    if (loadingElement) {
        loadingElement.classList.remove('hidden');
    }
}

// 로딩 숨기기
function hideLoading(type) {
    const loadingElement = document.getElementById(`${type}-loading`);
    if (loadingElement) {
        loadingElement.classList.add('hidden');
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
    
    try {
        const d = new Date(date);
        
        // Invalid Date 체크
        if (isNaN(d.getTime())) {
            return '-';
        }
        
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
        
    } catch (error) {
        console.error('날짜 파싱 오류:', error);
        return '-';
    }
}

// 경기 데이터 로드
async function loadMatches() {
    try {
        showLoading('matches');
        
        if (window.realCrawler) {
            matches = await window.realCrawler.crawlMatches();
        } else {
            // 더미 데이터 제거 - 빈 배열 반환
            matches = [];
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
            // 더미 데이터 제거 - 빈 배열 반환
            articles = [];
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
        <div class="news-card" onclick="openArticleModal('${article.id}')">
            <div class="news-card-header">
                <h3 class="news-title">${article.title}</h3>
                <div class="news-meta">
                    <span class="news-source">${article.source}</span>
                    <span class="news-date">${formatDate(article.publishedAt)}</span>
                </div>
            </div>
            <div class="news-card-body">
                <p class="news-summary">${article.description}</p>
                <div class="news-actions">
                    <button class="btn btn-secondary" onclick="translateArticle('${article.id}', event)">
                        <i class="fas fa-language"></i>
                        번역하기
                    </button>
                    <a href="${article.url || '#'}" target="_blank" class="btn btn-primary" onclick="event.stopPropagation()">
                        <i class="fas fa-external-link-alt"></i>
                        원문 보기
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

// 기사 번역
async function translateArticle(articleId, event) {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;
    
    try {
        // 번역 중 표시
        const translateBtn = event.target;
        const originalText = translateBtn.innerHTML;
        translateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 번역중...';
        translateBtn.disabled = true;
        
        // 실제 번역 수행
        const translatedTitle = await translateText(article.title);
        const translatedDescription = await translateText(article.description);
        
        // 번역된 내용을 모달에 표시
        openArticleModal(articleId, {
            title: translatedTitle,
            description: translatedDescription,
            isTranslated: true
        });
        
        // 버튼 복원
        translateBtn.innerHTML = originalText;
        translateBtn.disabled = false;
        
    } catch (error) {
        console.error('번역 실패:', error);
        alert('번역 중 오류가 발생했습니다. 다시 시도해주세요.');
        
        // 버튼 복원
        const translateBtn = event.target;
        translateBtn.innerHTML = '<i class="fas fa-language"></i> 번역하기';
        translateBtn.disabled = false;
    }
}

// 실제 번역 함수 (무료 번역 API 사용)
async function translateText(text) {
    if (!text) return '';
    
    try {
        // LibreTranslate 무료 API 사용
        const response = await fetch('https://libretranslate.de/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text,
                source: 'en',
                target: 'ko',
                format: 'text'
            })
        });
        
        if (!response.ok) {
            throw new Error('번역 API 응답 실패');
        }
        
        const result = await response.json();
        return result.translatedText || text;
        
    } catch (error) {
        console.error('번역 API 오류:', error);
        
        // 폴백: 간단한 키워드 번역
        return fallbackTranslate(text);
    }
}

// 폴백 번역 (API 실패 시 사용)
function fallbackTranslate(text) {
    const translations = {
        'Manchester United': '맨체스터 유나이티드',
        'Liverpool': '리버풀',
        'Arsenal': '아스널',
        'Chelsea': '첼시',
        'Tottenham': '토트넘',
        'Manchester City': '맨체스터 시티',
        'Real Madrid': '레알 마드리드',
        'Barcelona': '바르셀로나',
        'Bayern Munich': '바이에른 뮌헨',
        'Borussia Dortmund': '보루시아 도르트문트',
        'Juventus': '유벤투스',
        'AC Milan': 'AC 밀란',
        'Inter Milan': '인터 밀란',
        'PSG': '파리 생제르맹',
        'Premier League': '프리미어 리그',
        'La Liga': '라 리가',
        'Bundesliga': '분데스리가',
        'Serie A': '세리에 A',
        'Ligue 1': '리그 1',
        'Champions League': '챔피언스 리그',
        'Europa League': '유로파 리그'
    };
    
    let translatedText = text;
    
    // 영어 단어를 한국어로 번역
    Object.keys(translations).forEach(english => {
        const regex = new RegExp(english, 'gi');
        translatedText = translatedText.replace(regex, translations[english]);
    });
    
    return translatedText;
}

// 채팅 시스템은 chat.js에서 처리

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

function openArticleModal(articleId, updatedArticle = null) {
    const article = articles.find(a => a.id === articleId);
    if (!article || !articleModal) return;

    let articleContent = `
        <div class="article-content">
            <h2>${article.title}</h2>
            <div class="article-meta">
                <span class="source">${article.source}</span>
                <span class="date">${formatDate(article.publishedAt)}</span>
            </div>
            <div class="article-text">
                <p>${article.description}</p>
            </div>
        </div>
    `;

    if (updatedArticle && updatedArticle.isTranslated) {
        articleContent += `
            <div class="article-translated-info">
                <p><strong>번역된 제목:</strong> ${updatedArticle.title}</p>
                <p><strong>번역된 내용:</strong> ${updatedArticle.description}</p>
            </div>
        `;
    }

    // 채팅 시작
    startArticleChat(articleId);
    
    articleModalBody.innerHTML = articleContent;
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