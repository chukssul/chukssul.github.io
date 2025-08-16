// Firebase 기반 실시간 채팅 시스템

class ChatSystem {
    constructor() {
        this.currentChatId = null;
        this.currentUser = this.generateAnonymousUser();
        this.isTyping = false;
        this.typingTimeout = null;
        
        this.initializeChat();
        this.setupEventListeners();
    }

    // 익명 사용자 생성
    generateAnonymousUser() {
        const savedUser = localStorage.getItem('chatUser');
        if (savedUser) {
            return JSON.parse(savedUser);
        }
        
        const user = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: '익명' + Math.floor(Math.random() * 1000),
            color: this.getRandomColor()
        };
        
        localStorage.setItem('chatUser', JSON.stringify(user));
        return user;
    }

    // 랜덤 색상 생성
    getRandomColor() {
        const colors = ['#1e3c72', '#2a5298', '#3a6ea5', '#4a8bb8', '#5aa8cb'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // 채팅 초기화
    initializeChat() {
        // Firebase Realtime Database 연결 확인
        if (typeof firebase === 'undefined') {
            console.error('Firebase가 로드되지 않았습니다.');
            return;
        }
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 뉴스 채팅
        const newsChatInput = document.getElementById('chat-input');
        const newsChatSendBtn = document.getElementById('send-chat-message');
        
        if (newsChatInput && newsChatSendBtn) {
            newsChatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage('news');
                }
            });
            
            newsChatSendBtn.addEventListener('click', () => {
                this.sendMessage('news');
            });
        }

        // 기사 채팅
        const articleChatInput = document.getElementById('article-chat-input');
        const articleChatSendBtn = document.getElementById('send-article-chat-message');
        
        if (articleChatInput && articleChatSendBtn) {
            articleChatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage('article');
                }
            });
            
            articleChatSendBtn.addEventListener('click', () => {
                this.sendMessage('article');
            });
        }
    }

    // Firebase 경로를 안전하게 만드는 함수
    sanitizePath(path) {
        return path.replace(/[.#$\[\]]/g, '_').replace(/-/g, '_');
    }
    
    // Firebase 경로를 안전하게 만드는 함수 (내부용)
    sanitizeFirebasePath(path) {
        return path.replace(/[.#$\[\]]/g, '_').replace(/-/g, '_');
    }

    // 뉴스 제목을 기반으로 안정적인 ID 생성
    generateStableNewsId(newsTitle) {
        // 뉴스 제목을 정규화 (공백 제거, 특수문자 제거)
        const normalizedTitle = newsTitle
            .replace(/[^\w\s가-힣]/g, '') // 특수문자 제거
            .replace(/\s+/g, '_') // 공백을 언더스코어로
            .substring(0, 50); // 길이 제한
        
        // 해시 생성 (간단한 방식)
        let hash = 0;
        for (let i = 0; i < normalizedTitle.length; i++) {
            const char = normalizedTitle.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32비트 정수로 변환
        }
        
        return `news_${Math.abs(hash)}`;
    }

    // 채팅 시작 (뉴스 또는 기사 모달이 열릴 때)
    startChat(type, id, title = null) {
        let chatId;
        
        if (type === 'news' && title) {
            // 뉴스의 경우 제목 기반으로 안정적인 ID 생성
            chatId = this.generateStableNewsId(title);
        } else {
            // 기사의 경우 기존 방식 사용
            const safeId = this.sanitizePath(id);
            chatId = `${type}_${safeId}`;
        }
        
        this.currentChatId = chatId;
        console.log('채팅 시작:', { type, id, title, chatId });
        
        this.loadChatHistory();
        this.listenToNewMessages();
        
        // 채팅 입력 필드 활성화
        if (type === 'news') {
            const input = document.getElementById('chat-input');
            if (input) input.focus();
        } else if (type === 'article') {
            const input = document.getElementById('article-chat-input');
            if (input) input.focus();
        }
    }

    // 채팅 기록 로드
    loadChatHistory() {
        const chatRef = database.ref(`chats/${this.currentChatId}/messages`);
        
        // 성능 최적화: 인덱스된 timestamp로 정렬하고 최근 50개만 로드
        chatRef.orderByChild('timestamp').limitToLast(50).once('value')
            .then((snapshot) => {
                const messages = [];
                snapshot.forEach((childSnapshot) => {
                    messages.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                
                // 시간순 정렬 (최신 메시지가 아래에 오도록)
                messages.sort((a, b) => a.timestamp - b.timestamp);
                
                this.displayMessages(messages);
                this.scrollToBottom();
            })
            .catch((error) => {
                console.error('채팅 기록을 불러오는 중 오류:', error);
                this.showWelcomeMessage();
            });
    }

    // 새 메시지 수신 대기
    listenToNewMessages() {
        const chatRef = database.ref(`chats/${this.currentChatId}/messages`);
        
        chatRef.on('child_added', (snapshot) => {
            const message = {
                id: snapshot.key,
                ...snapshot.val()
            };
            
            // 새 메시지 추가
            this.addMessageToDisplay(message);
            this.scrollToBottom();
        });
    }

    // 메시지 전송
    sendMessage(type) {
        let input, messagesContainer;
        
        if (type === 'news') {
            input = document.getElementById('chat-input');
            messagesContainer = document.getElementById('chat-messages');
        } else if (type === 'article') {
            input = document.getElementById('article-chat-input');
            messagesContainer = document.getElementById('article-chat-messages');
        }
        
        if (!input || !messagesContainer) return;
        
        const content = input.value.trim();
        if (!content) return;
        
        // 입력 필드 비활성화 및 로딩 상태 표시
        input.disabled = true;
        const originalValue = input.value;
        input.value = '전송 중...';
        
        const message = {
            content: content,
            author: this.currentUser.name,
            authorId: this.currentUser.id,
            authorColor: this.currentUser.color,
            timestamp: Date.now(),
            type: 'text'
        };
        
        // Firebase에 메시지 저장
        const chatRef = database.ref(`chats/${this.currentChatId}/messages`);
        chatRef.push(message)
            .then(() => {
                // 입력 필드 초기화 및 활성화
                input.value = '';
                input.disabled = false;
                input.focus();
                
                // 뉴스 카드에 채팅 표시 업데이트
                this.updateNewsCardChatDisplay();
                
                // 성공 로그
                console.log('메시지 전송 성공:', message.content);
            })
            .catch((error) => {
                console.error('메시지 전송 오류:', error);
                
                // 입력 필드 복원
                input.value = originalValue;
                input.disabled = false;
                input.focus();
                
                // 사용자에게 오류 알림
                this.showErrorMessage('메시지 전송에 실패했습니다. 다시 시도해주세요.');
            });
    }

    // 메시지 표시
    displayMessages(messages) {
        let messagesContainer;
        
        if (this.currentChatId.startsWith('news_')) {
            messagesContainer = document.getElementById('chat-messages');
        } else if (this.currentChatId.startsWith('article_')) {
            messagesContainer = document.getElementById('article-chat-messages');
        }
        
        if (!messagesContainer) return;
        
        if (messages.length === 0) {
            this.showWelcomeMessage();
            return;
        }
        
        messagesContainer.innerHTML = messages.map(message => 
            this.createMessageHTML(message)
        ).join('');
    }

    // 새 메시지를 화면에 추가
    addMessageToDisplay(message) {
        let messagesContainer;
        
        if (this.currentChatId.startsWith('news_')) {
            messagesContainer = document.getElementById('chat-messages');
        } else if (this.currentChatId.startsWith('article_')) {
            messagesContainer = document.getElementById('article-chat-messages');
        }
        
        if (!messagesContainer) return;
        
        const messageHTML = this.createMessageHTML(message);
        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
    }

    // 메시지 HTML 생성
    createMessageHTML(message) {
        const isOwnMessage = message.authorId === this.currentUser.id;
        const messageClass = isOwnMessage ? 'chat-message own' : 'chat-message other';
        const time = this.formatTime(message.timestamp);
        
        return `
            <div class="${messageClass}" data-message-id="${message.id}">
                <div class="chat-message-header">
                    <span class="chat-message-author" style="color: ${message.authorColor}">
                        ${message.author}
                    </span>
                    <span class="chat-message-time">${time}</span>
                </div>
                <div class="chat-message-content">${message.content}</div>
            </div>
        `;
    }

    // 시간 포맷팅
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // 1분 이내
            return '방금 전';
        } else if (diff < 3600000) { // 1시간 이내
            return Math.floor(diff / 60000) + '분 전';
        } else if (diff < 86400000) { // 24시간 이내
            return Math.floor(diff / 3600000) + '시간 전';
        } else {
            return date.toLocaleDateString('ko-KR');
        }
    }

    // 뉴스 카드에 채팅 표시 업데이트
    updateNewsCardChatDisplay() {
        if (!this.currentChatId) return;
        
        try {
            // 뉴스 ID 추출
            const newsId = this.currentChatId.replace('news_', '').replace('article_', '');
            
            // Firebase에 채팅 존재 플래그 설정
            const safeNewsId = this.sanitizeFirebasePath(newsId);
            const newsRef = database.ref(`news/${safeNewsId}`);
            newsRef.update({ hasChat: true });
            
            // UI에 채팅 표시 추가
            this.addChatIndicatorToNewsCard(newsId);
        } catch (error) {
            console.error('뉴스 카드 채팅 표시 업데이트 중 오류:', error);
        }
    }
    
    // 뉴스 카드에 채팅 표시 추가
    addChatIndicatorToNewsCard(newsId) {
        // 뉴스 카드 찾기 (더 정확한 선택자 사용)
        const newsCards = document.querySelectorAll('.news-card');
        let newsCard = null;
        
        for (const card of newsCards) {
            const onclick = card.getAttribute('onclick');
            if (onclick && onclick.includes(newsId)) {
                newsCard = card;
                break;
            }
        }
        
        if (!newsCard) {
            console.log('뉴스 카드를 찾을 수 없음:', newsId);
            return;
        }
        
        // 이미 채팅 표시가 있으면 추가하지 않음
        if (newsCard.querySelector('.chat-indicator')) {
            console.log('이미 채팅 표시가 있음:', newsId);
            return;
        }
        
        // news-stats 섹션 찾기
        const newsStats = newsCard.querySelector('.news-stats');
        if (!newsStats) {
            console.log('news-stats를 찾을 수 없음:', newsId);
            return;
        }
        
        // 채팅 표시 요소 생성
        const chatIndicator = document.createElement('div');
        chatIndicator.className = 'chat-indicator';
        chatIndicator.innerHTML = '<i class="fas fa-comments"></i> 채팅';
        
        // news-stats에 추가
        newsStats.appendChild(chatIndicator);
        console.log('채팅 표시 추가 완료:', newsId);
    }
    
    // 환영 메시지 표시
    showWelcomeMessage() {
        let messagesContainer;
        
        if (this.currentChatId.startsWith('news_')) {
            messagesContainer = document.getElementById('chat-messages');
        } else if (this.currentChatId.startsWith('article_')) {
            messagesContainer = document.getElementById('article-chat-messages');
        }
        
        if (!messagesContainer) return;
        
        messagesContainer.innerHTML = `
            <div class="chat-welcome">
                <p>🎉 축구 뉴스에 대한 의견을 나누어보세요!</p>
                <p>실시간으로 다른 사용자들과 소통할 수 있습니다.</p>
            </div>
        `;
    }

    // 채팅창 맨 아래로 스크롤
    scrollToBottom() {
        let messagesContainer;
        
        if (this.currentChatId.startsWith('news_')) {
            messagesContainer = document.getElementById('chat-messages');
        } else if (this.currentChatId.startsWith('article_')) {
            messagesContainer = document.getElementById('article-chat-messages');
        }
        
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
    
    // 오류 메시지 표시
    showErrorMessage(message) {
        let messagesContainer;
        
        if (this.currentChatId.startsWith('news_')) {
            messagesContainer = document.getElementById('chat-messages');
        } else if (this.currentChatId.startsWith('article_')) {
            messagesContainer = document.getElementById('article-chat-messages');
        }
        
        if (!messagesContainer) return;
        
        // 오류 메시지 요소 생성
        const errorElement = document.createElement('div');
        errorElement.className = 'chat-error-message';
        errorElement.innerHTML = `
            <div class="error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
            </div>
        `;
        
        // 메시지 컨테이너에 추가
        messagesContainer.appendChild(errorElement);
        
        // 5초 후 자동 제거
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.parentNode.removeChild(errorElement);
            }
        }, 5000);
        
        // 자동 스크롤
        this.scrollToBottom();
    }

    // 채팅 종료 (모달이 닫힐 때)
    stopChat() {
        if (this.currentChatId) {
            const chatRef = database.ref(`chats/${this.currentChatId}/messages`);
            chatRef.off();
            this.currentChatId = null;
        }
    }
}

// 전역 채팅 시스템 인스턴스
let chatSystem;

// DOM 로드 완료 후 채팅 시스템 초기화
document.addEventListener('DOMContentLoaded', function() {
    chatSystem = new ChatSystem();
});

// 채팅 시작 함수 (외부에서 호출)
function startNewsChat(newsId, newsTitle) {
    if (chatSystem) {
        chatSystem.startChat('news', newsId, newsTitle);
    }
}

function startArticleChat(articleId) {
    if (chatSystem) {
        chatSystem.startChat('article', articleId);
    }
}

// 채팅 종료 함수 (외부에서 호출)
function stopChat() {
    if (chatSystem) {
        chatSystem.stopChat();
    }
}
