import { NextResponse } from "next/server";

/** Browsers and crawlers ask for /favicon.ico by default; send them to the PNG. */
export function GET(req: Request) {
  return NextResponse.redirect(new URL("/favicon.png?v=2", req.url), 308);
}
