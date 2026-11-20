import { NextResponse } from "next/server";

const base = (process.env.SHOP2TOPUP_BASE_URL || "https://shop2topup.com/api/endpoints/v1").replace(/\/$/, "");

async function providerGet(path: string, apiKey: string) {
  const response = await fetch(base + path, {
    headers: { Authorization: "Bearer " + apiKey, Accept: "application/json" },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.success === false) {
    const error: any = new Error(body?.error?.message || body?.error?.code || "Error de Shop2TopUp");
    error.status = response.status;
    error.code = body?.error?.code;
    throw error;
  }
  return body;
}

function getRows(body: any, key: string) {
  if (Array.isArray(body?.[key])) return body[key];
  if (Array.isArray(body?.data?.[key])) return body.data[key];
  if (Array.isArray(body?.data)) return body.data;
  return [];
}

export async function POST(request: Request) {
  const apiKey = process.env.SHOP2TOPUP_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "La validación de jugadores no está configurada." }, { status: 503 });

  try {
    const body = await request.json();
    const itemId = Number(body.sub_category_id);
    const categoryId = Number(body.category_id);
    const playerId = String(body.player_id || "").trim();
    const supplied = body.requirements && typeof body.requirements === "object" ? body.requirements : {};

    if (!Number.isSafeInteger(itemId) || itemId <= 0 || !playerId) {
      return NextResponse.json({ error: "Selecciona un paquete válido e ingresa tu ID de jugador." }, { status: 400 });
    }
    if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
      return NextResponse.json({ error: "Este paquete no tiene configurada su categoría de validación. Vuelve a importarlo desde el panel administrador." }, { status: 400 });
    }

    // Shop2TopUp exige consultar primero los requisitos de la categoría.
    const reqBody = await providerGet("/catalog/category/" + categoryId + "/requirements", apiKey);
    const fields = getRows(reqBody, "requirements");
    const missing = fields
      .filter((field: any) => field?.field_name && field.field_name !== "player_id")
      .filter((field: any) => field.required !== false && (supplied[field.field_name] === undefined || supplied[field.field_name] === ""))
      .map((field: any) => field.field_name);

    if (missing.length) {
      return NextResponse.json({
        error: "Este juego requiere datos adicionales para validar la cuenta: " + missing.join(", ") + ".",
        code: "MISSING_REQUIRED_FIELD",
        required_fields: fields,
      }, { status: 422 });
    }

    const response = await fetch(base + "/player/validate", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sub_category_id: itemId,
        player_id: playerId,
        ...supplied,
      }),
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      const code = data?.error?.code || "VALIDATION_FAILED";
      const messages: Record<string, string> = {
        PLAYER_NOT_FOUND: "No encontramos ese ID de jugador. Revisa los números e inténtalo nuevamente.",
        PLAYER_CHECK_UNAVAILABLE: "El servicio no pudo verificar el ID en este momento. No significa que el ID sea incorrecto; inténtalo más tarde.",
        REGION_MISMATCH: "La región de tu cuenta no coincide con este paquete.",
        INVALID_API_KEY: "La conexión de validación tiene un problema de autenticación. Contacta al administrador.",
        IP_NOT_ALLOWED: "El servidor de la tienda no está autorizado por Shop2TopUp. Contacta al administrador.",
        MISSING_REQUIRED_FIELD: "Falta un dato obligatorio para validar esta cuenta.",
      };
      return NextResponse.json({
        error: messages[code] || data?.error?.message || "No se pudo validar el jugador.",
        code,
      }, { status: response.status });
    }

    const player = data.player || data.data?.player || data.data || data;
    if (!player?.player_name) {
      return NextResponse.json({ error: "La API aceptó la consulta, pero no devolvió el nombre del jugador. No se puede confirmar la identidad.", code: "PLAYER_NAME_MISSING" }, { status: 502 });
    }
    return NextResponse.json({
      success: true,
      player: {
        player_id: player.player_id || playerId,
        player_name: player.player_name,
        region: player.region || player.zone_id || null,
      },
    });
  } catch (error: any) {
    const status = Number(error?.status) || 502;
    return NextResponse.json({
      error: error?.message || "No se pudo conectar con Shop2TopUp.",
      code: error?.code || "PROVIDER_CONNECTION_ERROR",
    }, { status });
  }
}
