# 共有状態Hookの設計・実装パターン

URL/Context/localStorageで状態を共有するReact hookの設計・実装ガイド。

## 発動条件
- 「useStateとURL同期」「複数コンポーネントで状態共有」「hook作成」
- 「状態が復活する」「古い値が残る」「同期がおかしい」
- URLパラメータやlocalStorageと連携するhookを作成・修正する時

---

## 複数インスタンス問題

### 問題の本質

同じhookを複数のコンポーネントで呼び出すと、**それぞれ独立した状態**を持つ：

```
コンポーネントA（useMyHook インスタンス1）
    state: { filter: 'old-value' }

コンポーネントB（useMyHook インスタンス2）
    state: { filter: 'new-value' }  ← Aは知らない
```

### バグパターン

```typescript
// ❌ 問題のあるパターン
function deserializeFromUrl(params): Partial<State> {
  return {
    filter: params.get('filter') ?? undefined  // URLにないとundefined
  }
}

useEffect(() => {
  const urlState = deserializeFromUrl(searchParams)
  // undefinedをマージすると、古いstateの値が残る
  setState(prev => ({ ...prev, ...urlState }))
}, [searchParams])
```

**結果**: インスタンスAがURLを更新 → インスタンスBのuseEffect発火 → マージで古い値が復活

### 解決パターン

```typescript
// ✅ 完全な状態を返す（undefinedを返さない）
function deserializeFromUrl(params): State {
  return {
    filter: params.get('filter') ?? DEFAULT_STATE.filter  // デフォルト値
  }
}

useEffect(() => {
  // URLを単一の信頼できるソースとして直接設定（マージしない）
  const urlState = deserializeFromUrl(searchParams)
  setState(urlState)
}, [searchParams])
```

---

## 設計原則

### 1. 単一の信頼できるソース（Single Source of Truth）

初回ロード後は**URLを唯一の状態ソース**とする：

```
初回ロード:  URL → localStorage → デフォルト（優先順）
以降:        URL のみ（localStorageは保存のみ）
```

### 2. Partial型を避ける

```typescript
// ❌ Partial型はマージ時に問題
function deserialize(): Partial<State> { ... }

// ✅ 完全な型を返す
function deserialize(): State { ... }
```

### 3. hookの使用箇所を把握する

```bash
# hookがどこで使われているか確認
grep -r "useEventSearchState" app/ --include="*.tsx"
```

複数箇所で使用される場合は、同期問題を必ず考慮する。

---

## useMemoでの参照等価性の罠

### 問題の本質

`useMemo`で空配列を返すケースがあると、依存配列の変更時に**毎回新しい参照**が生成される：

```typescript
// ❌ 問題のあるパターン
const filteredData = useMemo(() => {
  if (someCondition) {
    return []  // ← 毎回新しい配列オブジェクトが生成される
  }
  return processData(rawData)
}, [someCondition, rawData, processData])  // processDataが変わると[]も新しくなる
```

### なぜ問題か

子コンポーネントで `filteredData` をuseEffectの依存配列に入れていると、**空配列でも毎回useEffectが発火**する：

```typescript
function ChildComponent({ initialData }) {
  useEffect(() => {
    // initialDataが [] → [] に変わっても、参照が違うので発火
    resetScrollState()  // ← 意図しない副作用
  }, [initialData])
}
```

### 解決パターン

```typescript
// ✅ 安定した空配列参照を使う
const EMPTY_ARRAY = useMemo(() => [], [])  // 絶対に変わらない

const filteredData = useMemo(() => {
  if (someCondition) {
    return EMPTY_ARRAY  // ← 常に同じ参照
  }
  return processData(rawData)
}, [someCondition, rawData, processData, EMPTY_ARRAY])
```

### 実例（無限スクロールのバグ）

```typescript
// ❌ バグ：includePastEventsがtrueの時、filterEventsが変わると[]の参照も変わる
const filteredInitialEvents = useMemo(() => {
  if (includePastEvents) {
    return []  // ← filterEventsが変わるたびに新しい[]
  }
  return filterEvents(upcomingEvents)
}, [upcomingEvents, filterEvents, includePastEvents])

// ✅ 修正：安定した参照
const EMPTY_EVENTS: Event[] = useMemo(() => [], [])
const filteredInitialEvents = useMemo(() => {
  if (includePastEvents) {
    return EMPTY_EVENTS
  }
  return filterEvents(upcomingEvents)
}, [upcomingEvents, filterEvents, includePastEvents, EMPTY_EVENTS])
```

---

## 実装チェックリスト

### URL同期hook作成時

- [ ] `deserializeFromUrl` は完全な状態を返すか（undefinedを返さないか）
- [ ] `useEffect` でマージせず直接設定しているか
- [ ] 複数インスタンスで使用される可能性を考慮したか
- [ ] 関数型setState `setState(prev => ...)` を使用しているか（クロージャ問題対策）

### クロージャ問題対策

```typescript
// ❌ クロージャで古いstateを参照
const updateFilter = useCallback(() => {
  setState({ ...state, filter: 'new' })  // stateが古い可能性
}, [state])

// ✅ 関数型setStateで最新を取得
const updateFilter = useCallback(() => {
  setState(prev => ({ ...prev, filter: 'new' }))
}, [])
```

---

## コードレビュー観点

1. **hookが複数コンポーネントで使用されるか確認**
2. **deserialize関数がPartialを返していないか確認**
3. **useEffectでマージロジックを使っていないか確認**
4. **useCallbackの依存配列でstateを参照していないか確認**

---

## 関連スキル
- [e2e-test-principles](e2e-test-principles.md) - 複数UI領域からの操作テスト
