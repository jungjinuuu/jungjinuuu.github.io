# 이 블로그에 추가된 기능들

## 코드 찾는 법 (가장 중요)
모든 코드에는 `#feature:이름` 또는 `#design:이름` 주석이 달려 있습니다. 리포 전체에서 아래처럼
검색하면 그 기능과 관련된 코드가 CSS/JS/HTML 어디에 흩어져 있든 한 번에 다 찾을 수 있습니다.

```
grep -rn "#feature:dark-mode" .
grep -rn "#design:post-hero" .
```

기능 목록: `dark-mode`, `math-katex`, `search`, `toc`, `categories`,
`copy-code`, `lightbox`, `share`, `related-posts`, `prev-next-nav`,
`comments-giscus`, `scroll-progress`, `visitor-counter`, `archive-timeline`,
`reading-time`, `seo-og`, `404`

디자인 블록 목록: `tokens`, `base`, `buttons`, `nav-bar`, `home-hero`, `post-hero`,
`home-list`, `footer` (모두 `assets/main.scss` 안에 있음)

사용자가 직접 값을 채워야 하는 부분은 `#config:` 로 표시되어 있습니다.
```
grep -rn "#config:" .
```

## 파일이 어디에 있는지 — 뭘 고치고 싶을 때 여기를 보세요

| 하고 싶은 것 | 수정할 파일 |
|---|---|
| **새 카테고리 만들기 / 포스트 카테고리 바꾸기** | 그 포스트의 front matter `categories: [이름]` 한 줄만 고치면 끝. 파일 추가 불필요 — `/categories/` 페이지는 존재하는 모든 카테고리를 자동으로 긁어서 보여줌 |
| 색/여백/폰트/애니메이션 (디자인 토큰) | `assets/main.scss` 맨 위 `#design:tokens` 블록 |
| 홈 화면 큰 제목/설명 문구 | `_config.yml`의 `title` / `description` (필요하면 `tagline`도 추가 가능) — 실제 배치는 `_layouts/home.html` |
| 홈 화면 글 목록 레이아웃 자체 (카드 구조 등) | `_layouts/home.html` + `assets/main.scss`의 `#design:home-list` |
| 포스트 페이지 구조(목차, 관련글, 댓글 위치 등) | `_layouts/post.html` |
| 포스트 제목 영역(eyebrow, 제목 크기, 등장 애니메이션) | `assets/main.scss`의 `#design:post-hero` |
| 전체 페이지 뼈대(스크롤바, 검색모달 위치) | `_layouts/default.html` |
| 헤더 버튼(검색/다크모드), 네비게이션 메뉴 | `_includes/header.html` — 메뉴 항목은 `title`이 있는 모든 페이지가 자동으로 추가됨 |
| 하단 푸터(이메일, GitHub/LinkedIn 링크, 소개문구) | `_config.yml`의 `github_username` / `linkedin_username` / `email` 값. 스타일은 `assets/main.scss`의 `#design:footer` |
| `<head>` 안에 로드되는 외부 라이브러리(KaTeX, Lunr) | `_includes/custom-head.html` |
| 댓글(giscus) 설정 | `_includes/features-comments-giscus.html` |
| 404 페이지 문구/스타일 | `404.html` + `assets/main.scss`의 `#feature:404` |
| 클릭/토글 동작 (검색, 다크모드, 목차, 복사버튼 등 JS) | `assets/js/main.js` (섹션별 `#feature:` 주석) |

## 카테고리 다루는 법
- 포스트 front matter에 `categories: [LLM]` 처럼 쓰면 끝. 코드/설정 파일을 따로 건드릴 필요 없음.
- 카테고리를 여러 개 넣을 수도 있음(`categories: [LLM, Interpretability]`). 이 경우 `/categories/`
  페이지에는 두 그룹 모두에 나타나지만, 포스트 상단과 홈 목록에 뜨는 파란 eyebrow 배지는
  **항상 첫 번째 값만** 표시함 — 그래서 대표 카테고리를 배열 맨 앞에 쓸 것.
- `/categories/` 페이지(`categories/index.html`)는 `site.posts`를 순회하며 카테고리를 자동으로
  모으는 방식이라, 새 카테고리를 "만드는" 별도 절차가 없음. 그냥 아무 포스트에 그 이름을 쓰면
  다음 빌드 때 해당 카테고리 그룹이 생김.
- (Tags 기능은 제거했습니다. 예전 포스트에 `tags:` front matter가 남아있어도 무시되고 아무 데도
  표시되지 않음 — 완전히 지우고 싶으면 그냥 그 줄을 삭제하면 됨.)

## 지금 당장 채워야 하는 것 (`#config:`)
1. **`_config.yml`의 `url`** — 본인 블로그 주소(`https://jungjinuuu.github.io`)로 채우기.
   방문자 카운터, OG 이미지, RSS가 이 값을 씀.
2. **`_config.yml`의 `title` / `email` / `description`** — 원하는 내용으로.
3. **(선택) `_config.yml`의 `linkedin_username`** — 채우면 푸터에 LinkedIn 아이콘이 자동으로 뜸.
4. **giscus 댓글** — https://giscus.app 접속 → 저장소(`jungjinuuu/jungjinuuu.github.io`) 입력 →
   그 저장소의 GitHub 설정에서 Discussions 탭을 켜야 함 → 발급되는 `data-repo-id`,
   `data-category-id` 값을 `_includes/features-comments-giscus.html`에 붙여넣기.
   (설정 전까지는 에러 없이 그냥 댓글 영역이 비어 보임)

## 기능별 한 줄 설명
- **다크모드**: 헤더의 달 아이콘 버튼. `localStorage`에 저장되어 다음 방문에도 유지됨. 시스템 설정도 최초 1회 참고함.
- **수식(KaTeX)**: 포스트에서 `$$...$$` 또는 `$...$`로 쓰면 자동 렌더링. (kramdown이 `$$`를 `\[ \]`로 바꿔서 내보내기 때문에 `\[ \]`도 함께 처리하도록 설정해둠 — 이 부분 건드릴 필요 없음)
- **코드 하이라이팅 + 복사**: 코드블록에 마우스를 올리면 우측 상단에 복사 버튼이 뜸.
- **카테고리**: 포스트 front matter에 `categories: [이름]` 추가하면 자동으로 `/categories/` 페이지와 포스트 상단 배지에 반영됨. (자세한 내용은 위 "카테고리 다루는 법" 참고)
- **목차**: 본문에 `h2`/`h3`가 2개 이상이면 자동 생성. 접기/펼치기 가능.
- **검색**: 헤더의 돋보기 버튼. 빌드 시 생성되는 `search.json`을 브라우저에서 Lunr.js로 색인.
- **관련 글**: 같은 카테고리 글 중 최대 3개.
- **이전/다음 글 네비게이션**: Jekyll이 자동 제공하는 시간순 이전/다음 글.
- **댓글**: giscus (GitHub Discussions 기반). 특정 포스트만 끄려면 그 글 front matter에 `comments: false`.
- **읽기 시간**: 본문 단어 수 ÷ 200으로 자동 계산.
- **스크롤 진행률 바**: 화면 최상단 얇은 바.
- **방문자 카운터**: hits.sh 무료 배지, `_config.yml`의 `url` 채우면 자동 활성화.
- **아카이브**: `/archive/` — 연도별 타임라인.
- **SEO/OG 태그**: `jekyll-seo-tag` 플러그인이 `_config.yml` 값 기반으로 자동 생성.

## 로컬에서 미리보기
```
bundle install
bundle exec jekyll serve
```
그다음 http://localhost:4000 접속. (댓글은 `JEKYLL_ENV=production bundle exec jekyll serve`로 실행해야 보임 — 로컬 개발 중엔 기본적으로 숨겨지도록 되어있음)

`_config.yml`을 고쳤을 때는 `jekyll serve`가 자동으로 반영하지 못하니(설정 파일은 서버 시작 시
한 번만 읽음) 서버를 껐다 다시 켜야 함. 그 외 html/scss/md 파일은 저장하면 자동으로 다시 빌드됨.

## 기능을 끄고 싶을 때
`assets/js/main.js` 맨 위 `DOMContentLoaded` 안의 `initXxx();` 줄을 지우면 그 기능의 동작(JS)만 꺼집니다.
페이지에 남아있는 버튼/영역까지 완전히 지우려면 `_layouts/post.html` 또는 `_layouts/default.html`에서
해당 `#feature:` 주석으로 감싸진 블록을 통째로 지우면 됩니다.

## 디자인 시스템 (Apple 스타일, 살짝 미니멀하게)
색/타이포/간격/그림자/애니메이션은 `assets/main.scss` 맨 위 `#design:tokens` 블록의 CSS 변수로
관리됩니다. 여기 값만 바꾸면 사이트 전체(라이트+다크 모두)에 반영돼요.

- `--apl-accent`: 포인트 색 (링크, 카테고리 배지, 진행률 바 등)
- `--apl-bg` / `--apl-text`: 배경/글자색
- `--apl-font-display` / `--apl-font-text`: 제목/본문 폰트 (맥/사파리에서는 자동으로 SF Pro로 보임)
- `--apl-radius-s/m/l`, `--apl-shadow-1/2`, `--apl-ease`: 둥근 모서리 / 그림자 / 트랜지션 곡선

디자인 관련 코드도 같은 방식으로 찾을 수 있습니다:
```
grep -rn "#design:" .
```
- `#design:tokens` — 색/폰트/간격/그림자 변수 (라이트/다크 값 둘 다 여기 있음)
- `#design:base` — 기본 타이포그래피, 포커스 링, 선택 영역 색
- `#design:buttons` — 알약 모양 버튼
- `#design:nav-bar` — 상단 고정 블러 바
- `#design:home-hero` — 홈 화면 상단 큰 제목 + 설명 (`_layouts/home.html`과 짝)
- `#design:post-hero` — 포스트 제목 영역 (eyebrow + 큰 타이틀 + 등장 애니메이션)
- `#design:home-list` — 홈 글 목록 (에디토리얼 스타일 리스트, 화살표 호버)
- `#design:footer` — 하단 푸터 (미니멀, 링크만)
