// Firebase Realtime Database + Cloudinary 통합 실시간 커뮤니티 시스템
import { ref, push, set, onValue, off, serverTimestamp, onDisconnect, get, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

class PlayerCommunityApp {
    constructor() {
        this.database = window.database;
        this.cloudinaryStorage = new CloudinaryImageStorage();
        this.currentUser = this.generateUserId();
        this.setupRealtimeListeners();
        this.setupOnlinePresence();
        
        console.log('🔥 Firebase + Cloudinary 실시간 커뮤니티 시작!');
        console.log(`👤 사용자 ID: ${this.currentUser}`);
    }

    // 고유한 사용자 ID 생성
    generateUserId() {
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('userId', userId);
        }
        return userId;
    }

    // 실시간 리스너 설정
    setupRealtimeListeners() {
        // 포스트 실시간 업데이트
        const postsRef = ref(this.database, 'posts');
        onValue(postsRef, (snapshot) => {
            const posts = [];
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    posts.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
            }
            
            // 최신순 정렬
            posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            this.displayPosts(posts);
            
            console.log(`📡 실시간 포스트 업데이트: ${posts.length}개`);
        });

        // 온라인 사용자 수 실시간 업데이트
        const onlineRef = ref(this.database, 'online');
        onValue(onlineRef, (snapshot) => {
            let onlineCount = 0;
            if (snapshot.exists() && typeof snapshot.numChildren === 'function') {
                onlineCount = snapshot.numChildren();
            }
            const onlineCountElement = document.getElementById('online-count');
            if (onlineCountElement) {
                onlineCountElement.textContent = `접속자 수: ${onlineCount}명`;
            }
            console.log(`👥 온라인 사용자: ${onlineCount}명`);
        });
    }

    // 온라인 상태 관리
    setupOnlinePresence() {
        const userOnlineRef = ref(this.database, `online/${this.currentUser}`);
        const userRef = ref(this.database, `users/${this.currentUser}`);
        
        // 접속 시 온라인 상태 설정
        set(userOnlineRef, {
            timestamp: serverTimestamp(),
            status: 'online'
        });

        // 연결 해제 시 자동으로 제거
        onDisconnect(userOnlineRef).remove();
        onDisconnect(userRef).update({
            lastSeen: serverTimestamp(),
            status: 'offline'
        });
    }

    // 새 포스트 작성
    async createPost(postData, imageFile = null) {
        try {
            const submitBtn = document.getElementById('submit-btn');
            const progressDiv = document.getElementById('upload-progress');
            const progressFill = document.getElementById('progress-fill');
            const progressText = document.getElementById('progress-text');
            
            // 로딩 상태 시작
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;

            let imageUrl = null;
            
            // 이미지가 있으면 Cloudinary에 업로드
            if (imageFile) {
                progressDiv.style.display = 'block';
                progressText.textContent = 'Cloudinary에 이미지 업로드 중...';
                progressFill.style.width = '30%';
                
                try {
                    imageUrl = await this.cloudinaryStorage.uploadImage(imageFile);
                    progressText.textContent = '이미지 업로드 완료!';
                    progressFill.style.width = '60%';
                } catch (error) {
                    console.error('Image upload failed:', error);
                    this.showToast(`이미지 업로드 실패: ${error.message}`);
                    progressDiv.style.display = 'none';
                    submitBtn.classList.remove('loading');
                    submitBtn.disabled = false;
                    return;
                }
            }

            // Firebase에 포스트 데이터 저장
            progressText.textContent = 'Firebase에 포스트 저장 중...';
            progressFill.style.width = '80%';
            
            const postsRef = ref(this.database, 'posts');
            const newPostRef = push(postsRef);
            
            const post = {
                ...postData,
                image: imageUrl,
                userId: this.currentUser,
                timestamp: serverTimestamp(),
                likes: 0,
                dislikes: 0,
                likedBy: {},
                dislikedBy: {},
                comments: {}
            };

            await set(newPostRef, post);

            // 성공 처리
            progressText.textContent = '포스트 작성 완료!';
            progressFill.style.width = '100%';
            
            this.showToast('포스트가 성공적으로 작성되었습니다! 🎉');
            document.getElementById('post-form').reset();
            
            const imagePreview = document.getElementById('image-preview');
            if (imagePreview) {
                imagePreview.style.display = 'none';
            }
            
            // 홈 탭으로 이동
            this.switchTab('home');

        } catch (error) {
            console.error('Post creation failed:', error);
            this.showToast('포스트 작성에 실패했습니다. 다시 시도해주세요.');
        } finally {
            // 로딩 상태 종료
            const submitBtn = document.getElementById('submit-btn');
            const progressDiv = document.getElementById('upload-progress');
            
            setTimeout(() => {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                progressDiv.style.display = 'none';
            }, 1000);
        }
    }

    // 좋아요/싫어요 토글
    async toggleLike(postId, isLike = true) {
        try {
            const postRef = ref(this.database, `posts/${postId}`);
            const likeField = isLike ? 'likedBy' : 'dislikedBy';
            const oppositeField = isLike ? 'dislikedBy' : 'likedBy';
            const countField = isLike ? 'likes' : 'dislikes';
            const oppositeCountField = isLike ? 'dislikes' : 'likes';

            // 현재 상태 확인
            const snapshot = await get(postRef);
            const post = snapshot.val();
            
            if (!post) return;

            const updates = {};
            const userLiked = post[likeField] && post[likeField][this.currentUser];
            const userDisliked = post[oppositeField] && post[oppositeField][this.currentUser];

            // 반대 액션이 있으면 제거
            if (userDisliked) {
                updates[`${oppositeField}/${this.currentUser}`] = null;
                updates[oppositeCountField] = Math.max(0, (post[oppositeCountField] || 0) - 1);
            }

            // 현재 액션 토글
            if (userLiked) {
                updates[`${likeField}/${this.currentUser}`] = null;
                updates[countField] = Math.max(0, (post[countField] || 0) - 1);
            } else {
                updates[`${likeField}/${this.currentUser}`] = true;
                updates[countField] = (post[countField] || 0) + 1;
            }

            await update(postRef, updates);
            
            const action = isLike ? '👍' : '👎';
            const actionText = userLiked ? '취소' : (isLike ? '좋아요' : '싫어요');
            console.log(`${action} ${actionText} - 포스트 ID: ${postId}`);
            
        } catch (error) {
            console.error('Toggle like failed:', error);
            this.showToast('반응 처리에 실패했습니다.');
        }
    }

    // 댓글 추가
    async addComment(postId, commentData) {
        try {
            const commentsRef = ref(this.database, `posts/${postId}/comments`);
            const newCommentRef = push(commentsRef);
            
            const comment = {
                ...commentData,
                userId: this.currentUser,
                timestamp: serverTimestamp()
            };

            await set(newCommentRef, comment);
            this.showToast('댓글이 추가되었습니다! 💬');
            
        } catch (error) {
            console.error('Add comment failed:', error);
            this.showToast('댓글 추가에 실패했습니다.');
        }
    }

    // 포스트 표시
    displayPosts(posts) {
        this.lastPosts = posts;
        const container = document.getElementById('posts-container');
        
        if (!posts || posts.length === 0) {
            container.innerHTML = '<div class="loading">아직 포스트가 없습니다. 첫 번째 포스트를 작성해보세요! ✨</div>';
            return;
        }

        container.innerHTML = posts.map(post => this.createPostHTML(post)).join('');
    }

    // 포스트 HTML 생성
    createPostHTML(post) {
        const userLiked = post.likedBy && post.likedBy[this.currentUser];
        const userDisliked = post.dislikedBy && post.dislikedBy[this.currentUser];
        const commentCount = post.comments ? Object.keys(post.comments).length : 0;
        const isOwner = post.userId === this.currentUser;

        return `
            <div class="post-card new-post" onclick="openPostModal('${post.id}')">
                <div class="post-header">
                    <span class="player-tag">${this.escapeHtml(post.playerName)}</span>
                    <span class="post-date">${this.formatDate(post.timestamp)}</span>
                </div>
                <h3 class="post-title">${this.escapeHtml(post.title)}</h3>
                ${post.image ? `<img src="${post.image}" alt="포스트 이미지" class="post-image" loading="lazy">` : ''}
                <p class="post-preview">${this.escapeHtml(post.content.substring(0, 100))}${post.content.length > 100 ? '...' : ''}</p>
                ${post.tags && post.tags.length > 0 ? `
                    <div class="post-tags">
                        ${post.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="post-footer">
                    <span class="post-author">작성자: ${this.escapeHtml(post.author)}</span>
                    <div class="post-actions">
                        <button class="like-btn ${userLiked ? 'active' : ''}" onclick="event.stopPropagation(); app.toggleLike('${post.id}', true)">👍 ${post.likes || 0}</button>
                        <button class="dislike-btn ${userDisliked ? 'active' : ''}" onclick="event.stopPropagation(); app.toggleLike('${post.id}', false)">👎 ${post.dislikes || 0}</button>
                        <span class="comment-count">💬 ${commentCount}</span>
                        ${isOwner ? `<button class="edit-btn" onclick="event.stopPropagation(); app.openEditPostModal('${post.id}')">수정</button>` : ''}
                        ${isOwner ? `<button class="delete-btn" onclick="event.stopPropagation(); app.deletePost('${post.id}')">삭제</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // 포스트 삭제
    async deletePost(postId) {
        if (!confirm('정말로 이 포스트를 삭제하시겠습니까?')) return;
        try {
            const postRef = ref(this.database, `posts/${postId}`);
            await set(postRef, null);
            this.showToast('포스트가 삭제되었습니다.');
        } catch (error) {
            console.error('포스트 삭제 실패:', error);
            this.showToast('포스트 삭제에 실패했습니다.');
        }
    }

    // 포스트 수정 모달 열기
    openEditPostModal(postId) {
        const post = this.lastPosts && this.lastPosts.find(p => p.id === postId);
        if (!post) return;
        const modal = document.getElementById('post-modal');
        const modalBody = document.getElementById('modal-body');
        if (!modal || !modalBody) return;
        modalBody.innerHTML = `
            <div class="modal-post">
                <h2>포스트 수정</h2>
                <form id="edit-post-form">
                    <div class="form-group">
                        <label>선수 이름</label>
                        <input type="text" id="edit-player-name" value="${this.escapeHtml(post.playerName)}" required>
                    </div>
                    <div class="form-group">
                        <label>제목</label>
                        <input type="text" id="edit-post-title" value="${this.escapeHtml(post.title)}" required>
                    </div>
                    <div class="form-group">
                        <label>내용</label>
                        <textarea id="edit-post-content" required>${this.escapeHtml(post.content)}</textarea>
                    </div>
                    <div class="form-group">
                        <label>태그 (쉼표로 구분)</label>
                        <input type="text" id="edit-post-tags" value="${post.tags ? post.tags.join(', ') : ''}">
                    </div>
                    <button type="submit" class="submit-btn">저장</button>
                </form>
            </div>
        `;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        const form = document.getElementById('edit-post-form');
        form.onsubmit = (e) => {
            e.preventDefault();
            this.saveEditPost(postId);
        };
    }

    // 포스트 수정 저장
    async saveEditPost(postId) {
        const playerName = document.getElementById('edit-player-name').value.trim();
        const title = document.getElementById('edit-post-title').value.trim();
        const content = document.getElementById('edit-post-content').value.trim();
        const tagsInput = document.getElementById('edit-post-tags').value.trim();
        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        try {
            const postRef = ref(this.database, `posts/${postId}`);
            await update(postRef, { playerName, title, content, tags });
            this.showToast('포스트가 수정되었습니다.');
            document.getElementById('post-modal').style.display = 'none';
        } catch (error) {
            console.error('포스트 수정 실패:', error);
            this.showToast('포스트 수정에 실패했습니다.');
        }
    }

    // 유틸리티 함수들
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    formatDate(timestamp) {
        if (!timestamp) return '방금 전';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) return '방금 전';
        if (diffMinutes < 60) return `${diffMinutes}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        if (diffDays < 7) return `${diffDays}일 전`;
        
        return date.toLocaleDateString('ko-KR');
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        
        toastMessage.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    switchTab(tabName) {
        // 네비게이션 버튼 활성화
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // 탭 콘텐츠 표시
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }
}

// 전역 앱 인스턴스
window.PlayerCommunityApp = PlayerCommunityApp; 