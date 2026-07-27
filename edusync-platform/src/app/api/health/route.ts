export function GET() {
  return Response.json(
    { status: "ok", service: "edusync-platform" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
