# 축썰 - 축구 뉴스 실시간 채팅 플랫폼

국내 축구, 해외 축구 속보를 간편하게 확인하고 실시간으로 의견을 나눌 수 있는 웹 애플리케이션입니다.

## ✨ 주요 기능

### 📰 축구 뉴스
- **국내 축구 속보**: 한국 축구 관련 최신 뉴스
- **해외 축구 속보**: 해외 축구 관련 최신 뉴스
- **실시간 업데이트**: 최신 뉴스 자동 새로고침
- **검색 기능**: 키워드로 뉴스 검색

### 💬 실시간 채팅
- **Firebase 기반**: 실시간으로 다른 사용자와 소통
- **뉴스별 채팅**: 각 뉴스마다 독립적인 채팅방
- **익명 사용자**: 별도 가입 없이 바로 사용
- **실시간 업데이트**: 새 메시지 즉시 표시

## 🚀 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase Realtime Database
- **배포**: GitHub Pages
- **폰트**: Noto Sans KR, Font Awesome

## 🔧 설치 및 설정

### 1. Firebase 프로젝트 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Realtime Database 활성화
3. 보안 규칙 설정 (테스트 모드로 시작)

### 2. Firebase 설정 파일 수정

`firebase-config.js` 파일에서 Firebase 프로젝트 설정값을 입력하세요:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. 보안 규칙 설정

Firebase Realtime Database 보안 규칙:

```json
{
  "rules": {
    "chats": {
      "$chatId": {
        "messages": {
          ".read": true,
          ".write": true
        }
      }
    }
  }
}
```

## 📱 사용법

### 뉴스 보기
1. 상단 탭에서 "국내 축구 속보" 또는 "해외 축구 속보" 선택
2. 뉴스 카드 클릭하여 상세 내용 확인
3. "원문 보기" 버튼으로 원본 기사로 이동

### 실시간 채팅
1. 뉴스 상세 모달에서 하단 채팅창 확인
2. 메시지 입력 후 Enter 키 또는 전송 버튼 클릭
3. 다른 사용자들과 실시간으로 의견 교환

## 🌟 특징

- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 기기 지원
- **실시간 채팅**: Firebase로 즉시 메시지 전송 및 수신
- **익명 사용**: 개인정보 수집 없이 바로 사용
- **한국어 최적화**: 한국 사용자를 위한 UI/UX

## 🔒 보안 및 개인정보

- 사용자 식별 정보를 수집하지 않습니다
- 채팅 내용은 Firebase에 저장되지만 개인정보는 포함되지 않습니다
- 모든 사용자는 익명으로 참여합니다

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🤝 기여하기

버그 리포트, 기능 제안, 풀 리퀘스트를 환영합니다!

---

**축썰** - 축구 뉴스와 함께하는 실시간 소통의 장 