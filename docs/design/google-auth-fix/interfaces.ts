/**
 * Google認証修復 TypeScript型定義
 *
 * Google OAuth認証フローで使用される型定義とインターフェース
 * 認証エラーハンドリング、セッション管理、ログ収集に関する型を含む
 */

// =============================================================================
// 基本的な認証関連型定義
// =============================================================================

/**
 * 認証状態の種類
 */
export type AuthState =
  | 'unauthenticated'     // 未認証
  | 'authenticating'      // 認証処理中
  | 'authenticated'       // 認証済み
  | 'session_expired'     // セッション期限切れ
  | 'auth_error'          // 認証エラー
  | 'auth_timeout';       // 認証タイムアウト

/**
 * OAuth認証プロバイダー
 */
export type OAuthProvider = 'google' | 'github' | 'discord';

/**
 * 認証エラーの種類
 */
export type AuthErrorType =
  | 'no_code'                    // 認証コード未受信
  | 'invalid_code'               // 無効な認証コード
  | 'code_expired'               // 認証コード期限切れ
  | 'oauth_error'                // OAuth プロバイダエラー
  | 'session_creation_failed'    // セッション作成失敗
  | 'network_error'              // ネットワークエラー
  | 'server_error'               // サーバーエラー
  | 'csrf_violation'             // CSRF攻撃検知
  | 'invalid_redirect'           // 不正なリダイレクト
  | 'unknown_error';             // 不明なエラー

// =============================================================================
// OAuth認証フロー関連
// =============================================================================

/**
 * OAuth認証コールバックのクエリパラメータ
 */
export interface OAuthCallbackParams {
  code?: string;                 // 認証コード
  state?: string;                // CSRF対策パラメータ
  scope?: string;                // 認証スコープ
  error?: string;                // OAuthエラーコード
  error_description?: string;     // エラー詳細説明
  error_uri?: string;            // エラー詳細URL
}

/**
 * OAuth認証開始時のオプション
 */
export interface OAuthSignInOptions {
  provider: OAuthProvider;
  redirectTo?: string;           // 認証後のリダイレクト先
  scopes?: string;               // 要求するスコープ
  queryParams?: Record<string, string>; // 追加クエリパラメータ
  skipBrowserRedirect?: boolean; // ブラウザリダイレクトのスキップ
}

/**
 * PKCE (Proof Key for Code Exchange) パラメータ
 */
export interface PKCEParams {
  codeVerifier: string;          // コード検証子
  codeChallenge: string;         // コードチャレンジ
  codeChallengeMethod: 'S256' | 'plain'; // ハッシュ方法
}

/**
 * OAuth認証レスポンス
 */
export interface OAuthResponse {
  success: boolean;
  data?: {
    user: AuthUser;
    session: AuthSession;
  };
  error?: AuthError;
}

// =============================================================================
// ユーザー・セッション関連
// =============================================================================

/**
 * 認証ユーザー情報
 */
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  provider: OAuthProvider;
  provider_id: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string;
  user_metadata: Record<string, any>;
  app_metadata: Record<string, any>;
}

/**
 * 認証セッション
 */
export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: 'bearer';
  user: AuthUser;
}

/**
 * セッションの状態
 */
export interface SessionState {
  session: AuthSession | null;
  user: AuthUser | null;
  isLoading: boolean;
  error: AuthError | null;
}

// =============================================================================
// エラーハンドリング関連
// =============================================================================

/**
 * 認証エラー詳細
 */
export interface AuthError {
  type: AuthErrorType;
  message: string;
  description?: string;
  code?: string;
  statusCode?: number;
  timestamp: string;
  debugInfo?: AuthErrorDebugInfo;
  retryable: boolean;
  retryAfter?: number; // 秒
}

/**
 * エラー時のデバッグ情報
 */
export interface AuthErrorDebugInfo {
  url: string;
  userAgent?: string;
  referer?: string;
  queryParams: Record<string, string>;
  headers: Record<string, string>;
  environment: 'development' | 'production';
  timestamp: string;
  sessionId?: string;
  correlationId: string;
}

/**
 * エラーハンドリングの結果
 */
export interface ErrorHandlingResult {
  shouldRedirect: boolean;
  redirectUrl?: string;
  shouldRetry: boolean;
  retryDelay?: number;
  shouldLog: boolean;
  logLevel: 'info' | 'warn' | 'error' | 'fatal';
  userMessage: string;
  technicalMessage?: string;
}

// =============================================================================
// ログ・監視関連
// =============================================================================

/**
 * 認証ログエントリ
 */
export interface AuthLogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  event: AuthEventType;
  userId?: string;
  sessionId?: string;
  correlationId: string;
  message: string;
  data?: Record<string, any>;
  error?: AuthError;
  duration?: number; // ミリ秒
  success: boolean;
}

/**
 * 認証イベントの種類
 */
export type AuthEventType =
  | 'auth_started'           // 認証開始
  | 'auth_provider_redirect' // プロバイダへリダイレクト
  | 'auth_callback_received' // コールバック受信
  | 'auth_code_validated'    // 認証コード検証
  | 'auth_session_created'   // セッション作成
  | 'auth_session_refreshed' // セッション更新
  | 'auth_completed'         // 認証完了
  | 'auth_failed'            // 認証失敗
  | 'auth_timeout'           // 認証タイムアウト
  | 'logout_started'         // ログアウト開始
  | 'logout_completed';      // ログアウト完了

/**
 * 認証メトリクス
 */
export interface AuthMetrics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  successRate: number; // 0-1
  averageResponseTime: number; // ミリ秒
  errorBreakdown: Record<AuthErrorType, number>;
  timeframe: {
    start: string;
    end: string;
  };
}

// =============================================================================
// API レスポンス関連
// =============================================================================

/**
 * 標準APIレスポンス
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    type: string;
    message: string;
    code?: string;
    details?: Record<string, any>;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

/**
 * 認証状態確認APIのレスポンス
 */
export interface AuthStatusResponse extends ApiResponse<{
  authenticated: boolean;
  user?: AuthUser;
  session?: {
    expiresAt: string;
    isExpired: boolean;
  };
}> {}

/**
 * 認証開始APIのレスポンス
 */
export interface AuthStartResponse extends ApiResponse<{
  authUrl: string;
  state: string;
  codeChallenge?: string;
}> {}

// =============================================================================
// 設定・環境関連
// =============================================================================

/**
 * OAuth設定
 */
export interface OAuthConfig {
  google: {
    clientId: string;
    redirectUri: string;
    scope: string[];
  };
  supabase: {
    url: string;
    anonKey: string;
  };
  app: {
    siteUrl: string;
    environment: 'development' | 'production';
  };
}

/**
 * 認証設定
 */
export interface AuthConfig {
  oauth: OAuthConfig;
  session: {
    maxAge: number; // 秒
    renewBefore: number; // 秒（期限切れ前の更新）
  };
  security: {
    enableCSRF: boolean;
    enablePKCE: boolean;
    allowedOrigins: string[];
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableDebugInfo: boolean;
  };
}

// =============================================================================
// React Hook関連
// =============================================================================

/**
 * useAuth フックの戻り値
 */
export interface UseAuthReturn {
  // 状態
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;

  // アクション
  signInWithOAuth: (provider: OAuthProvider, options?: Partial<OAuthSignInOptions>) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;

  // ユーティリティ
  getAccessToken: () => string | null;
  isSessionExpired: () => boolean;
  getTimeUntilExpiry: () => number; // 秒
}

/**
 * useAuthError フックの戻り値
 */
export interface UseAuthErrorReturn {
  error: AuthError | null;
  isRetryable: boolean;
  canRetry: boolean;
  retryCount: number;
  retry: () => Promise<void>;
  clear: () => void;
  getErrorMessage: (locale?: string) => string;
}

// =============================================================================
// 環境変数の型定義
// =============================================================================

/**
 * 必要な環境変数
 */
export interface RequiredEnvironmentVariables {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  NEXT_PUBLIC_SITE_URL: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}

// =============================================================================
// Supabase Auth関連
// =============================================================================

/**
 * Supabase Auth のイベント
 */
export type SupabaseAuthEvent =
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY';

/**
 * Supabase Auth セッション
 */
export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: SupabaseUser;
}

/**
 * Supabase User
 */
export interface SupabaseUser {
  id: string;
  aud: string;
  role?: string;
  email?: string;
  email_confirmed_at?: string;
  phone?: string;
  confirmation_sent_at?: string;
  confirmed_at?: string;
  last_sign_in_at?: string;
  app_metadata: Record<string, any>;
  user_metadata: Record<string, any>;
  identities?: Array<{
    id: string;
    user_id: string;
    identity_data: Record<string, any>;
    provider: string;
    created_at: string;
    updated_at: string;
  }>;
  created_at: string;
  updated_at?: string;
}

// =============================================================================
// テスト関連
// =============================================================================

/**
 * 認証テスト用のモックデータ
 */
export interface AuthTestMocks {
  validUser: AuthUser;
  validSession: AuthSession;
  expiredSession: AuthSession;
  invalidCode: string;
  validCode: string;
  oauthError: AuthError;
  networkError: AuthError;
}

/**
 * 認証フローテストシナリオ
 */
export interface AuthTestScenario {
  name: string;
  description: string;
  setup: () => Promise<void>;
  execute: () => Promise<void>;
  verify: () => Promise<void>;
  cleanup: () => Promise<void>;
  expectedResult: 'success' | 'error';
  expectedError?: AuthErrorType;
}

// =============================================================================
// エクスポート用の型定義群
// =============================================================================

export type {
  // 認証状態関連
  AuthState,
  OAuthProvider,
  AuthErrorType,

  // OAuth認証関連
  OAuthCallbackParams,
  OAuthSignInOptions,
  PKCEParams,
  OAuthResponse,

  // ユーザー・セッション関連
  AuthUser,
  AuthSession,
  SessionState,

  // エラーハンドリング関連
  AuthError,
  AuthErrorDebugInfo,
  ErrorHandlingResult,

  // ログ・監視関連
  AuthLogEntry,
  AuthEventType,
  AuthMetrics,

  // API関連
  ApiResponse,
  AuthStatusResponse,
  AuthStartResponse,

  // 設定関連
  OAuthConfig,
  AuthConfig,

  // Hook関連
  UseAuthReturn,
  UseAuthErrorReturn,

  // 環境変数
  RequiredEnvironmentVariables,

  // Supabase関連
  SupabaseAuthEvent,
  SupabaseSession,
  SupabaseUser,

  // テスト関連
  AuthTestMocks,
  AuthTestScenario
};

// デフォルトエクスポート
export default {
  AuthState,
  OAuthProvider,
  AuthErrorType,
  AuthEventType
} as const;