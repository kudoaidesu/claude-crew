---
name: tailwind-design-system
description: Tailwind CSSでスケーラブルなデザインシステムを構築。デザイントークン、コンポーネントライブラリ、レスポンシブパターン。コンポーネントライブラリの作成、デザインシステムの実装、UIパターンの標準化時に使用。
---

# Tailwind デザインシステム

デザイントークン、コンポーネントバリアント、レスポンシブパターン、アクセシビリティを含む、Tailwind CSSでの本番環境対応デザインシステム構築。

## 使用タイミング

- Tailwindでコンポーネントライブラリを作成
- デザイントークンとテーマを実装
- レスポンシブでアクセシブルなコンポーネントを構築
- コードベース全体でUIパターンを標準化
- ダークモードとカラースキームのセットアップ

## コアコンセプト

### デザイントークン階層
```
ブランドトークン（抽象）
    └── セマンティックトークン（目的）
        └── コンポーネントトークン（具体）

例: blue-500 → primary → button-bg
```

### コンポーネントアーキテクチャ
```
ベーススタイル → バリアント → サイズ → 状態 → オーバーライド
```

## クイックスタート

```typescript
// tailwind.config.ts
const config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
    },
  },
}
```

## CVAコンポーネント

```typescript
import { cva } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground',
        outline: 'border border-input bg-background hover:bg-accent',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
      },
    },
  }
)
```

## ユーティリティ関数

```typescript
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

## ベストプラクティス

### やるべき
- CSS変数を使用（ランタイムテーマ）
- CVAで型安全なバリアント
- セマンティックカラー（`primary`）
- アクセシビリティ（ARIA、フォーカス状態）

### やってはいけない
- 任意の値を使用（テーマを拡張）
- 色をハードコード
- ダークモードを忘れる

## 参考リンク

- [Tailwind CSS](https://tailwindcss.com/docs)
- [CVA](https://cva.style/docs)
- [shadcn/ui](https://ui.shadcn.com/)