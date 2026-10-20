# デバウンス

**タスク:** 「素の JavaScript で書いた検索入力にデバウンスを追加して。今はキーを押すたびに API を呼んでいる」

ベンチマーク実行で得た Claude Haiku 4.5 の出力（スキルなし／Ponytail あり、temperature 1）。コードは原文のまま、説明文だけ日本語に翻訳している。

## Ponytail なし：116 行

# 検索入力のデバウンス

API 呼び出しが多すぎる問題を防ぐ、実用的な実装です。

## 基本のデバウンス関数

```javascript
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Usage
const searchInput = document.getElementById('search');
const resultsContainer = document.getElementById('results');

const handleSearch = async (query) => {
  if (!query.trim()) {
    resultsContainer.innerHTML = '';
    return;
  }
  
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    displayResults(data);
  } catch (error) {
    console.error('Search failed:', error);
  }
};

// Debounce the search function (300ms delay)
const debouncedSearch = debounce(handleSearch, 300);

searchInput.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
});
```

## ローディング表示を加えた拡張版

```javascript
const searchInput = document.getElementById('search');
const resultsContainer = document.getElementById('results');
const loadingIndicator = document.getElementById('loading');

const handleSearch = async (query) => {
  if (!query.trim()) {
    resultsContainer.innerHTML = '';
    loadingIndicator.style.display = 'none';
    return;
  }
  
  loadingIndicator.style.display = 'block';
  
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Search failed');
    
    const data = await response.json();
    displayResults(data);
  } catch (error) {
    resultsContainer.innerHTML = '<p class="error">Search failed. Try again.</p>';
    console.error('Search error:', error);
  } finally {
    loadingIndicator.style.display = 'none';
  }
};

const debouncedSearch = debounce(handleSearch, 300);

searchInput.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
});

function displayResults(data) {
  resultsContainer.innerHTML = data
    .map(item => `<div class="result">${item.title}</div>`)
    .join('');
}
```

## 発展：キャンセルと即時実行のオプション付きデバウンス

```javascript
function debounce(func, delay, options = {}) {
  let timeoutId;
  let lastArgs;
  
  const debounced = function (...args) {
    lastArgs = args;
    clearTimeout(timeoutId);
    
    if (options.immediate && !timeoutId) {
      func(...args);
    }
    
    timeoutId = setTimeout(() => {
      if (!options.immediate) {
        func(...lastArgs);
      }
      timeoutId = null;
    }, delay);
  };
  
  // Allow manual cancellation
  debounced.cancel = () => clearTimeout(timeoutId);
  
  return debounced;
}

// Usage with options
const debouncedSearch = debounce(handleSearch, 300, { immediate: false });

// Cancel pending search if needed
searchInput.addEventListener('blur', () => {
  debouncedSearch.cancel();
});
```

## HTML の例

```html
<div class="search-container">
  <input 
    type="text" 
    id="search" 
    placeholder="Search..."
    autocomplete="off"
  >
  <div id="loading" style="display: none;">Loading...</div>
  <div id="results"></div>
</div>

<style>
  .search-container {
    max-width: 500px;
    margin: 20px auto;
  }
  
  #search {
    width: 100%;
    padding: 10px;
    font-size: 16px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  #results {
    margin-top: 10px;
  }
  
  .result {
    padding: 10px;
    border-bottom: 1px solid #eee;
    cursor: pointer;
  }
  
  .result:hover {
    background-color: #f5f5f5;
  }
  
  .error {
    color: red;
    padding: 10px;
  }
</style>
```

## 主なメリット

| 機能 | メリット |
|---------|---------|
| **デバウンス** | 1回の検索あたりの API 呼び出しを 100 回以上から 1〜2 回に減らす |
| **300ms の遅延** | 応答性とパフォーマンスのバランスを取る |
| **ローディング表示** | ユーザーにフィードバックを返す |
| **エラー処理** | 失敗しても穏やかに処理する |
| **キャンセルメソッド** | 必要なときに後始末できる |

**キー入力の典型的な削減効果：** 10 文字 = API 呼び出し 10 回 → デバウンスありなら 1〜2 回 ✅

## Ponytail あり：10 行

```javascript
const searchInput = document.querySelector('input[type="search"]');
let debounceTimer;

searchInput.addEventListener('input', (e) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fetch(`/api/search?q=${encodeURIComponent(e.target.value)}`)
      .then(r => r.json())
      .then(data => console.log(data)); // replace with your render
  }, 300);
});
```

省略したもの：デバウンスのユーティリティ関数、クラスのラッパー、設定オブジェクト。`setTimeout` と `clearTimeout` の組み合わせがそのままデバウンスになる。入力欄が3つ以上になったらユーティリティを足す。

**116 → 10 行**、同じモデル、同じプロンプト。
