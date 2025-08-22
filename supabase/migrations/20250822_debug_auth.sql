-- 認証状態デバッグ用クエリ

-- 1. 基本的なauth状態確認
SELECT 
  auth.uid() as current_user_id,
  auth.jwt() as jwt_info;

-- 2. 現在のJWTの詳細確認  
SELECT 
  (auth.jwt() -> 'sub')::text as user_id_from_jwt,
  (auth.jwt() -> 'email')::text as email_from_jwt,
  (auth.jwt() -> 'role')::text as role_from_jwt;

-- 3. auth.usersテーブルから全ユーザー確認
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC;

-- 4. RLSが有効になっているテーブルの確認
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE rowsecurity = true;