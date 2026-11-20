import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";

const base = (process.env.SHOP2TOPUP_BASE_URL || "https://shop2topup.com/api/endpoints/v1").replace(/\/$/, "");

function rows(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.items)) return value.data.items;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
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

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const key = process.env.SHOP2TOPUP_API_KEY;
  if (!key) return NextResponse.json({ error: "Falta configurar Shop2TopUp." }, { status: 503 });

  try {
    const bigBody = await providerGet("/catalog/big-categories", key);
    const bigCategories = rows(bigBody);
    const found: any[] = [];

    for (const big of bigCategories) {
      const bigId = big.id ?? big.big_category_id;
      if (bigId == null) continue;
      const categoryBody = await providerGet("/catalog/categories?bigCategoryId=" + encodeURIComponent(String(bigId)), key);
      for (const category of rows(categoryBody)) {
        const categoryId = category.id ?? category.category_id;
        if (categoryId == null) continue;
        const categoryName = String(category.name || category.title || "");
        const bigName = String(big.name || big.title || "");
        const subBody = await providerGet("/catalog/subcategories?categoryId=" + encodeURIComponent(String(categoryId)), key);
        for (const item of rows(subBody)) {
          const name = String(item.name || item.title || item.product_name || "");
          const isFreeFire = /free\s*fire|garena/i.test([bigName, categoryName, name].join(" "));
          const isTopup = String(item.product_type || "").toLowerCase() === "topup";
          const itemId = item.item_id ?? item.id;
          if (!isFreeFire || !isTopup || itemId == null) continue;
          found.push({
            name,
            quantity: String(item.quantity || item.description || name),
            shop2topup_id: String(itemId),
            category_id: String(categoryId),
            product_type: "topup",
          });
        }
      }
    }

    return NextResponse.json({ packages: found });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "No se pudo consultar el catálogo.",
    }, { status: 502 });
  }
}
