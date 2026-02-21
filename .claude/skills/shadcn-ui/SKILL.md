---
name: shadcn-ui
description: shadcn/uiコンポーネントライブラリの完全ガイド。インストール、設定、アクセシブルなReactコンポーネントの実装を含む。トリガーワード：「UIを作って」「ボタン追加」「ダイアログ」「モーダル」「フォーム作成」「ドロップダウン」「Sheet」「Card」「Table」「shadcn」「Radix」「コンポーネントを追加」。shadcn/uiのセットアップ、フォーム構築、テーマカスタマイズ、UIパターン実装時に使用。
language: typescript,tsx
framework: react,nextjs,tailwindcss
license: MIT
allowed-tools: Read, Write, Bash, Edit, Glob
---

# shadcn/ui コンポーネントパターン

shadcn/ui、Radix UI、Tailwind CSSを使用したアクセシブルでカスタマイズ可能なUIコンポーネント構築のエキスパートガイド。

## 使用タイミング

- shadcn/uiで新規プロジェクトをセットアップ
- 個別コンポーネントのインストールや設定
- React Hook FormとZodバリデーションでフォーム構築
- アクセシブルなUIコンポーネント作成（ボタン、ダイアログ、ドロップダウン、シート）
- Tailwind CSSでコンポーネントスタイリングをカスタマイズ
- shadcn/uiでデザインシステムを実装

## クイックスタート

```bash
# shadcn/ui付きNext.jsプロジェクトを作成
npx create-next-app@latest my-app --typescript --tailwind --eslint --app
cd my-app
npx shadcn@latest init

# 必須コンポーネントをインストール
npx shadcn@latest add button input form card dialog select
```

## shadcn/uiとは

- プロジェクトにコピーできる**再利用可能なコンポーネント集**
- コンポーネントは**カスタマイズ自由** - コードはあなたのもの
- アクセシビリティのため**Radix UI**プリミティブで構築
- **Tailwind CSS**ユーティリティでスタイリング

## コアコンポーネント

### ボタン
```tsx
<Button variant="default">デフォルト</Button>
<Button variant="destructive">削除</Button>
<Button variant="outline">アウトライン</Button>
```

### バリデーション付きフォーム
```tsx
const formSchema = z.object({
  username: z.string().min(2, "2文字以上必要"),
  email: z.string().email("有効なメールアドレスを入力"),
})
```

### ダイアログ
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>開く</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>タイトル</DialogTitle>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

## ベストプラクティス

1. **アクセシビリティ**: Radix UIプリミティブでARIA準拠
2. **カスタマイズ**: コードベースで直接コンポーネントを修正
3. **型安全性**: TypeScriptで型安全なpropsと状態
4. **バリデーション**: Zodスキーマでフォームバリデーション

## 参考リンク

- 公式: https://ui.shadcn.com
- Radix UI: https://www.radix-ui.com
- React Hook Form: https://react-hook-form.com