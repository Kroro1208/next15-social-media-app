import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("🔥 TEST CALLBACK HIT");
  console.log("🔥 URL:", request.url);
  
  return NextResponse.json({
    message: "Test callback working",
    url: request.url,
    params: Object.fromEntries(new URL(request.url).searchParams.entries())
  });
}