// main.js
// 모든 기능은 #feature:이름 주석으로 구역이 나뉘어 있습니다.
// 특정 기능만 끄고 싶으면 아래 init 함수 목록에서 해당 initXxx() 호출 줄만 지우면 됩니다.

document.addEventListener('DOMContentLoaded', function () {
  initThemeToggle();      // #feature:dark-mode
  initScrollProgress();   // #feature:scroll-progress
  initMathRender();        // #feature:math-katex
  initToc();               // #feature:toc (수식 렌더링 뒤에 호출 - 목차는 렌더링된 heading 텍스트 기준)
  initCopyCode();          // #feature:copy-code
  initLightbox();          // #feature:lightbox
  initShareButton();       // #feature:share
  initSearch();            // #feature:search
});

// ===== #feature:math-katex =====
function initMathRender() {
  if (typeof renderMathInElement !== 'function') return; // 포스트가 아닌 페이지는 라이브러리 자체가 로드 안 됨
  var target = document.querySelector('.post-content') || document.body;
  renderMathInElement(target, {
    delimiters: [
      // kramdown이 $$...$$ 블록 수식을 \[...\] 로 변환해서 HTML에 내보내기 때문에
      // \[ \] / \( \) 를 반드시 등록해야 함. $ 계열은 원문이 그대로 남는 인라인 수식용.
      { left: '\\[', right: '\\]', display: true },
      { left: '\\(', right: '\\)', display: false },
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false }
    ],
    throwOnError: false
  });
}

// ===== #feature:dark-mode =====
function initThemeToggle() {
  var btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
}

// ===== #feature:scroll-progress =====
function initScrollProgress() {
  var bar = document.getElementById('scroll-progress-bar');
  if (!bar) return;
  window.addEventListener('scroll', function () {
    var el = document.documentElement;
    var max = el.scrollHeight - el.clientHeight;
    var pct = max > 0 ? (el.scrollTop / max) * 100 : 0;
    bar.style.width = pct + '%';
  });
}

// ===== #feature:toc =====
function initToc() {
  var listEl = document.getElementById('toc-list');
  var wrapper = document.getElementById('toc-wrapper');
  if (!listEl || !wrapper) return;

  var headings = document.querySelectorAll('.post-content h2, .post-content h3');
  if (headings.length < 2) {
    wrapper.style.display = 'none';
    return;
  }

  headings.forEach(function (h, i) {
    if (!h.id) h.id = 'section-' + i;
    var a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = h.textContent;
    a.className = h.tagName === 'H3' ? 'toc-sub' : 'toc-main';
    listEl.appendChild(a);
  });
}

// ===== #feature:copy-code =====
function initCopyCode() {
  document.querySelectorAll('.highlight').forEach(function (block) {
    var btn = document.createElement('button');
    btn.className = 'copy-code-btn';
    btn.type = 'button';
    btn.textContent = '복사';
    btn.addEventListener('click', function () {
      var codeEl = block.querySelector('pre') || block;
      navigator.clipboard.writeText(codeEl.innerText).then(function () {
        btn.textContent = '복사됨!';
        setTimeout(function () { btn.textContent = '복사'; }, 1500);
      });
    });
    block.appendChild(btn);
  });
}

// ===== #feature:lightbox =====
function initLightbox() {
  var overlay = document.getElementById('lightbox-overlay');
  var overlayImg = document.getElementById('lightbox-img');
  if (!overlay || !overlayImg) return;

  document.querySelectorAll('.post-content img').forEach(function (img) {
    img.addEventListener('click', function () {
      overlayImg.src = img.src;
      overlay.classList.add('active');
    });
  });
  overlay.addEventListener('click', function () {
    overlay.classList.remove('active');
    overlayImg.src = '';
  });
}

// ===== #feature:share =====
function initShareButton() {
  var btn = document.getElementById('copy-link-btn');
  if (!btn) return;
  btn.addEventListener('click', function () {
    navigator.clipboard.writeText(btn.dataset.url).then(function () {
      var original = btn.textContent;
      btn.textContent = '복사됨!';
      setTimeout(function () { btn.textContent = original; }, 1500);
    });
  });
}

// ===== #feature:search =====
function initSearch() {
  var toggleBtn = document.getElementById('search-toggle');
  var overlay = document.getElementById('search-overlay');
  var closeBtn = document.getElementById('search-close');
  var input = document.getElementById('search-input');
  var resultsEl = document.getElementById('search-results');
  if (!toggleBtn || !overlay || !input) return;

  var index = null;
  var documents = [];
  var loaded = false;

  function loadIndex() {
    if (loaded) return;
    fetch('/search.json').then(function (res) { return res.json(); }).then(function (data) {
      documents = data;
      index = lunr(function () {
        this.ref('url');
        this.field('title', { boost: 10 });
        this.field('tags', { boost: 5 });
        this.field('categories', { boost: 5 });
        this.field('content');
        data.forEach(function (doc) { this.add(doc); }, this);
      });
      loaded = true;
    });
  }

  function openSearch() {
    loadIndex();
    overlay.classList.add('active');
    input.focus();
  }
  function closeSearch() {
    overlay.classList.remove('active');
    input.value = '';
    resultsEl.innerHTML = '';
  }

  toggleBtn.addEventListener('click', openSearch);
  closeBtn.addEventListener('click', closeSearch);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeSearch(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSearch(); });

  input.addEventListener('input', function () {
    if (!index || input.value.trim() === '') { resultsEl.innerHTML = ''; return; }
    var hits = index.search(input.value.trim() + '*');
    resultsEl.innerHTML = '';
    hits.slice(0, 10).forEach(function (hit) {
      var doc = documents.find(function (d) { return d.url === hit.ref; });
      if (!doc) return;
      var li = document.createElement('li');
      li.innerHTML = '<a href="' + doc.url + '">' + doc.title + '</a><p>' + doc.date + '</p>';
      resultsEl.appendChild(li);
    });
    if (hits.length === 0) {
      resultsEl.innerHTML = '<li>검색 결과가 없습니다.</li>';
    }
  });
}
