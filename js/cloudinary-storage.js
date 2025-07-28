// Cloudinary를 사용한 무료 이미지 호스팅 솔루션
class CloudinaryImageStorage {
    constructor() {
        // Cloudinary 설정 (무료 계정)
        this.cloudName = 'YOUR_CLOUD_NAME'; // 실제 Cloud Name으로 교체
        this.uploadPreset = 'ml_default'; // unsigned 업로드용 기본 preset
        this.apiUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
    }

    // 이미지를 Cloudinary에 업로드
    async uploadImage(file) {
        try {
            // 파일 유효성 검증
            this.validateFile(file);
            
            // FormData 생성
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', this.uploadPreset);
            formData.append('folder', 'chukssul-community'); // 폴더 구분
            
            // 업로드 진행률 표시
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Cloudinary upload failed: ${response.statusText}`);
            }

            const data = await response.json();
            
            // 최적화된 URL 반환 (자동 압축, WebP 변환)
            return data.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_800/');
            
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            throw error;
        }
    }

    // 파일 유효성 검증
    validateFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB (Cloudinary 무료는 10MB 제한)
        const allowedTypes = [
            'image/jpeg', 
            'image/png', 
            'image/gif', 
            'image/webp',
            'image/bmp',
            'image/tiff'
        ];
        
        if (file.size > maxSize) {
            throw new Error('파일 크기는 10MB 이하여야 합니다.');
        }
        
        if (!allowedTypes.includes(file.type)) {
            throw new Error('지원되는 이미지 형식: JPEG, PNG, GIF, WebP, BMP, TIFF');
        }
        
        return true;
    }

    // Cloud Name 설정 함수
    setCloudName(cloudName) {
        this.cloudName = cloudName;
        this.apiUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        console.log(`✅ Cloudinary Cloud Name이 설정되었습니다: ${cloudName}`);
    }

    // 업로드 preset 설정 (선택사항)
    setUploadPreset(preset) {
        this.uploadPreset = preset;
        console.log(`✅ Upload Preset이 설정되었습니다: ${preset}`);
    }

    // 이미지 변환 URL 생성 (리사이징, 최적화)
    getOptimizedUrl(originalUrl, options = {}) {
        const {
            width = 800,
            height = null,
            quality = 'auto',
            format = 'auto'
        } = options;

        let transformation = `f_${format},q_${quality}`;
        
        if (width) transformation += `,w_${width}`;
        if (height) transformation += `,h_${height}`;
        
        return originalUrl.replace('/upload/', `/upload/${transformation}/`);
    }
}

// 전역에서 사용할 수 있도록 export
window.CloudinaryImageStorage = CloudinaryImageStorage; 