"use server"

import { loginSchema, type LoginValues } from "@/app/lib/validation";
import { isRedirectError } from "next/dist/client/components/redirect";
import { verify } from "@node-rs/argon2";
import { lucia } from "@/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";

export async function login(
    credentials: LoginValues
): Promise<{error: string}> {
    try {
        const {username, password} = loginSchema.parse(credentials)
        const existingUser = await prisma.user.findFirst({
            where: {
                username: {
                    equals: username,
                    mode: "insensitive"
                }
            }
        })

        if(!existingUser || !existingUser.passwordHash) {
            return {
                error: "入力されたユーザー名もしくはパスワードが一致しません"
            }
        }

        const validPassword = await verify(existingUser.passwordHash, password, {
            memoryCost: 19456,
            timeCost: 2,
            outputLen: 32,
            parallelism: 1
        })
        if(!validPassword) {
            return {
                error: "入力されたユーザー名もしくはパスワードが一致しません"
            }
        }

        const session = await lucia.createSession(existingUser.id, {})
        const sessionCookie = lucia.createSessionCookie(session.id);
        (await cookies()).set(
            sessionCookie.name,
            sessionCookie.value,
            sessionCookie.attributes
        );
        return redirect('/');
    } catch (error) {
        if(isRedirectError(error)) throw error;
        console.error(error);
        return {
            error: "エラーが発生しました"
        }
    }
}