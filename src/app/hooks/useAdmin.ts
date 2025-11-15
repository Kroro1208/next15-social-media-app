import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase-client";
import { useAuth } from "./useAuth";

export interface AdminRole {
  id: number;
  user_id: string;
  role: "admin" | "moderator" | "content_manager";
  permissions: Record<string, boolean | string | number>;
  assigned_by: string;
  assigned_at: string;
  is_active: boolean;
}

export interface DashboardStats {
  metric_type: string;
  total_count: number;
  week_count: number;
  today_count: number;
}

export interface ContentReport {
  id: number;
  reporter_user_id: string;
  reported_content_type: "post" | "comment";
  reported_content_id: number;
  report_reason: string;
  description?: string;
  status: "pending" | "investigating" | "resolved" | "dismissed";
  handled_by?: string;
  handled_at?: string;
  resolution?: string;
  created_at: string;
}

export interface UserSanction {
  id: number;
  user_id: string;
  sanction_type:
    | "warning"
    | "temporary_ban"
    | "permanent_ban"
    | "content_restriction";
  reason: string;
  duration_hours?: number;
  expires_at?: string;
  is_active: boolean;
  applied_by: string;
  created_at: string;
}

export const useAdmin = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 管理者権限チェック
  const { data: isAdmin, isLoading: isLoadingAdmin } = useQuery({
    queryKey: ["admin-status", user?.id],
    queryFn: async (): Promise<boolean> => {
      if (!user?.id) return false;

      const { data, error } = await supabase.rpc("is_admin", {
        user_id_param: user.id,
      });

      if (error) throw error;
      return data || false;
    },
    enabled: !!user?.id,
  });

  // ダッシュボード統計取得
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async (): Promise<DashboardStats[]> => {
      const { data, error } = await supabase
        .from("admin_dashboard_stats")
        .select("*");

      if (error) throw error;
      return data || [];
    },
    enabled: !!isAdmin,
    refetchInterval: 30000, // 30秒ごとに更新
  });

  // コンテンツ報告一覧取得
  const { data: contentReports, isLoading: isLoadingReports } = useQuery({
    queryKey: ["admin-content-reports"],
    queryFn: async (): Promise<ContentReport[]> => {
      const { data, error } = await supabase.rpc("get_content_reports");

      if (error) throw error;
      return data || [];
    },
    enabled: !!isAdmin,
  });

  // ユーザー制裁一覧取得
  const { data: userSanctions, isLoading: isLoadingSanctions } = useQuery({
    queryKey: ["admin-user-sanctions"],
    queryFn: async (): Promise<UserSanction[]> => {
      const { data, error } = await supabase.rpc("get_user_sanctions");

      if (error) throw error;
      return data || [];
    },
    enabled: !!isAdmin,
  });

  // コンテンツ削除
  const deleteContentMutation = useMutation({
    mutationFn: async ({
      contentType,
      contentId,
      reason,
    }: {
      contentType: "post" | "comment";
      contentId: number;
      reason: string;
    }) => {
      if (!user?.id) throw new Error("認証が必要です");

      const { data, error } = await supabase.rpc("admin_delete_content", {
        content_type: contentType,
        content_id_param: contentId,
        admin_user_id: user.id,
        reason: reason,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-content-reports"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });

  // ユーザー制裁適用
  const applySanctionMutation = useMutation({
    mutationFn: async ({
      targetUserId,
      sanctionType,
      reason,
      durationHours,
    }: {
      targetUserId: string;
      sanctionType:
        | "warning"
        | "temporary_ban"
        | "permanent_ban"
        | "content_restriction";
      reason: string;
      durationHours?: number;
    }) => {
      if (!user?.id) throw new Error("認証が必要です");

      const { data, error } = await supabase.rpc("apply_user_sanction", {
        target_user_id: targetUserId,
        sanction_type_param: sanctionType,
        reason_param: reason,
        duration_hours_param: durationHours,
        admin_user_id: user.id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-sanctions"] });
    },
  });

  // コンテンツ報告処理
  const handleReportMutation = useMutation({
    mutationFn: async ({
      reportId,
      status,
      resolution,
    }: {
      reportId: number;
      status: "investigating" | "resolved" | "dismissed";
      resolution?: string;
    }) => {
      if (!user?.id) throw new Error("認証が必要です");

      const { data, error } = await supabase.rpc("handle_content_report", {
        report_id_param: reportId,
        status_param: status,
        resolution_param: resolution || "",
        admin_user_id: user.id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-content-reports"] });
    },
  });

  // コンテンツ報告作成
  const reportContentMutation = useMutation({
    mutationFn: async ({
      contentType,
      contentId,
      reason,
      description,
    }: {
      contentType: "post" | "comment";
      contentId: number;
      reason: string;
      description?: string;
    }) => {
      if (!user?.id) throw new Error("認証が必要です");

      const { data, error } = await supabase.rpc("submit_content_report", {
        reporter_user_id: user.id,
        content_type: contentType,
        content_id_param: contentId,
        reason_param: reason,
        description_param: description || "",
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-content-reports"] });
    },
  });

  return {
    isAdmin: isAdmin || false,
    isLoadingAdmin,
    dashboardStats: dashboardStats || [],
    isLoadingStats,
    contentReports: contentReports || [],
    isLoadingReports,
    userSanctions: userSanctions || [],
    isLoadingSanctions,
    deleteContent: deleteContentMutation.mutate,
    isDeleting: deleteContentMutation.isPending,
    applySanction: applySanctionMutation.mutate,
    isApplyingSanction: applySanctionMutation.isPending,
    handleReport: handleReportMutation.mutate,
    isHandlingReport: handleReportMutation.isPending,
    reportContent: reportContentMutation.mutate,
    isReporting: reportContentMutation.isPending,
  };
};
