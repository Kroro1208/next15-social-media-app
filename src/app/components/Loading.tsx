import { LoadingSpinner } from "./ui/LoadingSpinner";

const Loading = () => {
	return (
		<div className="min-h-screen flex justify-center items-center bg-gray-50">
			<LoadingSpinner
				size="xl"
				variant="primary"
				showText
				text="読み込み中..."
			/>
		</div>
	);
};

export default Loading;
