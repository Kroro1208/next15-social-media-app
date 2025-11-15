"use client";

import { Clock, Flame, TrendingUp, Zap } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import PostList from "../Post/PostList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const TabSection = () => {
	const { t } = useLanguage();
	const [activeTab, setActiveTab] = useState<
		"all" | "urgent" | "popular" | "recent"
	>("all");

	return (
		<div className="bg-gradient-to-br from-slate-50 via-gray-50 to-indigo-50 dark:from-gray-800 dark:via-gray-800 dark:to-indigo-900">
			<Tabs
				value={activeTab}
				onValueChange={(value) => setActiveTab(value as typeof activeTab)}
				className="w-full"
			>
				<div className="px-4 pt-4">
					<TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
						<TabsTrigger
							value="all"
							className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-gray-700 dark:text-gray-300 rounded-md py-2 px-2 text-sm font-medium transition-colors"
						>
							<Zap className="w-4 h-4 mr-1" />
							{t("home.tabs.all")}
						</TabsTrigger>
						<TabsTrigger
							value="urgent"
							className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-700 dark:text-gray-300 rounded-md py-2 px-2 text-sm font-medium transition-colors"
						>
							<Flame className="w-4 h-4 mr-1" />
							{t("home.tabs.urgent")}
						</TabsTrigger>
						<TabsTrigger
							value="popular"
							className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-700 dark:text-gray-300 rounded-md py-2 px-2 text-sm font-medium transition-colors"
						>
							<TrendingUp className="w-4 h-4 mr-1" />
							{t("home.tabs.popular")}
						</TabsTrigger>
						<TabsTrigger
							value="recent"
							className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-700 dark:text-gray-300 rounded-md py-2 px-2 text-sm font-medium transition-colors"
						>
							<Clock className="w-4 h-4 mr-1" />
							{t("home.tabs.recent")}
						</TabsTrigger>
					</TabsList>
				</div>

				<div className="p-6">
					<TabsContent value="all" className="mt-0">
						{activeTab === "all" && <PostList />}
					</TabsContent>

					<TabsContent value="urgent" className="mt-0">
						{activeTab === "urgent" && <PostList filter="urgent" />}
					</TabsContent>

					<TabsContent value="popular" className="mt-0">
						{activeTab === "popular" && <PostList filter="popular" />}
					</TabsContent>

					<TabsContent value="recent" className="mt-0">
						{activeTab === "recent" && <PostList filter="recent" />}
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
};

export default TabSection;
