# CSV の合計

**タスク:** 「sales.csv を読み込み、'amount' 列を合計する Python コードを書いて」

ベンチマーク実行で得た Claude Haiku 4.5 の出力（スキルなし／Ponytail あり、temperature 1）。コードは原文のまま、説明文だけ日本語に翻訳している。

## Ponytail なし：20 行

# sales.csv を読み込み、'amount' 列を合計する Python コード

```python
import pandas as pd

# Read the CSV file
df = pd.read_csv('sales.csv')

# Sum the 'amount' column
total_amount = df['amount'].sum()

# Print the result
print(f"Total amount: ${total_amount:,.2f}")
```

## 別の方法：

**CSV モジュールを使う（pandas なし）：**
```python
import csv

total_amount = 0

with open('sales.csv', 'r') as file:
    reader = csv.DictReader(file)
    for row in reader:
        total_amount += float(row['amount'])

print(f"Total amount: ${total_amount:,.2f}")
```

**pandas とエラー処理を使う：**
```python
import pandas as pd

try:
    df = pd.read_csv('sales.csv')
    total_amount = df['amount'].sum()
    print(f"Total amount: ${total_amount:,.2f}")
except FileNotFoundError:
    print("Error: sales.csv not found")
except KeyError:
    print("Error: 'amount' column not found")
```

**pandas を使う方法をおすすめします**。理由は次のとおりです。
- より簡潔で読みやすい
- データ型を自動で扱ってくれる
- エラー処理が組み込まれている
- 大きなファイルでも効率が良い

## Ponytail あり：3 行

```python
import csv

total = sum(float(row['amount']) for row in csv.DictReader(open('sales.csv')))
print(total)
```

省略したもの：pandas、エラー処理、ファイルのクローズ。CSV が大きい、形式が崩れている、またはさらに分析が必要になったら足す。

**20 → 3 行**、同じモデル、同じプロンプト。
