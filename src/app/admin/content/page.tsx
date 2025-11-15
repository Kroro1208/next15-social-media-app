"use client";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Eye,
  MessageSquare,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../../supabase-client";
import { Button } from "../../components/ui/button";
import { useAdmin } from "../../hooks/useAdmin";
import { useAuth } from "../../hooks/useAuth";

interface Post {
  id: number;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  image_url?: string;
  vote_count?: number;
  comment_count?: number;
}

interface Comment {
  id: number;
  content: string;
  user_id: string;
  post_id: number;
  created_at: string;
  post_title?: string;
}

const AdminContentPage = () => {
  const { user, loading: isAuthLoading } = useAuth();
  const { isAdmin, isLoadingAdmin, deleteContent, isDeleting } = useAdmin();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"posts" | "comments">("posts");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [deleteReason, setDeleteReason] = useState("");

  useEffect(() => {
    if (!isAuthLoading && !isLoadingAdmin) {
      if (!user || !isAdmin) {
        router.push("/");
        return;
      }
    }
  }, [user, isAdmin, isAuthLoading, isLoadingAdmin, router]);

  // 投稿一覧取得
  const { data: posts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ["admin-posts", searchTerm],
    queryFn: async (): Promise<Post[]> => {
      const { data, error } = await supabase.rpc("get_admin_posts", {
        search_term: searchTerm,
        limit_param: 50,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!isAdmin && activeTab === "posts",
  });

  // コメント一覧取得
  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: ["admin-comments", searchTerm],
    queryFn: async (): Promise<Comment[]> => {
      const { data, error } = await supabase.rpc("get_admin_comments", {
        search_term: searchTerm,
        limit_param: 50,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!isAdmin && activeTab === "comments",
  });

  const handleDelete = async (
    contentType: "post" | "comment",
    contentId: number,
  ) => {
    if (!deleteReason.trim()) {
      alert("削除理由を入力してください");
      return;
    }

    try {
      deleteContent({
        contentType,
        contentId,
        reason: deleteReason,
      });
      setDeleteReason("");
      setSelectedItems([]);
    } catch (error) {
      console.error("削除エラー:", error);
      alert("削除に失敗しました");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    if (!deleteReason.trim()) {
      alert("削除理由を入力してください");
      return;
    }

    if (!confirm(`${selectedItems.length}件のコンテンツを削除しますか？`))
      return;

    try {
      for (const id of selectedItems) {
        await new Promise((resolve) => setTimeout(resolve, 100)); // 連続実行を避ける
        deleteContent({
          contentType: activeTab === "posts" ? "post" : "comment",
          contentId: id,
          reason: deleteReason,
        });
      }
      setSelectedItems([]);
      setDeleteReason("");
    } catch (error) {
      console.error("一括削除エラー:", error);
      alert("一括削除に失敗しました");
    }
  };

  if (isAuthLoading || isLoadingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                管理者ダッシュボードに戻る
              </Button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">コンテンツ管理</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* タブ・検索・フィルタ */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            {/* タブ */}
            <div className="flex rounded-lg border">
              <button
                onClick={() => setActiveTab("posts")}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                  activeTab === "posts"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <MessageSquare className="h-4 w-4 inline mr-2" />
                投稿管理
              </button>
              <button
                onClick={() => setActiveTab("comments")}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                  activeTab === "comments"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <User className="h-4 w-4 inline mr-2" />
                コメント管理
              </button>
            </div>

            {/* 検索 */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder={
                  activeTab === "posts"
                    ? "投稿タイトル・内容で検索"
                    : "コメント内容で検索"
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 一括操作 */}
          {selectedItems.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">
                  {selectedItems.length}件選択中
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="削除理由を入力"
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    一括削除
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* コンテンツ一覧 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === "posts" ? "投稿一覧" : "コメント一覧"}
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {activeTab === "posts" ? (
              <>
                {isLoadingPosts ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">読み込み中...</p>
                  </div>
                ) : (
                  posts?.map((post) => (
                    <div key={post.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(post.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems([...selectedItems, post.id]);
                            } else {
                              setSelectedItems(
                                selectedItems.filter((id) => id !== post.id),
                              );
                            }
                          }}
                          className="mt-1"
                        />

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {post.title}
                              </h3>
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                {post.content}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(post.created_at).toLocaleString(
                                    "ja-JP",
                                  )}
                                </span>
                                <span>投票数: {post.vote_count || 0}</span>
                                <span>
                                  コメント数: {post.comment_count || 0}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                詳細
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const reason =
                                    prompt("削除理由を入力してください:");
                                  if (reason) {
                                    handleDelete("post", post.id);
                                  }
                                }}
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                削除
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            ) : (
              <>
                {isLoadingComments ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">読み込み中...</p>
                  </div>
                ) : (
                  comments?.map((comment) => (
                    <div key={comment.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(comment.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems([...selectedItems, comment.id]);
                            } else {
                              setSelectedItems(
                                selectedItems.filter((id) => id !== comment.id),
                              );
                            }
                          }}
                          className="mt-1"
                        />

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-sm text-gray-600 mb-2">
                                投稿: {comment.post_title}
                              </div>
                              <p className="text-gray-900 mb-3">
                                {comment.content}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(comment.created_at).toLocaleString(
                                    "ja-JP",
                                  )}
                                </span>
                                <span>投稿ID: {comment.post_id}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                詳細
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const reason =
                                    prompt("削除理由を入力してください:");
                                  if (reason) {
                                    handleDelete("comment", comment.id);
                                  }
                                }}
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                削除
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminContentPage;
