-- 初期管理者設定
-- 使用方法：
-- 1. あなたのユーザーIDを確認してください（Supabaseダッシュボード > Authentication > Users）
-- 2. 下記のSQLを実行してください（'YOUR_USER_ID_HERE'を実際のUUIDに置き換える）

-- 例: INSERT INTO admin_roles (user_id, role, permissions) VALUES 
--     ('12345678-1234-1234-1234-123456789abc', 'admin', '{"all": true}');

-- ⚠️ 重要：実際のユーザーIDに置き換えてから実行してください！
-- INSERT INTO admin_roles (user_id, role, permissions) VALUES 
-- ('YOUR_USER_ID_HERE', 'admin', '{"all": true}');

-- 管理者権限確認クエリ（デバッグ用）
-- SELECT ar.*, au.email 
-- FROM admin_roles ar 
-- JOIN auth.users au ON ar.user_id = au.id 
-- WHERE ar.is_active = TRUE;