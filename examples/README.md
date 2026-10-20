# 例

ベンチマーク実行で得た実際のモデル出力。同じモデルに同じタスクを、スキルなし（`## Ponytail なし`）と Ponytail あり（`## Ponytail あり`）で答えさせたもので、並べて比較できる。モデルは Claude Haiku 4.5、temperature 1。

手書きではない。コードは原文のまま、説明文だけ日本語に翻訳している。計測の方法、3モデルの結果、10回の中央値は本家リポジトリの [benchmarks/](https://github.com/DietrichGebert/ponytail/tree/main/benchmarks) にある。

| 例 | なし（行数） | あり（行数） |
|---|--:|--:|
| [メールアドレスの検証](email-validation.md) | 75 | 3 |
| [デバウンス](debounce.md) | 116 | 10 |
| [CSV の合計](csv-sum.md) | 20 | 3 |
| [カウントダウンタイマー](react-countdown.md) | 267 | 9 |
| [レート制限](rate-limit.md) | 128 | 10 |
