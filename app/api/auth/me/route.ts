import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/auth/auth-service";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: sessionUser.user,
  });
}
