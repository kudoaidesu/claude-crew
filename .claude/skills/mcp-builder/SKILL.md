---
name: mcp-builder
description: LLMが外部サービスと連携するための高品質なMCP（Model Context Protocol）サーバー作成ガイド。外部APIやサービスを統合するMCPサーバーを構築する際に使用。Python（FastMCP）またはNode/TypeScript（MCP SDK）に対応。
license: Complete terms in LICENSE.txt
---

# MCPサーバー開発ガイド

## 概要

LLMが適切に設計されたツールを通じて外部サービスと連携できるMCPサーバーを作成する。MCPサーバーの品質は、LLMが実世界のタスクをどれだけうまく達成できるかで測定される。

---

# プロセス

## 高レベルワークフロー

高品質なMCPサーバーの作成には4つの主要フェーズがある：

### フェーズ1：深いリサーチと計画

#### 1.1 モダンMCP設計の理解

**APIカバレッジ vs ワークフローツール：**
包括的なAPIエンドポイントカバレッジと専門的なワークフローツールのバランスを取る。ワークフローツールは特定タスクに便利で、包括的なカバレッジはエージェントに操作を組み合わせる柔軟性を与える。不確かな場合は包括的なAPIカバレッジを優先。

**ツールの命名と発見可能性：**
明確で説明的なツール名がエージェントの迅速なツール発見を助ける。一貫したプレフィックス（例：`github_create_issue`、`github_list_repos`）とアクション指向の命名を使用。

**コンテキスト管理：**
エージェントは簡潔なツール説明と結果のフィルタ/ページネーション機能の恩恵を受ける。焦点を絞った関連データを返すツールを設計。

**アクション可能なエラーメッセージ：**
エラーメッセージは具体的な提案と次のステップでエージェントを解決策に導くべき。

#### 1.2 MCPプロトコルドキュメントの調査

**MCP仕様をナビゲート：**

サイトマップで関連ページを見つける：`https://modelcontextprotocol.io/sitemap.xml`

次にマークダウン形式で`.md`サフィックス付きの特定ページを取得（例：`https://modelcontextprotocol.io/specification/draft.md`）。

確認すべき主要ページ：
- 仕様の概要とアーキテクチャ
- トランスポートメカニズム（ストリーマブルHTTP、stdio）
- ツール、リソース、プロンプトの定義

#### 1.3 フレームワークドキュメントの調査

**推奨スタック：**
- **言語**: TypeScript（高品質なSDKサポートと多くの実行環境での良好な互換性）
- **トランスポート**: リモートサーバーにはストリーマブルHTTP（ステートレスJSON使用）。ローカルサーバーにはstdio。

**フレームワークドキュメントの読み込み：**

- **MCPベストプラクティス**: [📋 ベストプラクティスを見る](./reference/mcp_best_practices.md) - コアガイドライン

**TypeScript（推奨）:**
- **TypeScript SDK**: WebFetchで`https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/main/README.md`を読み込む
- [⚡ TypeScriptガイド](./reference/node_mcp_server.md) - TypeScriptのパターンと例

**Python:**
- **Python SDK**: WebFetchで`https://raw.githubusercontent.com/modelcontextprotocol/python-sdk/main/README.md`を読み込む
- [🐍 Pythonガイド](./reference/python_mcp_server.md) - Pythonのパターンと例

#### 1.4 実装の計画

**APIを理解する：**
サービスのAPIドキュメントを確認し、主要なエンドポイント、認証要件、データモデルを特定。必要に応じてWeb検索とWebFetchを使用。

**ツール選択：**
包括的なAPIカバレッジを優先。最も一般的な操作から始めて、実装するエンドポイントをリストアップ。

---

### フェーズ2：実装

#### 2.1 プロジェクト構造のセットアップ

プロジェクトセットアップについては言語固有のガイドを参照：
- [⚡ TypeScriptガイド](./reference/node_mcp_server.md) - プロジェクト構造、package.json、tsconfig.json
- [🐍 Pythonガイド](./reference/python_mcp_server.md) - モジュール構成、依存関係

#### 2.2 コアインフラストラクチャの実装

共有ユーティリティを作成：
- 認証付きAPIクライアント
- エラーハンドリングヘルパー
- レスポンスフォーマット（JSON/Markdown）
- ページネーションサポート

#### 2.3 ツールの実装

各ツールについて：

**入力スキーマ：**
- Zod（TypeScript）またはPydantic（Python）を使用
- 制約と明確な説明を含める
- フィールド説明に例を追加

**出力スキーマ：**
- 可能な場合、構造化データ用に`outputSchema`を定義
- ツールレスポンスで`structuredContent`を使用（TypeScript SDK機能）
- クライアントがツール出力を理解・処理するのを助ける

**ツール説明：**
- 機能の簡潔な要約
- パラメータの説明
- 戻り値の型スキーマ

**実装：**
- I/O操作にasync/await
- アクション可能なメッセージでの適切なエラーハンドリング
- 該当する場合はページネーションをサポート
- モダンSDK使用時はテキストコンテンツと構造化データの両方を返す

**アノテーション：**
- `readOnlyHint`: true/false
- `destructiveHint`: true/false
- `idempotentHint`: true/false
- `openWorldHint`: true/false

---

### フェーズ3：レビューとテスト

#### 3.1 コード品質

確認項目：
- 重複コードなし（DRY原則）
- 一貫したエラーハンドリング
- 完全な型カバレッジ
- 明確なツール説明

#### 3.2 ビルドとテスト

**TypeScript：**
- `npm run build`を実行してコンパイルを確認
- MCP Inspectorでテスト：`npx @modelcontextprotocol/inspector`

**Python：**
- 構文確認：`python -m py_compile your_server.py`
- MCP Inspectorでテスト

詳細なテストアプローチと品質チェックリストについては言語固有のガイドを参照。

---

### フェーズ4：評価の作成

MCPサーバー実装後、その効果をテストする包括的な評価を作成。

**完全な評価ガイドラインは[✅ 評価ガイド](./reference/evaluation.md)を読み込む。**

#### 4.1 評価の目的を理解

評価を使用して、LLMがMCPサーバーを効果的に使用して現実的で複雑な質問に回答できるかをテスト。

#### 4.2 10個の評価質問を作成

効果的な評価を作成するには、評価ガイドに記載されたプロセスに従う：

1. **ツール検査**: 利用可能なツールをリストし、その機能を理解
2. **コンテンツ探索**: 読み取り専用操作で利用可能なデータを探索
3. **質問生成**: 10個の複雑で現実的な質問を作成
4. **回答検証**: 各質問を自分で解いて回答を検証

#### 4.3 評価要件

各質問が以下であることを確認：
- **独立**: 他の質問に依存しない
- **読み取り専用**: 破壊的でない操作のみ必要
- **複雑**: 複数のツール呼び出しと深い探索が必要
- **現実的**: 人間が関心を持つ実際のユースケースに基づく
- **検証可能**: 文字列比較で検証できる単一の明確な回答
- **安定**: 時間経過で回答が変わらない

#### 4.4 出力形式

この構造でXMLファイルを作成：

```xml
<evaluation>
  <qa_pair>
    <question>質問テキスト</question>
    <answer>回答</answer>
  </qa_pair>
<!-- 追加のqa_pairs... -->
</evaluation>
```

---

# リファレンスファイル

## ドキュメントライブラリ

開発中に必要に応じてこれらのリソースを読み込む：

### コアMCPドキュメント（最初に読み込む）
- **MCPプロトコル**: `https://modelcontextprotocol.io/sitemap.xml`のサイトマップから開始、`.md`サフィックスで特定ページを取得
- [📋 MCPベストプラクティス](./reference/mcp_best_practices.md) - 普遍的なMCPガイドライン

### SDKドキュメント（フェーズ1/2で読み込む）
- **Python SDK**: `https://raw.githubusercontent.com/modelcontextprotocol/python-sdk/main/README.md`から取得
- **TypeScript SDK**: `https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/main/README.md`から取得

### 言語固有の実装ガイド（フェーズ2で読み込む）
- [🐍 Python実装ガイド](./reference/python_mcp_server.md) - 完全なPython/FastMCPガイド
- [⚡ TypeScript実装ガイド](./reference/node_mcp_server.md) - 完全なTypeScriptガイド

### 評価ガイド（フェーズ4で読み込む）
- [✅ 評価ガイド](./reference/evaluation.md) - 完全な評価作成ガイド
