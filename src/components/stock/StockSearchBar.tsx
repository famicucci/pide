"use client";

import { useRef } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface StockSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchMode: boolean;
  onSearchModeChange: (active: boolean) => void;
  className?: string;
  inputClassName?: string;
}

export function StockSearchBar({
  value,
  onChange,
  placeholder,
  searchMode,
  onSearchModeChange,
  className,
  inputClassName,
}: StockSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function exitSearchMode() {
    onChange("");
    onSearchModeChange(false);
    inputRef.current?.blur();
  }

  return (
    <div
      className={cn(
        searchMode &&
          "sticky top-0 z-40 -mx-4 bg-muted/95 px-4 py-2 backdrop-blur sm:-mx-8 sm:px-8 md:static md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-none",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onFocus={() => onSearchModeChange(true)}
            placeholder={placeholder}
            className={cn("h-12 bg-white pl-9", inputClassName)}
          />
        </div>
        {searchMode && (
          <Button
            variant="ghost"
            size="icon"
            onClick={exitSearchMode}
            aria-label="Cerrar búsqueda"
            className="h-12 w-12 shrink-0 md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
