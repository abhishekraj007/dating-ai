import { NextResponse } from "next/server";
import { api } from "@/lib/polar-client";

export async function GET() {
  try {
    // Fetch all products from Polar
    const response = await api.products.list({
      organizationId: process.env.POLAR_ORGANIZATION_ID!,
      isRecurring: false, // Get one-time purchase products (credits)
    });

    const products = response.result?.items || [];

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching Polar products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
