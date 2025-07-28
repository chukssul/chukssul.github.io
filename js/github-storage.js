// GitHub를 이미지 저장소로 사용하는 완전 무료 솔루션
class GitHubImageStorage {
    constructor() {
        this.owner = 'chukssul';
        this.repo = 'chukssul.github.io';
        this.branch = 'main';
        this.imagePath = 'images/uploads/';
        // GitHub Personal Access Token (repo 권한 필요)
        // 보안상 토큰은 별도로 설정해야 합니다
        this.token = null; // 실제 토큰은 runtime에 설정
    }

    // 이미지를 GitHub에 업로드
    async uploadImage(file) {
        try {
            // 토큰 확인
            if (!this.token) {
                throw new Error('GitHub Token이 설정되지 않았습니다. 콘솔에서 setGitHubToken("YOUR_TOKEN")을 실행하세요.');
            }
            
            // 고유한 파일명 생성
            const filename = this.generateFilename(file.name);
            
            // 파일을 Base64로 변환
            const base64Content = await this.fileToBase64(file);
            
            // GitHub API를 사용하여 파일 업로드
            const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.imagePath}${filename}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Add image: ${filename}`,
                    content: base64Content.split(',')[1], // Base64 부분만 추출
                    branch: this.branch
                })
            });

            if (response.ok) {
                const data = await response.json();
                // GitHub Pages URL 반환
                return `https://${this.owner}.github.io/${this.imagePath}${filename}`;
            } else {
                const errorData = await response.json();
                throw new Error(`GitHub upload failed: ${errorData.message}`);
            }
        } catch (error) {
            console.error('GitHub image upload error:', error);
            throw error;
        }
    }

    // 파일을 Base64로 변환
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // 고유한 파일명 생성
    generateFilename(originalName) {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substr(2, 9);
        const extension = originalName.split('.').pop().toLowerCase();
        return `${timestamp}_${randomStr}.${extension}`;
    }

    // 파일 크기 체크 (GitHub는 100MB 제한, 하지만 웹에서는 10MB 권장)
    validateFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        
        if (file.size > maxSize) {
            throw new Error('파일 크기는 10MB 이하여야 합니다.');
        }
        
        if (!allowedTypes.includes(file.type)) {
            throw new Error('지원되는 이미지 형식: JPEG, PNG, GIF, WebP');
        }
        
        return true;
    }
}

// 전역에서 사용할 수 있도록 export
window.GitHubImageStorage = GitHubImageStorage; 