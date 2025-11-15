"use client";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
	size?: "sm" | "md" | "lg" | "xl";
	variant?: "primary" | "secondary" | "white" | "gray";
	className?: string;
	showText?: boolean;
	text?: string;
}

const sizeClasses = {
	sm: "w-4 h-4 border-2",
	md: "w-6 h-6 border-2",
	lg: "w-8 h-8 border-3",
	xl: "w-10 h-10 border-4",
};

const variantClasses = {
	primary: "border-blue-500 border-t-transparent",
	secondary: "border-gray-500 border-t-transparent",
	white: "border-white border-t-transparent",
	gray: "border-gray-400 border-t-transparent",
};

export function LoadingSpinner({
	size = "md",
	variant = "primary",
	className,
	showText = false,
	text = "読み込み中...",
}: LoadingSpinnerProps) {
	return (
		<div className={cn("flex items-center justify-center", className)}>
			<div className="flex flex-col items-center space-y-2">
				<div
					className={cn(
						"rounded-full animate-spin",
						sizeClasses[size],
						variantClasses[variant],
					)}
				/>
				{showText && (
					<p className="text-sm font-medium text-gray-600">{text}</p>
				)}
			</div>
		</div>
	);
}

export function PageLoadingSpinner({ text }: { text?: string }) {
	return (
		<div className="flex flex-col items-center space-y-4">
			<LoadingSpinner size="xl" variant="primary" />
			<p className="text-white text-sm font-medium drop-shadow-lg">
				{text || "ページを読み込み中..."}
			</p>
		</div>
	);
}

export function InlineLoadingSpinner({
	variant = "gray",
}: {
	variant?: "primary" | "secondary" | "white" | "gray";
}) {
	return <LoadingSpinner size="sm" variant={variant} />;
}

export function CardLoadingSpinner({ text }: { text?: string }) {
	return (
		<div className="flex flex-col items-center justify-center py-8">
			<LoadingSpinner
				size="lg"
				variant="primary"
				showText
				text={text || "読み込み中..."}
			/>
		</div>
	);
}

export function OverlayLoadingSpinner({
	text = "読み込み中...",
	zIndex = "z-40",
}: {
	text?: string;
	zIndex?: "z-40" | "z-50";
}) {
	return (
		<div className={`fixed inset-0 ${zIndex} flex items-center justify-center`}>
			<div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-all duration-300" />
			<div className="relative z-10">
				<div className="flex flex-col items-center space-y-4">
					<div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
					<p className="text-white text-sm font-medium drop-shadow-lg">
						{text}
					</p>
				</div>
			</div>
		</div>
	);
}
