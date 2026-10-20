# Ponytail

怠け者のシニア開発者を、Claude Code に住まわせる skill。最良のコードは、書かなかったコードだ。頼まれたことを、最小の新しいコードで完全に解決する。既存のコード、標準ライブラリ、インストール済みの依存関係を先に探し、誰も頼んでいない抽象化や設定は足さない。検証、エラー処理、セキュリティ、アクセシビリティは削らない。返答の最後に、省略したことと、知っておくべきリスクを書く。ルールの全文は [`CLAUDE.md`](CLAUDE.md) と [`skills/ponytail/SKILL.md`](skills/ponytail/SKILL.md)、実際の出力例は [`examples/`](examples/)。

導入は [INSTALL.md](INSTALL.md)。以下は導入後の使い方。

## 仕組み

- **常時有効のルール**は、`~/.claude/CLAUDE.md` の `ponytail:begin`〜`ponytail:end` のブロック。Claude Code は新しいセッションの開始時にこれを読む。普段は何も操作しなくてよい。
- **コマンド**は `~/.claude/skills/` の6つの skill。`/ponytail-review` のように、使いたいときに入力する。

## どういうときに何をするか

| やりたいこと | 操作 |
|---|---|
| ふだんのコーディングで使う | 何もしない。新しいセッションを開けば、既定のレベル（`full`）で効いている |
| いまのセッションだけ強さを変える | `/ponytail lite`、`/ponytail full`、`/ponytail ultra` |
| いまのセッションだけ止める | 「stop ponytail」または「normal mode」と言う。`/ponytail off` でもよい |
| 変更を見てもらう | `/ponytail-review` |
| リポジトリ全体を診てもらう | `/ponytail-audit` |
| 先送りにした近道を一覧にする | `/ponytail-debt` |
| 効果の数字を見る | `/ponytail-gain` |
| コマンドの早見表を見る | `/ponytail-help` |
| 新しいセッションからの既定のレベルを変える | [INSTALL.md の設定](INSTALL.md#設定)。変えたら `install` を再実行する |
| 完全にやめる | [INSTALL.md のアンインストール](INSTALL.md#アンインストール) |

## レベル

| レベル | 動き |
|---|---|
| `lite` | 頼まれたものを作る。もっと小さい案があれば1行で挙げて、選ばせる |
| `full` | 既定。最小で完全な変更を作り、返答の最後に「省略したこと」と「リスク」を書く |
| `ultra` | さらに、依頼そのものを疑う。作る前に、必要性が説明できない部分に異を唱える |

迷ったら `full` のまま使う。「頼んでいないものまで作られる」と感じたら `ultra`、「異論を出されすぎる」と感じたら `lite`。

## レビューと監査

```
/ponytail-review
/ponytail-review staged
/ponytail-review branch
/ponytail-review https://github.com/<org>/<repo>/pull/123
/ponytail-review src/auth.js
```

- 対象を書かなければ、未コミットの変更を見る。変更がなければ、直前のコミットを見る。
- 差分だけでなく、変更が触れるコード（呼び出し元、テスト）も読む。バグ、セキュリティ、負荷、テストの有無、速度、削れる部分を順に見る。
- 指摘ごとに、何が起きるか、どう直すか、直さないとどうなるかが書かれる。

```
/ponytail-audit
/ponytail-audit src/payments
```

- 対象を書かなければリポジトリ全体。先にコードの地図を作り、見つけたものを重要な順に並べて、最初に直すものを示す。
- どちらも報告だけで、ファイルは変更しない。

## `shortcut:` コメントと `/ponytail-debt`

ponytail は、近道を取ったとき、コードに `shortcut: <限界>, <いつ作り直すか>` の形のコメントを残す。`/ponytail-debt` はこれを集めて一覧にする。「あとで直す」が「直さない」にならないように、ときどき実行する。

自分の目印を使いたいときは、`/ponytail-debt TODO` のように語を渡す。

## 注意点（hook がないことによる違い）

- `/ponytail ultra` などの切り替えは、そのセッションだけで有効。新しいセッションは既定のレベルに戻る。
- 長い会話で compact が起きると、切り替えが薄れることがある。そのときは、もう一度 `/ponytail ultra` と入力する。
- 止めるときの「stop ponytail」は、hook が判定していたものではなく、ルールの文面をモデルが読んで従うもの。確実に止めたいときは、新しいセッションを開くか、既定のレベルを `off` にして `install` を再実行する。
- サブエージェントには、ルールが届かないことがある。
- コードベースマップ、band、statusline、`/ponytail band` は使えない。

## 入っているかの確認

- `/ponytail-help` が表示されれば、skill は入っている。
- `~/.claude/CLAUDE.md` に `ponytail:begin` のブロックがあれば、常時有効のルールも入っている。Claude Code の `/memory` でも読み込まれているか見られる。
- どちらもなければ、`node ponytail/scripts/claude-skills.js install` をもう一度実行し、新しいセッションを開く。
- `ponytail:begin` のブロックは `install` のたびに上書きされるので、手で編集しない。自分のルールは、ブロックの外に書く。
