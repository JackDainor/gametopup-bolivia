import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.SHOP2TOPUP_API_KEY;
  const baseUrl = process.env.SHOP2TOPUP_BASE_URL || "https://shop2topup.com/api/endpoints/v1";
  if (!apiKey) return NextResponse.json({ error: "La validación de jugadores no está configurada." }, { status: 503 });
  try {
    const { sub_category_id, player_id, requirements = {} } = await request.json();
    if (!sub_category_id || !String(player_id || "").trim()) return NextResponse.json({ error: "Selecciona un paquete e ingresa el ID." }, { status: 400 });
    const response = await fetch(baseUrl + "/player/validate", {
      method: "POST", headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ sub_category_id: Number(sub_category_id), player_id: String(player_id).trim(), ...requirements }), cache: "no-store"
    });
    const data = await response.json();
    if (!response.ok || data.success === false) return NextResponse.json({ error: data?.error?.message || data?.error?.code || "No se pudo validar el jugador.", code: data?.error?.code }, { status: response.status });
    return NextResponse.json({ success: true, player: data.player || data.data || data });
  } catch { return NextResponse.json({ error: "No se pudo conectar con Shop2TopUp." }, { status: 502 }); }
}
