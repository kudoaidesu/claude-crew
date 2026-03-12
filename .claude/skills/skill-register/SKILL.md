---
name: skill-register
description: >
  現在のプロジェクトのスキルを claude-code-template リポジトリに登録する。
  「スキルを登録」「テンプレートに追加」「スキルを共有」「スキルをテンプレートリポジトリに」等のキーワードで発動。
  新規登録・既存スキルの更新の両方に対応。
license: Complete terms in LICENSE.txt
---

# スキル登録

現在のプロジェクトにあるスキルを `claude-code-template` リポジトリに登録する。

## テンプレートリポジトリ

- パス: `~/workspace/claude-code-template`
- リモート: GitHub `claude-code-template`
- スキル格納先: `.claude/skills/<skill-name>/`

## ワークフロー

### Step 1: 登録対象の特定

ユーザーに登録したいスキル名を確認する。未指定なら現プロジェクトの `.claude/skills/` 一覧を提示して選択させる。

### Step 2: 差分チェック

```bash
# テンプレートリポジトリに同名スキルが存在するか確認
ls ~/workspace/claude-code-template/.claude/skills/<skill-name>/ 2>/dev/null

# 存在する場合は差分を確認
diff -r <source-skill-path> ~/workspace/claude-code-template/.claude/skills/<skill-name>/
```

- **新規**: そのままStep 3へ
- **差分あり**: 差分を表示し、上書き確認をとる
- **差分なし**: 「既に最新です」と報告して終了

### Step 3: コピー

```bash
# ディレクトリごとコピー（SKILL.md + バンドルリソース）
mkdir -p ~/workspace/claude-code-template/.claude/skills/<skill-name>
cp -r <source-skill-path>/* ~/workspace/claude-code-template/.claude/skills/<skill-name>/
```

### Step 4: コミット & プッシュ

テンプレートリポジトリ内で：

```bash
cd ~/workspace/claude-code-template
git add .claude/skills/<skill-name>/
git commit -m "feat: add <skill-name> skill"  # 更新時は "update"
git push origin main
```

### Step 5: 完了報告

登録結果をユーザーに報告する：
- 新規 or 更新
- コピーしたファイル一覧
- コミットハッシュ

## 一括登録

複数スキルを同時に登録する場合は、Step 2-3 を各スキルに対して実行し、Step 4 で一括コミットする。

```bash
git commit -m "feat: add <skill-1>, <skill-2>, ... skills"
```
