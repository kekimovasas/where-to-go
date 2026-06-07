import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("places")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    const missingTable =
      error.code === "PGRST205" ||
      error.message.toLowerCase().includes("could not find the table");

    if (missingTable) {
      return NextResponse.json({ data: [] });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
