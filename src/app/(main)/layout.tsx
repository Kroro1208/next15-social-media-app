import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import type React from "react";
import SessionProvider from "./SessionProvider";
import Navbar from "./Navbar";

export default async function Layout({children}: {children: React.ReactNode}) {
    const session = await validateRequest();
    if(!session.user) redirect('/login');
    return (
    <SessionProvider value={session}>
        <div className="flex min-h-screen flex-col">
            <Navbar />
            {children}
        </div>
    </SessionProvider>
    )
}