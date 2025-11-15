"use client";
import {
	AlertTriangle,
	BarChart3,
	Eye,
	MessageSquare,
	Settings,
	Shield,
	TrendingUp,
	Users,
	Vote,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { type DashboardStats, useAdmin } from "../hooks/useAdmin";
import { useAuth } from "../hooks/useAuth";

const AdminDashboard = () => {
	const { user, loading: isAuthLoading } = useAuth();
	const { isAdmin, isLoadingAdmin, dashboardStats, isLoadingStats } =
		useAdmin();
	const router = useRouter();

	useEffect(() => {
		if (!isAuthLoading && !isLoadingAdmin) {
			if (!user) {
				router.push("/auth");
				return;
			}
			if (!isAdmin) {
				router.push("/");
				return;
			}
		}
	}, [user, isAdmin, isAuthLoading, isLoadingAdmin, router]);

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

	// 統計データを整理
	const statsMap = dashboardStats.reduce(
		(acc, stat) => {
			acc[stat.metric_type] = stat;
			return acc;
		},
		{} as Record<string, DashboardStats>,
	);

	const statCards = [
		{
			title: "総ユーザー数",
			count: statsMap["users"]?.total_count || 0,
			weeklyGrowth: statsMap["users"]?.week_count || 0,
			todayGrowth: statsMap["users"]?.today_count || 0,
			icon: Users,
			color: "bg-blue-500",
		},
		{
			title: "総投稿数",
			count: statsMap["posts"]?.total_count || 0,
			weeklyGrowth: statsMap["posts"]?.week_count || 0,
			todayGrowth: statsMap["posts"]?.today_count || 0,
			icon: MessageSquare,
			color: "bg-green-500",
		},
		{
			title: "総投票数",
			count: statsMap["votes"]?.total_count || 0,
			weeklyGrowth: statsMap["votes"]?.week_count || 0,
			todayGrowth: statsMap["votes"]?.today_count || 0,
			icon: Vote,
			color: "bg-purple-500",
		},
		{
			title: "報告件数",
			count: statsMap["reports"]?.total_count || 0,
			weeklyGrowth: statsMap["reports"]?.week_count || 0,
			todayGrowth: statsMap["reports"]?.today_count || 0,
			icon: AlertTriangle,
			color: "bg-red-500",
		},
	];

	const menuItems = [
		{
			title: "コンテンツ管理",
			description: "投稿・コメントの管理",
			href: "/admin/content",
			icon: Eye,
			color: "bg-blue-500",
		},
		{
			title: "報告管理",
			description: "不適切コンテンツの報告処理",
			href: "/admin/reports",
			icon: AlertTriangle,
			color: "bg-red-500",
		},
		{
			title: "ユーザー管理",
			description: "ユーザー制裁・権限管理",
			href: "/admin/users",
			icon: Users,
			color: "bg-green-500",
		},
		{
			title: "システム設定",
			description: "NGワード・管理者設定",
			href: "/admin/settings",
			icon: Settings,
			color: "bg-gray-500",
		},
	];

	return (
		<div className="min-h-screen bg-gray-50">
			{/* ヘッダー */}
			<div className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<div className="flex items-center gap-3">
							<Shield className="h-8 w-8 text-blue-600" />
							<h1 className="text-2xl font-bold text-gray-900">
								管理者ダッシュボード
							</h1>
						</div>
						<div className="flex items-center gap-2 text-sm text-gray-600">
							<div className="w-2 h-2 bg-green-500 rounded-full"></div>
							<span>オンライン</span>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* 統計カード */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					{statCards.map((card, index) => (
						<div
							key={index}
							className="bg-white rounded-lg shadow-sm border p-6"
						>
							<div className="flex items-center justify-between">
								<div>
									<h3 className="text-sm font-medium text-gray-500">
										{card.title}
									</h3>
									<p className="text-3xl font-bold text-gray-900 mt-2">
										{isLoadingStats ? "..." : card.count.toLocaleString()}
									</p>
								</div>
								<div className={`p-3 rounded-full ${card.color}`}>
									<card.icon className="h-6 w-6 text-white" />
								</div>
							</div>

							{!isLoadingStats && (
								<div className="mt-4 flex items-center text-sm">
									<TrendingUp className="h-4 w-4 text-green-500 mr-1" />
									<span className="text-green-600 font-medium">
										+{card.weeklyGrowth}
									</span>
									<span className="text-gray-500 ml-1">今週</span>
									<span className="text-gray-400 mx-2">|</span>
									<span className="text-blue-600 font-medium">
										+{card.todayGrowth}
									</span>
									<span className="text-gray-500 ml-1">今日</span>
								</div>
							)}
						</div>
					))}
				</div>

				{/* 管理メニュー */}
				<div className="bg-white rounded-lg shadow-sm border">
					<div className="px-6 py-4 border-b">
						<h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
							<BarChart3 className="h-5 w-5" />
							管理機能
						</h2>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
						{menuItems.map((item, index) => (
							<a
								key={index}
								href={item.href}
								className="group p-6 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
							>
								<div className="flex items-start gap-4">
									<div className={`p-3 rounded-lg ${item.color}`}>
										<item.icon className="h-6 w-6 text-white" />
									</div>
									<div>
										<h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
											{item.title}
										</h3>
										<p className="text-gray-600 mt-1">{item.description}</p>
										<div className="mt-3">
											<span className="text-sm text-blue-600 group-hover:text-blue-700">
												管理画面を開く →
											</span>
										</div>
									</div>
								</div>
							</a>
						))}
					</div>
				</div>

				{/* 最近のアクティビティ */}
				<div className="mt-8 bg-white rounded-lg shadow-sm border">
					<div className="px-6 py-4 border-b">
						<h2 className="text-lg font-semibold text-gray-900">
							最近のアクティビティ
						</h2>
					</div>
					<div className="p-6">
						<div className="text-center py-12">
							<BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
							<p className="text-gray-500">アクティビティログは準備中です</p>
							<p className="text-sm text-gray-400 mt-1">
								管理者の操作履歴がここに表示されます
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AdminDashboard;
