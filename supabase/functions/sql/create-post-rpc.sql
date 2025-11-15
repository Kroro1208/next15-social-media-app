-- 投稿作成用のRPC関数

-- 既存の関数を削除
DROP FUNCTION IF EXISTS create_post_secure(text,text,text,integer,integer,timestamp with time zone,text,text);
DROP FUNCTION IF EXISTS create_post_secure(text,text,text,integer,integer[],timestamp with time zone,text,text);

-- 投稿作成関数
CREATE OR REPLACE FUNCTION create_post_secure(
    p_title text,
    p_content text,
    p_avatar_url text,
    p_community_id integer,
    p_tag_id integer,
    p_tag_ids integer[],
    p_vote_deadline timestamp with time zone,
    p_user_id text,
    p_image_url text
)
RETURNS SETOF posts
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_post_id integer;
    sanitized_tag_ids integer[];
    primary_tag integer;
BEGIN
    -- 認証チェック
    IF auth.uid()::text != p_user_id::text THEN
        RAISE EXCEPTION 'Unauthorized: You can only create posts as yourself';
    END IF;

    -- 入力値の検証
    IF LENGTH(TRIM(p_title)) = 0 THEN
        RAISE EXCEPTION 'Title cannot be empty';
    END IF;

    IF LENGTH(TRIM(p_content)) = 0 THEN
        RAISE EXCEPTION 'Content cannot be empty';
    END IF;

    -- タグの検証と整形（最大3件まで）
    IF p_tag_ids IS NOT NULL THEN
        SELECT ARRAY_AGG(tag_id ORDER BY first_position)
        INTO sanitized_tag_ids
        FROM (
            SELECT tag_id, MIN(ord) AS first_position
            FROM UNNEST(p_tag_ids) WITH ORDINALITY AS u(tag_id, ord)
            WHERE tag_id IS NOT NULL
            GROUP BY tag_id
        ) ordered_tags
        ORDER BY first_position;

        IF array_length(sanitized_tag_ids, 1) > 3 THEN
            RAISE EXCEPTION 'A maximum of 3 tags can be selected per post';
        END IF;

        IF array_length(sanitized_tag_ids, 1) = 0 THEN
            sanitized_tag_ids := NULL;
        END IF;
    END IF;

    IF sanitized_tag_ids IS NOT NULL AND array_length(sanitized_tag_ids, 1) > 0 THEN
        primary_tag := sanitized_tag_ids[1];
    ELSE
        primary_tag := p_tag_id;
    END IF;

    -- 投稿を作成
    INSERT INTO posts (
        title,
        content,
        avatar_url,
        community_id,
        tag_id,
        post_tags,
        vote_deadline,
        user_id,
        image_url,
        created_at
    ) VALUES (
        TRIM(p_title),
        TRIM(p_content),
        p_avatar_url,
        p_community_id,
        primary_tag,
        CASE
            WHEN sanitized_tag_ids IS NOT NULL THEN sanitized_tag_ids
            WHEN primary_tag IS NOT NULL THEN ARRAY[primary_tag]
            ELSE NULL
        END,
        p_vote_deadline,
        p_user_id::UUID,
        p_image_url,
        NOW()
    ) RETURNING posts.id INTO new_post_id;

    -- 作成された投稿を返す
    RETURN QUERY
    SELECT *
    FROM posts p
    WHERE p.id = new_post_id;
END;
$$;

-- 関数の権限設定
GRANT EXECUTE ON FUNCTION create_post_secure(text, text, text, integer, integer, integer[], timestamp with time zone, text, text) TO authenticated;
