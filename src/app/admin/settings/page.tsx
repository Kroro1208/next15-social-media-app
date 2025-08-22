"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "../../hooks/useAdmin";
import { useAuth } from "../../hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../supabase-client";
import { ArrowLeft, Plus, Trash2, Shield, Filter } from "lucide-react";
import { Button } from "../../components/ui/button";

interface BlockedWord {
  id: number;
  word: string;
  category: string;
  severity: number;
  is_regex: boolean;
  created_at: string;
}

interface AdminRole {
  id: number;
  user_id: string;
  role: string;
  permissions: Record<string, boolean | string | number>;
  is_active: boolean;
  created_at: string;
}

const AdminSettingsPage = () => {
  const { user, loading: isAuthLoading } = useAuth();
  const { isAdmin, isLoadingAdmin } = useAdmin();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"blocked-words" | "admin-roles">(
    "blocked-words",
  );
  const [newWord, setNewWord] = useState({
    word: "",
    category: "general",
    severity: 1,
    is_regex: false,
  });
  const [newAdmin, setNewAdmin] = useState({
    email: "",
    role: "moderator",
  });

  useEffect(() => {
    if (!isAuthLoading && !isLoadingAdmin) {
      if (!user || !isAdmin) {
        router.push("/");
        return;
      }
    }
  }, [user, isAdmin, isAuthLoading, isLoadingAdmin, router]);

  // NGワード一覧取得
  const { data: blockedWords, isLoading: isLoadingWords } = useQuery({
    queryKey: ["admin-blocked-words"],
    queryFn: async (): Promise<BlockedWord[]> => {
      const { data, error } = await supabase.rpc("get_blocked_words");

      if (error) throw error;
      return data || [];
    },
    enabled: !!isAdmin && activeTab === "blocked-words",
  });

  // 管理者ロール一覧取得
  const { data: adminRoles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async (): Promise<AdminRole[]> => {
      const { data, error } = await supabase.rpc("get_admin_roles");

      if (error) throw error;
      return data || [];
    },
    enabled: !!isAdmin && activeTab === "admin-roles",
  });

  // NGワード追加
  const addWordMutation = useMutation({
    mutationFn: async () => {
      if (!newWord.word.trim()) throw new Error("単語を入力してください");
      if (!user?.id) throw new Error("認証が必要です");

      const { data, error } = await supabase.rpc("add_blocked_word", {
        word_param: newWord.word.trim(),
        category_param: newWord.category,
        severity_param: newWord.severity,
        is_regex_param: newWord.is_regex,
        admin_user_id: user.id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blocked-words"] });
      setNewWord({
        word: "",
        category: "general",
        severity: 1,
        is_regex: false,
      });
    },
  });

  // NGワード削除
  const deleteWordMutation = useMutation({
    mutationFn: async (wordId: number) => {
      if (!user?.id) throw new Error("認証が必要です");

      const { data, error } = await supabase.rpc("delete_blocked_word", {
        word_id_param: wordId,
        admin_user_id: user.id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blocked-words"] });
    },
  });

  // 管理者追加
  const addAdminMutation = useMutation({
    mutationFn: async () => {
      if (!newAdmin.email.trim())
        throw new Error("メールアドレスを入力してください");
      if (!user?.id) throw new Error("認証が必要です");

      // まず対象ユーザーを検索
      const { data: authUsers, error: authError } =
        await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      const targetUser = authUsers.users.find(
        (u) => u.email === newAdmin.email.trim(),
      );
      if (!targetUser) throw new Error("ユーザーが見つかりません");

      const { data, error } = await supabase.rpc("add_admin_role", {
        target_user_id: targetUser.id,
        role_param: newAdmin.role,
        admin_user_id: user.id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      setNewAdmin({
        email: "",
        role: "moderator",
      });
    },
  });

  // 管理者削除
  const deleteAdminMutation = useMutation({
    mutationFn: async (roleId: number) => {
      if (!user?.id) throw new Error("認証が必要です");

      const { data, error } = await supabase.rpc("delete_admin_role", {
        role_id_param: roleId,
        admin_user_id: user.id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    },
  });

  const getCategoryLabel = (category: string) => {
    const labels = {
      general: "一般",
      hate_speech: "ヘイトスピーチ",
      spam: "スパム",
      harassment: "ハラスメント",
      inappropriate: "不適切",
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: "管理者",
      moderator: "モデレーター",
      content_manager: "コンテンツマネージャー",
    };
    return labels[role as keyof typeof labels] || role;
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
            <h1 className="text-2xl font-bold text-gray-900">システム設定</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* タブ */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex rounded-lg border">
            <button
              onClick={() => setActiveTab("blocked-words")}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                activeTab === "blocked-words"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Filter className="h-4 w-4 inline mr-2" />
              NGワード管理
            </button>
            <button
              onClick={() => setActiveTab("admin-roles")}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                activeTab === "admin-roles"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Shield className="h-4 w-4 inline mr-2" />
              管理者権限
            </button>
          </div>
        </div>

        {activeTab === "blocked-words" ? (
          // NGワード管理
          <div className="space-y-6">
            {/* 新規追加フォーム */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                新しいNGワードを追加
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    単語・フレーズ
                  </label>
                  <input
                    type="text"
                    value={newWord.word}
                    onChange={(e) =>
                      setNewWord({ ...newWord, word: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="禁止する単語を入力"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    カテゴリ
                  </label>
                  <select
                    value={newWord.category}
                    onChange={(e) =>
                      setNewWord({ ...newWord, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="general">一般</option>
                    <option value="hate_speech">ヘイトスピーチ</option>
                    <option value="spam">スパム</option>
                    <option value="harassment">ハラスメント</option>
                    <option value="inappropriate">不適切</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    重要度 (1-5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={newWord.severity}
                    onChange={(e) =>
                      setNewWord({
                        ...newWord,
                        severity: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    正規表現
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newWord.is_regex}
                      onChange={(e) =>
                        setNewWord({ ...newWord, is_regex: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">
                      正規表現として処理
                    </span>
                  </label>
                </div>
              </div>
              <Button
                onClick={() => addWordMutation.mutate()}
                disabled={addWordMutation.isPending || !newWord.word.trim()}
              >
                <Plus className="h-4 w-4 mr-1" />
                追加
              </Button>
            </div>

            {/* NGワード一覧 */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  NGワード一覧 ({blockedWords?.length || 0}件)
                </h3>
              </div>

              {isLoadingWords ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">読み込み中...</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {blockedWords?.map((word) => (
                    <div key={word.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {word.word}
                            </span>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                              {getCategoryLabel(word.category)}
                            </span>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              重要度 {word.severity}
                            </span>
                            {word.is_regex && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                正規表現
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            追加日:{" "}
                            {new Date(word.created_at).toLocaleDateString(
                              "ja-JP",
                            )}
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm(`"${word.word}" を削除しますか？`)) {
                              deleteWordMutation.mutate(word.id);
                            }
                          }}
                          disabled={deleteWordMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {blockedWords?.length === 0 && (
                    <div className="p-8 text-center">
                      <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        NGワードが設定されていません
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          // 管理者権限管理
          <div className="space-y-6">
            {/* 新規管理者追加 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                新しい管理者を追加
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) =>
                      setNewAdmin({ ...newAdmin, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="管理者のメールアドレス"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    権限レベル
                  </label>
                  <select
                    value={newAdmin.role}
                    onChange={(e) =>
                      setNewAdmin({ ...newAdmin, role: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="moderator">モデレーター</option>
                    <option value="content_manager">
                      コンテンツマネージャー
                    </option>
                    <option value="admin">管理者</option>
                  </select>
                </div>
              </div>
              <Button
                onClick={() => addAdminMutation.mutate()}
                disabled={addAdminMutation.isPending || !newAdmin.email.trim()}
              >
                <Plus className="h-4 w-4 mr-1" />
                管理者を追加
              </Button>
            </div>

            {/* 管理者一覧 */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  管理者一覧 ({adminRoles?.length || 0}人)
                </h3>
              </div>

              {isLoadingRoles ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">読み込み中...</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {adminRoles?.map((role) => (
                    <div key={role.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              ユーザーID: {role.user_id}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                role.role === "admin"
                                  ? "bg-red-100 text-red-800"
                                  : role.role === "content_manager"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {getRoleLabel(role.role)}
                            </span>
                            {!role.is_active && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
                                無効
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            追加日:{" "}
                            {new Date(role.created_at).toLocaleDateString(
                              "ja-JP",
                            )}
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm(`この管理者権限を削除しますか？`)) {
                              deleteAdminMutation.mutate(role.id);
                            }
                          }}
                          disabled={
                            deleteAdminMutation.isPending ||
                            role.user_id === user?.id
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {adminRoles?.length === 0 && (
                    <div className="p-8 text-center">
                      <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        管理者が登録されていません
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsPage;
