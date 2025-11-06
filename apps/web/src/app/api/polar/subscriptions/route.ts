import { api } from "@/lib/polar-client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await api.products.list({
      organizationId: process.env.POLAR_ORGANIZATION_ID!,
      isRecurring: true,
    });

    const products = result.result?.items || [];

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching Polar subscription products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
