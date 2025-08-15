// 기사 번역 시스템
class ArticleTranslator {
    constructor() {
        this.translatedArticles = new Map(); // 번역된 기사 캐시
        this.isTranslating = false;
    }

    // 기사 번역
    async translateArticle(article) {
        // 이미 번역된 기사가 있으면 캐시에서 반환
        if (this.translatedArticles.has(article.id)) {
            return this.translatedArticles.get(article.id);
        }

        try {
            this.isTranslating = true;
            
            // Google Translate API 사용 (무료 프록시)
            const translatedTitle = await this.translateText(article.title);
            const translatedDescription = await this.translateText(article.description);
            const translatedContent = await this.translateText(article.content);

            const translatedArticle = {
                ...article,
                title: translatedTitle,
                description: translatedDescription,
                content: translatedContent,
                isTranslated: true
            };

            // 캐시에 저장
            this.translatedArticles.set(article.id, translatedArticle);
            
            return translatedArticle;
        } catch (error) {
            console.error('번역 실패:', error);
            return article; // 번역 실패시 원본 반환
        } finally {
            this.isTranslating = false;
        }
    }

    // 텍스트 번역 (Google Translate 프록시 사용)
    async translateText(text) {
        const proxyUrls = [
            'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=',
            'https://api.mymemory.translated.net/get?q=',
            'https://libretranslate.de/translate'
        ];

        for (const proxyUrl of proxyUrls) {
            try {
                let response;
                
                if (proxyUrl.includes('googleapis')) {
                    // Google Translate
                    response = await fetch(proxyUrl + encodeURIComponent(text));
                    const data = await response.json();
                    return data[0][0][0];
                } else if (proxyUrl.includes('mymemory')) {
                    // MyMemory
                    response = await fetch(proxyUrl + encodeURIComponent(text) + '&langpair=en|ko');
                    const data = await response.json();
                    return data.responseData.translatedText;
                } else if (proxyUrl.includes('libretranslate')) {
                    // LibreTranslate
                    response = await fetch(proxyUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            q: text,
                            source: 'en',
                            target: 'ko'
                        })
                    });
                    const data = await response.json();
                    return data.translatedText;
                }
            } catch (error) {
                console.error(`${proxyUrl} 번역 실패:`, error);
                continue;
            }
        }
        
        throw new Error('모든 번역 서비스 실패');
    }

    // 번역 상태 확인
    isTranslationInProgress() {
        return this.isTranslating;
    }

    // 캐시 클리어
    clearCache() {
        this.translatedArticles.clear();
    }
}

// 전역 번역기 인스턴스
window.articleTranslator = new ArticleTranslator();
