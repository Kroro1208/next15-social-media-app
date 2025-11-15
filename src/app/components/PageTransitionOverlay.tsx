"use client";

import { usePageTransition } from "../../hooks/usePageTransitionHook";
import { PageLoadingSpinner } from "./ui/LoadingSpinner";

export function PageTransitionOverlay() {
	const { isTransitioning } = usePageTransition();

	if (!isTransitioning) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Blur背景 */}
			<div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-all duration-300" />

			{/* ローディングスピナー */}
			<div className="relative z-10">
				<PageLoadingSpinner />
			</div>
		</div>
	);
}
