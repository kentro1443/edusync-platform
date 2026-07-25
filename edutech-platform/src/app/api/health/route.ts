export function GET() {
  return Response.json(
    { status: "ok", service: "edutech-platform" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
