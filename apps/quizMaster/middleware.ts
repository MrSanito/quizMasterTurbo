import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();

  const token = request.cookies.get("token")?.value;
  const guestId = request.cookies.get("guestId");
  const quizCount = Number(request.cookies.get("quizCount")?.value || 0);
  const isQuizRoute = request.nextUrl.pathname.startsWith("/quiz");

  console.log("hit hua ya nahi");
   
  //return true if it has jwt token
  if (token) {
    res.headers.set("x-quiz-blocked", "false");

    return res;
  }

  // Create guest if not exists
  if (!guestId) {
    res.cookies.set("guestId", nanoid(), {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log("guest id:", request.cookies.get("guestId"));
    res.cookies.set("quizCount", "0");
    return res;
  }

  // Block after 3 quizzes

  if (quizCount >= 3 && isQuizRoute) {
    res.headers.set("x-quiz-blocked", "true");
  }

  return res;

  // console.log("session:", token);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
