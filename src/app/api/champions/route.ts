import { NextResponse } from "next/server";
import { getChampions } from "@/lib/ddragon";

export const runtime = "nodejs";
export const revalidate = 86400;

export async function GET() {
  try {
    const { version, champions } = await getChampions();
    return NextResponse.json({ version, champions });
  } catch {
    return NextResponse.json(
      { error: "Could not load champion data from Data Dragon." },
      { status: 502 }
    );
  }
}
