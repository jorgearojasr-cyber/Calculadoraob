"use server";

import { searchContent, type SearchResult } from "@/lib/search";

export async function searchSuggestionsAction(query: string): Promise<SearchResult[]> {
  const results = await searchContent(query);
  return results.slice(0, 8);
}
