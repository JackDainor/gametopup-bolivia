import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";

const base = (process.env.SHOP2TOPUP_BASE_URL || "https://shop2topup.com/api/endpoints/v1").replace(/\/$/, "");

function rows(value: any): any[] {
  if (Array.isArray(value)) return value;
  for (const key of ["categories", "subcategories", "big_categories", "items", "results"]) {
    if (Array.isArray(value?.[key])) return value[key];
    if (Array.isArray(value?.data?.[key])) return value.data[key];
  }
  return Array.isArray(value?.data) ? value.data : [];
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

const normalize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const regionAliases: Record<string, string[]> = {
  "LATAM": ["latam", "latin america", "latin american", "south america", "central america", "latinamerica", "latinoamerica", "america latina", "sudamerica"],
  "Brasil": ["brazil", "brasil"],
  "Global": ["global", "worldwide", "international"],
  "Norteamérica": ["north america", "northamerican", "usa", "united states", "canada"],
  "Europa": ["europe", "european"],
  "CIS": ["cis", "commonwealth of independent states"],
  "MENA": ["mena", "middle east", "north africa"],
  "Asia": ["asia", "asian"],
  "Singapur": ["singapore"],
  "Vietnam": ["vietnam"],
  "Taiwán": ["taiwan"],
  "Indonesia": ["indonesia"],
  "Bangladesh": ["bangladesh"],
  "Pakistán": ["pakistan"],
  "India": ["india"],
  "Tailandia": ["thailand"],
  "Filipinas": ["philippines"],
  "Malasia": ["malaysia"],
  "Turquía": ["turkey", "turkiye"],
  "Japón": ["japan"],
  "Corea": ["korea", "south korea"],
  "África": ["africa"],
};

function detectRegion(value: string): string | null {
  const text = " " + normalize(value) + " ";
  for (const [region, aliases] of Object.entries(regionAliases)) {
    if (aliases.some(alias => text.includes(" " + normalize(alias) + " "))) return region;
  }
  return null;
}

export async function GET(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const gameName = params.get("game")?.trim();
  const requestedRegion = params.get("region")?.trim();
  const mode = params.get("mode");
  const normalizedGame = normalize(gameName || "");
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
  const key = process.env.SHOP2TOPUP_API_KEY;
  if (!key) return NextResponse.json({ error: "Falta configurar Shop2TopUp." }, { status: 503 });

  try {
    const bigCategories = rows(await providerGet("/catalog/big-categories", key));
    if (mode === "games") {
      const games = Array.from(new Set(bigCategories
        .map((item: any) => String(item.name || item.title || item.game_name || "").trim())
        .filter(Boolean)));
      games.sort((a, b) => a.localeCompare(b, "es"));
      return NextResponse.json({ games });
    }
    if (!gameName) return NextResponse.json({ error: "Selecciona un juego del catálogo de Shop2TopUp." }, { status: 400 });
    const candidates: any[] = [];
    const candidateTypes: Record<string, number> = {};
    const categoriesSeen: string[] = [];

    for (const big of bigCategories) {
      const bigId = big.id ?? big.big_category_id;
      if (bigId == null) continue;
      const bigName = String(big.name || big.title || "");
      const categories = rows(await providerGet("/catalog/categories?bigCategoryId=" + encodeURIComponent(String(bigId)), key));
      for (const category of categories) {
        const categoryId = category.id ?? category.category_id;
        if (categoryId == null) continue;
        const categoryName = String(category.name || category.title || "");
        categoriesSeen.push(bigName + " > " + categoryName);
        const items = rows(await providerGet("/catalog/subcategories?categoryId=" + encodeURIComponent(String(categoryId)), key));
        for (const item of items) {
          const name = String(item.name || item.title || item.product_name || "");
          const description = String(item.description || "");
          const itemCategoryName = String(item.category_name || "");
          const gameText = [bigName, categoryName, itemCategoryName, name, description].join(" ");
          if (!matchesGame(gameText)) continue;

          const productType = String(item.product_type || item.fulfillment_type || "").toLowerCase();
          candidateTypes[productType || "(sin tipo)"] = (candidateTypes[productType || "(sin tipo)"] || 0) + 1;
          const regionText = [
            bigName, categoryName, itemCategoryName,
            item.region, item.region_name, item.server, item.server_name,
            item.country, item.country_name, item.market, item.market_name,
          ].filter(Boolean).join(" ");
          const region = detectRegion(regionText);
          const itemId = item.item_id ?? item.id;
          if (productType !== "topup" || itemId == null || !region) continue;

          candidates.push({
            name,
            quantity: String(item.quantity || description || name),
            shop2topup_id: String(itemId),
            category_id: String(categoryId),
            product_type: "topup",
            region,
          });
        }
      }
    }

    const regionCounts = new Map<string, number>();
    for (const item of candidates) regionCounts.set(item.region, (regionCounts.get(item.region) || 0) + 1);
    const regions = Array.from(regionCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));

    if (mode === "regions" || !requestedRegion) {
      return NextResponse.json({
        regions,
        diagnostics: regions.length ? undefined : {
          requested_game: gameName,
          categories_seen: categoriesSeen.filter(value => matchesGame(value)).slice(0, 80),
          candidate_count: Object.values(candidateTypes).reduce((a, b) => a + b, 0),
          product_types: candidateTypes,
          note: "No se detectaron regiones conocidas en los campos de categoría del catálogo."
        }
      });
    }

    const normalizedRegion = normalize(requestedRegion);
    const selected = candidates.filter(item => normalize(item.region) === normalizedRegion);
    return NextResponse.json({
      packages: selected,
      region: requestedRegion,
      diagnostics: selected.length ? undefined : { available_regions: regions, note: "No hay paquetes topup para la región seleccionada." }
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "No se pudo consultar el catálogo.",
    }, { status: 502 });
  }
}
