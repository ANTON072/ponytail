# メールアドレスの検証

**タスク:** 「メールアドレスを検証する Python の関数を書いて」

ベンチマーク実行で得た Claude Haiku 4.5 の出力（スキルなし／Ponytail あり、temperature 1）。コードは原文のまま、説明文だけ日本語に翻訳している。

## Ponytail なし：75 行

# メールアドレス検証関数

メールアドレスを検証する、実用的な Python 関数です。

```python
import re

def validate_email(email: str) -> bool:
    """
    Validates an email address using a regular expression.
    
    Args:
        email (str): The email address to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    # Regular expression pattern for email validation
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    return re.match(pattern, email) is not None


# Test cases
if __name__ == "__main__":
    test_emails = [
        "user@example.com",           # Valid
        "john.doe@company.co.uk",     # Valid
        "test+tag@domain.org",        # Valid
        "invalid.email@",             # Invalid
        "missing@domain",             # Invalid
        "@nodomain.com",              # Invalid
        "spaces in@email.com",        # Invalid
        "user@domain..com",           # Invalid (double dot)
    ]
    
    for email in test_emails:
        result = validate_email(email)
        print(f"{email:<30} -> {result}")
```

## より堅牢なバージョン（追加のチェック付き）

```python
import re

def validate_email_advanced(email: str) -> tuple[bool, str]:
    """
    Advanced email validation with detailed feedback.
    
    Args:
        email (str): The email address to validate
        
    Returns:
        tuple: (is_valid, message)
    """
    # Basic checks
    if not email or not isinstance(email, str):
        return False, "Email must be a non-empty string"
    
    email = email.strip()
    
    if len(email) > 254:
        return False, "Email is too long (max 254 characters)"
    
    # Regular expression pattern
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(pattern, email):
        return False, "Email format is invalid"
    
    # Additional checks
    local_part, domain = email.rsplit('@', 1)
    
    if len(local_part) > 64:
        return False, "Local part is too long (max 64 characters)"
    
    if local_part.startswith('.') or local_part.endswith('.'):
        return False, "Local part cannot start or end with a dot"
    
    if '..' in email:
        return False, "Email cannot contain consecutive dots"
    
    return True, "Email is valid"


# Test the advanced version
if __name__ == "__main__":
    test_emails = [
        "user@example.com",
        "invalid..email@domain.com",
        ".invalid@domain.com",
        "user@domain",
    ]
    
    for email in test_emails:
        is_valid, message = validate_email_advanced(email)
        print(f"{email:<35} -> {is_valid:5} ({message})")
```

## サードパーティのライブラリを使う（本番環境向けにおすすめ）

```python
from email_validator import validate_email, EmailNotValidError

def validate_email_production(email: str) -> bool:
    """
    Validates email using the email_validator library.
    More reliable for production use.
    
    Install with: pip install email-validator
    """
    try:
        # Validate and normalize the email
        valid = validate_email(email)
        return True
    except EmailNotValidError:
        return False


# Usage
if __name__ == "__main__":
    print(validate_email_production("user@example.com"))  # True
    print(validate_email_production("invalid@"))          # False
```

## 比較

| 方法 | 長所 | 短所 |
|--------|------|------|
| **正規表現（シンプル）** | 速い、依存なし | 検証が限定的 |
| **正規表現（発展）** | より徹底している | それでも RFC には準拠しない |
| **email-validator** | RFC に準拠、信頼できる | 外部への依存が増える |

**おすすめ**：本番のアプリケーションでは `email-validator` ライブラリを使ってください。RFC 5321/5322 の規格を正しく扱えます。手軽なスクリプトや、依存を避けたい場合は、シンプルな正規表現版を使ってください。

## Ponytail あり：3 行

```python
import re

def is_valid_email(email: str) -> bool:
    return bool(re.match(r'^[^@]+@[^@]+\.[^@]+$', email))
```

省略したもの：RFC 5322 のパーサー、DNS の MX 検索、確認メール。`user+tag@sub.domain.co.uk` を弾く必要が出たとき、またはタイプミスを拾いたくなったときに足す。それまでは、この1行で「うっかり打ち間違えた」ケースの 99% は拾える。

**75 → 3 行**、同じモデル、同じプロンプト。
