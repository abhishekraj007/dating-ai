import { NextResponse } from "next/server";
import { fetchAction, api } from "@/lib/convex-client";

export async function GET() {
  try {
    const products = await fetchAction(api.features.dodo.actions.listCatalog, {
      recurring: false,
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching Dodo products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
