---
name: web-artifacts-builder
description: 最新のフロントエンドWeb技術（React、Tailwind CSS、shadcn/ui）を使用した、複雑な複数コンポーネントのclaude.ai HTMLアーティファクト作成ツールスイート。状態管理、ルーティング、shadcn/uiコンポーネントを必要とする複雑なアーティファクトに使用。単純な単一ファイルHTML/JSXアーティファクトには不要。
license: Complete terms in LICENSE.txt
---

# Webアーティファクトビルダー

強力なフロントエンドclaude.aiアーティファクトを構築するには、以下の手順に従う：
1. `scripts/init-artifact.sh`を使用してフロントエンドリポジトリを初期化
2. 生成されたコードを編集してアーティファクトを開発
3. `scripts/bundle-artifact.sh`を使用してすべてのコードを単一HTMLファイルにバンドル
4. ユーザーにアーティファクトを表示
5. （オプション）アーティファクトをテスト

**スタック**: React 18 + TypeScript + Vite + Parcel（バンドル） + Tailwind CSS + shadcn/ui

## デザイン＆スタイルガイドライン

**非常に重要**: 「AIっぽさ」を避けるため、過度な中央揃えレイアウト、紫グラデーション、均一な角丸、Interフォントの使用を避ける。

## クイックスタート

### ステップ1：プロジェクトの初期化

初期化スクリプトを実行して新しいReactプロジェクトを作成：
```bash
bash scripts/init-artifact.sh <project-name>
cd <project-name>
```

これにより、以下が設定された完全なプロジェクトが作成される：
- ✅ React + TypeScript（Vite経由）
- ✅ Tailwind CSS 3.4.1（shadcn/uiテーマシステム付き）
- ✅ パスエイリアス（`@/`）設定済み
- ✅ 40以上のshadcn/uiコンポーネントがプリインストール
- ✅ すべてのRadix UI依存関係を含む
- ✅ バンドル用のParcel設定済み（.parcelrc経由）
- ✅ Node 18+互換性（Viteバージョンを自動検出して固定）

### ステップ2：アーティファクトを開発

アーティファクトを構築するには、生成されたファイルを編集。以下の**一般的な開発タスク**を参照。

### ステップ3：単一HTMLファイルにバンドル

Reactアプリを単一HTMLアーティファクトにバンドル：
```bash
bash scripts/bundle-artifact.sh
```

これにより、すべてのJavaScript、CSS、依存関係がインライン化された自己完結型アーティファクト`bundle.html`が作成される。このファイルはClaude会話でアーティファクトとして直接共有可能。

**要件**: プロジェクトのルートディレクトリに`index.html`が必要。

**スクリプトの動作**:
- バンドル依存関係をインストール（parcel、@parcel/config-default、parcel-resolver-tspaths、html-inline）
- パスエイリアスサポート付きの`.parcelrc`設定を作成
- Parcelでビルド（ソースマップなし）
- html-inlineを使用してすべてのアセットを単一HTMLにインライン化

### ステップ4：ユーザーにアーティファクトを共有

最後に、バンドルされたHTMLファイルを会話でユーザーと共有し、アーティファクトとして表示できるようにする。

### ステップ5：アーティファクトのテスト/可視化（オプション）

注意：これは完全にオプションのステップ。必要な場合または要求された場合のみ実行。

アーティファクトをテスト/可視化するには、利用可能なツール（他のスキルやPlaywright、Puppeteerなどの組み込みツールを含む）を使用。一般的に、リクエストから完成したアーティファクトが見られるまでの遅延が増えるため、事前にアーティファクトをテストすることは避ける。問題が発生した場合、アーティファクトを提示した後でテスト。

## リファレンス

- **shadcn/uiコンポーネント**: https://ui.shadcn.com/docs/components
