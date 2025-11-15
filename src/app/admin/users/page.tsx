"use client";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Ban,
  Calendar,
  Eye,
  Filter,
  Search,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../../supabase-client";
import { Button } from "../../components/ui/button";
import { type UserSanction, useAdmin } from "../../hooks/useAdmin";
import { useAuth } from "../../hooks/useAuth";

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  user_metadata?: { [key: string]: string | number | boolean };
  // 関連データ
  posts_count?: number;
  comments_count?: number;
  votes_count?: number;
  // 制裁情報
  active_sanctions: UserSanction[];
}

const AdminUsersPage = () => {
  const { user, loading: isAuthLoading } = useAuth();
  const { isAdmin, isLoadingAdmin, applySanction, isApplyingSanction } =
    useAdmin();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [sanctionFilter, setSanctionFilter] = useState<
    "all" | "active" | "none"
  >("all");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [sanctionModal, setSanctionModal] = useState(false);
  const [sanctionForm, setSanctionForm] = useState({
    type: "warning" as
      | "warning"
      | "temporary_ban"
      | "permanent_ban"
      | "content_restriction",
    reason: "",
    duration: 24,
  });

  useEffect(() => {
    if (!isAuthLoading && !isLoadingAdmin) {
      if (!user || !isAdmin) {
        router.push("/");
        return;
      }
    }
  }, [user, isAdmin, isAuthLoading, isLoadingAdmin, router]);

  // ユーザー一覧取得
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["admin-users", searchTerm],
    queryFn: async (): Promise<UserData[]> => {
      const { data: authUsers, error: authError } =
        await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      // ユーザーの追加情報を取得
      const userIds = authUsers.users.map((u) => u.id);

      // 投稿数、コメント数、投票数を並列取得
      const [postsData, commentsData, votesData, sanctionsData] =
        await Promise.all([
          supabase.from("posts").select("user_id").in("user_id", userIds),
          supabase.from("comments").select("user_id").in("user_id", userIds),
          supabase.from("votes").select("user_id").in("user_id", userIds),
          supabase
            .from("user_sanctions")
            .select("*")
            .in("user_id", userIds)
            .eq("is_active", true),
        ]);

      // 集計
      const postsCounts =
        postsData.data?.reduce(
          (acc, post) => {
            acc[post.user_id] = (acc[post.user_id] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ) || {};

      const commentsCounts =
        commentsData.data?.reduce(
          (acc, comment) => {
            acc[comment.user_id] = (acc[comment.user_id] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ) || {};

      const votesCounts =
        votesData.data?.reduce(
          (acc, vote) => {
            acc[vote.user_id] = (acc[vote.user_id] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ) || {};

      const sanctionsMap =
        sanctionsData.data?.reduce(
          (acc, sanction) => {
            if (!acc[sanction.user_id]) acc[sanction.user_id] = [];
            acc[sanction.user_id].push(sanction);
            return acc;
          },
          {} as Record<string, UserSanction[]>,
        ) || {};

      let filteredUsers = authUsers.users.map((authUser) => ({
        id: authUser.id,
        email: authUser.email || "",
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        user_metadata: authUser.user_metadata,
        posts_count: postsCounts[authUser.id] || 0,
        comments_count: commentsCounts[authUser.id] || 0,
        votes_count: votesCounts[authUser.id] || 0,
        active_sanctions: sanctionsMap[authUser.id] || [],
      })) as UserData[];

      // 検索フィルタ
      if (searchTerm) {
        filteredUsers = filteredUsers.filter(
          (u) =>
            u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.id.includes(searchTerm),
        );
      }

      // 制裁フィルタ
      if (sanctionFilter === "active") {
        filteredUsers = filteredUsers.filter(
          (u) => u.active_sanctions.length > 0,
        );
      } else if (sanctionFilter === "none") {
        filteredUsers = filteredUsers.filter(
          (u) => u.active_sanctions.length === 0,
        );
      }

      return filteredUsers;
    },
    enabled: !!isAdmin,
    refetchInterval: 30000, // 30秒ごとに更新
  });

  const handleApplySanction = () => {
    if (!selectedUser) return;

    const sanctionData: {
      targetUserId: string;
      sanctionType:
        | "warning"
        | "temporary_ban"
        | "permanent_ban"
        | "content_restriction";
      reason: string;
      durationHours?: number;
    } = {
      targetUserId: selectedUser.id,
      sanctionType: sanctionForm.type,
      reason: sanctionForm.reason,
    };

    if (sanctionForm.type === "temporary_ban") {
      sanctionData.durationHours = sanctionForm.duration;
    }

    applySanction(sanctionData);

    setSanctionModal(false);
    setSelectedUser(null);
    setSanctionForm({
      type: "warning",
      reason: "",
      duration: 24,
    });
  };

  const getSanctionBadge = (sanctions: UserSanction[]) => {
    if (!sanctions || sanctions.length === 0) return null;

    const activeSanction = sanctions[0]; // 最新の制裁
    if (!activeSanction) return null;
    const badges = {
      warning: "bg-yellow-100 text-yellow-800",
      temporary_ban: "bg-red-100 text-red-800",
      permanent_ban: "bg-red-500 text-white",
      content_restriction: "bg-orange-100 text-orange-800",
    };

    const labels = {
      warning: "警告",
      temporary_ban: "一時停止",
      permanent_ban: "永久BAN",
      content_restriction: "コンテンツ制限",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${badges[activeSanction.sanction_type as keyof typeof badges]}`}
      >
        {labels[activeSanction.sanction_type as keyof typeof labels]}
      </span>
    );
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
            <h1 className="text-2xl font-bold text-gray-900">ユーザー管理</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 検索・フィルタ */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="メールアドレスまたはユーザーIDで検索"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={sanctionFilter}
                onChange={(e) =>
                  setSanctionFilter(e.target.value as typeof sanctionFilter)
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">全ユーザー</option>
                <option value="active">制裁中</option>
                <option value="none">制裁なし</option>
              </select>
            </div>
          </div>
        </div>

        {/* ユーザー一覧 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              ユーザー一覧 ({users?.length || 0}人)
            </h2>
          </div>

          {isLoadingUsers ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">読み込み中...</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {users?.map((userData) => (
                <div key={userData.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-500" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {userData.email}
                          </h3>
                          {getSanctionBadge(userData.active_sanctions)}
                        </div>

                        <div className="text-sm text-gray-600 mb-2">
                          ID: {userData.id}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            登録:{" "}
                            {new Date(userData.created_at).toLocaleDateString(
                              "ja-JP",
                            )}
                          </span>
                          {userData.last_sign_in_at && (
                            <span className="flex items-center gap-1">
                              <Activity className="h-4 w-4" />
                              最終ログイン:{" "}
                              {new Date(
                                userData.last_sign_in_at,
                              ).toLocaleDateString("ja-JP")}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                          <span>投稿: {userData.posts_count}</span>
                          <span>コメント: {userData.comments_count}</span>
                          <span>投票: {userData.votes_count}</span>
                        </div>
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
                          setSelectedUser(userData);
                          setSanctionModal(true);
                        }}
                        disabled={userData.active_sanctions?.some(
                          (s) => s.sanction_type === "permanent_ban",
                        )}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        制裁
                      </Button>
                    </div>
                  </div>

                  {/* アクティブな制裁の詳細 */}
                  {userData.active_sanctions &&
                    userData.active_sanctions.length > 0 && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-sm font-medium text-red-800 mb-1">
                          アクティブな制裁
                        </div>
                        {userData.active_sanctions.map((sanction, index) => (
                          <div key={index} className="text-sm text-red-700">
                            <div>理由: {sanction.reason}</div>
                            {sanction.expires_at && (
                              <div>
                                期限:{" "}
                                {new Date(sanction.expires_at).toLocaleString(
                                  "ja-JP",
                                )}
                              </div>
                            )}
                            <div>
                              適用日:{" "}
                              {new Date(sanction.created_at).toLocaleString(
                                "ja-JP",
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 制裁モーダル */}
      {sanctionModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                ユーザー制裁
              </h3>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600">対象ユーザー</div>
              <div className="font-medium">{selectedUser.email}</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  制裁タイプ
                </label>
                <select
                  value={sanctionForm.type}
                  onChange={(e) =>
                    setSanctionForm({
                      ...sanctionForm,
                      type: e.target.value as typeof sanctionForm.type,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="warning">警告</option>
                  <option value="temporary_ban">一時停止</option>
                  <option value="content_restriction">コンテンツ制限</option>
                  <option value="permanent_ban">永久BAN</option>
                </select>
              </div>

              {sanctionForm.type === "temporary_ban" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    期間 (時間)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={sanctionForm.duration}
                    onChange={(e) =>
                      setSanctionForm({
                        ...sanctionForm,
                        duration: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  理由 *
                </label>
                <textarea
                  value={sanctionForm.reason}
                  onChange={(e) =>
                    setSanctionForm({ ...sanctionForm, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="制裁の理由を詳細に記入してください"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setSanctionModal(false);
                  setSelectedUser(null);
                }}
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={handleApplySanction}
                disabled={!sanctionForm.reason.trim() || isApplyingSanction}
              >
                制裁を適用
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
