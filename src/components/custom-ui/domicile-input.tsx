"use client";

import * as React from "react";
import { Check, ChevronsUpDown, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

interface WilayahItem {
  kode: string;
  nama: string;
  tipe: string;
}

interface WilayahAutocompleteProps extends Omit<
  React.ComponentProps<'input'>, 
  'value' | 'onChange' | 'onBlur' | 'disabled' | 'placeholder' | 'className'
> {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  allowTypedInput?: boolean;
}

export function WilayahAutocomplete({
  value,
  onChange,
  onBlur,
  disabled = false,
  placeholder = "Pilih domisili...",
  className,
  allowTypedInput = true,
  ...props
}: WilayahAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [results, setResults] = React.useState<WilayahItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<WilayahItem | null>(null);
  const [typedInput, setTypedInput] = React.useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Check if current value is a typed input (not a wilayah code)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isTypedInput = React.useMemo(() => {
    return value && !selectedItem && value !== "";
  }, [value, selectedItem]);

  // Fetch search results
  React.useEffect(() => {
    const searchWilayah = async () => {
      if (debouncedSearch.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/wilayah/search?q=${encodeURIComponent(debouncedSearch)}&limit=10`
        );
        
        if (response.ok) {
          const data = await response.json();
          setResults(data.data || []);
        }
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    searchWilayah();
  }, [debouncedSearch]);

  // Find selected item when value changes
  React.useEffect(() => {
    const findSelectedItem = async () => {
      if (!value) {
        setSelectedItem(null);
        setTypedInput("");
        return;
      }

      // If value looks like a typed input (not a typical wilayah code pattern)
      if (allowTypedInput && !/^\d{2,13}$/.test(value)) {
        setSelectedItem(null);
        setTypedInput(value);
        return;
      }

      if (selectedItem?.kode === value) {
        return;
      }
      // If we have a value but no selected item, try to find it
      try {
        const response = await fetch(
          // Search by the exact kode to retrieve the full item data
          `/api/wilayah/search?kode=${encodeURIComponent(value)}&limit=1`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data.length > 0) {
            // Update selectedItem to reflect the name/tipe of the new kode
            setSelectedItem(data.data[0]);
          } else {
            // If the code is not found, clear the selection
            setSelectedItem(null);
            if (allowTypedInput && value) {
              setTypedInput(value);
            }
          }
        }
      } catch (error) {
        console.error("Failed to find selected item:", error);
        setSelectedItem(null);
        if (allowTypedInput && value) {
          setTypedInput(value);
        }
      }
    };

    findSelectedItem();
  }, [value, selectedItem, allowTypedInput]);

  const handleSelect = (item: WilayahItem) => {
    setSelectedItem(item);
    onChange?.(item.nama);
    setTypedInput("");
    setOpen(false);
    setSearchQuery("");
  };

  const handleTypedInput = () => {
    if (allowTypedInput && searchQuery.trim()) {
      onChange?.(searchQuery.trim());
      setTypedInput(searchQuery.trim());
      setSelectedItem(null);
      setOpen(false);
      setSearchQuery("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && allowTypedInput && searchQuery.trim()) {
      e.preventDefault();
      // If there are results, select the first one
      if (results.length > 0) {
        handleSelect(results[0]);
      } else {
        // If no results, use the typed input
        handleTypedInput();
      }
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      provinsi: "🏛️",
      kabupaten: "🏢", 
      kecamatan: "🏠",
      desa: "📍",
    };
    return icons[type as keyof typeof icons] || "📌";
  };

  const getTypeColor = (type: string) => {
    const colors = {
      provinsi: "text-blue-600 bg-blue-50",
      kabupaten: "text-green-600 bg-green-50",
      kecamatan: "text-purple-600 bg-purple-50", 
      desa: "text-orange-600 bg-orange-50",
    };
    return colors[type as keyof typeof colors] || "text-gray-600 bg-gray-50";
  };

  const showTypedInputOption = allowTypedInput && 
    searchQuery.length >= 2 && 
    !loading && 
    results.length === 0;

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between h-10 px-3 py-2 text-sm",
              (!selectedItem && !typedInput) && "text-muted-foreground"
            )}
            disabled={disabled}
            onBlur={onBlur}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {selectedItem ? (
                <>
                  <span className={cn("text-xs px-2 py-1 rounded", getTypeColor(selectedItem.tipe))}>
                    {getTypeIcon(selectedItem.tipe)}
                  </span>
                  <span className="truncate">{selectedItem.nama}</span>
                </>
              ) : typedInput ? (
                <>
                  <span className={cn("text-xs px-2 py-1 rounded", "text-gray-600 bg-gray-50")}>
                    ✏️
                  </span>
                  <span className="truncate">{typedInput}</span>
                </>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <CommandInput
                placeholder="Cari provinsi, kabupaten, kecamatan, atau desa..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                onKeyDown={handleKeyDown}
                className="border-none focus:ring-0"
              />
              {loading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <CommandList>
              <CommandEmpty className="py-6 text-center text-sm">
                {searchQuery.length < 2 ? (
                  "Ketik minimal 2 karakter untuk mencari"
                ) : loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mencari...
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                    <div>Tidak ada hasil untuk &quot;{searchQuery}&quot;</div>
                    <div className="text-xs text-muted-foreground">
                      Coba kata kunci lain
                    </div>
                  </div>
                )}
              </CommandEmpty>
              {results.length > 0 && (
                <CommandGroup>
                  {results.map((item) => (
                    <CommandItem
                      key={item.kode}
                      value={item.nama}
                      onSelect={() => handleSelect(item)}
                      className="flex items-center gap-3 py-3 cursor-pointer"
                    >
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full",
                        getTypeColor(item.tipe)
                      )}>
                        <span className="text-sm">{getTypeIcon(item.tipe)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {item.nama}
                          </span>
                          {selectedItem?.nama === item.nama && (
                            <Check className="h-4 w-4 shrink-0" />
                          )}
                        </div>
                        {/* <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "text-xs px-2 py-1 rounded-full capitalize",
                            getTypeColor(item.tipe)
                          )}>
                            {item.tipe}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {item.kode}
                          </span>
                        </div> */}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {/* Typed input option */}
              {showTypedInputOption && (
                <CommandGroup>
                  <CommandItem
                    onSelect={handleTypedInput}
                    className="flex items-center gap-3 py-3 cursor-pointer border-t"
                  >
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full",
                      "text-gray-600 bg-gray-50"
                    )}>
                      <span className="text-sm">✏️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          Gunakan &quot;{searchQuery}&quot;
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Input typed
                      </div>
                    </div>
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Hidden input for form submission */}
      <Input type="hidden" name="domicile" value={value || ""} readOnly {...props} />
    </div>
  );
}