import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const apiKey = process.env.SHOP2TOPUP_API_KEY;
  const baseUrl = process.env.SHOP2TOPUP_BASE_URL ?? "https://shop2topup.com/api/endpoints/v1";

  if (!apiKey) {
    return NextResponse.json(
      { configured: false, message: "Falta configurar SHOP2TOPUP_API_KEY en el servidor." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(`${baseUrl}/account`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ configured: true, success: false, error: data?.error?.code ?? "PROVIDER_ERROR" }, { status: response.status });
    }
    return NextResponse.json({ configured: true, success: true, account: data.account ?? data });
  } catch {
    return NextResponse.json({ configured: true, success: false, error: "PROVIDER_UNAVAILABLE" }, { status: 502 });
  }
}
