source "https://rubygems.org"
gem "jekyll", "~> 4.4.1"
gem "minima", "~> 2.5"
# github-pages 로 배포한다면 위 jekyll 줄을 지우고 아래 주석을 해제하세요
# gem "github-pages", group: :jekyll_plugins

group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.12"
  gem "jekyll-seo-tag", "~> 2.8" # ===== #feature:seo-og =====
end

platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

gem "wdm", "~> 0.1", :platforms => [:mingw, :x64_mingw, :mswin]
gem "http_parser.rb", "~> 0.6.0", :platforms => [:jruby]
