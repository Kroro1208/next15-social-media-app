# 管理システムセットアップガイド

## 📋 デプロイ手順

### 1. データベースマイグレーション実行

以下のファイルを順番にSupabaseで実行：

```bash
# 1. メインの管理システム
supabase/migrations/20250822_admin_management_system.sql

# 2. RPC関数群
supabase/migrations/20250822_admin_rpc_functions.sql

# 3. 管理者ヘルパー関数
supabase/migrations/20250822_admin_helpers.sql

# 4. 初期管理者設定（オプション）
supabase/migrations/20250822_set_initial_admin.sql
```

### 2. 初期管理者の設定

#### 方法A: 手動設定（推奨）

1. Supabaseダッシュボード → Authentication → Users でユーザーIDを確認
2. SQL Editorで実行：

```sql
INSERT INTO admin_roles (user_id, role, permissions)
VALUES ('あなたのユーザーID', 'admin', '{"all": true}');
```

#### 方法B: ヘルパー関数使用

ログイン後にSQL Editorで実行：

```sql
SELECT make_current_user_admin();
```

### 3. セキュリティ設定

#### Supabaseダッシュボードで設定：

1. **Authentication** → **Settings** → **Security**
2. **Leaked Password Protection** を有効化
3. **MFA** の設定（推奨）

### 4. 管理者権限の確認

```sql
SELECT get_admin_users_with_email();
```

## 🛡️ アクセス方法

### ナビゲーションから

- 管理者権限があるユーザーは、ナビゲーションバーに「🛡️ 管理者」リンクが表示される
- `/admin` で直接アクセス可能

### 管理機能

- **ダッシュボード**: 統計とナビゲーション
- **コンテンツ管理**: 投稿・コメント削除
- **報告管理**: ユーザー報告の処理
- **ユーザー管理**: 制裁・権限管理
- **システム設定**: NGワード・管理者設定

## 🔧 トラブルシューティング

### 管理者リンクが表示されない

1. 管理者権限が正しく設定されているか確認
2. ページを再読み込み
3. ブラウザキャッシュをクリア

### 権限エラーが発生する

1. RLSポリシーが正しく適用されているか確認
2. 管理者権限が有効（is_active = true）か確認

### データベースリンター警告

- 関数のsearch_path警告は修正済み
- マイグレーション実行後、リンターキャッシュの更新待ち

## 📁 ファイル構成

```
supabase/migrations/
├── 20250822_admin_management_system.sql    # メイン管理システム
├── 20250822_admin_rpc_functions.sql        # RPC関数群
├── 20250822_admin_helpers.sql              # ヘルパー関数
└── 20250822_set_initial_admin.sql          # 初期管理者設定
```

## 🚀 デプロイ完了後

✅ 管理者権限設定完了
✅ セキュリティ設定完了  
✅ 管理システム利用可能

これで完全なソーシャルメディア管理システムが稼働します！
