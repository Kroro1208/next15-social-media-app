import type { Metadata } from 'next';
import Image from 'next/image';
import signupImage from "../../../../public/login.svg"
import Link from 'next/link';
import SignUpForm from './SignUpForm';

export const metadata: Metadata = {
    title: "Sign Up",
    description: "アカウント作成ページ",
    keywords: ["SNS", "サインアップ", "アカウント作成"]
}

export default function Page() {
    return (
        <main className='min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900'>
            <div className='flex w-full max-w-4xl bg-card rounded-2xl shadow-xl overflow-hidden'>
                {/* 左側: フォームエリア */}
                <div className='flex-1 p-6 md:p-8 lg:p-12'>
                    <div className='max-w-md mx-auto space-y-8'>
                        {/* ヘッダー */}
                        <div className='space-y-2 text-center'>
                            <h1 className='text-2xl text-muted-foreground font-bold tracking-tight'>
                                Create Your Account
                            </h1>
                            <p className='text-sm md:text-base text-muted-foreground'>
                                次世代のSNSで価値観の合う友達を見つけよう
                            </p>
                        </div>

                        {/* フォーム */}
                        <SignUpForm />

                        {/* ログインリンク */}
                        <div className='text-center'>
                            すでにアカウントをお持ちの方は👉
                            <Link 
                                href="/login" 
                                className='text-sm text-muted-foreground hover:text-primary transition-colors'
                            >
                                ログイン
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 右側: イメージエリア */}
                <div className='hidden md:flex md:w-1/2 bg-gradient-to-br from-primary/10 to-primary/5'>
                    <Image 
                        src={signupImage} 
                        alt='アカウント作成' 
                        className='object-cover p-8'
                        priority
                    />
                </div>
            </div>
        </main>
    )
}