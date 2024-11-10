import type { Metadata } from "next";
import LoginForm from "./LoginForm";
import Link from "next/link";
import loginImage from "../../../../public/login2.svg"
import Image from "next/image";

export const metadata: Metadata = {
    title: "Login"
}

export default function Page() {
    return (
        <main className="flex h-screen items-center justify-center p-5">
            <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl bg-card shadow-2xl">
                {/* 左側：フォームエリア */}
                <div className="flex flex-1 flex-col justify-center space-y-6 md:p-8 lg:p-12">
                    <div className="space-y-2 flex flex-col items-center">
                        <h1 className="text-2xl text-muted-foreground font-bold tracking-tight">Let&apos;s Login</h1>
                        <p className="text-sm text-muted-foreground">
                            アカウントにログインして始めましょう
                        </p>
                    </div>              
                    <LoginForm />
                    <div className="text-sm text-muted-foreground">
                        まだアカウント未登録の方は 👉
                        <Link 
                            href="/signup" 
                            className="ml-1 font-medium text-primary hover:underline"
                        >
                            サインアップ
                        </Link>
                    </div>
                </div>
                {/* 右側：イメージエリア */}
                <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary/10 to-primary/5">
                    <Image 
                        src={loginImage} 
                        alt="ログインイメージ" 
                        className="h-full w-full object-contain p-8"
                        priority
                    />
                </div>
            </div>
        </main>
    )
}