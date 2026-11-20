import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";

const base = (process.env.SHOP2TOPUP_BASE_URL || "https://shop2topup.com/api/endpoints/v1").replace(/\/$/, "");

function rows(value: any): any[] {
  if (Array.isArray(value)) return value;
  for (const key of ["categories", "subcategories", "big_categories", "items", "results"]) {
    if (Array.isArray(value?.[key])) return value[key];
    if (Array.isArray(value?.data?.[key])) return value.data[key];
  }
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

async function providerGet(path: string, key: string) {
  const response = await fetch(base + path, {
    headers: { Authorization: "Bearer " + key, Accept: "application/json" },
    cache: "no-store",
  });
  const body = await response.json();
  if (!response.ok || body?.success === false) {
    throw new Error(body?.error?.message || body?.error?.code || "Shop2TopUp no respondió correctamente.");
  }
  return body;
}

export async function GET(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const gameName = new URL(request.url).searchParams.get("game")?.trim();
  if (!gameName) return NextResponse.json({ error: "Indica el nombre del juego que deseas importar." }, { status: 400 });

  const normalize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  const normalizedGame = normalize(gameName);
  const aliases: Record<string, string[]> = {
    "free fire": ["free fire", "freefire", "garena free fire"],
    "mlbb": ["mobile legends", "mobile legends bang bang", "mlbb"],
    "mobile legends": ["mobile legends", "mobile legends bang bang", "mlbb"],
  };
  const terms = aliases[normalizedGame] || [normalizedGame];
  const matchesGame = (value: string) => {
    const normalized = normalize(value);
    return terms.some(term => normalized.includes(normalize(term)));
  };
  const isLatam = (value: string) => /\\b(latam|latin america|south america|central america|latin american|latinoamerica|latinoamerica|america latina|sudamerica|sur america)\\b/i.test(normalize(value));
  const key = process.env.SHOP2TOPUP_API_KEY;
  if (!key) return NextResponse.json({ error: "Falta configurar Shop2TopUp." }, { status: 503 });

  try {
    const bigBody = await providerGet("/catalog/big-categories", key);
    const bigCategories = rows(bigBody);
    const found: any[] = [];
    const seenCategories: string[] = [];
    const candidateTypes: Record<string, number> = {};
    const regionSamples = new Set<string>();
    const gameCandidates: any[] = [];

    for (const big of bigCategories) {
      const bigId = big.id ?? big.big_category_id;
      if (bigId == null) continue;
      const categoryBody = await providerGet("/catalog/categories?bigCategoryId=" + encodeURIComponent(String(bigId)), key);
      for (const category of rows(categoryBody)) {
        const categoryId = category.id ?? category.category_id;
        if (categoryId == null) continue;
        const categoryName = String(category.name || category.title || "");
        const bigName = String(big.name || big.title || "");
        seenCategories.push(categoryName || bigName || String(categoryId));
        const subBody = await providerGet("/catalog/subcategories?categoryId=" + encodeURIComponent(String(categoryId)), key);
        for (const item of rows(subBody)) {
          const name = String(item.name || item.title || item.product_name || "");
          const description = String(item.description || "");
          const itemCategoryName = String(item.category_name || "");
          const gameText = [bigName, categoryName, itemCategoryName, name, description].join(" ");
          if (!matchesGame(gameText)) continue;

          const productType = String(item.product_type || item.fulfillment_type || "").toLowerCase();
          candidateTypes[productType || "(sin tipo)"] = (candidateTypes[productType || "(sin tipo)"] || 0) + 1;
          const regionText = [
            item.region, item.region_name, item.server, item.server_name,
            item.country, item.country_name, item.market, item.market_name,
            item.description, item.name, item.title
          ].filter(Boolean).join(" ");
          if (regionText) regionSamples.add(regionText.slice(0, 120));

          const itemId = item.item_id ?? item.id;
          const latam = isLatam(regionText);
          if (productType !== "topup" || itemId == null) {
            if (gameCandidates.length < 12) gameCandidates.push({ name, product_type: productType || null, category: categoryName, region_fields: regionText || null });
            continue;
          }
          if (!latam) {
            if (gameCandidates.length < 12) gameCandidates.push({ name, product_type: productType, category: categoryName, region_fields: regionText || "No se encontró región explícita" });
            continue;
          }
          found.push({
            name,
            quantity: String(item.quantity || description || name),
            shop2topup_id: String(itemId),
            category_id: String(categoryId),
            product_type: "topup",
            region: "LATAM",
          });
        }
      }
    }

    return NextResponse.json({
      packages: found,
      diagnostics: found.length ? undefined : {
        requested_game: gameName,
        categories_seen: seenCategories.slice(0, 40),
        game_candidate_count: Object.values(candidateTypes).reduce((a, b) => a + b, 0),
        product_types: candidateTypes,
        samples: gameCandidates,
        note: "Solo se importan productos topup con región LATAM identificada explícitamente. No se infiere LATAM a partir de America."
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "No se pudo consultar el catálogo.",
    }, { status: 502 });
  }
}
