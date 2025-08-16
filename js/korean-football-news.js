// 한국 축구 뉴스 수집 시스템
class KoreanFootballNewsCollector {
    constructor() {
        this.config = {
            // 네이버 스포츠 축구만 사용
            RSS_FEEDS: [
                'https://sports.news.naver.com/kfootball/index.nhn?rss=1'
            ],
            
            // 네이버 스포츠 축구만 크롤링
            CRAWL_SITES: [
                {
                    name: '네이버 스포츠 축구',
                    url: 'https://sports.news.naver.com/wfootball/news/index.nhn',
                    selector: '.news_list li, .news_item, .news_list_item, .list_news li, .news_list .item, .news_list .list_item, .news_list .news_item, .news_list .news_list_item'
                }
            ],
            
            // 더 안정적인 CORS 프록시 목록
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
        try {
            const rssNews = await this.collectFromRSS();
            allNews.push(...rssNews);
        } catch (error) {
            console.log('RSS 수집 실패:', error);
        }
        
        // 2. 크롤링으로 뉴스 수집
        try {
            const crawlNews = await this.collectFromCrawling();
            allNews.push(...crawlNews);
        } catch (error) {
            console.log('크롤링 실패:', error);
        }
        
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
        try {
            const response = await this.fetchWithProxy(rssUrl);
            const text = await response.text();
            
            console.log(`RSS 응답 길이: ${text.length}`);
            console.log(`RSS 응답 샘플: ${text.substring(0, 500)}`);
            
            // XML이 아닌 HTML이 반환되는 경우 처리
            if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
                console.log('HTML 응답 감지, 크롤링으로 전환');
                return [];
            }
            
            // XML 파싱
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, 'text/xml');
            
            const news = [];
            const items = xmlDoc.querySelectorAll('item');
            
            console.log(`RSS 아이템 수: ${items.length}`);
            
            items.forEach((item, index) => {
                if (index >= 20) return; // 최대 20개만
                
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
                        link: link || '#',
                        publishedAt: this.parseDate(pubDate),
                        source: source,
                        type: 'rss',
                        summary: this.generateSummary(description || title)
                    });
                }
            });
            
            return news;
        } catch (error) {
            console.error(`RSS 파싱 실패:`, error);
            return [];
        }
    }

    // 크롤링으로 뉴스 수집
    async collectFromCrawling() {
        const allNews = [];
        for (const site of this.config.CRAWL_SITES) {
            try {
                console.log(`크롤링 중: ${site.name}`);
                const apiUrl = 'https://sports.news.naver.com/kfootball/news/list?isphoto=N&page=1&pageSize=20';
                const response = await this.fetchWithProxy(apiUrl);
                const json = await response.json();
    
                const news = json.list.map(item => {
                    console.log('네이버 뉴스 아이템 전체:', item);
                    
                    // 네이버 뉴스 URL 생성: https://sports.news.naver.com/news?oid=421&aid=0008431018
                    const newsUrl = `https://sports.news.naver.com/news?oid=${item.oid}&aid=${item.aid}`;
                    
                    // 기자 이름 추출 (subContent에서 "기자" 패턴 찾기) - 공백이 없는 경우도 처리
                    const reporterMatch = item.subContent?.match(/([가-힣]+)\s*기자/) || 
                                        item.title?.match(/([가-힣]+)\s*기자/) ||
                                        item.subContent?.match(/([가-힣]+)기자/) ||
                                        item.title?.match(/([가-힣]+)기자/);
                    const reporter = reporterMatch ? reporterMatch[1] : null;
                    
                    console.log('네이버 뉴스 아이템:', {
                        title: item.title,
                        datetime: item.datetime,
                        parsedDate: this.parseNaverDate(item.datetime),
                        oid: item.oid,
                        aid: item.aid,
                        generatedUrl: newsUrl,
                        reporter: reporter
                    });
                    
                    return {
                        id: this.generateStableNewsId(item.title),
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
        try {
            const response = await this.fetchWithProxy(site.url);
            const html = await response.text();
            
            console.log(`${site.name} HTML 길이: ${html.length}`);
            
            // HTML 파싱
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const news = [];
            
            // 여러 선택자 시도 (네이버 스포츠 축구 전용)
            const selectors = [
                site.selector,
                // 네이버 스포츠 축구 전용 선택자들
                '.news_list li',
                '.news_item',
                '.news_list_item',
                '.list_news li',
                '.article_list li',
                '.news_list .item',
                '.news_list .list_item',
                '.news_list .news_item',
                '.news_list .news_list_item',
                // 추가 네이버 선택자들
                '.news_list .list_item',
                '.news_list .item',
                '.news_list .news_item',
                '.news_list .news_list_item',
                // 더 일반적인 선택자들
                'li',
                '.item',
                '.list_item',
                '.news_item',
                '.article_item',
                '.content_item',
                // 네이버 특화 선택자들
                '.news_list .list_item',
                '.news_list .item',
                '.news_list .news_item',
                '.news_list .news_list_item',
                '.news_list .list_item',
                '.news_list .item',
                '.news_list .news_item',
                '.news_list .news_list_item',
                // 더 구체적인 선택자들
                '.news_list .list_item a',
                '.news_list .item a',
                '.news_list .news_item a',
                '.news_list .news_list_item a',
                '.list_news .item a',
                '.article_list .item a'
            ];
            
            let newsElements = [];
            for (const selector of selectors) {
                newsElements = doc.querySelectorAll(selector);
                if (newsElements.length > 0) {
                    console.log(`${site.name}에서 선택자 "${selector}"로 ${newsElements.length}개 요소 발견`);
                    break;
                }
            }
            
            if (newsElements.length === 0) {
                console.log(`${site.name}에서 뉴스 요소를 찾을 수 없음`);
                console.log('사용 가능한 요소들:', doc.querySelectorAll('*').length);
                console.log('HTML 샘플:', html.substring(0, 1000));
                return [];
            }
            
            newsElements.forEach((element, index) => {
                if (index >= 10) return; // 최대 10개만
                
                const titleElement = element.querySelector('a, h3, h4, .title, .headline, .news_title');
                const title = titleElement?.textContent?.trim();
                const link = titleElement?.href || titleElement?.getAttribute('href');
                const descriptionElement = element.querySelector('p, .description, .summary, .news_summary');
                const description = descriptionElement?.textContent?.trim();
                
                if (title && this.isFootballRelated(title)) {
                    news.push({
                        id: this.generateStableNewsId(this.cleanTitle(title)),
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
        } catch (error) {
            console.error(`${site.name} 크롤링 오류:`, error);
            return [];
        }
    }

    // 프록시를 통한 요청
    async fetchWithProxy(url) {
        for (const proxyUrl of this.config.PROXY_URLS) {
            try {
                const userAgent = this.config.USER_AGENTS[Math.floor(Math.random() * this.config.USER_AGENTS.length)];
                
                console.log(`프록시 시도: ${proxyUrl}`);
                
                const response = await fetch(proxyUrl + encodeURIComponent(url), {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'User-Agent': userAgent
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                console.log(`프록시 성공: ${proxyUrl}`);
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

    // 뉴스 제목을 기반으로 안정적인 ID 생성
    generateStableNewsId(title) {
        if (!title) return `crawl-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
        
        // 뉴스 제목을 정규화 (공백 제거, 특수문자 제거)
        const normalizedTitle = title
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
        
        return `crawl-${Math.abs(hash)}`;
    }

    // 설명 정리
    cleanDescription(description) {
        return description
            .replace(/&[^;]+;/g, '') // HTML 엔티티 제거
            .replace(/<[^>]*>/g, '') // HTML 태그 제거
            .replace(/\s+/g, ' ') // 연속 공백 제거
            .replace(/^\s+/, '') // 첫 줄 앞 공백 제거
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

    // 네이버 날짜 파싱 (YYYY.MM.DD HH:MM 형식)
    parseNaverDate(dateString) {
        if (!dateString) return new Date();

        try {
            // '2025.08.16 10:12' 형식 파싱
            const [datePart, timePart] = dateString.split(' ');
            const [year, month, day] = datePart.split('.').map(num => parseInt(num));
            const [hour, minute] = timePart.split(':').map(num => parseInt(num));
            
            // 월은 0부터 시작하므로 -1
            return new Date(year, month - 1, day, hour, minute);
        } catch (error) {
            console.error(`네이버 날짜 파싱 실패: ${dateString}`, error);
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
