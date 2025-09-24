# Google認証修復 データフロー設計

## 認証フローの全体概要

Google OAuth認証における理想的なデータフローと、現在発生している問題点、および修復後の改善されたフローを定義します。

## 現在の問題フロー分析

### 問題のあるフロー（現状）

```mermaid
flowchart TD
    A[ユーザー] --> B[LoginPage]
    B --> C[Google OAuth認証開始]
    C --> D[Google認証サーバー]
    D --> E[認証コールバック]
    E --> F{codeパラメータ確認}
    F -->|❌ no_code| G[エラーページ]
    F -->|✅ code存在| H[Supabase Auth]
    H --> I[セッション作成]
    I --> J[ホーム画面]

    style G fill:#ffcccc
    style F fill:#fff2cc
```

### 問題発生ポイント

1. **Google → Callback間**: 認証コードの未送信
2. **環境差異**: 本番環境特有の制約
3. **エラーハンドリング**: 不十分なデバッグ情報

## 修復後の理想フロー

### 正常認証フロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant L as LoginPage
    participant G as Google OAuth
    participant C as Callback Handler
    participant S as Supabase Auth
    participant D as Database
    participant H as Home Page

    U->>L: ログインボタンクリック
    L->>L: ローディング表示
    L->>S: signInWithOAuth()
    S->>G: OAuth認証リクエスト
    Note over G: PKCE Code Challenge生成
    G->>U: Google認証画面表示
    U->>G: 認証情報入力・許可
    G->>C: authorization_code + state
    Note over C: 詳細ログ出力
    C->>C: パラメータ検証
    C->>S: exchangeCodeForSession()
    S->>G: トークン交換リクエスト
    G-->>S: access_token + refresh_token
    S->>D: ユーザー情報保存
    S-->>C: セッション情報
    C->>H: リダイレクト（成功）
    H->>U: ホーム画面表示
```

### エラーハンドリングフロー

```mermaid
flowchart TD
    A[Callback受信] --> B{パラメータ検証}

    B -->|no_code| C[詳細デバッグ情報収集]
    B -->|oauth_error| D[OAuth エラー処理]
    B -->|valid_code| E[セッション作成処理]

    C --> C1[URL パラメータログ]
    C1 --> C2[Referrer確認]
    C2 --> C3[User-Agent確認]
    C3 --> F[エラーページ表示]

    D --> D1[エラー詳細ログ]
    D1 --> F

    E --> G{セッション作成結果}
    G -->|成功| H[ホーム画面リダイレクト]
    G -->|失敗| I[セッションエラー処理]
    I --> F

    F --> J[日本語エラーメッセージ]
    J --> K[リトライボタン提供]

    style C fill:#ffeecc
    style D fill:#ffeecc
    style I fill:#ffeecc
    style F fill:#ffcccc
```

## 状態管理データフロー

### 認証状態の管理

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated

    Unauthenticated --> AuthPending: ログイン開始
    AuthPending --> AuthSuccess: 認証成功
    AuthPending --> AuthError: 認証失敗
    AuthPending --> AuthTimeout: タイムアウト

    AuthSuccess --> Authenticated: セッション確立
    Authenticated --> Unauthenticated: ログアウト
    Authenticated --> SessionExpired: セッション期限切れ

    AuthError --> Unauthenticated: エラー解決後
    AuthTimeout --> Unauthenticated: タイムアウト後
    SessionExpired --> Unauthenticated: 再認証必要

    note right of AuthPending
        ローディング状態
        ユーザー操作無効
    end note

    note right of AuthError
        エラーメッセージ表示
        デバッグ情報提供
        リトライ操作可能
    end note
```

## データ構造とフロー

### 認証関連データの流れ

```mermaid
flowchart LR
    subgraph "Google OAuth Response"
        A1[authorization_code]
        A2[state]
        A3[scope]
        A4[error?]
        A5[error_description?]
    end

    subgraph "Callback Processing"
        B1[パラメータ抽出]
        B2[検証・ログ]
        B3[Supabase送信]
    end

    subgraph "Supabase Response"
        C1[access_token]
        C2[refresh_token]
        C3[user_metadata]
        C4[session_info]
    end

    subgraph "Client State"
        D1[AuthContext]
        D2[Session Storage]
        D3[Cookie]
        D4[Local State]
    end

    A1 --> B1
    A2 --> B1
    A3 --> B1
    A4 --> B2
    A5 --> B2

    B1 --> B2
    B2 --> B3

    B3 --> C1
    C1 --> D1
    C2 --> D2
    C3 --> D1
    C4 --> D3

    D1 --> D4
```

## 環境別データフロー

### ローカル環境 vs 本番環境

```mermaid
flowchart TD
    subgraph "Local Environment"
        L1[localhost:3000]
        L2[HTTP許可]
        L3[開発用OAuth設定]
        L4[詳細ログ出力]
    end

    subgraph "Production Environment"
        P1[Vercel Edge Functions]
        P2[HTTPS強制]
        P3[本番OAuth設定]
        P4[最適化ログ]
    end

    subgraph "Common Flow"
        C1[Google OAuth]
        C2[Supabase Auth]
        C3[Session Management]
    end

    L1 --> C1
    L2 --> C1
    L3 --> C1
    L4 --> C2

    P1 --> C1
    P2 --> C1
    P3 --> C1
    P4 --> C2

    C1 --> C2
    C2 --> C3
```

## リアルタイム監視データフロー

### ログとモニタリング

```mermaid
flowchart TD
    subgraph "Application Events"
        E1[認証開始]
        E2[認証コールバック]
        E3[セッション作成]
        E4[エラー発生]
    end

    subgraph "Logging Pipeline"
        L1[Vercel Function Logs]
        L2[Supabase Auth Logs]
        L3[カスタムログ収集]
        L4[エラートラッキング]
    end

    subgraph "Monitoring Dashboard"
        M1[認証成功率]
        M2[エラー分析]
        M3[パフォーマンス監視]
        M4[アラート通知]
    end

    E1 --> L1
    E1 --> L3
    E2 --> L1
    E2 --> L3
    E3 --> L2
    E3 --> L3
    E4 --> L4

    L1 --> M1
    L1 --> M3
    L2 --> M1
    L2 --> M2
    L3 --> M2
    L4 --> M4

    M4 --> A[管理者通知]
```

## セキュリティデータフロー

### セキュリティ検証フロー

```mermaid
flowchart TD
    A[認証リクエスト] --> B[CSRF Token検証]
    B --> C[State Parameter検証]
    C --> D[Origin Header確認]
    D --> E[Redirect URL検証]
    E --> F[PKCE Code Verifier検証]
    F --> G[認証コード有効性確認]
    G --> H[セッション作成]
    H --> I[Cookie設定（Secure + HttpOnly）]
    I --> J[認証完了]

    B -->|無効| X[セキュリティエラー]
    C -->|無効| X
    D -->|無効| X
    E -->|無効| X
    F -->|無効| X
    G -->|無効| X

    style X fill:#ff9999
```

## パフォーマンス最適化フロー

### レスポンス時間最適化

```mermaid
gantt
    title 認証処理タイムライン（目標vs現状）
    dateFormat X
    axisFormat %Ls

    section 理想フロー
    ログインボタンクリック    :active, ideal1, 0, 500
    OAuth認証画面表示        :ideal2, after ideal1, 1000
    認証情報入力            :ideal3, after ideal2, 2000
    コールバック処理        :ideal4, after ideal3, 500
    セッション作成          :ideal5, after ideal4, 1000

    section 現状問題フロー
    ログインボタンクリック    :prob1, 0, 500
    OAuth認証画面表示        :prob2, after prob1, 2000
    認証情報入力            :prob3, after prob2, 2000
    エラー発生              :crit, prob4, after prob3, 1000
```

---

**作成者**: システムアーキテクト
**最終更新**: 2025-08-23
**次回レビュー**: 実装完了後
