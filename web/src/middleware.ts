import { NextResponse, type NextRequest } from "next/server";

/**
 * Sends www.latelylebanon.com to latelylebanon.com with a permanent redirect, keeping the
 * path and query, so search engines only ever see one version of each page.
 */
export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  if (!host.toLowerCase().startsWith("www.")) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.host = host.slice(4);
  url.port = "";
  url.protocol = "https:";
  return NextResponse.redirect(url, 308);
}

export const config = {
  // Skip Next.js internals and static files; everything else is checked.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
