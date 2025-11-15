"use client";

import { CheckCircle, Key, Shield, Smartphone, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useLanguage } from "../../hooks/useLanguage";
import { useSupabaseMFA } from "../../hooks/useSupabaseMFA";
import { Button } from "../ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";
import MfaModal from "./MfaModal";

export const SupabaseMFASettings = () => {
	const { t } = useLanguage();
	const {
		mfaFactors,
		isFactorsLoading,
		enrollMFA,
		isEnrolling,
		enrollData,
		verifyEnroll,
		isVerifyingEnroll,
		unenrollMFA,
		isUnenrolling,
		getMFAStatus,
	} = useSupabaseMFA();

	const [showSetupModal, setShowSetupModal] = useState(false);
	const [verificationCode, setVerificationCode] = useState("");
	const [showQRCode, setShowQRCode] = useState(true);
	const inputRef = useRef<HTMLInputElement>(null);

	// MFA検証が完了して成功した場合のみモーダルを閉じる
	const [verificationSuccessful, setVerificationSuccessful] = useState(false);

	useEffect(() => {
		if (verificationSuccessful) {
			const timer = setTimeout(() => {
				setShowSetupModal(false);
				setVerificationCode("");
				setVerificationSuccessful(false);
			}, 1000);
			return () => clearTimeout(timer);
		}

		return () => {}; // 空のクリーンアップ関数を返す
	}, [verificationSuccessful]);

	const mfaStatus = getMFAStatus();

	// モーダルが開かれたときに入力フィールドにフォーカス
	useEffect(() => {
		if (showSetupModal && enrollData && inputRef.current) {
			setTimeout(() => {
				inputRef.current?.focus();
			}, 100);
		}
	}, [showSetupModal, enrollData]);

	const handleStartSetup = async () => {
		// 新規作成
		enrollMFA({
			factorType: "totp",
			onSuccess: () => {
				setShowSetupModal(true);
			},
		});
	};

	const handleVerifySetup = async () => {
		if (!enrollData || !verificationCode) {
			toast.error(t("mfa.error.code.required"));
			return;
		}

		if (verificationCode.length !== 6) {
			toast.error(t("mfa.error.code.length"));
			return;
		}

		// 数値のみチェック
		if (!/^\d{6}$/.test(verificationCode)) {
			toast.error(t("mfa.error.code.format"));
			return;
		}

		// useSupabaseMFAフックのverifyEnrollを使用
		verifyEnroll({
			factorId: enrollData.id,
			code: verificationCode.trim(),
			onSuccess: () => {
				setVerificationSuccessful(true);
			},
		});
	};

	const handleDisableMFA = async (factorId: string) => {
		if (window.confirm(t("mfa.disable.confirm"))) {
			unenrollMFA({ factorId });
		}
	};

	const handleCloseModal = () => {
		setShowSetupModal(false);
		setVerificationCode("");
		setShowQRCode(true);
	};

	if (isFactorsLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Shield className="h-5 w-5" />
						2段階認証（MFA）
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center py-4">
						<div className="text-sm text-gray-500">{t("common.loading")}</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<Card className="dark:bg-gray-800 dark:border-gray-700">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 dark:text-gray-100">
						<Shield className="h-5 w-5" />
						{t("mfa.title")}
					</CardTitle>
					<CardDescription className="dark:text-gray-300">
						{t("mfa.description")}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{!mfaStatus.isEnabled ? (
						// MFA未設定の場合
						<div className="space-y-4">
							<div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
								<Smartphone className="h-5 w-5 text-blue-500 mt-1" />
								<div>
									<h4 className="font-medium text-blue-800 dark:text-blue-300">
										{t("mfa.setup.required")}
									</h4>
									<p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
										{t("mfa.setup.install")}
									</p>
								</div>
							</div>

							<div className="space-y-2">
								<h4 className="font-medium dark:text-gray-200">
									{t("mfa.setup.steps")}
								</h4>
								<ol className="text-sm space-y-1 list-decimal list-inside text-gray-600 dark:text-gray-400">
									<li>{t("mfa.setup.step1")}</li>
									<li>{t("mfa.setup.step2")}</li>
									<li>{t("mfa.setup.step3")}</li>
									<li>{t("mfa.setup.step4")}</li>
								</ol>
							</div>

							<Button
								onClick={handleStartSetup}
								disabled={isEnrolling}
								className="w-full bg-blue-600 hover:bg-blue-700"
							>
								{isEnrolling ? t("mfa.setup.preparing") : t("mfa.setup.button")}
							</Button>
						</div>
					) : (
						// MFA設定済みの場合
						<div className="space-y-4">
							<div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
								<CheckCircle className="h-5 w-5 text-green-500 mt-1" />
								<div>
									<h4 className="font-medium text-green-800 dark:text-green-300">
										{t("mfa.enabled")}
									</h4>
									<p className="text-sm text-green-600 dark:text-green-400 mt-1">
										{t("mfa.enabled.description")}
									</p>
								</div>
							</div>

							{mfaFactors && mfaFactors.length > 0 && (
								<div className="space-y-2">
									<h4 className="font-medium dark:text-gray-200">
										{t("mfa.registered.methods")}
									</h4>
									{mfaFactors.map((factor) => (
										<div
											key={factor.id}
											className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
										>
											<div className="flex items-center gap-2">
												<Key className="h-4 w-4 text-gray-500" />
												<div>
													<div className="text-sm font-medium dark:text-gray-200">
														{factor.friendly_name || t("mfa.app.name")}
													</div>
													<div className="text-xs text-gray-500 dark:text-gray-400">
														{factor.factor_type?.toUpperCase()} -{" "}
														{factor.status}
													</div>
												</div>
											</div>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleDisableMFA(factor.id)}
												disabled={isUnenrolling}
												className="flex items-center gap-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
											>
												<Trash2 className="h-3 w-3" />
												{isUnenrolling
													? t("common.updating")
													: t("mfa.disable")}
											</Button>
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* セットアップモーダル */}
			<MfaModal
				isEnrolling={isEnrolling}
				enrollData={enrollData}
				showQRCode={showQRCode}
				setShowQRCode={setShowQRCode}
				inputRef={inputRef}
				verificationCode={verificationCode}
				setVerificationCode={setVerificationCode}
				handleVerifySetup={handleVerifySetup}
				isVerifyingEnroll={isVerifyingEnroll}
				showSetupModal={showSetupModal}
				handleCloseModal={handleCloseModal}
			/>
		</>
	);
};
