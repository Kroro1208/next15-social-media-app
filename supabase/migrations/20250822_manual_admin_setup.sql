-- 手動管理者設定用SQL
-- 使用方法：
-- 1. 上記のデバッグクエリでユーザーIDを確認
-- 2. 下記のINSERT文のYOUR_USER_ID_HEREを実際のUUIDに置き換えて実行

-- 例：あなたのユーザーIDが判明したら、以下を実行
-- INSERT INTO admin_roles (user_id, role, permissions) 
-- VALUES ('あなたのユーザーID', 'admin', '{"all": true}');

-- テンプレート（UUIDを置き換えてから実行）
INSERT INTO admin_roles (user_id, role, permissions) 
VALUES ('YOUR_USER_ID_HERE', 'admin', '{"all": true}');

-- 設定後の確認
SELECT 
  ar.*,
  au.email 
FROM admin_roles ar
JOIN auth.users au ON ar.user_id = au.id;