"use client";

import { createContext, useContext } from "react";

interface SearchModeValue {
  searchMode: boolean;
  setSearchMode: (active: boolean) => void;
}

const SearchModeContext = createContext<SearchModeValue>({
  searchMode: false,
  setSearchMode: () => {},
});

export const SearchModeProvider = SearchModeContext.Provider;

export function useSearchMode() {
  return useContext(SearchModeContext);
}
