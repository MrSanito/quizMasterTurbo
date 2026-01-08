// import { NextRequest } from "next/server";
// import { NextResponse } from "next/server";
// import { nanoid } from "nanoid";

// // 🟢 Anyone can access
// const guestAllowedRoutes = ["/", "/login", "/register"];

// // 🔴 Must be logged in
// const protectedRoutes = ["/profile", "/dashboard", "/settings"];
// // 🎮 Guest limited routes
// const quizRoutePrefix = "/quiz";


// export async function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;
//   const res = NextResponse.next();

//   const token = request.cookies.get("token")?.value;
//   const guestId = request.cookies.get("guestId");
//   const quizCount = Number(request.cookies.get("quizCount")?.value || 0);

//   // ✅ Public routes → always allow
//   if (guestAllowedRoutes.includes(pathname)) {
//     return res;
//   }

//   // 🔐 Protected routes → require token
//   if (protectedRoutes.some((route) => pathname.startsWith(route))) {
//     if (!token) {
//       return NextResponse.redirect(new URL("/login", request.url));
//     }
//     return res;
//   }






//   // 🎮 Quiz logic (guest allowed but limited)
//   if (pathname.startsWith(quizRoutePrefix)) {
//     // Logged-in user → unlimited
//     if (token) return res;

//     // New guest
//     if (!guestId) {
//       res.cookies.set("guestId", nanoid(), {
//         httpOnly: true,
//         maxAge: 60 * 60 * 24 * 7,
//       });

//       res.cookies.set("quizCount", "0", {
//         httpOnly: true,
//         maxAge: 60 * 60 * 24 * 7,
//       });

//       return res;
//     }

//     // Guest limit reached
//     if (quizCount >= 3) {
//       return NextResponse.redirect(new URL("/login", req.url));
//     }
//   }

//   return res;
// }




// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - api (API routes)
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      */
//     // Skip Next.js internals and all static files, unless found in search params
//     "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
//     "/((?!api|_next/static|_next/image|favicon.ico).*)",
//   ],
// };
