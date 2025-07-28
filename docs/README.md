# ⚽ 축썰닷컴

축구에 대한 포스팅을 올리고 댓글로 자유롭게 소통할 수 있는 웹 커뮤니티입니다.

## 🌟 주요 기능

- **포스트 작성**: 좋아하는 선수에 대한 글을 자유롭게 작성
- **이미지 업로드**: 포스트에 이미지 첨부 가능 (최대 5MB)
- **태그 시스템**: 포스트에 태그를 추가하고 태그별로 필터링
- **좋아요/싫어요**: 포스트에 좋아요 또는 싫어요 표시
- **댓글 시스템**: 포스트에 댓글을 달며 다른 사용자들과 소통
- **검색 기능**: 선수 이름, 제목, 내용으로 포스트 검색
- **정렬 기능**: 최신순, 오래된순, 댓글 많은순, 좋아요 많은순으로 정렬
- **사용자 프로필**: 개인 프로필 설정 및 활동 통계 확인
- **다크모드**: 라이트/다크 테마 전환
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 기기에서 최적화된 경험
- **로컬 저장소**: 브라우저 로컬 스토리지를 사용한 데이터 저장

## 🚀 GitHub Pages 배포 완료!

이 웹사이트는 GitHub Pages를 통해 배포되었습니다:
**https://chukssul.github.io**

### 배포 방법
1. GitHub 레포지토리: [https://github.com/chukssul/chukssul.github.io](https://github.com/chukssul/chukssul.github.io)
2. Settings → Pages → Deploy from branch (main)
3. 자동 배포 완료!

## 💻 사용 기술

- **HTML5**: 시맨틱 마크업
- **CSS3**: 모던 스타일링, 그라디언트, 애니메이션
- **JavaScript (ES6+)**: 동적 기능 구현
- **Local Storage**: 클라이언트 사이드 데이터 저장
- **Google Fonts**: Noto Sans KR 폰트 사용
- **GitHub Pages**: 무료 웹 호스팅

## 📱 반응형 지원

- **데스크톱**: 1200px 이상
- **태블릿**: 768px ~ 1199px
- **모바일**: 767px 이하

## 🎨 디자인 특징

- **그라디언트 배경**: 보라색 계열의 아름다운 그라디언트
- **글래스모피즘**: 반투명 효과와 블러 처리
- **부드러운 애니메이션**: 호버 효과와 페이드 인 애니메이션
- **직관적인 UI**: 사용자 친화적인 인터페이스
- **다크모드**: 눈에 편안한 다크 테마 지원

## 📂 프로젝트 구조

```
/
├── index.html          # 메인 HTML 파일
├── .gitignore          # Git 제외 파일 설정
├── css/
│   └── styles.css      # CSS 스타일시트
├── js/
│   └── script.js       # JavaScript 로직
├── images/
│   └── README.md       # 이미지 폴더 설명
└── docs/
    └── README.md       # 프로젝트 문서 (현재 파일)
```

## 🔧 로컬 개발 환경

1. 레포지토리 클론:
   ```bash
   git clone https://github.com/chukssul/chukssul.github.io.git
   cd chukssul.github.io
   ```

2. 로컬 서버 실행:
   ```bash
   # Python 3 사용시
   python -m http.server 8000
   
   # Node.js 사용시
   npx serve .
   
   # Live Server (VS Code 확장) 사용 권장
   ```

3. 브라우저에서 `http://localhost:8000` 접속

## 🌐 브라우저 지원

- ✅ Chrome (최신 버전)
- ✅ Firefox (최신 버전)
- ✅ Safari (최신 버전)
- ✅ Edge (최신 버전)

## 📝 사용 방법

1. **웹사이트 접속**: [https://chukssul.github.io](https://chukssul.github.io)
2. **프로필 설정**: "프로필" 탭에서 닉네임과 개인정보를 설정
3. **포스트 작성**: "포스트 작성" 탭에서 새 글 작성
   - 📸 이미지 첨부 가능 (최대 5MB)
   - 🏷️ 태그 추가 (자동완성 지원)
4. **포스트 상호작용**:
   - 👍/👎 좋아요/싫어요 버튼
   - 💬 댓글 작성 및 읽기
5. **검색 및 필터링**:
   - 🔍 키워드 검색
   - 🏷️ 태그별 필터링
   - 📊 다양한 정렬 옵션
6. **테마 변경**: 🌙/☀️ 다크모드 토글

## 🔒 개인정보 보호

- ✅ **완전한 클라이언트 사이드**: 모든 데이터는 사용자 브라우저에만 저장
- ✅ **서버 전송 없음**: 개인정보가 외부로 전송되지 않음
- ✅ **로컬 스토리지**: 브라우저 로컬 스토리지 사용
- ⚠️ **데이터 백업**: 브라우저 데이터 삭제 시 모든 내용 사라짐

## ✨ 주요 특징

### 💾 데이터 관리
- **로컬 스토리지**: 브라우저에 안전하게 저장
- **실시간 동기화**: 새로고침 없이 데이터 업데이트
- **자동 저장**: 모든 작업이 즉시 저장됨

### 🎯 사용자 경험
- **직관적인 인터페이스**: 쉽고 편리한 사용법
- **빠른 응답**: 클라이언트 사이드 처리로 빠른 속도
- **PWA 지원**: 모바일에서도 앱처럼 사용 가능

### 🔧 개발자 친화적
- **모듈화된 구조**: 유지보수가 쉬운 코드
- **확장 가능**: 새로운 기능 추가 용이
- **웹 표준 준수**: 최신 웹 기술 사용

## 🎮 데모 데이터

첫 방문 시 다음과 같은 샘플 포스트들이 제공됩니다:
- 🇰🇷 **손흥민** 관련 포스트 (프리미어리그, 토트넘)
- 🇦🇷 **메시** 관련 포스트 (MLS, 바르셀로나)
- 🇰🇷 **김민재** 관련 포스트 (분데스리가, 바이에른뮌헨)

## 🤝 기여하기

1. Fork the repository: [https://github.com/chukssul/chukssul.github.io](https://github.com/chukssul/chukssul.github.io)
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 🐛 버그 리포트 및 기능 요청

GitHub Issues를 통해 버그 리포트나 새로운 기능 요청을 해주세요:
[https://github.com/chukssul/chukssul.github.io/issues](https://github.com/chukssul/chukssul.github.io/issues)

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🙏 감사의 말

- **Google Fonts**: Noto Sans KR 폰트 제공
- **GitHub Pages**: 무료 호스팅 서비스
- **사용자 여러분**: 소중한 피드백과 기여

---

## 🔗 링크

- 🌐 **웹사이트**: [https://chukssul.github.io](https://chukssul.github.io)
- 📦 **GitHub 레포지토리**: [https://github.com/chukssul/chukssul.github.io](https://github.com/chukssul/chukssul.github.io)
- 📖 **문서**: [docs/README.md](docs/README.md)

---

💡 **팁**: 더 나은 사용자 경험을 위해 최신 버전의 브라우저 사용을 권장합니다.

🚀 **지금 바로 체험해보세요!** [https://chukssul.github.io](https://chukssul.github.io) 