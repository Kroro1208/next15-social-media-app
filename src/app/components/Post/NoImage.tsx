import { Image } from "lucide-react";

interface NoImageProps {
	className?: string;
}

const NoImage = ({ className = "" }: NoImageProps) => {
	return (
		<div
			className={`rounded-lg w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 shadow-lg dark:shadow-gray-700 flex flex-col items-center justify-center ${className}`}
		>
			<div className="p-4 bg-white dark:bg-gray-800 rounded-full shadow-md mb-4">
				<Image
					className="w-12 h-12 text-gray-400 dark:text-gray-500"
					aria-label="画像なしアイコン"
				/>
			</div>
			<p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
				画像がありません
			</p>
			<p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
				テキストベースの投稿です
			</p>
		</div>
	);
};

export default NoImage;
