import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
};

export async function GET() {
  const { data, error } = await supabase
    .from("categories")
    .select("*");

  if (error) {
    const missingTable =
      error.code === "PGRST205" ||
      error.message.toLowerCase().includes("could not find the table");

    if (missingTable) {
      return NextResponse.json({ data: [] }, { headers: noStoreHeaders });
    }

    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: noStoreHeaders
      }
    );
  }

  return NextResponse.json(
    { data: data ?? [] },
    { headers: noStoreHeaders }
  );
}
