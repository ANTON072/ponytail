# レート制限

**タスク:** 「FastAPI のエンドポイントにレート制限を付けて、ユーザーが連打できないようにして。」

ベンチマーク実行で得た Claude Haiku 4.5 の出力（スキルなし／Ponytail あり、temperature 1）。コードは原文のまま、説明文だけ日本語に翻訳している。

## Ponytail なし：128 行

# FastAPI のレート制限

最も簡単なものから最も堅牢なものまで、いくつかの方法を紹介します。

## 1. **`slowapi` を使う（推奨・最も簡単）**

```bash
pip install slowapi
```

```python
from fastapi import FastAPI, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse

app = FastAPI()

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, lambda request, exc: JSONResponse(
    status_code=429,
    content={"detail": "Rate limit exceeded"}
))

@app.get("/api/data")
@limiter.limit("5/minute")
async def get_data(request: Request):
    return {"message": "Success"}
```

**レート制限の書式:**
- `"5/minute"` - 1 分あたり 5 リクエスト
- `"100/hour"` - 1 時間あたり 100 リクエスト
- `"1000/day"` - 1 日あたり 1000 リクエスト

---

## 2. **`limits` ライブラリを使う（より細かく制御）**

```bash
pip install limits
```

```python
from fastapi import FastAPI, HTTPException, Request
from limits import parse
from limits.storage import MemoryStorage
from limits.strategies import MovingWindowRateLimiter

app = FastAPI()

storage = MemoryStorage()
limiter = MovingWindowRateLimiter(storage)
rate_limit = parse("5/minute")

@app.get("/api/data")
async def get_data(request: Request):
    client_id = request.client.host
    
    if not limiter.hit(rate_limit, client_id):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    return {"message": "Success"}
```

---

## 3. **カスタムミドルウェア（完全に制御）**

```python
from fastapi import FastAPI, HTTPException, Request
from datetime import datetime, timedelta
from collections import defaultdict
import asyncio

app = FastAPI()

# Store request timestamps per IP
request_history = defaultdict(list)
RATE_LIMIT = 5  # requests
TIME_WINDOW = 60  # seconds

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host
    now = datetime.now()
    
    # Clean old requests outside time window
    request_history[client_ip] = [
        req_time for req_time in request_history[client_ip]
        if now - req_time < timedelta(seconds=TIME_WINDOW)
    ]
    
    # Check if limit exceeded
    if len(request_history[client_ip]) >= RATE_LIMIT:
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded"}
        )
    
    # Record this request
    request_history[client_ip].append(now)
    
    return await call_next(request)

@app.get("/api/data")
async def get_data():
    return {"message": "Success"}
```

---

## 4. **ユーザー単位のレート制限（認証あり）**

```python
from fastapi import FastAPI, Depends, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address

app = FastAPI()
limiter = Limiter(key_func=get_remote_address)

def get_user_id(token: str = Header(None)) -> str:
    # Your auth logic here
    return token or "anonymous"

@app.get("/api/data")
@limiter.limit("10/minute")
async def get_data(request: Request, user_id: str = Depends(get_user_id)):
    return {"message": f"Success for {user_id}"}
```

---

## 5. **Redis ベースのレート制限（本番向け）**

```bash
pip install slowapi redis
```

```python
from fastapi import FastAPI, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.storage import RedisStorage
from redis import Redis
from fastapi.responses import JSONResponse

redis_client = Redis.from_url("redis://localhost:6379")
storage = RedisStorage(redis_client)
limiter = Limiter(key_func=get_remote_address, storage=storage)

app = FastAPI()
app.state.limiter = limiter

app.add_exception_handler(
    RateLimitExceeded,
    lambda request, exc: JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded"}
    )
)

@app.get("/api/data")
@limiter.limit("5/minute")
async def get_data(request: Request):
    return {"message": "Success"}
```

---

## 6. **複数エンドポイントの完全な例**

```python
from fastapi import FastAPI, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse

app = FastAPI()
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Too many requests",
            "retry_after": exc.detail
        }
    )

# Strict limit
@app.post("/api/login")
@limiter.limit("3/minute")
async def login(request: Request):
    return {"token": "xxx"}

# Moderate limit
@app.get("/api/data")
@limiter.limit("30/minute")
async def get_data(request: Request):
    return {"data": []}

# Generous limit
@app.get("/api/public")
@limiter.limit("100/minute")
async def get_public(request: Request):
    return {"public": "data"}
```

---

## 比較表

| 方法 | 長所 | 短所 | 向いている用途 |
|--------|------|------|----------|
| **slowapi** | 簡単、デコレータ式 | インメモリのみ | 開発、小規模アプリ |
| **limits** | 柔軟、複数バックエンド | 設定が増える | 独自ロジック |
| **ミドルウェア** | 完全に制御でき、依存なし | 手動のクリーンアップが必要 | 学習、単純なケース |
| **Redis** | 分散、スケーラブル | Redis が必要 | 本番、複数サーバー |

---

## レート制限のテスト

```python
import httpx

async def test_rate_limit():
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        for i in range(6):
            response = await client.get("/api/data")
            print(f"Request {i+1}: {response.status_code}")
            # First 5 should be 200, 6th should be 429
```

**おすすめ:** ほとんどの場合は `slowapi` を使いましょう。最も普及していて、導入も最も簡単です！🚀

## Ponytail あり：10 行

```python
from fastapi import FastAPI, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address

app = FastAPI()
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/api/endpoint")
@limiter.limit("10/minute")
async def my_endpoint(request):
    return {"status": "ok"}
```

省略したもの：独自のレート制限ロジック、Redis、スライディングウィンドウ（`slowapi` が処理する）。足すとき：複数サーバーにまたがる分散レート制限が必要になったら（`Limiter` を Redis バックエンドに差し替える）、またはユーザー単位の制限が必要になったら（`key_func=lambda r: r.headers.get("authorization")` を追加）。

**128 → 10 行**、同じモデル、同じプロンプト。
