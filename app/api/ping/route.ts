export const dynamic = "force-dynamic";
/** Dependency-free liveness probe: if THIS returns 200 the Next runtime is up (no DB, no auth, no env needed). */
export function GET() {
  return Response.json({ pong: true, node: process.version, time: new Date().toISOString() });
}
