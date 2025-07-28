// 전역 변수
let posts = JSON.parse(localStorage.getItem('posts')) || [];
let currentPostId = null;
let userProfile = JSON.parse(localStorage.getItem('userProfile')) || {
    nickname: '',
    avatar: '',
    bio: '',
    favoriteTeam: ''
};
let commonTags = ['프리미어리그', '라리가', '세리에A', '분데스리가', '리그1', '한국축구', '월드컵', '유로', '챔피언스리그', '토트넘', '맨유', '맨시티', '아스날', '첼시', '리버풀', '바르셀로나', '레알마드리드', '유벤투스', 'AC밀란', '인터밀란', '바이에른뮌헨', 'PSG'];

// DOM 요소들
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');
const postForm = document.getElementById('post-form');
const postsContainer = document.getElementById('posts-container');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const sortSelect = document.getElementById('sort-select');
const tagFilter = document.getElementById('tag-filter');
const modal = document.getElementById('post-modal');
const modalBody = document.getElementById('modal-body');
const closeModal = document.querySelector('.close');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const themeToggle = document.getElementById('theme-toggle');
const postImageInput = document.getElementById('post-image');
const imagePreview = document.getElementById('image-preview');
const postTagsInput = document.getElementById('post-tags');
const tagSuggestions = document.getElementById('tag-suggestions');
const profileElements = {
    nickname: document.getElementById('profile-nickname'),
    avatar: document.getElementById('profile-avatar'),
    bio: document.getElementById('profile-bio'),
    favoriteTeam: document.getElementById('favorite-team'),
    saveBtn: document.getElementById('save-profile'),
    avatarPreview: document.getElementById('avatar-preview'),
    postsCount: document.getElementById('user-posts-count'),
    commentsCount: document.getElementById('user-comments-count'),
    likesReceived: document.getElementById('user-likes-received')
};

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // 샘플 데이터 추가 (처음 방문시에만)
    if (posts.length === 0) {
        addSamplePosts();
    }
    
    setupEventListeners();
    displayPosts();
    loadTheme();
    loadProfile();
    updateTagFilter();
    updateUserStats();
    setupTagSuggestions();
}

function addSamplePosts() {
    const samplePosts = [
        {
            id: generateId(),
            playerName: '손흥민',
            title: '손흥민의 최근 경기력에 대해',
            content: '최근 손흥민 선수의 경기력이 정말 인상적입니다. 특히 지난 경기에서 보여준 플레이메이킹 능력과 골 결정력이 뛰어났다고 생각해요. 여러분은 어떻게 생각하시나요?',
            author: '축구팬123',
            date: new Date(Date.now() - 86400000).toISOString(), // 1일 전
            image: '',
            tags: ['프리미어리그', '토트넘', '한국축구'],
            likes: 15,
            dislikes: 2,
            likedBy: [],
            dislikedBy: [],
            comments: [
                {
                    id: generateId(),
                    author: '토트넘러버',
                    content: '정말 동감합니다! 손흥민은 언제나 기대를 저버리지 않는 선수예요.',
                    date: new Date(Date.now() - 43200000).toISOString() // 12시간 전
                }
            ]
        },
        {
            id: generateId(),
            playerName: '메시',
            title: '메시의 인터 마이애미 활약상',
            content: 'MLS에서의 메시 활약이 정말 대단하네요. 나이가 많음에도 불구하고 여전히 월드클래스의 실력을 보여주고 있습니다.',
            author: '메시팬',
            date: new Date(Date.now() - 172800000).toISOString(), // 2일 전
            image: '',
            tags: ['MLS', '바르셀로나', '아르헨티나'],
            likes: 8,
            dislikes: 0,
            likedBy: [],
            dislikedBy: [],
            comments: []
        },
        {
            id: generateId(),
            playerName: '김민재',
            title: '김민재 바이에른 뮌헨 적응기',
            content: '김민재 선수가 바이에른 뮌헨에서 잘 적응하고 있는 것 같아서 기쁩니다. 분데스리가에서의 활약을 기대해봅니다!',
            author: '한국축구사랑',
            date: new Date(Date.now() - 259200000).toISOString(), // 3일 전
            image: '',
            tags: ['분데스리가', '바이에른뮌헨', '한국축구'],
            likes: 23,
            dislikes: 1,
            likedBy: [],
            dislikedBy: [],
            comments: [
                {
                    id: generateId(),
                    author: '뮌헨팬',
                    content: '김민재 정말 든든한 수비수예요. 팀에 꼭 필요한 선수입니다.',
                    date: new Date(Date.now() - 216000000).toISOString()
                },
                {
                    id: generateId(),
                    author: '축구매니아',
                    content: '한국 선수가 바이에른에서 활약하는 모습이 정말 자랑스럽네요!',
                    date: new Date(Date.now() - 180000000).toISOString()
                }
            ]
        }
    ];
    
    posts = samplePosts;
    localStorage.setItem('posts', JSON.stringify(posts));
}

function setupEventListeners() {
    // 탭 네비게이션
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // 포스트 작성 폼
    postForm.addEventListener('submit', handlePostSubmit);
    
    // 검색 기능
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    // 정렬 기능
    sortSelect.addEventListener('change', handleSort);
    
    // 모달 닫기
    closeModal.addEventListener('click', closePostModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closePostModal();
    });
    
    // 태그 필터
    tagFilter.addEventListener('change', handleTagFilter);
    
    // 다크모드 토글
    themeToggle.addEventListener('click', toggleTheme);
    
    // 이미지 업로드
    postImageInput.addEventListener('change', handleImageUpload);
    
    // 태그 입력
    postTagsInput.addEventListener('input', handleTagInput);
    
    // 프로필 관련
    profileElements.saveBtn.addEventListener('click', saveProfile);
    profileElements.avatar.addEventListener('change', handleAvatarUpload);
}

function switchTab(tabName) {
    // 네비게이션 버튼 활성화
    navBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // 탭 콘텐츠 표시
    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
}

async function handlePostSubmit(e) {
    e.preventDefault();
    
    const playerName = document.getElementById('player-name').value.trim();
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    const author = document.getElementById('author-name').value.trim();
    const tagsInput = document.getElementById('post-tags').value.trim();
    
    if (!playerName || !title || !content || !author) {
        showToast('모든 필드를 입력해주세요!');
        return;
    }
    
    // 태그 처리
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    // 이미지 처리 - GitHub Storage 사용
    let imageUrl = '';
    const imageFile = document.getElementById('post-image').files[0];
    
    if (imageFile) {
        try {
            if (!window.GitHubImageStorage || !GitHubImageStorage.prototype.token) {
                showToast('GitHub 토큰이 설정되지 않았습니다. 콘솔에서 setGitHubToken("YOUR_TOKEN")을 실행하세요.');
                return;
            }
            
            showToast('이미지를 업로드하는 중...');
            const storage = new GitHubImageStorage();
            imageUrl = await storage.uploadImage(imageFile);
            showToast('이미지 업로드 완료!');
        } catch (error) {
            console.error('Image upload failed:', error);
            showToast(`이미지 업로드 실패: ${error.message}`);
            return;
        }
    }
    
    const newPost = {
        id: generateId(),
        playerName,
        title,
        content,
        author,
        date: new Date().toISOString(),
        image: imageUrl,
        tags,
        likes: 0,
        dislikes: 0,
        likedBy: [],
        dislikedBy: [],
        comments: []
    };
    
    posts.unshift(newPost); // 최신 포스트를 맨 앞에 추가
    localStorage.setItem('posts', JSON.stringify(posts));
    
    // 폼 리셋
    postForm.reset();
    imagePreview.style.display = 'none';
    imagePreview.innerHTML = '';
    
    // 홈 탭으로 이동
    switchTab('home');
    displayPosts();
    updateTagFilter();
    updateUserStats();
    
    showToast('포스트가 성공적으로 작성되었습니다!');
}

function displayPosts(postsToShow = posts) {
    if (postsToShow.length === 0) {
        postsContainer.innerHTML = '<div class="no-posts">포스트가 없습니다.</div>';
        return;
    }
    
    postsContainer.innerHTML = postsToShow.map(post => `
        <div class="post-card" onclick="openPostModal('${post.id}')">
            <div class="post-header">
                <span class="player-tag">${escapeHtml(post.playerName)}</span>
                <span class="post-date">${formatDate(post.date)}</span>
            </div>
            <h3 class="post-title">${escapeHtml(post.title)}</h3>
            ${post.image ? `<img src="${post.image}" alt="포스트 이미지" class="post-image">` : ''}
            <p class="post-preview">${escapeHtml(post.content.substring(0, 100))}${post.content.length > 100 ? '...' : ''}</p>
            ${post.tags && post.tags.length > 0 ? `
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
            <div class="post-footer">
                <span class="post-author">작성자: ${escapeHtml(post.author)}</span>
                <div class="post-actions">
                    <button class="like-btn ${post.likedBy.includes(getCurrentUser()) ? 'active' : ''}" onclick="event.stopPropagation(); toggleLike('${post.id}')">
                        👍 ${post.likes || 0}
                    </button>
                    <button class="dislike-btn ${post.dislikedBy.includes(getCurrentUser()) ? 'active' : ''}" onclick="event.stopPropagation(); toggleDislike('${post.id}')">
                        👎 ${post.dislikes || 0}
                    </button>
                    <span class="comment-count">💬 ${post.comments.length}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();
    
    if (!query) {
        displayPosts();
        return;
    }
    
    const filteredPosts = posts.filter(post => 
        post.playerName.toLowerCase().includes(query) ||
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.author.toLowerCase().includes(query)
    );
    
    displayPosts(filteredPosts);
    
    if (filteredPosts.length === 0) {
        showToast(`"${query}"에 대한 검색 결과가 없습니다.`);
    }
}

function handleSort() {
    const sortType = sortSelect.value;
    const selectedTag = tagFilter.value;
    
    let filteredPosts = posts;
    if (selectedTag) {
        filteredPosts = posts.filter(post => post.tags && post.tags.includes(selectedTag));
    }
    
    let sortedPosts = [...filteredPosts];
    
    switch (sortType) {
        case 'newest':
            sortedPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'oldest':
            sortedPosts.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'most-comments':
            sortedPosts.sort((a, b) => b.comments.length - a.comments.length);
            break;
        case 'most-likes':
            sortedPosts.sort((a, b) => (b.likes || 0) - (a.likes || 0));
            break;
    }
    
    displayPosts(sortedPosts);
}

function openPostModal(postId) {
    currentPostId = postId;
    const post = posts.find(p => p.id === postId);
    
    if (!post) return;
    
    modalBody.innerHTML = `
        <div class="modal-post">
            <div class="modal-post-header">
                <h2 class="modal-post-title">${escapeHtml(post.title)}</h2>
                <div class="modal-post-meta">
                    <span class="player-tag">${escapeHtml(post.playerName)}</span>
                    <span>작성자: ${escapeHtml(post.author)}</span>
                    <span>${formatDate(post.date)}</span>
                </div>
                ${post.tags && post.tags.length > 0 ? `
                    <div class="post-tags">
                        ${post.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="post-actions" style="margin-top: 1rem;">
                    <button class="like-btn ${post.likedBy.includes(getCurrentUser()) ? 'active' : ''}" onclick="toggleLike('${post.id}'); openPostModal('${post.id}')">
                        👍 ${post.likes || 0}
                    </button>
                    <button class="dislike-btn ${post.dislikedBy.includes(getCurrentUser()) ? 'active' : ''}" onclick="toggleDislike('${post.id}'); openPostModal('${post.id}')">
                        👎 ${post.dislikes || 0}
                    </button>
                </div>
            </div>
            ${post.image ? `<img src="${post.image}" alt="포스트 이미지" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 10px; margin: 1rem 0;">` : ''}
            <div class="modal-post-content">
                ${escapeHtml(post.content).replace(/\n/g, '<br>')}
            </div>
            <div class="comments-section">
                <h3 class="comments-header">댓글 (${post.comments.length})</h3>
                <div class="comment-form">
                    <textarea id="comment-content" placeholder="댓글을 입력하세요..." rows="3"></textarea>
                    <input type="text" id="comment-author" placeholder="닉네임을 입력하세요" required>
                    <button type="button" class="comment-submit" onclick="addComment()">댓글 작성</button>
                </div>
                <div class="comments-list">
                    ${post.comments.map(comment => `
                        <div class="comment">
                            <div class="comment-author">${escapeHtml(comment.author)}</div>
                            <div class="comment-date">${formatDate(comment.date)}</div>
                            <div class="comment-content">${escapeHtml(comment.content).replace(/\n/g, '<br>')}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // 스크롤 방지
}

function closePostModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // 스크롤 복원
    currentPostId = null;
}

function addComment() {
    if (!currentPostId) return;
    
    const content = document.getElementById('comment-content').value.trim();
    const author = document.getElementById('comment-author').value.trim();
    
    if (!content || !author) {
        showToast('댓글 내용과 닉네임을 모두 입력해주세요!');
        return;
    }
    
    const post = posts.find(p => p.id === currentPostId);
    if (!post) return;
    
    const newComment = {
        id: generateId(),
        author,
        content,
        date: new Date().toISOString()
    };
    
    post.comments.push(newComment);
    localStorage.setItem('posts', JSON.stringify(posts));
    
    // 모달 새로고침
    openPostModal(currentPostId);
    
    // 포스트 목록도 업데이트 (댓글 수 변경)
    displayPosts();
    
    showToast('댓글이 성공적으로 작성되었습니다!');
}

// 유틸리티 함수들
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffMinutes < 1) {
        return '방금 전';
    } else if (diffMinutes < 60) {
        return `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
        return `${diffHours}시간 전`;
    } else if (diffDays < 7) {
        return `${diffDays}일 전`;
    } else {
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 키보드 단축키
document.addEventListener('keydown', function(e) {
    // ESC로 모달 닫기
    if (e.key === 'Escape' && modal.style.display === 'block') {
        closePostModal();
    }
    
    // Ctrl+Enter로 포스트/댓글 작성
    if (e.ctrlKey && e.key === 'Enter') {
        if (document.activeElement.id === 'post-content') {
            postForm.dispatchEvent(new Event('submit'));
        } else if (document.activeElement.id === 'comment-content') {
            addComment();
        }
    }
});

// 반응형 처리
window.addEventListener('resize', function() {
    if (window.innerWidth > 768 && modal.style.display === 'block') {
        // 큰 화면에서 모달 위치 조정
        modal.querySelector('.modal-content').style.margin = '5% auto';
    }
});

// 페이지 가시성 변경 감지 (다른 탭에서 돌아왔을 때 데이터 새로고침)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        const savedPosts = JSON.parse(localStorage.getItem('posts')) || [];
        if (JSON.stringify(posts) !== JSON.stringify(savedPosts)) {
            posts = savedPosts;
            displayPosts();
        }
    }
});

// 새로운 기능들

// 좋아요/싫어요 기능
function toggleLike(postId) {
    const post = posts.find(p => p.id === postId);
    const currentUser = getCurrentUser();
    
    if (!post) return;
    
    // 싫어요가 눌러져 있다면 제거
    if (post.dislikedBy.includes(currentUser)) {
        post.dislikedBy = post.dislikedBy.filter(user => user !== currentUser);
        post.dislikes = Math.max(0, (post.dislikes || 0) - 1);
    }
    
    // 좋아요 토글
    if (post.likedBy.includes(currentUser)) {
        post.likedBy = post.likedBy.filter(user => user !== currentUser);
        post.likes = Math.max(0, (post.likes || 0) - 1);
    } else {
        post.likedBy.push(currentUser);
        post.likes = (post.likes || 0) + 1;
    }
    
    localStorage.setItem('posts', JSON.stringify(posts));
    displayPosts();
    updateUserStats();
}

function toggleDislike(postId) {
    const post = posts.find(p => p.id === postId);
    const currentUser = getCurrentUser();
    
    if (!post) return;
    
    // 좋아요가 눌러져 있다면 제거
    if (post.likedBy.includes(currentUser)) {
        post.likedBy = post.likedBy.filter(user => user !== currentUser);
        post.likes = Math.max(0, (post.likes || 0) - 1);
    }
    
    // 싫어요 토글
    if (post.dislikedBy.includes(currentUser)) {
        post.dislikedBy = post.dislikedBy.filter(user => user !== currentUser);
        post.dislikes = Math.max(0, (post.dislikes || 0) - 1);
    } else {
        post.dislikedBy.push(currentUser);
        post.dislikes = (post.dislikes || 0) + 1;
    }
    
    localStorage.setItem('posts', JSON.stringify(posts));
    displayPosts();
    updateUserStats();
}

function getCurrentUser() {
    return userProfile.nickname || '익명';
}

// 다크모드 기능
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('darkMode', isDark);
}

function loadTheme() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    }
}

// 이미지 업로드 기능
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) {
        imagePreview.style.display = 'none';
        return;
    }
    
    // GitHub Storage 파일 유효성 검증
    try {
        if (window.GitHubImageStorage) {
            const storage = new GitHubImageStorage();
            storage.validateFile(file);
        }
    } catch (error) {
        showToast(error.message);
        e.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        imagePreview.innerHTML = `<img src="${e.target.result}" alt="미리보기">`;
        imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) { // 2MB 제한
        showToast('프로필 이미지 크기는 2MB 이하여야 합니다.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        profileElements.avatarPreview.innerHTML = `<img src="${e.target.result}" alt="프로필 미리보기">`;
        profileElements.avatarPreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// 태그 기능
function handleTagInput(e) {
    const input = e.target.value;
    const lastTag = input.split(',').pop().trim().toLowerCase();
    
    if (lastTag.length > 0) {
        const suggestions = commonTags.filter(tag => 
            tag.toLowerCase().includes(lastTag) && 
            !input.toLowerCase().includes(tag.toLowerCase())
        ).slice(0, 5);
        
        displayTagSuggestions(suggestions, input);
    } else {
        tagSuggestions.innerHTML = '';
    }
}

function displayTagSuggestions(suggestions, currentInput) {
    tagSuggestions.innerHTML = suggestions.map(tag => 
        `<span class="tag-suggestion" onclick="addTag('${tag}', '${currentInput}')">${tag}</span>`
    ).join('');
}

function addTag(tag, currentInput) {
    const tags = currentInput.split(',').map(t => t.trim()).filter(t => t);
    tags[tags.length - 1] = tag;
    postTagsInput.value = tags.join(', ') + ', ';
    tagSuggestions.innerHTML = '';
    postTagsInput.focus();
}

function setupTagSuggestions() {
    // 기존 포스트에서 태그 추출하여 공통 태그에 추가
    const existingTags = new Set(commonTags);
    posts.forEach(post => {
        if (post.tags) {
            post.tags.forEach(tag => existingTags.add(tag));
        }
    });
    commonTags = Array.from(existingTags);
}

function updateTagFilter() {
    const allTags = new Set();
    posts.forEach(post => {
        if (post.tags) {
            post.tags.forEach(tag => allTags.add(tag));
        }
    });
    
    const sortedTags = Array.from(allTags).sort();
    tagFilter.innerHTML = '<option value="">모든 태그</option>' + 
        sortedTags.map(tag => `<option value="${tag}">${tag}</option>`).join('');
}

function handleTagFilter() {
    handleSort(); // 정렬 함수가 태그 필터링도 처리
}

// 프로필 기능
function loadProfile() {
    profileElements.nickname.value = userProfile.nickname || '';
    profileElements.bio.value = userProfile.bio || '';
    profileElements.favoriteTeam.value = userProfile.favoriteTeam || '';
    
    if (userProfile.avatar) {
        profileElements.avatarPreview.innerHTML = `<img src="${userProfile.avatar}" alt="프로필 이미지">`;
        profileElements.avatarPreview.style.display = 'block';
    }
}

function saveProfile() {
    userProfile.nickname = profileElements.nickname.value.trim();
    userProfile.bio = profileElements.bio.value.trim();
    userProfile.favoriteTeam = profileElements.favoriteTeam.value.trim();
    
    const avatarImg = profileElements.avatarPreview.querySelector('img');
    if (avatarImg) {
        userProfile.avatar = avatarImg.src;
    }
    
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    showToast('프로필이 저장되었습니다!');
    updateUserStats();
}

function updateUserStats() {
    const currentUser = getCurrentUser();
    
    // 작성한 포스트 수
    const userPosts = posts.filter(post => post.author === currentUser);
    profileElements.postsCount.textContent = userPosts.length;
    
    // 작성한 댓글 수
    let commentCount = 0;
    posts.forEach(post => {
        commentCount += post.comments.filter(comment => comment.author === currentUser).length;
    });
    profileElements.commentsCount.textContent = commentCount;
    
    // 받은 좋아요 수
    const likesReceived = userPosts.reduce((total, post) => total + (post.likes || 0), 0);
    profileElements.likesReceived.textContent = likesReceived;
}

// GitHub Token 설정 함수
function setGitHubToken(token) {
    if (window.GitHubImageStorage) {
        GitHubImageStorage.prototype.token = token;
        console.log('✅ GitHub token이 설정되었습니다!');
        showToast('GitHub 토큰이 설정되었습니다. 이제 이미지 업로드가 가능합니다!');
    } else {
        console.error('❌ GitHubImageStorage가 로드되지 않았습니다.');
    }
}

// 토큰 설정 안내 (페이지 로드 시)
setTimeout(() => {
    console.log('🔑 GitHub Token 설정이 필요합니다!');
    console.log('브라우저 콘솔에서 다음 명령어를 실행하세요:');
    console.log('setGitHubToken("YOUR_GITHUB_TOKEN")');
    console.log('');
    console.log('📋 설정 방법:');
    console.log('1. GitHub → Settings → Developer settings → Personal access tokens');
    console.log('2. "Generate new token (classic)" 클릭');
    console.log('3. repo 권한 선택 후 토큰 생성');
    console.log('4. 생성된 토큰을 위 명령어에 입력');
}, 1000); 