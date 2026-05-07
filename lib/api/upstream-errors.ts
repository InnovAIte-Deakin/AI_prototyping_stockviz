import { NextResponse } from "next/server";

type UpstreamErrorInput = {
  body: string;
  publicMessage: string;
  service: string;
  status: number;
};

export function upstreamErrorResponse({
  body,
  publicMessage,
  service,
  status,
}: UpstreamErrorInput) {
  console.warn(`${service} upstream request failed`, {
    bodyPreview: body.slice(0, 300),
    status,
  });

  return NextResponse.json({ error: publicMessage }, { status });
}
