-- 管理者権限管理用ヘルパー関数

-- 現在のユーザーを管理者に昇格させる関数（開発用）
CREATE OR REPLACE FUNCTION make_current_user_admin()
RETURNS JSON AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- 現在のユーザーIDを取得
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'not_authenticated',
      'message', 'ユーザーが認証されていません'
    );
  END IF;
  
  -- 既に管理者権限があるかチェック
  IF EXISTS (SELECT 1 FROM admin_roles WHERE user_id = current_user_id AND is_active = TRUE) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'already_admin',
      'message', 'このユーザーは既に管理者権限を持っています',
      'user_id', current_user_id
    );
  END IF;
  
  -- 管理者権限を付与
  INSERT INTO admin_roles (user_id, role, permissions, assigned_by) 
  VALUES (current_user_id, 'admin', '{"all": true}', current_user_id);
  
  RETURN json_build_object(
    'success', true,
    'message', '管理者権限を付与しました',
    'user_id', current_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 管理者一覧確認関数（メール付き）
CREATE OR REPLACE FUNCTION get_admin_users_with_email()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  role VARCHAR(50),
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ar.user_id,
    au.email,
    ar.role,
    ar.is_active,
    ar.created_at
  FROM admin_roles ar
  JOIN auth.users au ON ar.user_id = au.id
  ORDER BY ar.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;