// 한국 축구 뉴스 수집 시스템
class KoreanFootballNewsCollector {
    constructor() {
        this.config = {
            // RSS 피드 목록 (한국 주요 축구 뉴스)
            RSS_FEEDS: [
                // 네이버 스포츠 축구
                'https://sports.news.naver.com/wfootball/index.nhn?rss=1',
                // 다음 스포츠 축구
                'https://sports.daum.net/rss/축구.xml',
                // 조선일보 스포츠
                'https://sports.chosun.com/rss/축구.xml',
                // 중앙일보 스포츠
                'https://sports.joins.com/rss/축구.xml',
                // 한겨레 스포츠
                'https://sports.hani.co.kr/rss/축구.xml',
                // 경향신문 스포츠
                'https://sports.khan.co.kr/rss/축구.xml',
                // 인터풋볼
                'https://www.interfootball.co.kr/rss/news.xml',
                // 풋볼리스트
                'https://www.footballist.co.kr/rss/news.xml',
                // 베스트일레븐
                'https://www.besteleven.com/rss/news.xml',
                // K리그 공식
                'https://www.kleague.com/rss/news.xml'
            ],
            
            // 크롤링 대상 사이트 (RSS가 없는 경우)
            CRAWL_SITES: [
                {
                    name: '네이버 스포츠 축구',
                    url: 'https://sports.news.naver.com/wfootball/index.nhn',
                    selector: '.news_list li'
                },
                {
                    name: '다음 스포츠 축구',
                    url: 'https://sports.daum.net/football',
                    selector: '.list_news li'
                },
                {
                    name: '인터풋볼',
                    url: 'https://www.interfootball.co.kr/news',
                    selector: '.news_list li'
                }
            ],
            
            // CORS 프록시 목록
            PROXY_URLS: [
                'https://api.allorigins.win/raw?url=',
                'https://corsproxy.io/?',
                'https://cors-anywhere.herokuapp.com/',
                'https://thingproxy.freeboard.io/fetch/',
                'https://api.codetabs.com/v1/proxy?quest=',
                'https://cors.bridged.cc/'
            ],
            
            // User Agent 목록
            USER_AGENTS: [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
            ]
        };
        
        this.newsCache = new Map();
        this.lastUpdate = null;
    }

    // 메인 뉴스 수집 함수
    async collectAllNews() {
        console.log('한국 축구 뉴스 수집 시작...');
        
        const allNews = [];
        
        // 1. RSS 피드에서 뉴스 수집
        const rssNews = await this.collectFromRSS();
        allNews.push(...rssNews);
        
        // 2. 크롤링으로 뉴스 수집 (RSS가 없는 사이트)
        const crawlNews = await this.collectFromCrawling();
        allNews.push(...crawlNews);
        
        // 3. 중복 제거 및 정렬
        const uniqueNews = this.removeDuplicates(allNews);
        const sortedNews = this.sortByDate(uniqueNews);
        
        console.log(`총 ${sortedNews.length}개의 한국 축구 뉴스 수집 완료`);
        return sortedNews;
    }

    // RSS 피드에서 뉴스 수집
    async collectFromRSS() {
        const allNews = [];
        
        for (const rssUrl of this.config.RSS_FEEDS) {
            try {
                console.log(`RSS 수집 중: ${rssUrl}`);
                const news = await this.parseRSSFeed(rssUrl);
                allNews.push(...news);
                console.log(`${rssUrl}에서 ${news.length}개 뉴스 수집`);
            } catch (error) {
                console.error(`RSS 수집 실패 (${rssUrl}):`, error);
            }
        }
        
        return allNews;
    }

    // RSS 피드 파싱
    async parseRSSFeed(rssUrl) {
        const response = await this.fetchWithProxy(rssUrl);
        const text = await response.text();
        
        // XML 파싱
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');
        
        const news = [];
        const items = xmlDoc.querySelectorAll('item');
        
        items.forEach(item => {
            const title = item.querySelector('title')?.textContent?.trim();
            const description = item.querySelector('description')?.textContent?.trim();
            const link = item.querySelector('link')?.textContent?.trim();
            const pubDate = item.querySelector('pubDate')?.textContent?.trim();
            const source = this.extractSourceFromRSS(rssUrl);
            
            if (title && this.isFootballRelated(title)) {
                news.push({
                    id: `rss-${Date.now()}-${Math.random()}`,
                    title: this.cleanTitle(title),
                    description: this.cleanDescription(description || title),
                    link: link,
                    publishedAt: this.parseDate(pubDate),
                    source: source,
                    type: 'rss',
                    summary: this.generateSummary(description || title)
                });
            }
        });
        
        return news;
    }

    // 크롤링으로 뉴스 수집
    async collectFromCrawling() {
        const allNews = [];
        
        for (const site of this.config.CRAWL_SITES) {
            try {
                console.log(`크롤링 중: ${site.name}`);
                const news = await this.crawlSite(site);
                allNews.push(...news);
                console.log(`${site.name}에서 ${news.length}개 뉴스 수집`);
            } catch (error) {
                console.error(`크롤링 실패 (${site.name}):`, error);
            }
        }
        
        return allNews;
    }

    // 사이트 크롤링
    async crawlSite(site) {
        const response = await this.fetchWithProxy(site.url);
        const html = await response.text();
        
        // HTML 파싱
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const news = [];
        const newsElements = doc.querySelectorAll(site.selector);
        
        newsElements.forEach((element, index) => {
            if (index >= 10) return; // 최대 10개만
            
            const titleElement = element.querySelector('a, h3, h4, .title, .headline');
            const title = titleElement?.textContent?.trim();
            const link = titleElement?.href || titleElement?.getAttribute('href');
            const descriptionElement = element.querySelector('p, .description, .summary');
            const description = descriptionElement?.textContent?.trim();
            
            if (title && this.isFootballRelated(title)) {
                news.push({
                    id: `crawl-${Date.now()}-${Math.random()}`,
                    title: this.cleanTitle(title),
                    description: this.cleanDescription(description || title),
                    link: this.makeAbsoluteUrl(link, site.url),
                    publishedAt: new Date(),
                    source: site.name,
                    type: 'crawl',
                    summary: this.generateSummary(description || title)
                });
            }
        });
        
        return news;
    }

    // 프록시를 통한 요청
    async fetchWithProxy(url) {
        for (const proxyUrl of this.config.PROXY_URLS) {
            try {
                const userAgent = this.config.USER_AGENTS[Math.floor(Math.random() * this.config.USER_AGENTS.length)];
                
                const response = await fetch(proxyUrl + encodeURIComponent(url), {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'User-Agent': userAgent
                    },
                    timeout: 10000
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                return response;
            } catch (error) {
                console.error(`${proxyUrl} 프록시 실패:`, error);
                continue;
            }
        }
        
        throw new Error('모든 프록시 실패');
    }

    // 축구 관련 뉴스인지 확인
    isFootballRelated(title) {
        const footballKeywords = [
            '축구', '축구선수', '축구팀', '축구경기', '축구리그', '축구대회',
            'K리그', 'K1', 'K2', 'K3', 'K4', 'K5',
            '프리미어리그', '라리가', '분데스리가', '세리에A', '리그앙',
            '챔피언스리그', '유로파리그', '월드컵', '아시안컵',
            '손흥민', '김민재', '이강인', '황희찬', '조현우',
            '맨유', '리버풀', '아스널', '첼시', '토트넘',
            '레알마드리드', '바르셀로나', '아틀레티코',
            '바이에른', '도르트문트', '레버쿠젠',
            '유벤투스', '밀란', '인터', '나폴리',
            'PSG', '마르세유', '리옹', '모나코'
        ];
        
        const lowerTitle = title.toLowerCase();
        return footballKeywords.some(keyword => lowerTitle.includes(keyword.toLowerCase()));
    }

    // 제목 정리
    cleanTitle(title) {
        return title
            .replace(/&[^;]+;/g, '') // HTML 엔티티 제거
            .replace(/[<>]/g, '') // HTML 태그 제거
            .replace(/\s+/g, ' ') // 연속 공백 제거
            .trim();
    }

    // 설명 정리
    cleanDescription(description) {
        return description
            .replace(/&[^;]+;/g, '') // HTML 엔티티 제거
            .replace(/<[^>]*>/g, '') // HTML 태그 제거
            .replace(/\s+/g, ' ') // 연속 공백 제거
            .substring(0, 200) // 200자로 제한
            .trim();
    }

    // 요약 생성
    generateSummary(text) {
        const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 10);
        if (sentences.length >= 2) {
            return sentences.slice(0, 2).join('. ') + '.';
        }
        return text.substring(0, 100) + '...';
    }

    // 날짜 파싱
    parseDate(dateString) {
        if (!dateString) return new Date();
        
        try {
            return new Date(dateString);
        } catch (error) {
            return new Date();
        }
    }

    // RSS에서 소스명 추출
    extractSourceFromRSS(rssUrl) {
        if (rssUrl.includes('naver')) return '네이버 스포츠';
        if (rssUrl.includes('daum')) return '다음 스포츠';
        if (rssUrl.includes('chosun')) return '조선일보 스포츠';
        if (rssUrl.includes('joins')) return '중앙일보 스포츠';
        if (rssUrl.includes('hani')) return '한겨레 스포츠';
        if (rssUrl.includes('khan')) return '경향신문 스포츠';
        if (rssUrl.includes('interfootball')) return '인터풋볼';
        if (rssUrl.includes('footballist')) return '풋볼리스트';
        if (rssUrl.includes('besteleven')) return '베스트일레븐';
        if (rssUrl.includes('kleague')) return 'K리그';
        return '축구 뉴스';
    }

    // 상대 URL을 절대 URL로 변환
    makeAbsoluteUrl(url, baseUrl) {
        if (!url) return '#';
        if (url.startsWith('http')) return url;
        
        try {
            return new URL(url, baseUrl).href;
        } catch (error) {
            return baseUrl + url;
        }
    }

    // 중복 제거
    removeDuplicates(news) {
        const seen = new Set();
        return news.filter(item => {
            const key = item.title.toLowerCase().trim();
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    // 날짜순 정렬
    sortByDate(news) {
        return news.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    }

    // 뉴스 검색
    searchNews(news, keyword) {
        if (!keyword) return news;
        
        const lowerKeyword = keyword.toLowerCase();
        return news.filter(item => 
            item.title.toLowerCase().includes(lowerKeyword) ||
            item.description.toLowerCase().includes(lowerKeyword) ||
            item.source.toLowerCase().includes(lowerKeyword)
        );
    }

    // 소스별 필터링
    filterBySource(news, source) {
        if (!source) return news;
        return news.filter(item => item.source === source);
    }

    // 최근 뉴스만 가져오기 (24시간 이내)
    getRecentNews(news, hours = 24) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        return news.filter(item => new Date(item.publishedAt) > cutoff);
    }

    // 캐시된 뉴스 반환
    getCachedNews() {
        if (this.newsCache.size > 0) {
            return Array.from(this.newsCache.values());
        }
        return [];
    }

    // 뉴스 캐시 업데이트
    updateCache(news) {
        this.newsCache.clear();
        news.forEach(item => {
            this.newsCache.set(item.id, item);
        });
        this.lastUpdate = new Date();
    }

    // 마지막 업데이트 시간 반환
    getLastUpdate() {
        return this.lastUpdate;
    }
}

// 전역 인스턴스
window.koreanFootballNews = new KoreanFootballNewsCollector();
