import { Lucia, type Session, type User } from "lucia";
import prisma from "./app/lib/prisma";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma"
import { cookies } from "next/headers";
import { cache } from "react";

const adapter = new PrismaAdapter(prisma.session, prisma.user);
export const lucia = new Lucia(adapter, {
    sessionCookie: {
        expires: false,
        attributes: {
            secure: process.env.NODE_ENV === "production"
        }
    },
    getUserAttributes(DatabaseUserAttributes) {
        return {
            id: DatabaseUserAttributes.id,
            username: DatabaseUserAttributes.username,
            displayName: DatabaseUserAttributes.displayName,
            avatarUrl: DatabaseUserAttributes.avatarUrl,
            googleId: DatabaseUserAttributes.googleId
        }
    }
})

declare module "lucia" {
    interface Register {
        Lucia: typeof lucia;
        DatabaseUserAttributes: DatabaseUserAttributes;
    }
}

interface DatabaseUserAttributes {
    id: string,
    username: string,
    displayName: string,
    avatarUrl: string | null
    googleId: string | null
}

export const validateRequest = cache(
    async(): Promise<{
        user: User, session: Session
    } | { user: null, session: null }> => {
        const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
        if(!sessionId) {
            return {
                user: null,
                session: null
            }
        }

        const result = await lucia.validateSession(sessionId);
        try {
            if(result.session?.fresh) {
                const sessionCookie = lucia.createSessionCookie(result.session.id);
                (await cookies()).set(
                    sessionCookie.name,
                    sessionCookie.value,
                    sessionCookie.attributes
                )
            }
            if(!result.session) {
                const sessionCookie = lucia.createBlankSessionCookie();
                (await cookies()).set(
                    sessionCookie.name,
                    sessionCookie.value,
                    sessionCookie.attributes
                )
            }
        } catch {}
        return result;
    }
)