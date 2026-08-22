import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Placeholder route for Cloud Run Doctor chat.
 * No agent logic is implemented in foundation.
 */
export async function POST() {
  return NextResponse.json(
    {
      message:
        "Doctor no implementado en la fundación. La investigación se añadirá en SPEC-004.",
    },
    { status: 501 }
  );
}
