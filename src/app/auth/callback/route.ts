import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  console.log("Callback route executed, code:", !!code);
  console.log("Full URL:", request.url);

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
      process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        return NextResponse.redirect(
          `${origin}/auth/login?error=${encodeURIComponent(error.message)}`,
        );
      }

      if (data?.session) {
        return NextResponse.redirect(`${origin}/`);
      }
    } catch (error) {
      return NextResponse.redirect(
        `${origin}/auth/login?error=unexpected_error`,
      );
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
}
