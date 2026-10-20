# インストール

Claude Code に、プラグインも hook も使わずに ponytail を入れる手順。組織の管理設定で plugin hooks（`allowManagedHooksOnly`）や marketplace（`strictKnownMarketplaces`）が塞がれている環境を想定している。`node` が PATH に通っていればよい。

## インストール

```bash
git clone https://github.com/DietrichGebert/ponytail.git
node ponytail/scripts/claude-skills.js install
```

次の2つを行う。

- 6つの skill（`ponytail`、`ponytail-review`、`ponytail-audit`、`ponytail-debt`、`ponytail-gain`、`ponytail-help`）を `~/.claude/skills/` にコピーする。
- 既定のレベルのルールを、`~/.claude/CLAUDE.md` の末尾に印付きのブロックとして書き込む。ファイルのそれ以外の部分には触れない。

実行後、新しいセッションから効く。使い方は [README.md](README.md)。`CLAUDE_CONFIG_DIR` を設定している場合は、`~/.claude` の代わりにそのディレクトリを使う。

hook がないため、次の制限がある。

- `/ponytail lite|full|ultra` で切り替えたレベルは、そのセッションの中だけで有効。
- サブエージェントには、ルールが注入されない。
- コードベースマップ、band、statusline は使えない。

## プロジェクトだけに入れる

`~/.claude` ではなく、特定のプロジェクトの `.claude` に入れたいときは、`CLAUDE_CONFIG_DIR` をそのプロジェクトの `.claude` に向けて実行する。

```bash
CLAUDE_CONFIG_DIR=/path/to/project/.claude node ponytail/scripts/claude-skills.js install
```

skill は `<project>/.claude/skills/` に、ルールのブロックは `<project>/.claude/CLAUDE.md` に入る。アンインストールも、同じ環境変数を付けて `uninstall` を実行する。

注意点：

- この方法は `CLAUDE_CONFIG_DIR` を本来の意味（Claude Code の設定ディレクトリ）とは違う使い方をする回避策で、専用のオプションはない。
- Claude Code が `<project>/.claude/CLAUDE.md` をプロジェクトの指示として読むかどうかは、確かめていない。読まれない場合は、できあがったブロックを `<project>/CLAUDE.md` に移す。
- `CLAUDE_CONFIG_DIR` を `.zshrc` などで設定済みの人は、実行のたびに上書きされることに注意する。
- ユーザー全体（`~/.claude`）に入れたものと、プロジェクトに入れたものの両方があると、ルールが二重に読み込まれる。

## 設定

新しいセッションの既定のレベルは、環境変数 `PONYTAIL_DEFAULT_MODE`（`lite`／`full`／`ultra`／`off`）か、`~/.config/ponytail/config.json` の `defaultMode` で決める。環境変数が優先で、どちらもなければ `full`。

```json
{ "defaultMode": "ultra" }
```

レベルは CLAUDE.md に書き込まれるので、変えたら `install` をもう一度実行する。`off` にすると skill だけが残り、CLAUDE.md のブロックは消える。

## 更新

```bash
git -C ponytail pull
node ponytail/scripts/claude-skills.js install
```

`install` は何度実行しても、CLAUDE.md のブロックを置き換えるだけで重複しない。

## アンインストール

```bash
node ponytail/scripts/claude-skills.js uninstall
```

6つの skill と、CLAUDE.md の ponytail のブロックだけを消す。`~/.config/ponytail/config.json` は残るので、不要なら手で消す。
