# 이 블로그에 추가된 기능들

## 코드 찾는 법 (가장 중요)
모든 코드에는 `#feature:이름` 주석이 달려 있습니다. 리포 전체에서 아래처럼 검색하면
그 기능과 관련된 코드가 CSS/JS/HTML 어디에 흩어져 있든 한 번에 다 찾을 수 있습니다.

```
grep -rn "#feature:dark-mode" .
```

기능 목록: `dark-mode`, `math-katex`, `search`, `toc`, `categories-tags`,
`copy-code`, `lightbox`, `share`, `related-posts`, `prev-next-nav`,
`comments-giscus`, `scroll-progress`, `visitor-counter`, `archive-timeline`,
`reading-time`, `now-page`, `seo-og`

사용자가 직접 값을 채워야 하는 부분은 `#config:` 로 표시되어 있습니다.
```
grep -rn "#config:" .
```

## 파일이 어디에 있는지
| 뭘 고치고 싶을 때 | 여기를 보세요 |
|---|---|
| 색/여백/애니메이션 (모든 기능 CSS) | `assets/main.scss` (섹션별 `#feature:` 주석) |
| 클릭/토글 동작 (모든 기능 JS) | `assets/js/main.js` (섹션별 `#feature:` 주석) |
| 포스트 페이지 구조(목차, 관련글, 댓글 위치 등) | `_layouts/post.html` |
| 전체 페이지 뼈대(스크롤바, 검색모달 위치) | `_layouts/default.html` |
| 헤더 버튼(검색/다크모드), 네비게이션 | `_includes/header.html` |
| `<head>` 안에 로드되는 외부 라이브러리(KaTeX, Lunr) | `_includes/custom-head.html` |
| 댓글(giscus) 설정 | `_includes/features-comments-giscus.html` |

## 지금 당장 채워야 하는 것 (`#config:`)
1. **`_config.yml`의 `url`** — 본인 블로그 주소(`https://jungjinuuu.github.io`)로 채우기.
   방문자 카운터, OG 이미지, RSS가 이 값을 씀.
2. **`_config.yml`의 `title` / `email` / `description`** — 원하는 내용으로.
3. **giscus 댓글** — https://giscus.app 접속 → 저장소(`jungjinuuu/jungjinuuu.github.io`) 입력 →
   그 저장소의 GitHub 설정에서 Discussions 탭을 켜야 함 → 발급되는 `data-repo-id`,
   `data-category-id` 값을 `_includes/features-comments-giscus.html`에 붙여넣기.
   (설정 전까지는 에러 없이 그냥 댓글 영역이 비어 보임)

## 기능별 한 줄 설명
- **다크모드**: 헤더의 🌓 버튼. `localStorage`에 저장되어 다음 방문에도 유지됨. 시스템 설정도 최초 1회 참고함.
- **수식(KaTeX)**: 포스트에서 `$$...$$` 또는 `$...$`로 쓰면 자동 렌더링. (kramdown이 `$$`를 `\[ \]`로 바꿔서 내보내기 때문에 `\[ \]`도 함께 처리하도록 설정해둠 — 이 부분 건드릴 필요 없음)
- **코드 하이라이팅 + 복사**: 코드블록에 마우스를 올리면 우측 상단에 복사 버튼이 뜸.
- **카테고리/태그**: 포스트 front matter에 `categories: [이름]`, `tags: [이름1, 이름2]` 추가하면 자동으로 `/categories/`, `/tags/` 페이지에 반영됨.
- **목차**: 본문에 `h2`/`h3`가 2개 이상이면 자동 생성. 접기/펼치기 가능.
- **검색**: 헤더의 🔍 버튼. 빌드 시 생성되는 `search.json`을 브라우저에서 Lunr.js로 색인.
- **관련 글**: 같은 카테고리 글 중 최대 3개.
- **이전/다음 글 네비게이션**: Jekyll이 자동 제공하는 시간순 이전/다음 글.
- **댓글**: giscus (GitHub Discussions 기반). 특정 포스트만 끄려면 그 글 front matter에 `comments: false`.
- **읽기 시간**: 본문 단어 수 ÷ 200으로 자동 계산.
- **스크롤 진행률 바**: 화면 최상단 얇은 바.
- **방문자 카운터**: hits.sh 무료 배지, `_config.yml`의 `url` 채우면 자동 활성화.
- **아카이브**: `/archive/` — 연도별 타임라인.
- **Now 페이지**: `/now/` — 직접 내용을 채워 넣는 페이지.
- **SEO/OG 태그**: `jekyll-seo-tag` 플러그인이 `_config.yml` 값 기반으로 자동 생성.

## 로컬에서 미리보기
```
bundle install
bundle exec jekyll serve
```
그다음 http://localhost:4000 접속. (댓글은 `JEKYLL_ENV=production bundle exec jekyll serve`로 실행해야 보임 — 로컬 개발 중엔 기본적으로 숨겨지도록 되어있음)

## 기능을 끄고 싶을 때
`assets/js/main.js` 맨 위 `DOMContentLoaded` 안의 `initXxx();` 줄을 지우면 그 기능의 동작(JS)만 꺼집니다.
페이지에 남아있는 버튼/영역까지 완전히 지우려면 `_layouts/post.html` 또는 `_layouts/default.html`에서
해당 `#feature:` 주석으로 감싸진 블록을 통째로 지우면 됩니다.

## 디자인 시스템 (Apple 스타일)
색/타이포/간격은 `assets/main.scss` 맨 위 `#design:tokens` 블록의 CSS 변수로 관리됩니다.
여기 값만 바꾸면 사이트 전체(라이트+다크 모두)에 반영돼요.

- `--apl-accent`: 포인트 색 (링크, 카테고리 배지, 진행률 바 등)
- `--apl-bg` / `--apl-text`: 배경/글자색
- `--apl-font-display` / `--apl-font-text`: 제목/본문 폰트 (맥/사파리에서는 자동으로 SF Pro로 보임)

디자인 관련 코드도 같은 방식으로 찾을 수 있습니다:
```
grep -rn "#design:" .
```
- `#design:tokens` — 색/폰트/간격 변수
- `#design:base` — 기본 타이포그래피
- `#design:buttons` — 알약 모양 버튼
- `#design:nav-bar` — 상단 고정 블러 바
- `#design:post-hero` — 포스트 제목 영역 (eyebrow + 큰 타이틀 + 등장 애니메이션)
- `#design:home-list` — 홈 글 목록
