/**
 * 해외 축구 뉴스 수집기
 * 네이버 스포츠 해외축구(wfootball) 뉴스를 수집합니다.
 */

class InternationalFootballNews {
    constructor() {
        this.news = [];
        this.cache = null;
        this.cacheKey = 'international-football-news-cache';
        this.cacheExpiry = 30 * 60 * 1000; // 30분
        
        // RSS 피드 (해외축구)
        this.RSS_FEEDS = [
            'https://sports.news.naver.com/wfootball/index.nhn?rss=1'
        ];
        
        // 크롤링 사이트 (해외축구)
        this.CRAWL_SITES = [
            {
                name: '네이버 스포츠 해외축구',
                url: 'https://sports.news.naver.com/wfootball',
                apiUrl: 'https://sports.news.naver.com/wfootball/news/list?isphoto=N&page=1&pageSize=20'
            }
        ];
        
        // 프록시 서비스들
        this.PROXY_URLS = [
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?',
            'https://thingproxy.freeboard.io/fetch/',
            'https://api.codetabs.com/v1/proxy?quest='
        ];
        
        this.currentProxyIndex = 0;
    }
    
    /**
     * 모든 뉴스 수집
     */
    async collectAllNews() {
        console.log('해외 축구 뉴스 수집 시작...');
        
        let allNews = [];
        
        // RSS 피드에서 수집
        for (const rssUrl of this.RSS_FEEDS) {
            const rssNews = await this.collectFromRSS(rssUrl);
            allNews = allNews.concat(rssNews);
        }
        
        // 크롤링에서 수집
        for (const site of this.CRAWL_SITES) {
            const crawlNews = await this.collectFromCrawling(site);
            allNews = allNews.concat(crawlNews);
        }
        
        // 중복 제거 및 정렬
        allNews = this.removeDuplicates(allNews);
        allNews.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        
        this.news = allNews;
        console.log(`총 ${allNews.length}개의 해외 축구 뉴스 수집 완료`);
        
        return allNews;
    }
    
    /**
     * RSS 피드에서 뉴스 수집
     */
    async collectFromRSS(rssUrl) {
        console.log(`RSS 수집 중: ${rssUrl}`);
        
        try {
            const text = await this.fetchWithProxy(rssUrl);
            console.log(`RSS 응답 길이: ${text.length}`);
            console.log(`RSS 응답 샘플: ${text.substring(0, 200)}`);
            
            // HTML 응답인지 확인 (RSS가 아닌 경우)
            if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
                console.log('HTML 응답 감지, 크롤링으로 전환');
                return [];
            }
            
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, 'text/xml');
            
            const items = xmlDoc.querySelectorAll('item');
            const news = [];
            
            items.forEach(item => {
                const title = item.querySelector('title')?.textContent || '';
                const description = item.querySelector('description')?.textContent || '';
                const link = item.querySelector('link')?.textContent || '';
                const pubDate = item.querySelector('pubDate')?.textContent || '';
                
                if (title && link) {
                    news.push({
                        id: `rss-${Date.now()}-${Math.random()}`,
                        title: title,
                        description: this.cleanDescription(description),
                        link: link,
                        publishedAt: this.parseRSSDate(pubDate),
                        source: '네이버 스포츠 해외축구',
                        type: 'rss',
                        summary: this.cleanDescription(description)
                    });
                }
            });
            
            console.log(`${rssUrl}에서 ${news.length}개 뉴스 수집`);
            return news;
            
        } catch (error) {
            console.error(`RSS 수집 실패 (${rssUrl}):`, error);
            return [];
        }
    }
    
    /**
     * 크롤링에서 뉴스 수집
     */
    async collectFromCrawling(site) {
        console.log(`크롤링 중: ${site.name}`);
        
        try {
            const text = await this.fetchWithProxy(site.apiUrl);
            console.log(`${site.name} HTML 길이: ${text.length}`);
            
            // JSON 응답 파싱
            try {
                const json = JSON.parse(text);
                
                if (json.list && Array.isArray(json.list)) {
                    const news = json.list.map(item => {
                        console.log('해외축구 뉴스 아이템 전체:', item);
                        
                        // 네이버 뉴스 URL 생성: https://sports.news.naver.com/news?oid=421&aid=0008431018
                        const newsUrl = `https://sports.news.naver.com/news?oid=${item.oid}&aid=${item.aid}`;
                        
                        // 기자 이름 추출 (subContent에서 "기자" 패턴 찾기) - 공백이 없는 경우도 처리
                        const reporterMatch = item.subContent?.match(/([가-힣]+)\s*기자/) || 
                                            item.title?.match(/([가-힣]+)\s*기자/) ||
                                            item.subContent?.match(/([가-힣]+)기자/) ||
                                            item.title?.match(/([가-힣]+)기자/);
                        const reporter = reporterMatch ? reporterMatch[1] : null;
                        
                        console.log('해외축구 뉴스 아이템:', {
                            title: item.title,
                            datetime: item.datetime,
                            parsedDate: this.parseNaverDate(item.datetime),
                            oid: item.oid,
                            aid: item.aid,
                            generatedUrl: newsUrl,
                            reporter: reporter
                        });
                        
                        return {
                            id: `crawl-${Date.now()}-${Math.random()}`,
                            title: item.title,
                            description: item.subContent || item.title,
                            link: newsUrl,
                            publishedAt: this.parseNaverDate(item.datetime),
                            source: item.officeName || site.name,
                            reporter: reporter,
                            type: 'crawl',
                            summary: item.subContent || item.title // 전체 subContent를 요약으로 사용
                        };
                    });
                    
                    console.log(`${site.name}에서 ${news.length}개 뉴스 수집`);
                    return news;
                }
            } catch (jsonError) {
                console.log('JSON 파싱 실패, HTML 크롤링 시도');
                return this.parseHTMLContent(text, site);
            }
            
        } catch (error) {
            console.error(`크롤링 실패 (${site.name}):`, error);
        }
        
        return [];
    }
    
    /**
     * HTML 내용 파싱 (JSON API가 실패한 경우)
     */
    parseHTMLContent(html, site) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // 뉴스 요소 찾기
            const newsElements = doc.querySelectorAll('.news_list li, .news_item, .article_item');
            console.log(`${site.name}에서 뉴스 요소를 찾을 수 없음`);
            console.log(`사용 가능한 요소들: ${newsElements.length}`);
            console.log(`HTML 샘플: ${html.substring(0, 500)}`);
            
            return [];
            
        } catch (error) {
            console.error('HTML 파싱 실패:', error);
            return [];
        }
    }
    
    /**
     * 프록시를 사용한 데이터 가져오기
     */
    async fetchWithProxy(url) {
        for (let i = 0; i < this.PROXY_URLS.length; i++) {
            const proxyIndex = (this.currentProxyIndex + i) % this.PROXY_URLS.length;
            const proxyUrl = this.PROXY_URLS[proxyIndex];
            
            try {
                console.log(`프록시 시도: ${proxyUrl}`);
                const response = await fetch(proxyUrl + encodeURIComponent(url));
                
                if (response.ok) {
                    const text = await response.text();
                    console.log(`프록시 성공: ${proxyUrl}`);
                    this.currentProxyIndex = proxyIndex;
                    return text;
                }
            } catch (error) {
                console.log(`프록시 실패 (${proxyUrl}):`, error);
                continue;
            }
        }
        
        throw new Error('모든 프록시 서비스 실패');
    }
    
    /**
     * RSS 날짜 파싱
     */
    parseRSSDate(dateString) {
        if (!dateString) return new Date();
        
        try {
            return new Date(dateString);
        } catch (error) {
            console.error('RSS 날짜 파싱 오류:', error);
            return new Date();
        }
    }
    
    /**
     * 네이버 날짜 파싱
     */
    parseNaverDate(dateString) {
        if (!dateString) return new Date();
        
        try {
            // 'YYYY.MM.DD HH:MM' 형식 (예: '2025.08.16 10:12')
            if (dateString.includes('.')) {
                const [datePart, timePart] = dateString.split(' ');
                const [year, month, day] = datePart.split('.').map(Number);
                const [hour, minute] = timePart.split(':').map(Number);
                
                return new Date(year, month - 1, day, hour, minute);
            }
            
            // 'YYYYMMDDHHMMSS' 형식
            if (dateString.length === 14) {
                const year = parseInt(dateString.substring(0, 4));
                const month = parseInt(dateString.substring(4, 6)) - 1;
                const day = parseInt(dateString.substring(6, 8));
                const hour = parseInt(dateString.substring(8, 10));
                const minute = parseInt(dateString.substring(10, 12));
                const second = parseInt(dateString.substring(12, 14));
                
                return new Date(year, month, day, hour, minute, second);
            }
            
            return new Date(dateString);
            
        } catch (error) {
            console.error('네이버 날짜 파싱 오류:', error);
            return new Date();
        }
    }
    
    /**
     * 설명 텍스트 정리
     */
    cleanDescription(description) {
        if (!description) return '';
        
        return description
            .replace(/<[^>]*>/g, '') // HTML 태그 제거
            .replace(/&[^;]+;/g, '') // HTML 엔티티 제거
            .replace(/^\s+/, '') // 앞쪽 공백 제거
            .trim();
    }
    
    /**
     * 중복 뉴스 제거
     */
    removeDuplicates(news) {
        const seen = new Set();
        return news.filter(item => {
            const key = `${item.title}-${item.source}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
    
    /**
     * 뉴스 검색
     */
    searchNews(news, keyword) {
        if (!keyword) return news;
        
        const lowerKeyword = keyword.toLowerCase();
        return news.filter(item => 
            item.title.toLowerCase().includes(lowerKeyword) ||
            item.description.toLowerCase().includes(lowerKeyword) ||
            item.source.toLowerCase().includes(lowerKeyword)
        );
    }
    
    /**
     * 소스별 필터링
     */
    filterBySource(news, source) {
        if (!source) return news;
        return news.filter(item => item.source === source);
    }
    
    /**
     * 캐시된 뉴스 가져오기
     */
    getCachedNews() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                if (Date.now() - data.timestamp < this.cacheExpiry) {
                    return data.news;
                }
            }
        } catch (error) {
            console.error('캐시 읽기 오류:', error);
        }
        return [];
    }
    
    /**
     * 캐시 업데이트
     */
    updateCache(news) {
        try {
            const cacheData = {
                news: news,
                timestamp: Date.now()
            };
            localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            console.error('캐시 업데이트 오류:', error);
        }
    }
    
    /**
     * 마지막 업데이트 시간
     */
    getLastUpdate() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                return new Date(data.timestamp);
            }
        } catch (error) {
            console.error('마지막 업데이트 읽기 오류:', error);
        }
        return null;
    }
}

// 전역 객체로 등록
window.internationalFootballNews = new InternationalFootballNews();
