import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import type React from "react";

export default async function Layout({children}: {children: React.ReactNode}) {
    const { user } = await validateRequest();
    if(user) redirect('/');
    return (
        <>
            {children}
        </>
    )
}