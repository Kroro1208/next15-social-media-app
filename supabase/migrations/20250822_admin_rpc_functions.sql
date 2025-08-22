-- 管理機能用RPC関数集

-- コンテンツ報告一覧取得関数
CREATE OR REPLACE FUNCTION get_content_reports()
RETURNS TABLE (
  id INTEGER,
  reporter_user_id UUID,
  reported_content_type VARCHAR(50),
  reported_content_id INTEGER,
  report_reason VARCHAR(100),
  description TEXT,
  status VARCHAR(50),
  handled_by UUID,
  handled_at TIMESTAMP WITH TIME ZONE,
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id,
    cr.reporter_user_id,
    cr.reported_content_type,
    cr.reported_content_id,
    cr.report_reason,
    cr.description,
    cr.status,
    cr.handled_by,
    cr.handled_at,
    cr.resolution,
    cr.created_at,
    cr.updated_at
  FROM content_reports cr
  ORDER BY cr.created_at DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ユーザー制裁一覧取得関数
CREATE OR REPLACE FUNCTION get_user_sanctions()
RETURNS TABLE (
  id INTEGER,
  user_id UUID,
  sanction_type VARCHAR(50),
  reason TEXT,
  duration_hours INTEGER,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN,
  applied_by UUID,
  lifted_by UUID,
  lifted_at TIMESTAMP WITH TIME ZONE,
  lift_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id,
    us.user_id,
    us.sanction_type,
    us.reason,
    us.duration_hours,
    us.expires_at,
    us.is_active,
    us.applied_by,
    us.lifted_by,
    us.lifted_at,
    us.lift_reason,
    us.created_at
  FROM user_sanctions us
  ORDER BY us.created_at DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 管理者権限一覧取得関数
CREATE OR REPLACE FUNCTION get_admin_roles()
RETURNS TABLE (
  id INTEGER,
  user_id UUID,
  role VARCHAR(50),
  permissions JSONB,
  assigned_by UUID,
  assigned_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ar.id,
    ar.user_id,
    ar.role,
    ar.permissions,
    ar.assigned_by,
    ar.assigned_at,
    ar.is_active,
    ar.created_at
  FROM admin_roles ar
  ORDER BY ar.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- NGワード一覧取得関数
CREATE OR REPLACE FUNCTION get_blocked_words()
RETURNS TABLE (
  id INTEGER,
  word TEXT,
  category VARCHAR(50),
  severity INTEGER,
  is_regex BOOLEAN,
  added_by UUID,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bw.id,
    bw.word,
    bw.category,
    bw.severity,
    bw.is_regex,
    bw.added_by,
    bw.created_at
  FROM blocked_words bw
  ORDER BY bw.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 投稿一覧取得関数（管理者用）
CREATE OR REPLACE FUNCTION get_admin_posts(
  search_term TEXT DEFAULT '',
  limit_param INTEGER DEFAULT 50
)
RETURNS TABLE (
  id INTEGER,
  title TEXT,
  content TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  vote_count INTEGER,
  comment_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.content,
    p.user_id,
    p.created_at,
    p.updated_at,
    p.image_url,
    COALESCE((SELECT COUNT(*) FROM votes v WHERE v.post_id = p.id), 0)::INTEGER as vote_count,
    COALESCE((SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id), 0)::INTEGER as comment_count
  FROM posts p
  WHERE (search_term = '' OR p.title ILIKE '%' || search_term || '%' OR p.content ILIKE '%' || search_term || '%')
  ORDER BY p.created_at DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- コメント一覧取得関数（管理者用）
CREATE OR REPLACE FUNCTION get_admin_comments(
  search_term TEXT DEFAULT '',
  limit_param INTEGER DEFAULT 50
)
RETURNS TABLE (
  id INTEGER,
  content TEXT,
  user_id UUID,
  post_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  post_title TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.content,
    c.user_id,
    c.post_id,
    c.created_at,
    p.title as post_title
  FROM comments c
  LEFT JOIN posts p ON c.post_id = p.id
  WHERE (search_term = '' OR c.content ILIKE '%' || search_term || '%')
  ORDER BY c.created_at DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- NGワード追加関数
CREATE OR REPLACE FUNCTION add_blocked_word(
  word_param TEXT,
  admin_user_id UUID,
  category_param VARCHAR(50) DEFAULT 'general',
  severity_param INTEGER DEFAULT 1,
  is_regex_param BOOLEAN DEFAULT FALSE
)
RETURNS JSON AS $$
BEGIN
  -- 管理者権限チェック
  IF NOT is_admin(admin_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', '管理者権限が必要です'
    );
  END IF;

  -- NGワード追加
  INSERT INTO blocked_words (
    word, category, severity, is_regex, added_by
  ) VALUES (
    word_param, category_param, severity_param, is_regex_param, admin_user_id
  );

  -- 管理者ログに記録
  INSERT INTO admin_logs (
    admin_user_id, action, target_type, target_id, details
  ) VALUES (
    admin_user_id,
    'add_blocked_word',
    'blocked_word',
    word_param,
    json_build_object(
      'category', category_param,
      'severity', severity_param,
      'is_regex', is_regex_param
    )
  );

  RETURN json_build_object(
    'success', true,
    'message', 'NGワードを追加しました'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- NGワード削除関数
CREATE OR REPLACE FUNCTION delete_blocked_word(
  word_id_param INTEGER,
  admin_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  deleted_word TEXT;
BEGIN
  -- 管理者権限チェック
  IF NOT is_admin(admin_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', '管理者権限が必要です'
    );
  END IF;

  -- 削除対象の単語を取得
  SELECT word INTO deleted_word FROM blocked_words WHERE id = word_id_param;
  
  IF deleted_word IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'not_found',
      'message', 'NGワードが見つかりません'
    );
  END IF;

  -- NGワード削除
  DELETE FROM blocked_words WHERE id = word_id_param;

  -- 管理者ログに記録
  INSERT INTO admin_logs (
    admin_user_id, action, target_type, target_id, details
  ) VALUES (
    admin_user_id,
    'delete_blocked_word',
    'blocked_word',
    word_id_param::TEXT,
    json_build_object('word', deleted_word)
  );

  RETURN json_build_object(
    'success', true,
    'message', 'NGワードを削除しました'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 管理者権限追加関数
CREATE OR REPLACE FUNCTION add_admin_role(
  target_user_id UUID,
  role_param VARCHAR(50),
  admin_user_id UUID
)
RETURNS JSON AS $$
BEGIN
  -- 管理者権限チェック
  IF NOT is_admin(admin_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', '管理者権限が必要です'
    );
  END IF;

  -- 既存の管理者権限をチェック
  IF EXISTS (SELECT 1 FROM admin_roles WHERE user_id = target_user_id AND is_active = TRUE) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'already_exists',
      'message', 'このユーザーは既に管理者権限を持っています'
    );
  END IF;

  -- 管理者権限を追加
  INSERT INTO admin_roles (
    user_id, role, permissions, assigned_by
  ) VALUES (
    target_user_id, role_param, '{}', admin_user_id
  );

  -- 管理者ログに記録
  INSERT INTO admin_logs (
    admin_user_id, action, target_type, target_id, details
  ) VALUES (
    admin_user_id,
    'add_admin_role',
    'user',
    target_user_id::TEXT,
    json_build_object('role', role_param)
  );

  RETURN json_build_object(
    'success', true,
    'message', '管理者権限を追加しました'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 管理者権限削除関数
CREATE OR REPLACE FUNCTION delete_admin_role(
  role_id_param INTEGER,
  admin_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- 管理者権限チェック
  IF NOT is_admin(admin_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', '管理者権限が必要です'
    );
  END IF;

  -- 削除対象のユーザーIDを取得
  SELECT user_id INTO target_user_id FROM admin_roles WHERE id = role_id_param;
  
  IF target_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'not_found',
      'message', '管理者権限が見つかりません'
    );
  END IF;

  -- 自分自身の権限は削除できない
  IF target_user_id = admin_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'self_deletion',
      'message', '自分自身の管理者権限は削除できません'
    );
  END IF;

  -- 管理者権限を削除
  DELETE FROM admin_roles WHERE id = role_id_param;

  -- 管理者ログに記録
  INSERT INTO admin_logs (
    admin_user_id, action, target_type, target_id, details
  ) VALUES (
    admin_user_id,
    'delete_admin_role',
    'user',
    target_user_id::TEXT,
    json_build_object('role_id', role_id_param)
  );

  RETURN json_build_object(
    'success', true,
    'message', '管理者権限を削除しました'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- コンテンツ報告提出関数
CREATE OR REPLACE FUNCTION submit_content_report(
  reporter_user_id UUID,
  content_type VARCHAR(50),
  content_id_param INTEGER,
  reason_param VARCHAR(100),
  description_param TEXT DEFAULT ''
)
RETURNS JSON AS $$
BEGIN
  -- ユーザー認証チェック
  IF reporter_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', '認証が必要です'
    );
  END IF;

  -- 報告を追加
  INSERT INTO content_reports (
    reporter_user_id,
    reported_content_type,
    reported_content_id,
    report_reason,
    description
  ) VALUES (
    reporter_user_id,
    content_type,
    content_id_param,
    reason_param,
    description_param
  );

  RETURN json_build_object(
    'success', true,
    'message', '報告を受け付けました'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 報告処理関数
CREATE OR REPLACE FUNCTION handle_content_report(
  report_id_param INTEGER,
  status_param VARCHAR(50),
  admin_user_id UUID,
  resolution_param TEXT DEFAULT ''
)
RETURNS JSON AS $$
BEGIN
  -- 管理者権限チェック
  IF NOT is_admin(admin_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', '管理者権限が必要です'
    );
  END IF;

  -- 報告状況を更新
  UPDATE content_reports 
  SET 
    status = status_param,
    resolution = resolution_param,
    handled_by = admin_user_id,
    handled_at = NOW(),
    updated_at = NOW()
  WHERE id = report_id_param;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'not_found',
      'message', '報告が見つかりません'
    );
  END IF;

  -- 管理者ログに記録
  INSERT INTO admin_logs (
    admin_user_id, action, target_type, target_id, details
  ) VALUES (
    admin_user_id,
    'handle_report',
    'report',
    report_id_param::TEXT,
    json_build_object(
      'status', status_param,
      'resolution', resolution_param
    )
  );

  RETURN json_build_object(
    'success', true,
    'message', '報告を処理しました'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ユーザー統計取得関数（管理者用）
-- 注意: この関数は auth.users テーブルにアクセスできないため、
-- 実際にはフロントエンドで auth.admin.listUsers() と組み合わせて使用する必要があります
CREATE OR REPLACE FUNCTION get_user_activity_stats(
  user_ids UUID[]
)
RETURNS TABLE (
  user_id UUID,
  posts_count BIGINT,
  comments_count BIGINT,
  votes_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.user_id,
    COALESCE(p.posts_count, 0) as posts_count,
    COALESCE(c.comments_count, 0) as comments_count,
    COALESCE(v.votes_count, 0) as votes_count
  FROM (SELECT unnest(user_ids) as user_id) u
  LEFT JOIN (
    SELECT posts.user_id, COUNT(*) as posts_count 
    FROM posts 
    WHERE posts.user_id = ANY(user_ids)
    GROUP BY posts.user_id
  ) p ON u.user_id = p.user_id
  LEFT JOIN (
    SELECT comments.user_id, COUNT(*) as comments_count 
    FROM comments 
    WHERE comments.user_id = ANY(user_ids)
    GROUP BY comments.user_id
  ) c ON u.user_id = c.user_id
  LEFT JOIN (
    SELECT votes.user_id, COUNT(*) as votes_count 
    FROM votes 
    WHERE votes.user_id = ANY(user_ids)
    GROUP BY votes.user_id
  ) v ON u.user_id = v.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- アクティブな制裁情報取得関数
CREATE OR REPLACE FUNCTION get_active_sanctions_for_users(
  user_ids UUID[]
)
RETURNS TABLE (
  user_id UUID,
  sanctions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.user_id,
    COALESCE(
      json_agg(
        json_build_object(
          'id', us.id,
          'sanction_type', us.sanction_type,
          'reason', us.reason,
          'expires_at', us.expires_at,
          'created_at', us.created_at
        )
      ) FILTER (WHERE us.id IS NOT NULL),
      '[]'::json
    )::jsonb as sanctions
  FROM (SELECT unnest(user_ids) as user_id) u
  LEFT JOIN user_sanctions us ON u.user_id = us.user_id 
    AND us.is_active = TRUE 
    AND (us.expires_at IS NULL OR us.expires_at > NOW())
  GROUP BY u.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;