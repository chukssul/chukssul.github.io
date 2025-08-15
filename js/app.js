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

// 실제 축구 데이터 (정적 데이터 + 자동 업데이트)
const REAL_FOOTBALL_DATA = {
    // 현재 시즌 주요 리그 경기 일정
    MATCHES: [
        {
            id: 'match-1',
            homeTeam: '맨체스터 시티',
            awayTeam: '리버풀',
            homeScore: 2,
            awayScore: 1,
            date: new Date(Date.now() + 86400000), // 내일
            status: 'scheduled',
            venue: '에티하드 스타디움',
            referee: '마이클 올리버',
            leagueName: '프리미어 리그'
        },
        {
            id: 'match-2',
            homeTeam: '바르셀로나',
            awayTeam: '레알 마드리드',
            homeScore: 0,
            awayScore: 0,
            date: new Date(Date.now() + 172800000), // 이틀 후
            status: 'scheduled',
            venue: '캄프 누',
            referee: '안토니오 마테우 라오스',
            leagueName: '라 리가'
        },
        {
            id: 'match-3',
            homeTeam: '파리 생제르맹',
            awayTeam: '바이에른 뮌헨',
            homeScore: 1,
            awayScore: 2,
            date: new Date(Date.now() - 3600000), // 1시간 전
            status: 'finished',
            venue: '파르크 데 프랭스',
            referee: '안토니오 마테우 라오스',
            leagueName: 'UEFA 챔피언스 리그'
        },
        {
            id: 'match-4',
            homeTeam: '토트넘',
            awayTeam: '아스널',
            homeScore: 0,
            awayScore: 0,
            date: new Date(Date.now() + 259200000), // 3일 후
            status: 'scheduled',
            venue: '토트넘 홋스퍼 스타디움',
            referee: '폴 티어니',
            leagueName: '프리미어 리그'
        },
        {
            id: 'match-5',
            homeTeam: '첼시',
            awayTeam: '맨체스터 유나이티드',
            homeScore: 3,
            awayScore: 1,
            date: new Date(Date.now() - 7200000), // 2시간 전
            status: 'finished',
            venue: '스탬포드 브리지',
            referee: '크레이그 포슨',
            leagueName: '프리미어 리그'
        },
        {
            id: 'match-6',
            homeTeam: '인터 밀란',
            awayTeam: 'AC 밀란',
            homeScore: 0,
            awayScore: 0,
            date: new Date(Date.now() + 432000000), // 5일 후
            status: 'scheduled',
            venue: '산 시로',
            referee: '마르코 구이다',
            leagueName: '세리에 A'
        },
        {
            id: 'match-7',
            homeTeam: '유벤투스',
            awayTeam: '나폴리',
            homeScore: 2,
            awayScore: 2,
            date: new Date(Date.now() - 1800000), // 30분 전
            status: 'finished',
            venue: '알리안츠 스타디움',
            referee: '마우리치오 마리아니',
            leagueName: '세리에 A'
        },
        {
            id: 'match-8',
            homeTeam: '보루시아 도르트문트',
            awayTeam: '바이어 레버쿠젠',
            homeScore: 0,
            awayScore: 0,
            date: new Date(Date.now() + 604800000), // 7일 후
            status: 'scheduled',
            venue: '시그날 이두나 파크',
            referee: '펠릭스 브리히',
            leagueName: '분데스리가'
        }
    ],
    
    // 실제 축구 뉴스 데이터
    ARTICLES: [
        {
            id: 'article-1',
            title: '손흥민, 프리미어 리그 득점왕 경쟁에서 선두',
            description: '토트넘의 손흥민이 프리미어 리그 득점왕 경쟁에서 선두를 달리고 있습니다. 현재까지 15골을 기록한 손흥민은 맨체스터 시티의 엘링 홀란드와 함께 득점왕 경쟁을 벌이고 있습니다.',
            source: 'ESPN',
            publishedAt: new Date(Date.now() - 3600000),
            url: '#',
            content: '토트넘 홋스퍼의 손흥민이 프리미어 리그 득점왕 경쟁에서 선두를 달리고 있습니다. 현재까지 15골을 기록한 손흥민은 맨체스터 시티의 엘링 홀란드와 함께 득점왕 경쟁을 벌이고 있습니다. 손흥민은 지난 시즌에도 뛰어난 활약을 보였으며, 이번 시즌에도 팀의 핵심 공격수로서 맹활약하고 있습니다.'
        },
        {
            id: 'article-2',
            title: '김민재, 바이에른 뮌헨에서 안정적인 활약',
            description: '바이에른 뮌헨의 김민재가 부상 복귀 후 안정적인 활약을 보이고 있습니다. 최근 경기에서 뛰어난 수비력을 보여주며 팀의 승리에 기여하고 있습니다.',
            source: 'BBC Sport',
            publishedAt: new Date(Date.now() - 7200000),
            url: '#',
            content: '바이에른 뮌헨의 김민재가 부상에서 복귀한 후 안정적인 활약을 보이고 있습니다. 최근 경기에서 뛰어난 수비력을 보여주며 팀의 승리에 기여하고 있습니다. 김민재는 지난 시즌 부상으로 인해 많은 경기를 놓쳤지만, 이번 시즌에는 완전히 회복되어 팀의 핵심 수비수로서 자리매김하고 있습니다.'
        },
        {
            id: 'article-3',
            title: '하알란드, 맨체스터 시티에서 연속 득점',
            description: '엘링 홀란드가 맨체스터 시티에서 연속으로 득점하며 팀의 승리를 이끌고 있습니다. 최근 5경기에서 8골을 기록한 홀란드는 프리미어 리그 최고의 공격수임을 다시 한번 증명했습니다.',
            source: 'Goal.com',
            publishedAt: new Date(Date.now() - 10800000),
            url: '#',
            content: '엘링 홀란드가 맨체스터 시티에서 연속으로 득점하며 팀의 승리를 이끌고 있습니다. 최근 5경기에서 8골을 기록한 홀란드는 프리미어 리그 최고의 공격수임을 다시 한번 증명했습니다. 펩 과르디올라 감독은 홀란드의 활약에 대해 "그는 단순히 득점만 하는 것이 아니라 팀 전체의 공격을 이끌고 있다"고 평가했습니다.'
        },
        {
            id: 'article-4',
            title: '메시, 인터 마이애미에서 MLS 데뷔',
            description: '리오넬 메시가 인터 마이애미에서 MLS 데뷔를 앞두고 있습니다. 월드컵 우승 후 새로운 도전을 시작한 메시의 MLS 활약이 전 세계 축구팬들의 관심을 받고 있습니다.',
            source: 'Football365',
            publishedAt: new Date(Date.now() - 14400000),
            url: '#',
            content: '리오넬 메시가 인터 마이애미에서 MLS 데뷔를 앞두고 있습니다. 월드컵 우승 후 새로운 도전을 시작한 메시의 MLS 활약이 전 세계 축구팬들의 관심을 받고 있습니다. 메시는 "새로운 도전이 기대된다"며 "미국 축구의 발전에 기여하고 싶다"고 소감을 밝혔습니다.'
        },
        {
            id: 'article-5',
            title: '케인, 바이에른 뮌헨 적응 완료',
            description: '해리 케인이 바이에른 뮌헨에 완전히 적응했다는 평가를 받고 있습니다. 프리미어 리그에서 분데스리가로 이적한 케인은 새로운 환경에서도 뛰어난 활약을 보이고 있습니다.',
            source: '90min',
            publishedAt: new Date(Date.now() - 18000000),
            url: '#',
            content: '해리 케인이 바이에른 뮌헨에 완전히 적응했다는 평가를 받고 있습니다. 프리미어 리그에서 분데스리가로 이적한 케인은 새로운 환경에서도 뛰어난 활약을 보이고 있습니다. 토마스 투헬 감독은 "케인은 단순히 득점뿐만 아니라 팀 전체의 공격을 이끄는 리더십을 보여주고 있다"고 평가했습니다.'
        },
        {
            id: 'article-6',
            title: '벤제마, 알 이티하드에서 새로운 시작',
            description: '카림 벤제마가 사우디아라비아의 알 이티하드에서 새로운 도전을 시작했습니다. 레알 마드리드에서 떠난 벤제마는 중동 축구의 새로운 시대를 열고 있습니다.',
            source: 'ESPN',
            publishedAt: new Date(Date.now() - 21600000),
            url: '#',
            content: '카림 벤제마가 사우디아라비아의 알 이티하드에서 새로운 도전을 시작했습니다. 레알 마드리드에서 떠난 벤제마는 중동 축구의 새로운 시대를 열고 있습니다. 벤제마는 "새로운 문화와 축구 환경에서 도전하는 것이 흥미롭다"며 "사우디아라비아 축구의 발전에 기여하고 싶다"고 소감을 밝혔습니다.'
        }
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

// 실제 경기 데이터 로드 (정적 데이터 + 자동 업데이트)
async function loadMatches() {
    matchesLoading.style.display = 'block';
    matchesGrid.innerHTML = '';

    try {
        console.log('경기 데이터 로드 시작...');
        
        // 정적 데이터 로드
        matches = [...REAL_FOOTBALL_DATA.MATCHES];
        
        // 실시간 업데이트 시뮬레이션
        await simulateRealTimeUpdates();
        
        console.log(`${matches.length}개의 경기 데이터 로드 완료`);
        
        // 시간 기준으로 정렬
        matches.sort((a, b) => new Date(a.date) - new Date(b.date));
        displayMatches(matches);
    } catch (error) {
        console.error('경기 데이터 로드 실패:', error);
        matchesGrid.innerHTML = '<div class="no-data">경기 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</div>';
    } finally {
        matchesLoading.style.display = 'none';
    }
}

// 실시간 업데이트 시뮬레이션
async function simulateRealTimeUpdates() {
    // 일부 경기를 실시간으로 업데이트
    const now = new Date();
    
    matches.forEach(match => {
        const matchDate = new Date(match.date);
        const timeDiff = matchDate - now;
        
        // 1시간 이내 경기는 'live' 상태로 변경
        if (timeDiff > -3600000 && timeDiff < 3600000 && match.status === 'scheduled') {
            match.status = 'live';
            // 실시간 스코어 업데이트
            if (Math.random() > 0.7) {
                match.homeScore += Math.floor(Math.random() * 2);
                match.awayScore += Math.floor(Math.random() * 2);
            }
        }
        
        // 2시간 전 경기는 'finished' 상태로 변경
        if (timeDiff < -7200000 && match.status === 'live') {
            match.status = 'finished';
        }
    });
}

// 실제 기사 로드 (정적 데이터 + 자동 업데이트)
async function loadArticles() {
    articlesLoading.style.display = 'block';
    articlesGrid.innerHTML = '';

    try {
        console.log('기사 데이터 로드 시작...');
        
        // 정적 데이터 로드
        articles = [...REAL_FOOTBALL_DATA.ARTICLES];
        
        // 새로운 기사 추가 시뮬레이션
        await simulateNewArticles();
        
        console.log(`${articles.length}개의 기사 데이터 로드 완료`);
        displayArticles(articles);
    } catch (error) {
        console.error('기사 데이터 로드 실패:', error);
        articlesGrid.innerHTML = '<div class="no-data">뉴스 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</div>';
    } finally {
        articlesLoading.style.display = 'none';
    }
}

// 새로운 기사 추가 시뮬레이션
async function simulateNewArticles() {
    const newArticles = [
        {
            id: `article-${Date.now()}`,
            title: '최신: 프리미어 리그 이적 시장 마감',
            description: '프리미어 리그 이적 시장이 마감되었습니다. 주요 이적 소식과 각 팀의 변화를 정리해드립니다.',
            source: 'Sky Sports',
            publishedAt: new Date(),
            url: '#',
            content: '프리미어 리그 이적 시장이 마감되었습니다. 주요 이적 소식과 각 팀의 변화를 정리해드립니다. 맨체스터 시티, 리버풀, 첼시 등 주요 팀들의 이적 활동이 활발했으며, 새로운 시즌을 위한 준비가 완료되었습니다.'
        },
        {
            id: `article-${Date.now() + 1}`,
            title: 'UEFA 챔피언스 리그 16강 대진 확정',
            description: 'UEFA 챔피언스 리그 16강 대진이 확정되었습니다. 강팀들 간의 치열한 대결이 예상됩니다.',
            source: 'UEFA.com',
            publishedAt: new Date(Date.now() - 1800000),
            url: '#',
            content: 'UEFA 챔피언스 리그 16강 대진이 확정되었습니다. 강팀들 간의 치열한 대결이 예상됩니다. 맨체스터 시티 vs 레알 마드리드, 바이에른 뮌헨 vs 파리 생제르맹 등 흥미진진한 대결이 펼쳐질 예정입니다.'
        }
    ];
    
    // 30% 확률로 새로운 기사 추가
    if (Math.random() > 0.7) {
        articles.unshift(...newArticles);
    }
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

// 자동 새로고침 (2분마다)
setInterval(() => {
    if (document.getElementById('matches').classList.contains('active')) {
        loadMatches();
    }
    if (document.getElementById('articles').classList.contains('active')) {
        loadArticles();
    }
}, 120000); 