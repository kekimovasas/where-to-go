import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
};

export async function GET() {
  const { data: collections, error: collectionsError } = await supabase
    .from("collections")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (collectionsError) {
    const missingTable =
      collectionsError.code === "PGRST205" ||
      collectionsError.message.toLowerCase().includes("could not find the table");

    if (missingTable) {
      return NextResponse.json({ data: [] }, { headers: noStoreHeaders });
    }

    return NextResponse.json(
      { error: collectionsError.message },
      {
        status: 500,
        headers: noStoreHeaders
      }
    );
  }

  const collectionIds = (collections ?? []).map((collection) => collection.id);

  if (collectionIds.length === 0) {
    return NextResponse.json({ data: [] }, { headers: noStoreHeaders });
  }

  const { data: items, error: itemsError } = await supabase
    .from("collection_items")
    .select("*")
    .in("collection_id", collectionIds)
    .order("sort_order", { ascending: true });

  if (itemsError) {
    return NextResponse.json(
      { error: itemsError.message },
      {
        status: 500,
        headers: noStoreHeaders
      }
    );
  }

  const itemsByCollectionId = new Map<string, unknown[]>();

  for (const item of items ?? []) {
    const collectionId = String(item.collection_id ?? "");
    const currentItems = itemsByCollectionId.get(collectionId) ?? [];

    currentItems.push(item);
    itemsByCollectionId.set(collectionId, currentItems);
  }

  const data = (collections ?? []).map((collection) => ({
    ...collection,
    items: itemsByCollectionId.get(String(collection.id)) ?? []
  }));

  return NextResponse.json({ data }, { headers: noStoreHeaders });
}
