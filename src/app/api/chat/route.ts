import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Placeholder route for Cloud Run Doctor chat.
 * No agent logic is implemented in foundation.
 */
export const POST = async () => {
  return NextResponse.json(
    {
      errorCode: "DOCTOR_NOT_IMPLEMENTED",
    },
    { status: 501 }
  );
};
