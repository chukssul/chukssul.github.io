// 실제 크롤링 시스템
class RealCrawler {
    constructor() {
        this.config = {
            PROXY_URLS: [
                'https://api.allorigins.win/raw?url=',
                'https://cors-anywhere.herokuapp.com/',
                'https://thingproxy.freeboard.io/fetch/',
                'https://api.codetabs.com/v1/proxy?quest=',
                'https://cors.bridged.cc/',
                'https://corsproxy.io/?'
            ],
            FOOTBALL_SITES: [
                'https://www.livescore.com/football/'
            ],
            NEWS_SITES: [
                'https://www.goal.com/en/news',
                'https://www.90min.com/'
            ],
            USER_AGENTS: [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
            ]
        };
    }

    // 실제 경기 데이터 크롤링
    async crawlMatches() {
        console.log('실제 경기 데이터 크롤링 시작...');
        const allMatches = [];

        for (const site of this.config.FOOTBALL_SITES) {
            try {
                const matches = await this.crawlSite(site, 'matches');
                allMatches.push(...matches);
                console.log(`${site}에서 ${matches.length}개 경기 수집`);
            } catch (error) {
                console.error(`${site} 크롤링 실패:`, error);
            }
        }

        return allMatches;
    }

    // 실제 뉴스 데이터 크롤링
    async crawlArticles() {
        console.log('실제 뉴스 데이터 크롤링 시작...');
        const allArticles = [];

        for (const site of this.config.NEWS_SITES) {
            try {
                const articles = await this.crawlSite(site, 'articles');
                allArticles.push(...articles);
                console.log(`${site}에서 ${articles.length}개 기사 수집`);
            } catch (error) {
                console.error(`${site} 크롤링 실패:`, error);
            }
        }

        return allArticles;
    }

    // 사이트별 크롤링
    async crawlSite(url, type) {
        for (const proxyUrl of this.config.PROXY_URLS) {
            try {
                const userAgent = this.config.USER_AGENTS[Math.floor(Math.random() * this.config.USER_AGENTS.length)];
                
                const response = await fetch(proxyUrl + encodeURIComponent(url), {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'Accept-Encoding': 'gzip, deflate',
                        'Connection': 'keep-alive',
                        'User-Agent': userAgent,
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    },
                    timeout: 15000
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const html = await response.text();
                console.log(`${url} 크롤링 성공, HTML 길이: ${html.length}`);

                if (type === 'matches') {
                    return this.parseMatches(html, url);
                } else {
                    return this.parseArticles(html, url);
                }

            } catch (error) {
                console.error(`${proxyUrl} 프록시 실패:`, error);
                continue;
            }
        }
        
        throw new Error('모든 프록시 실패');
    }

    // 경기 데이터 파싱
    parseMatches(html, site) {
        const matches = [];
        
        // 사이트별 특화 파싱
        if (site.includes('livescore')) {
            return this.parseLivescoreMatches(html);
        }
        
        // 일반적인 패턴으로 경기 정보 추출 (fallback)
        const patterns = [
            /<div[^>]*class="[^"]*(match|fixture|game)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
            /<tr[^>]*class="[^"]*(match|fixture)[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi,
            /<li[^>]*class="[^"]*(match|fixture)[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
            /<article[^>]*class="[^"]*(match|fixture)[^"]*"[^>]*>([\s\S]*?)<\/article>/gi
        ];

        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(html)) !== null && matches.length < 10) {
                const matchHtml = match[2] || match[1];
                const parsedMatch = this.extractMatchInfo(matchHtml, site);
                if (parsedMatch) {
                    matches.push(parsedMatch);
                }
            }
        });

        return matches;
    }

    // 경기 정보 추출
    extractMatchInfo(matchHtml, site) {
        // 팀명 추출
        const teamPatterns = [
            /<span[^>]*class="[^"]*(home|away|team)[^"]*"[^>]*>([^<]+)<\/span>/gi,
            /<td[^>]*class="[^"]*(home|away|team)[^"]*"[^>]*>([^<]+)<\/td>/gi,
            /<div[^>]*class="[^"]*(home|away|team)[^"]*"[^>]*>([^<]+)<\/div>/gi,
            /<a[^>]*class="[^"]*(home|away|team)[^"]*"[^>]*>([^<]+)<\/a>/gi,
            /<strong[^>]*>([^<]+)<\/strong>/gi
        ];

        const teams = [];
        teamPatterns.forEach(pattern => {
            let teamMatch;
            while ((teamMatch = pattern.exec(matchHtml)) !== null) {
                const teamName = (teamMatch[2] || teamMatch[1]).trim();
                if (teamName.length > 2 && teamName.length < 30 && !teams.includes(teamName)) {
                    teams.push(teamName);
                }
            }
        });

        if (teams.length >= 2) {
            // 스코어 추출
            const scorePattern = /(\d+)\s*[-:]\s*(\d+)/;
            const scoreMatch = matchHtml.match(scorePattern);
            const homeScore = scoreMatch ? parseInt(scoreMatch[1]) : 0;
            const awayScore = scoreMatch ? parseInt(scoreMatch[2]) : 0;

            // 날짜 추출
            const datePatterns = [
                /(\d{1,2}\/\d{1,2}\/\d{4})/,
                /(\d{4}-\d{2}-\d{2})/,
                /(\d{1,2}\.\d{1,2}\.\d{4})/
            ];
            
            let matchDate = new Date();
            datePatterns.forEach(pattern => {
                const dateMatch = matchHtml.match(pattern);
                if (dateMatch) {
                    const parsedDate = new Date(dateMatch[0]);
                    if (!isNaN(parsedDate.getTime())) {
                        matchDate = parsedDate;
                    }
                }
            });

            return {
                id: `match-${Date.now()}-${Math.random()}`,
                homeTeam: teams[0],
                awayTeam: teams[1],
                homeScore: homeScore,
                awayScore: awayScore,
                date: matchDate,
                status: 'scheduled',
                venue: '경기장',
                referee: '주심',
                leagueName: this.extractLeagueName(site)
            };
        }

        return null;
    }

    // Livescore 경기 파싱
    parseLivescoreMatches(html) {
        const matches = [];
        
        // Livescore의 실제 HTML 구조 분석
        // 경기 카드 패턴들
        const matchPatterns = [
            // 메인 경기 카드
            /<div[^>]*class="[^"]*(match-row|match-card|fixture-row)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
            // 테이블 행
            /<tr[^>]*class="[^"]*(match-row|fixture-row)[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi,
            // 리스트 아이템
            /<li[^>]*class="[^"]*(match-item|fixture-item)[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
            // 일반적인 경기 컨테이너
            /<div[^>]*class="[^"]*(match|fixture)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
        ];
        
        console.log('Livescore HTML 길이:', html.length);
        console.log('HTML 샘플:', html.substring(0, 1000));
        
        matchPatterns.forEach((pattern, index) => {
            console.log(`패턴 ${index + 1} 시도 중...`);
            let match;
            while ((match = pattern.exec(html)) !== null && matches.length < 15) {
                const matchHtml = match[2] || match[1];
                console.log(`경기 HTML 발견 (패턴 ${index + 1}):`, matchHtml.substring(0, 200));
                
                const parsedMatch = this.extractLivescoreMatchInfo(matchHtml);
                if (parsedMatch) {
                    matches.push(parsedMatch);
                    console.log('경기 파싱 성공:', parsedMatch);
                }
            }
        });
        
        console.log(`총 ${matches.length}개 경기 파싱 완료`);
        return matches;
    }

    // Livescore 경기 정보 추출
    extractLivescoreMatchInfo(matchHtml) {
        console.log('Livescore 경기 정보 추출 시작:', matchHtml.substring(0, 300));
        
        // 팀명 추출 - 다양한 패턴 시도
        const teamPatterns = [
            // 클래스 기반 팀명
            /<span[^>]*class="[^"]*(team-name|team|home-team|away-team)[^"]*"[^>]*>([^<]+)<\/span>/gi,
            // 링크 기반 팀명
            /<a[^>]*class="[^"]*(team-name|team)[^"]*"[^>]*>([^<]+)<\/a>/gi,
            // div 기반 팀명
            /<div[^>]*class="[^"]*(team-name|team)[^"]*"[^>]*>([^<]+)<\/div>/gi,
            // 일반적인 텍스트 패턴
            /<[^>]*>([A-Z][a-zA-Z\s]+(?:FC|United|City|Town|Rovers|Athletic|Wanderers|Albion))<\/[^>]*>/gi
        ];
        
        const teams = [];
        teamPatterns.forEach((pattern, index) => {
            console.log(`팀명 패턴 ${index + 1} 시도 중...`);
            let teamMatch;
            while ((teamMatch = pattern.exec(matchHtml)) !== null) {
                const teamName = (teamMatch[2] || teamMatch[1]).trim();
                if (teamName.length > 2 && teamName.length < 50 && !teams.includes(teamName)) {
                    teams.push(teamName);
                    console.log(`팀명 발견: ${teamName}`);
                }
            }
        });
        
        console.log('발견된 팀들:', teams);
        
        if (teams.length >= 2) {
            // 스코어 추출
            const scorePatterns = [
                /(\d+)\s*[-:]\s*(\d+)/,
                /<span[^>]*class="[^"]*score[^"]*"[^>]*>(\d+)\s*[-:]\s*(\d+)<\/span>/i,
                /<div[^>]*class="[^"]*score[^"]*"[^>]*>(\d+)\s*[-:]\s*(\d+)<\/div>/i
            ];
            
            let homeScore = 0, awayScore = 0;
            scorePatterns.forEach(pattern => {
                const scoreMatch = matchHtml.match(pattern);
                if (scoreMatch) {
                    homeScore = parseInt(scoreMatch[1]);
                    awayScore = parseInt(scoreMatch[2]);
                    console.log(`스코어 발견: ${homeScore}-${awayScore}`);
                }
            });
            
            // 날짜/시간 추출
            const datePatterns = [
                /(\d{1,2}\/\d{1,2}\/\d{4})/,
                /(\d{4}-\d{2}-\d{2})/,
                /(\d{1,2}\.\d{1,2}\.\d{4})/,
                /<span[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/span>/i,
                /<div[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/div>/i
            ];
            
            let matchDate = new Date();
            datePatterns.forEach(pattern => {
                const dateMatch = matchHtml.match(pattern);
                if (dateMatch) {
                    const dateStr = dateMatch[1] || dateMatch[0];
                    const parsedDate = new Date(dateStr);
                    if (!isNaN(parsedDate.getTime())) {
                        matchDate = parsedDate;
                        console.log(`날짜 발견: ${dateStr}`);
                    }
                }
            });
            
            // 리그명 추출
            const leaguePatterns = [
                /<span[^>]*class="[^"]*league[^"]*"[^>]*>([^<]+)<\/span>/i,
                /<div[^>]*class="[^"]*league[^"]*"[^>]*>([^<]+)<\/div>/i,
                /<a[^>]*class="[^"]*league[^"]*"[^>]*>([^<]+)<\/a>/i
            ];
            
            let leagueName = '축구 리그';
            leaguePatterns.forEach(pattern => {
                const leagueMatch = matchHtml.match(pattern);
                if (leagueMatch) {
                    leagueName = leagueMatch[1].trim();
                    console.log(`리그명 발견: ${leagueName}`);
                }
            });
            
            // 경기 상태 추출
            let status = 'scheduled';
            if (matchHtml.includes('live') || matchHtml.includes('Live')) {
                status = 'live';
            } else if (matchHtml.includes('finished') || matchHtml.includes('FT')) {
                status = 'finished';
            }
            
            const match = {
                id: `match-${Date.now()}-${Math.random()}`,
                homeTeam: teams[0],
                awayTeam: teams[1],
                homeScore: homeScore,
                awayScore: awayScore,
                date: matchDate,
                status: status,
                venue: '경기장',
                referee: '주심',
                leagueName: leagueName
            };
            
            console.log('최종 경기 정보:', match);
            return match;
        }
        
        console.log('유효한 경기 정보를 찾을 수 없음');
        return null;
    }

    // 불필요한 파싱 함수들 제거

    // 리그명 추출
    extractLeagueName(site) {
        if (site.includes('livescore')) return 'Livescore';
        if (site.includes('goal')) return 'Goal.com';
        if (site.includes('90min')) return '90min';
        return '축구 리그';
    }

    // 기사 데이터 파싱
    parseArticles(html, site) {
        const articles = [];
        
        const patterns = [
            /<article[^>]*>([\s\S]*?)<\/article>/gi,
            /<div[^>]*class="[^"]*(article|news|post)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
            /<div[^>]*class="[^"]*(story|headline)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
        ];

        patterns.forEach(pattern => {
            let article;
            while ((article = pattern.exec(html)) !== null && articles.length < 5) {
                const articleHtml = article[1] || article[2];
                const parsedArticle = this.extractArticleInfo(articleHtml, site);
                if (parsedArticle) {
                    articles.push(parsedArticle);
                }
            }
        });

        return articles;
    }

    // 기사 정보 추출
    extractArticleInfo(articleHtml, site) {
        // 제목 추출
        const titlePatterns = [
            /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i,
            /<a[^>]*class="[^"]*(title|headline)[^"]*"[^>]*>([^<]+)<\/a>/i,
            /<span[^>]*class="[^"]*(title|headline)[^"]*"[^>]*>([^<]+)<\/span>/i
        ];

        let title = null;
        titlePatterns.forEach(pattern => {
            const titleMatch = articleHtml.match(pattern);
            if (titleMatch && (titleMatch[1] || titleMatch[2]).trim().length > 10) {
                title = (titleMatch[1] || titleMatch[2]).trim();
            }
        });

        if (title) {
            // 설명 추출
            const descPattern = /<p[^>]*>([^<]+)<\/p>/i;
            const descMatch = articleHtml.match(descPattern);
            const description = descMatch ? descMatch[1].trim() : title;

            return {
                id: `article-${Date.now()}-${Math.random()}`,
                title: title,
                description: description,
                source: this.extractSourceName(site),
                publishedAt: new Date(),
                url: '#',
                content: description
            };
        }

        return null;
    }

    // 소스명 추출
    extractSourceName(site) {
        if (site.includes('bbc')) return 'BBC Sport';
        if (site.includes('espn')) return 'ESPN';
        if (site.includes('goal')) return 'Goal.com';
        if (site.includes('football365')) return 'Football365';
        if (site.includes('90min')) return '90min';
        if (site.includes('skysports')) return 'Sky Sports';
        return '축구 뉴스';
    }
}

// 전역 크롤러 인스턴스
window.realCrawler = new RealCrawler();
