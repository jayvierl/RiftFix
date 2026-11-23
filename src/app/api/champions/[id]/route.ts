import { NextRequest, NextResponse } from "next/server";
import { getChampionDetail } from "@/lib/ddragon";

export const runtime = "nodejs";
export const revalidate = 86400;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const detail = await getChampionDetail(id);
    if (!detail) {
      return NextResponse.json({ error: "Champion not found." }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch {
    return NextResponse.json(
      { error: "Could not load champion detail from Data Dragon." },
      { status: 502 }
    );
  }
}
