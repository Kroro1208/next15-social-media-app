import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");

    console.log("=== Callback route executed ===");
    console.log("Code exists:", !!code);
    console.log("Full URL:", request.url);

    if (!code) {
      console.log(
        "No code found in query. Returning HTML that preserves hash when forwarding to client callback",
      );
      const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Auth callback</title>
  </head>
  <body>
    <script>
      (function(){
        try {
          const hash = window.location.hash || '';
          const search = window.location.search || '';
          const target = '/auth/callback-client' + (hash || search);
          window.location.replace(target);
        } catch (e) {
          window.location.replace('/auth/login?error=no_code');
        }
      })();
    </script>
  </body>
</html>`;

      return new NextResponse(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    const supabase = createClient(
      process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
      process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!,
    );

    console.log("Attempting to exchange code for session");
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code:", error);
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent(error.message)}`,
      );
    }

    if (data?.session) {
      console.log("Session created successfully, redirecting to home");
      return NextResponse.redirect(`${origin}/`);
    }

    console.log("No session created, redirecting to login");
    return NextResponse.redirect(`${origin}/auth/login?error=no_session`);
  } catch (error) {
    console.error("Unexpected error in callback:", error);
    return NextResponse.redirect(
      `${new URL(request.url).origin}/auth/login?error=server_error`,
    );
  }
}
