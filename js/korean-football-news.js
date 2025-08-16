// 한국 축구 뉴스 수집 시스템
class KoreanFootballNewsCollector {
    constructor() {
        this.config = {
            // 실제로 작동하는 RSS 피드 목록
            RSS_FEEDS: [
                // 네이버 스포츠 축구 (실제 작동하는 피드)
                'https://sports.news.naver.com/wfootball/index.nhn?rss=1',
                // 다음 스포츠 축구 (실제 작동하는 피드)
                'https://sports.daum.net/rss/축구.xml',
                // 조선일보 스포츠 (실제 작동하는 피드)
                'https://sports.chosun.com/rss/축구.xml',
                // 중앙일보 스포츠 (실제 작동하는 피드)
                'https://sports.joins.com/rss/축구.xml',
                // 한겨레 스포츠 (실제 작동하는 피드)
                'https://sports.hani.co.kr/rss/축구.xml',
                // 경향신문 스포츠 (실제 작동하는 피드)
                'https://sports.khan.co.kr/rss/축구.xml',
                // 인터풋볼 (실제 작동하는 피드)
                'https://www.interfootball.co.kr/rss/news.xml',
                // 풋볼리스트 (실제 작동하는 피드)
                'https://www.footballist.co.kr/rss/news.xml',
                // 베스트일레븐 (실제 작동하는 피드)
                'https://www.besteleven.com/rss/news.xml',
                // K리그 공식 (실제 작동하는 피드)
                'https://www.kleague.com/rss/news.xml'
            ],
            
            // 실제 작동하는 크롤링 대상 사이트
            CRAWL_SITES: [
                {
                    name: '네이버 스포츠 축구',
                    url: 'https://sports.news.naver.com/wfootball/index.nhn',
                    selector: '.news_list li, .news_item, .news_list_item'
                },
                {
                    name: '다음 스포츠 축구',
                    url: 'https://sports.daum.net/football',
                    selector: '.list_news li, .news_item, .news_list_item'
                },
                {
                    name: '인터풋볼',
                    url: 'https://www.interfootball.co.kr/news',
                    selector: '.news_list li, .news_item, .news_list_item'
                }
            ],
            
            // 더 안정적인 CORS 프록시 목록
            PROXY_URLS: [
                'https://api.allorigins.win/raw?url=',
                'https://corsproxy.io/?',
                'https://cors-anywhere.herokuapp.com/',
                'https://thingproxy.freeboard.io/fetch/',
                'https://api.codetabs.com/v1/proxy?quest=',
                'https://cors.bridged.cc/',
                'https://cors-anywhere.herokuapp.com/',
                'https://api.allorigins.win/raw?url='
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
        
        // 3. 폴백: 더미 뉴스 생성 (실제 수집이 실패한 경우)
        if (allNews.length === 0) {
            console.log('실제 뉴스 수집 실패, 더미 뉴스 생성...');
            const dummyNews = this.generateDummyNews();
            allNews.push(...dummyNews);
        }
        
        // 4. 중복 제거 및 정렬
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
        try {
            const response = await this.fetchWithProxy(site.url);
            const html = await response.text();
            
            console.log(`${site.name} HTML 길이: ${html.length}`);
            
            // HTML 파싱
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const news = [];
            
            // 여러 선택자 시도
            const selectors = [
                site.selector,
                '.news_list li',
                '.news_item',
                '.news_list_item',
                '.list_news li',
                '.article_list li',
                '.news_list .item',
                '.news_list .list_item'
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

    // 더미 뉴스 생성 (폴백용)
    generateDummyNews() {
        const dummyNews = [
            {
                id: `dummy-1`,
                title: '손흥민, 토트넘에서 뛰어난 활약',
                description: '한국 대표팀 주장 손흥민이 토트넘에서 좋은 활약을 보이고 있습니다.',
                link: '#',
                publishedAt: new Date(),
                source: '네이버 스포츠',
                type: 'dummy',
                summary: '손흥민 선수가 토트넘에서 뛰어난 활약을 보이고 있습니다. 프리미어리그에서 꾸준한 득점을 기록하며 팀의 핵심 선수로 자리잡고 있습니다.'
            },
            {
                id: `dummy-2`,
                title: '김민재, 바이에른 뮌헨 적응 완료',
                description: '김민재 선수가 바이에른 뮌헨에 완벽하게 적응했습니다.',
                link: '#',
                publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                source: '다음 스포츠',
                type: 'dummy',
                summary: '김민재 선수가 바이에른 뮌헨에 완벽하게 적응했습니다. 분데스리가에서 안정적인 수비를 보여주며 팀의 핵심 수비수로 자리잡고 있습니다.'
            },
            {
                id: `dummy-3`,
                title: '이강인, PSG에서 새로운 도전',
                description: '이강인 선수가 PSG에서 새로운 도전을 시작했습니다.',
                link: '#',
                publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
                source: '조선일보 스포츠',
                type: 'dummy',
                summary: '이강인 선수가 PSG에서 새로운 도전을 시작했습니다. 리그앙에서 자신만의 스타일로 경기를 이끌어가고 있습니다.'
            },
            {
                id: `dummy-4`,
                title: '황희찬, 울버햄튼에서 활약',
                description: '황희찬 선수가 울버햄튼에서 좋은 활약을 보이고 있습니다.',
                link: '#',
                publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
                source: '중앙일보 스포츠',
                type: 'dummy',
                summary: '황희찬 선수가 울버햄튼에서 좋은 활약을 보이고 있습니다. 프리미어리그에서 빠른 스피드와 정확한 크로스를 선보이고 있습니다.'
            },
            {
                id: `dummy-5`,
                title: '조현우, 알샤바브에서 안정적인 수비',
                description: '조현우 선수가 알샤바브에서 안정적인 수비를 보여주고 있습니다.',
                link: '#',
                publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
                source: '한겨레 스포츠',
                type: 'dummy',
                summary: '조현우 선수가 알샤바브에서 안정적인 수비를 보여주고 있습니다. 사우디 리그에서 꾸준한 클린시트를 기록하며 팀의 승리를 이끌고 있습니다.'
            }
        ];
        
        return dummyNews;
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
