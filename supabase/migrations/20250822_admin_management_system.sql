-- 管理機能データベース設計
-- 管理者権限テーブル
CREATE TABLE IF NOT EXISTS admin_roles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'moderator',
  permissions JSONB DEFAULT '{}',
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id),
  CHECK (role IN ('admin', 'moderator', 'content_manager'))
);

-- 管理者操作ログテーブル
CREATE TABLE IF NOT EXISTS admin_logs (
  id SERIAL PRIMARY KEY,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 不適切コンテンツ報告テーブル
CREATE TABLE IF NOT EXISTS content_reports (
  id SERIAL PRIMARY KEY,
  reporter_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_content_type VARCHAR(50) NOT NULL,
  reported_content_id INTEGER NOT NULL,
  report_reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  handled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  handled_at TIMESTAMP WITH TIME ZONE,
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CHECK (reported_content_type IN ('post', 'comment')),
  CHECK (report_reason IN ('spam', 'harassment', 'hate_speech', 'inappropriate_content', 'misinformation', 'other')),
  CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed'))
);

-- ユーザー制裁テーブル
CREATE TABLE IF NOT EXISTS user_sanctions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sanction_type VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL,
  duration_hours INTEGER,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  applied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lifted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lifted_at TIMESTAMP WITH TIME ZONE,
  lift_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CHECK (sanction_type IN ('warning', 'temporary_ban', 'permanent_ban', 'content_restriction'))
);

-- NGワードテーブル
CREATE TABLE IF NOT EXISTS blocked_words (
  id SERIAL PRIMARY KEY,
  word TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  severity INTEGER DEFAULT 1,
  is_regex BOOLEAN DEFAULT FALSE,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(word),
  CHECK (severity BETWEEN 1 AND 5),
  CHECK (category IN ('general', 'hate_speech', 'spam', 'harassment', 'inappropriate'))
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user_id ON admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target_type ON admin_logs(target_type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_content_reports_reporter_user_id ON content_reports(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_content ON content_reports(reported_content_type, reported_content_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON content_reports(created_at);

CREATE INDEX IF NOT EXISTS idx_user_sanctions_user_id ON user_sanctions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sanctions_type ON user_sanctions(sanction_type);
CREATE INDEX IF NOT EXISTS idx_user_sanctions_active ON user_sanctions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sanctions_expires ON user_sanctions(expires_at);

-- 管理者用統計ビュー
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
  'users' AS metric_type,
  COUNT(*) AS total_count,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) AS week_count,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '1 day' THEN 1 END) AS today_count
FROM auth.users
UNION ALL
SELECT 
  'posts' AS metric_type,
  COUNT(*) AS total_count,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) AS week_count,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '1 day' THEN 1 END) AS today_count
FROM posts
UNION ALL
SELECT 
  'comments' AS metric_type,
  COUNT(*) AS total_count,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) AS week_count,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '1 day' THEN 1 END) AS today_count
FROM comments
UNION ALL
SELECT 
  'votes' AS metric_type,
  COUNT(*) AS total_count,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) AS week_count,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '1 day' THEN 1 END) AS today_count
FROM votes
UNION ALL
SELECT 
  'reports' AS metric_type,
  COUNT(*) AS total_count,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) AS week_count,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '1 day' THEN 1 END) AS today_count
FROM content_reports;

-- 管理者権限チェック関数
CREATE OR REPLACE FUNCTION is_admin(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = user_id_param 
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 制裁確認関数
CREATE OR REPLACE FUNCTION is_user_sanctioned(user_id_param UUID, sanction_types TEXT[] DEFAULT ARRAY['temporary_ban', 'permanent_ban'])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_sanctions 
    WHERE user_id = user_id_param 
    AND sanction_type = ANY(sanction_types)
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 投稿・コメント削除関数（管理者用）
CREATE OR REPLACE FUNCTION admin_delete_content(
  content_type TEXT,
  content_id_param INTEGER,
  admin_user_id UUID,
  reason TEXT DEFAULT '管理者による削除'
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  content_author UUID;
BEGIN
  -- 管理者権限チェック
  IF NOT is_admin(admin_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', '管理者権限が必要です'
    );
  END IF;
  
  -- コンテンツ削除処理
  IF content_type = 'post' THEN
    -- 投稿の作成者を取得
    SELECT user_id INTO content_author FROM posts WHERE id = content_id_param;
    
    -- 投稿を削除
    DELETE FROM posts WHERE id = content_id_param;
    
  ELSIF content_type = 'comment' THEN
    -- コメントの作成者を取得
    SELECT user_id INTO content_author FROM comments WHERE id = content_id_param;
    
    -- コメントを削除
    DELETE FROM comments WHERE id = content_id_param;
    
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'invalid_content_type',
      'message', '無効なコンテンツタイプです'
    );
  END IF;
  
  -- 管理者ログに記録
  INSERT INTO admin_logs (
    admin_user_id, action, target_type, target_id, details
  ) VALUES (
    admin_user_id,
    'delete_content',
    content_type,
    content_id_param::TEXT,
    json_build_object(
      'reason', reason,
      'content_author', content_author
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'コンテンツを削除しました'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ユーザー制裁適用関数
CREATE OR REPLACE FUNCTION apply_user_sanction(
  target_user_id UUID,
  sanction_type_param VARCHAR(50),
  reason_param TEXT,
  admin_user_id UUID,
  duration_hours_param INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  expires_at_param TIMESTAMP WITH TIME ZONE;
BEGIN
  -- 管理者権限チェック
  IF NOT is_admin(admin_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', '管理者権限が必要です'
    );
  END IF;
  
  -- 期限切れ日時計算
  IF duration_hours_param IS NOT NULL THEN
    expires_at_param := NOW() + INTERVAL '1 hour' * duration_hours_param;
  END IF;
  
  -- 既存の制裁を無効化
  UPDATE user_sanctions 
  SET is_active = FALSE, updated_at = NOW()
  WHERE user_id = target_user_id AND is_active = TRUE;
  
  -- 新しい制裁を適用
  INSERT INTO user_sanctions (
    user_id, sanction_type, reason, duration_hours, expires_at, applied_by
  ) VALUES (
    target_user_id, sanction_type_param, reason_param, duration_hours_param, expires_at_param, admin_user_id
  );
  
  -- 管理者ログに記録
  INSERT INTO admin_logs (
    admin_user_id, action, target_type, target_id, details
  ) VALUES (
    admin_user_id,
    'apply_sanction',
    'user',
    target_user_id::TEXT,
    json_build_object(
      'sanction_type', sanction_type_param,
      'reason', reason_param,
      'duration_hours', duration_hours_param
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'message', '制裁を適用しました',
    'expires_at', expires_at_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RLSポリシー設定
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sanctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_words ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Admin only access for admin_roles" ON admin_roles;
DROP POLICY IF EXISTS "Admin only access for admin_logs" ON admin_logs;
DROP POLICY IF EXISTS "Admin only access for content_reports" ON content_reports;
DROP POLICY IF EXISTS "Admin only access for user_sanctions" ON user_sanctions;
DROP POLICY IF EXISTS "Admin only insert for user_sanctions" ON user_sanctions;
DROP POLICY IF EXISTS "Admin only update for user_sanctions" ON user_sanctions;
DROP POLICY IF EXISTS "Admin only delete for user_sanctions" ON user_sanctions;
DROP POLICY IF EXISTS "Admin only access for blocked_words" ON blocked_words;

-- 管理者のみアクセス可能
CREATE POLICY "Admin only access for admin_roles" ON admin_roles FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admin only access for admin_logs" ON admin_logs FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admin only access for content_reports" ON content_reports FOR ALL USING (is_admin(auth.uid()) OR reporter_user_id = auth.uid());
CREATE POLICY "Admin only access for user_sanctions" ON user_sanctions FOR SELECT USING (is_admin(auth.uid()) OR user_id = auth.uid());
CREATE POLICY "Admin only insert for user_sanctions" ON user_sanctions FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admin only update for user_sanctions" ON user_sanctions FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admin only delete for user_sanctions" ON user_sanctions FOR DELETE USING (is_admin(auth.uid()));
CREATE POLICY "Admin only access for blocked_words" ON blocked_words FOR ALL USING (is_admin(auth.uid()));

-- 初期管理者設定（プレースホルダー - 実際のユーザーIDに置き換える）
-- INSERT INTO admin_roles (user_id, role, permissions) VALUES 
-- ('ユーザーIDをここに入力', 'admin', '{"all": true}');

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user_id ON admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON content_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sanctions_user_id ON user_sanctions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sanctions_active ON user_sanctions(is_active, expires_at);