"use client";
import { AlertTriangle, Flag, X } from "lucide-react";
import { useState } from "react";
import { useAdmin } from "../hooks/useAdmin";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";

interface ReportButtonProps {
	contentType: "post" | "comment";
	contentId: number;
	className?: string;
}

const ReportButton = ({
	contentType,
	contentId,
	className = "",
}: ReportButtonProps) => {
	const { user } = useAuth();
	const { reportContent, isReporting } = useAdmin();
	const [showModal, setShowModal] = useState(false);
	const [reportData, setReportData] = useState({
		reason: "",
		description: "",
	});

	const handleSubmit = () => {
		if (!reportData.reason) {
			alert("報告理由を選択してください");
			return;
		}

		reportContent({
			contentType,
			contentId,
			reason: reportData.reason,
			description: reportData.description,
		});

		setShowModal(false);
		setReportData({ reason: "", description: "" });
		alert("報告を受け付けました。管理者が確認いたします。");
	};

	if (!user) return null;

	const reasons = [
		{ value: "spam", label: "スパム" },
		{ value: "harassment", label: "ハラスメント" },
		{ value: "hate_speech", label: "ヘイトスピーチ" },
		{ value: "inappropriate_content", label: "不適切なコンテンツ" },
		{ value: "misinformation", label: "デマ・誤情報" },
		{ value: "other", label: "その他" },
	];

	return (
		<>
			<button
				onClick={() => setShowModal(true)}
				className={`flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors ${className}`}
				title="不適切なコンテンツを報告"
			>
				<Flag className="h-4 w-4" />
				<span className="text-sm">報告</span>
			</button>

			{showModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-lg max-w-md w-full p-6">
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-2">
								<AlertTriangle className="h-5 w-5 text-red-500" />
								<h3 className="text-lg font-semibold text-gray-900">
									コンテンツを報告
								</h3>
							</div>
							<button
								onClick={() => setShowModal(false)}
								className="text-gray-400 hover:text-gray-600"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						<div className="mb-4">
							<div className="text-sm text-gray-600 mb-2">
								この{contentType === "post" ? "投稿" : "コメント"}
								を報告する理由を選択してください
							</div>
						</div>

						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									報告理由 *
								</label>
								<div className="space-y-2">
									{reasons.map((reason) => (
										<label key={reason.value} className="flex items-center">
											<input
												type="radio"
												name="reason"
												value={reason.value}
												checked={reportData.reason === reason.value}
												onChange={(e) =>
													setReportData({
														...reportData,
														reason: e.target.value,
													})
												}
												className="mr-3"
											/>
											<span className="text-sm text-gray-700">
												{reason.label}
											</span>
										</label>
									))}
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									詳細 (任意)
								</label>
								<textarea
									value={reportData.description}
									onChange={(e) =>
										setReportData({
											...reportData,
											description: e.target.value,
										})
									}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
									rows={3}
									placeholder="問題の詳細があれば記入してください"
								/>
							</div>
						</div>

						<div className="flex justify-end gap-2 mt-6">
							<Button
								variant="outline"
								onClick={() => setShowModal(false)}
								disabled={isReporting}
							>
								キャンセル
							</Button>
							<Button
								variant="destructive"
								onClick={handleSubmit}
								disabled={!reportData.reason || isReporting}
							>
								{isReporting ? "送信中..." : "報告する"}
							</Button>
						</div>

						<div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
							<div className="text-sm text-yellow-800">
								<strong>注意:</strong>{" "}
								悪意のある報告や虚偽の報告は禁止されています。
								適切な理由のみ報告してください。
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default ReportButton;
