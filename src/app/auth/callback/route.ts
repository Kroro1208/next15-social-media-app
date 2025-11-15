import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const { origin, searchParams } = new URL(request.url);
		const error = searchParams.get("error");
		const error_description = searchParams.get("error_description");

		// エラーがある場合はログインページにリダイレクト
		if (error) {
			console.error("OAuth error received:", error, error_description);
			return NextResponse.redirect(
				`${origin}/auth/login?error=${error}&message=${encodeURIComponent(error_description || "")}`,
			);
		}

		// フラグメント（#）にトークンがある場合、ログインページにリダイレクト
		// クライアントサイドでトークンを処理させる
		return NextResponse.redirect(`${origin}/auth/login`);
	} catch (error) {
		console.error("Callback error:", error);
		const { origin } = new URL(request.url);
		return NextResponse.redirect(
			`${origin}/auth/login?error=callback_failed&message=${encodeURIComponent(error instanceof Error ? error.message : "Unknown error")}`,
		);
	}
}
