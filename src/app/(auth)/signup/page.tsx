import type { Metadata } from 'next';
import Image from 'next/image';
import signupImage from "../../../../public/login.svg"
import Link from 'next/link';
import SignUpForm from './SignUpForm';

export const metadata: Metadata = {
    title: "Sign Up"
}

export default function Page() {
    return (
        <main className='flex h-screen items-center justify-center p-5'>
            <div className='flex h-full max-h-[40rem] w-full max-w-[64rem] rounded-2xl overflow-hidden bg-card shadow-2xl'>
                <div className='md:w-1/2 w-full space-y-10 overflow-y-auto p-10'>
                    <div className='space-y-1 text-center'>
                        <h1 className=' text-3xl font-bold'>SignUp Page</h1>
                        <p className='text-muted-foreground'>次世代のSNSで価値観の合う友達を見つけよう</p>
                    </div>
                </div>
                <div className='space-y-5'>
                    <SignUpForm />
                    <Link href="/login" className='block text-center hover:underline'>
                        すでにアカウントを持っている方👉: ログインする
                    </Link>
                </div>
                <Image src={signupImage} alt='signupImage' className='w-1/2 hidden md:block object-cover'/>
            </div>
        </main>
    )
}