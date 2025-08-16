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

    // 채팅 시작 (뉴스 또는 기사 모달이 열릴 때)
    startChat(type, id) {
        this.currentChatId = `${type}_${id}`;
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
        
        chatRef.orderByChild('timestamp').limitToLast(50).once('value')
            .then((snapshot) => {
                const messages = [];
                snapshot.forEach((childSnapshot) => {
                    messages.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                
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
        
        // 입력 필드 비활성화
        input.disabled = true;
        
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
            })
            .catch((error) => {
                console.error('메시지 전송 오류:', error);
                input.disabled = false;
                alert('메시지 전송에 실패했습니다. 다시 시도해주세요.');
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
function startNewsChat(newsId) {
    if (chatSystem) {
        chatSystem.startChat('news', newsId);
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
