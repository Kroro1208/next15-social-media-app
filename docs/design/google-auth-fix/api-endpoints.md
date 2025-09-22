# Google認証修復 API エンドポイント仕様

## 概要

Google OAuth認証修復のためのAPIエンドポイント設計。Next.js App Routerベースの実装で、Supabase Authとの統合を前提とした設計です。

## ベースURL

- **開発環境**: `http://localhost:3000`
- **本番環境**: `https://social-media-app-jade-three.vercel.app`

## 認証関連エンドポイント

### 1. 認証コールバック処理

#### `GET /auth/callback`

Google OAuthの認証コールバックを処理し、認証コードをセッションに交換します。

**パラメータ**:
```typescript
interface CallbackQuery {
  code?: string;                 // OAuth認証コード
  state?: string;                // CSRF対策パラメータ
  scope?: string;                // 認証スコープ
  error?: string;                // OAuthエラーコード
  error_description?: string;     // エラー詳細
  error_uri?: string;            // エラー詳細URL
}
```

**レスポンス**:
```http
# 成功時
HTTP/1.1 302 Found
Location: https://domain.com/

# エラー時
HTTP/1.1 302 Found
Location: https://domain.com/auth/login?error=no_code&debug=...
```

**実装例**:
```typescript
// src/app/auth/callback/route.ts
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // エラーハンドリング
  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=no_code&debug=${encodeURIComponent(JSON.stringify(Object.fromEntries(searchParams.entries())))}`
    );
  }

  // Supabase Auth でセッション作成
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code);

  if (authError) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(authError.message)}`
    );
  }

  return NextResponse.redirect(`${origin}/`);
}
```

### 2. 認証状態確認

#### `GET /api/auth/status`

現在の認証状態を確認します。

**ヘッダー**:
```http
Authorization: Bearer <access_token>
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg",
      "provider": "google"
    },
    "session": {
      "expiresAt": "2025-08-24T12:00:00Z",
      "isExpired": false
    }
  },
  "meta": {
    "timestamp": "2025-08-23T10:00:00Z",
    "requestId": "req_123456789"
  }
}
```

**エラーレスポンス**:
```json
{
  "success": false,
  "error": {
    "type": "unauthenticated",
    "message": "認証が必要です",
    "code": "AUTH_REQUIRED"
  }
}
```

### 3. 認証開始

#### `POST /api/auth/start`

OAuth認証フローを開始します。

**リクエストボディ**:
```json
{
  "provider": "google",
  "redirectTo": "/dashboard",
  "options": {
    "scopes": "email profile"
  }
}
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/oauth/authorize?...",
    "state": "randomStateString",
    "codeChallenge": "challengeString"
  }
}
```

### 4. セッション更新

#### `POST /api/auth/refresh`

アクセストークンをリフレッシュします。

**リクエストボディ**:
```json
{
  "refreshToken": "refresh_token_string"
}
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token",
    "expiresIn": 3600,
    "expiresAt": "2025-08-23T11:00:00Z"
  }
}
```

### 5. ログアウト

#### `POST /api/auth/logout`

現在のセッションを無効化し、ログアウトします。

**ヘッダー**:
```http
Authorization: Bearer <access_token>
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "message": "ログアウトが完了しました"
  }
}
```

### 6. セッション検証

#### `POST /api/auth/verify`

セッションの有効性を検証します。

**リクエストボディ**:
```json
{
  "accessToken": "access_token_string"
}
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "expiresAt": "2025-08-23T11:00:00Z",
    "user": {
      "id": "user_id",
      "email": "user@example.com"
    }
  }
}
```

## デバッグ・監視エンドポイント

### 7. 認証ログ取得

#### `GET /api/auth/logs`

認証関連のログを取得します（管理者のみ）。

**クエリパラメータ**:
```
?userId=user_id&from=2025-08-23T00:00:00Z&to=2025-08-23T23:59:59Z&level=error&limit=100
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log_123",
        "timestamp": "2025-08-23T10:30:00Z",
        "level": "error",
        "event": "auth_failed",
        "userId": "user_123",
        "message": "認証コードが見つかりません",
        "error": {
          "type": "no_code",
          "code": "NO_CODE_ERROR"
        }
      }
    ],
    "total": 150,
    "hasMore": true
  }
}
```

### 8. 認証メトリクス

#### `GET /api/auth/metrics`

認証の成功率やパフォーマンスメトリクスを取得します。

**クエリパラメータ**:
```
?timeframe=24h&granularity=1h
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "totalAttempts": 1000,
    "successfulAttempts": 950,
    "failedAttempts": 50,
    "successRate": 0.95,
    "averageResponseTime": 2500,
    "errorBreakdown": {
      "no_code": 30,
      "network_error": 15,
      "session_creation_failed": 5
    },
    "timeframe": {
      "start": "2025-08-22T10:00:00Z",
      "end": "2025-08-23T10:00:00Z"
    }
  }
}
```

### 9. 設定検証

#### `GET /api/auth/config/validate`

認証設定の妥当性を検証します。

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "checks": {
      "supabaseUrl": { "status": "valid", "value": "https://xxx.supabase.co" },
      "supabaseKey": { "status": "valid", "masked": "sb-xxx...xxx" },
      "googleClientId": { "status": "valid", "masked": "123...789" },
      "redirectUri": { "status": "valid", "value": "https://domain.com/auth/callback" },
      "environment": { "status": "valid", "value": "production" }
    },
    "warnings": [],
    "errors": []
  }
}
```

## エラーハンドリング

### 標準エラーレスポンス形式

```json
{
  "success": false,
  "error": {
    "type": "auth_error_type",
    "message": "ユーザー向けエラーメッセージ",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "details": {
      "field": "追加情報"
    }
  },
  "meta": {
    "timestamp": "2025-08-23T10:00:00Z",
    "requestId": "req_123456789",
    "version": "1.0.0"
  }
}
```

### HTTPステータスコード

| ステータス | 説明 | 使用例 |
|-----------|------|--------|
| 200 | 成功 | 認証状態確認成功 |
| 201 | 作成成功 | セッション作成成功 |
| 302 | リダイレクト | 認証完了後のリダイレクト |
| 400 | 不正なリクエスト | 無効なパラメータ |
| 401 | 認証エラー | 無効なトークン |
| 403 | 認可エラー | 権限不足 |
| 404 | 見つからない | 無効なエンドポイント |
| 429 | レート制限 | リクエスト制限超過 |
| 500 | サーバーエラー | 内部エラー |

### エラーコード一覧

| コード | タイプ | 説明 |
|--------|--------|------|
| `NO_CODE_ERROR` | `no_code` | 認証コードが見つからない |
| `INVALID_CODE` | `invalid_code` | 無効な認証コード |
| `CODE_EXPIRED` | `code_expired` | 認証コード期限切れ |
| `OAUTH_ERROR` | `oauth_error` | OAuthプロバイダエラー |
| `SESSION_FAILED` | `session_creation_failed` | セッション作成失敗 |
| `NETWORK_ERROR` | `network_error` | ネットワークエラー |
| `CSRF_VIOLATION` | `csrf_violation` | CSRF攻撃検知 |
| `INVALID_REDIRECT` | `invalid_redirect` | 不正なリダイレクト |

## セキュリティ考慮事項

### 1. CORS設定
```javascript
// next.config.mjs
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/auth/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.ALLOWED_ORIGINS || 'https://domain.com'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          }
        ]
      }
    ];
  }
};
```

### 2. レート制限
```typescript
// レート制限設定例
const rateLimits = {
  '/auth/callback': { requests: 10, window: '1m' },
  '/api/auth/start': { requests: 5, window: '1m' },
  '/api/auth/refresh': { requests: 30, window: '1h' }
};
```

### 3. セキュリティヘッダー
```typescript
// セキュリティヘッダー設定
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'"
};
```

## 実装優先度

### P0（緊急）
1. `GET /auth/callback` - 認証コールバック修復
2. エラーハンドリング強化

### P1（高優先度）
3. `GET /api/auth/status` - 認証状態確認
4. `GET /api/auth/config/validate` - 設定検証

### P2（中優先度）
5. `GET /api/auth/logs` - ログ機能
6. `GET /api/auth/metrics` - メトリクス機能

---

**最終更新**: 2025-08-23
**レビュー**: セキュリティチーム承認済み
**実装担当**: バックエンドチーム