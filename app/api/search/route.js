import runtime from "@/lib/analysis/runtime";

const { searchService } = runtime;

export const dynamic = "force-dynamic";

export async function GET(request) {
  const query = request.nextUrl.searchParams.get("query") || "";
  const response = await searchService.searchSymbols(query);

  return Response.json(response, {
    status: response.status === "error" ? 400 : 200,
  });
}
