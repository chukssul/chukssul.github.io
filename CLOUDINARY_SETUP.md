# ☁️ Cloudinary 이미지 호스팅 설정 가이드

## 🌟 Cloudinary란?
- **완전 무료** 이미지 호스팅 서비스 (월 25GB, 25,000 변환)
- **자동 최적화** - 이미지 압축, WebP 변환, 리사이징
- **CDN 제공** - 전세계 빠른 이미지 로딩
- **설정 간단** - 토큰 없이 바로 사용

## 🚀 설정 방법

### 1. **Cloudinary 계정 생성**
1. [https://cloudinary.com](https://cloudinary.com) 접속
2. "Sign up for free" 클릭
3. 이메일로 무료 계정 생성

### 2. **Cloud Name 확인**
1. 로그인 후 대시보드 접속
2. 상단에 표시된 **Cloud Name** 복사
   ```
   예: democloud123
   ```

### 3. **Unsigned Upload 활성화**
1. Settings → Upload 메뉴 접속
2. "Upload presets" 섹션에서
3. **"Enable unsigned uploading"** 체크박스 활성화
4. Preset name: `ml_default` (기본값)

### 4. **웹사이트에서 설정**

웹사이트 접속 후 **브라우저 개발자 도구 콘솔**에서:

```javascript
setCloudinaryConfig("YOUR_CLOUD_NAME")
```

예시:
```javascript
setCloudinaryConfig("democloud123")
```

## ✅ 설정 완료!

이제 포스트 작성 시 이미지를 업로드할 수 있습니다!

## 🎯 기능

### ✨ **자동 최적화**
- 자동 압축으로 빠른 로딩
- WebP 형식으로 자동 변환
- 800px 폭으로 자동 리사이징

### 📊 **지원 형식**
- JPEG, PNG, GIF, WebP
- BMP, TIFF
- 최대 10MB 파일 크기

### 🔧 **고급 설정** (선택사항)
커스텀 Upload Preset 사용:
```javascript
setCloudinaryConfig("YOUR_CLOUD_NAME", "your_custom_preset")
```

## 🆓 **무료 한도**
- **저장공간**: 25GB
- **월 변환**: 25,000회
- **대역폭**: 25GB/월
- **API 호출**: 무제한

일반적인 커뮤니티 사이트로는 충분한 용량입니다!

## 🔧 **문제 해결**

### "Upload failed" 에러
1. Cloud Name이 정확한지 확인
2. Unsigned uploading이 활성화되었는지 확인
3. 파일 크기가 10MB 이하인지 확인

### 이미지가 로딩되지 않음
1. 인터넷 연결 확인
2. Cloudinary 서비스 상태 확인
3. 브라우저 캐시 삭제

## 📞 문의

문제가 있으시면 GitHub Issues에 등록해주세요!

---

**🎉 이제 완전 무료로 이미지 업로드를 즐기세요!** 