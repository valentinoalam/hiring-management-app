import React, { useState, useEffect, useImperativeHandle, Ref, useCallback  } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.js';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command.js';
import Image from 'next/image';
import { Input } from '../ui/input';

// Helper to construct a free CDN URL based on the ISO code (e.g., US -> https://flagcdn.com/16x12/us.png)
const getFlagUrl = (code: string) => `https://flagcdn.com/${code.toLowerCase()}.svg`;

// Country interface to match REST Countries API response
interface Country {
  code: string;
  name: string;
  dial: string;
  flagUrl: string;
}

interface PhoneInputProps extends React.ComponentPropsWithoutRef<"input"> {
  onPhoneChange?: (fullNumber: string, isValid: boolean) => void;
  maxLength?: number;
  allowedCharacters?: RegExp;
  showValidation?: boolean;
  value?: string;
  ref?: Ref<unknown> | undefined;
}
const initialCountries = [
  { code: 'ID', name: 'Indonesia', dial: '+62', flagUrl: getFlagUrl('ID') },
  { code: 'US', name: 'United States', dial: '+1', flagUrl: getFlagUrl('US') },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flagUrl: getFlagUrl('GB') },
  { code: 'CA', name: 'Canada', dial: '+1', flagUrl: getFlagUrl('CA') },
  { code: 'AU', name: 'Australia', dial: '+61', flagUrl: getFlagUrl('AU') },
  { code: 'DE', name: 'Germany', dial: '+49', flagUrl: getFlagUrl('DE') },
  { code: 'FR', name: 'France', dial: '+33', flagUrl: getFlagUrl('FR') },
];

const DEFAULT_MAX_LENGTH = 15;
const DEFAULT_ALLOWED_CHARS = /[\d\s()-]/g;

// Helper function to parse initial phone number
const parseInitialPhoneNumber = (initialValue: string, countries: Country[]) => {
  if (!initialValue) return { country: initialCountries[0], phoneNumber: '' };

  // Remove all non-digit and non-plus characters for parsing
  const cleanValue = initialValue.replace(/[^\d+]/g, '');
  
  // Find matching country by dial code
  let matchedCountry = initialCountries[0]; // Default to Indonesia
  let phoneNumber = cleanValue;

  // Sort countries by dial code length (longest first) to avoid partial matches
  const sortedCountries = [...countries].sort((a, b) => b.dial.length - a.dial.length);
  
  for (const country of sortedCountries) {
    const dialWithoutPlus = country.dial.replace('+', '');
    if (cleanValue.startsWith(dialWithoutPlus)) {
      matchedCountry = country;
      phoneNumber = cleanValue.slice(dialWithoutPlus.length);
      break;
    }
  }

  // If no country found but starts with +, try to find in all countries
  if (cleanValue.startsWith('+') && matchedCountry === initialCountries[0]) {
    for (const country of sortedCountries) {
      if (cleanValue.startsWith(country.dial)) {
        matchedCountry = country;
        phoneNumber = cleanValue.slice(country.dial.length);
        break;
      }
    }
  }

  return { country: matchedCountry, phoneNumber };
};

export default function PhoneInput({ 
  onPhoneChange, 
  maxLength = DEFAULT_MAX_LENGTH,
  allowedCharacters = DEFAULT_ALLOWED_CHARS,
  showValidation = false,
  value = '', 
  ref, 
  ...props }: PhoneInputProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(initialCountries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [open, setOpen] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

// Expose values via ref
  useImperativeHandle(ref, () => ({
    getFullPhoneNumber: () => {
      return selectedCountry ? `${selectedCountry.dial}${phoneNumber.replace(/\s/g, '')}` : '';
    },
    getCountryCode: () => {
      return selectedCountry?.dial || '';
    },
    getPhoneNumber: () => {
      return phoneNumber;
    },
    isValid: () => {
      return isValid;
    }
  }));

  // Validation state
  const isValid = phoneNumber.length >= 10 && phoneNumber.length <= maxLength;
  const showError = showValidation && isTouched && !isValid;


  const filterAndLimitInput = (input: string): string => {
    // Step 1: Filter out unwanted characters
    const filtered = input.replace(new RegExp(`[^${allowedCharacters.source.slice(1, -2)}]`, 'g'), '');
    
    // Step 2: Apply length limit
    return filtered.slice(0, maxLength);
  };

  const formatPhoneNumber = useCallback((value: string): string => {
    // Remove all non-digits for formatting logic
    const digitsOnly = value.replace(/\D/g, '');
    const limitedDigits = digitsOnly.slice(0, maxLength);
    // Apply formatting based on length
    if (limitedDigits.length <= 3) {
      return limitedDigits;
    } else if (limitedDigits.length <= 6) {
      return `${limitedDigits.slice(0, 3)} ${limitedDigits.slice(3)}`;
    } else if (limitedDigits.length <= 9) {
      return `${limitedDigits.slice(0, 3)} ${limitedDigits.slice(3, 6)} ${limitedDigits.slice(6)}`;
    } else {
      return `${limitedDigits.slice(0, 3)} ${limitedDigits.slice(3, 6)} ${limitedDigits.slice(6, 9)} ${limitedDigits.slice(9, 12)}`;
    }
  }, [maxLength]);
const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Filter and limit the input - keep only digits
    const filteredValue = filterAndLimitInput(rawValue);
    
    // Format the phone number
    const formattedValue = formatPhoneNumber(filteredValue);
    
    setPhoneNumber(formattedValue);
    setIsTouched(true);
    
    // Notify parent component
    const fullNumber = selectedCountry ? `${selectedCountry.dial}${filteredValue}` : '';
    onPhoneChange?.(fullNumber, isValid);
  }, [filterAndLimitInput, formatPhoneNumber, selectedCountry, onPhoneChange, isValid]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    
    // Filter and limit pasted content - keep only digits
    const filteredValue = filterAndLimitInput(pastedData);
    const formattedValue = formatPhoneNumber(filteredValue);
    
    setPhoneNumber(formattedValue);
    setIsTouched(true);
    
    // Notify parent component
    const fullNumber = selectedCountry ? `${selectedCountry.dial}${filteredValue}` : '';
    onPhoneChange?.(fullNumber, isValid);
  }, [filterAndLimitInput, formatPhoneNumber, selectedCountry, onPhoneChange, isValid]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow only specific keys: digits, backspace, delete, tab, arrow keys
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 
      'ArrowUp', 'ArrowDown', 'Home', 'End'
    ];
    
    if (!/^\d$/.test(e.key) && !allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  }, []);

  const handleCountrySelect = useCallback((country: Country) => {
    setSelectedCountry(country);
    setOpen(false);
    
    // Notify parent about change
    const fullNumber = `${country.dial}${phoneNumber.replace(/\s/g, '')}`;
    onPhoneChange?.(fullNumber, isValid);
  }, [phoneNumber, onPhoneChange, isValid]);

  // Initialize with value prop on mount
  useEffect(() => {
    if (value && !isInitialized) {
      const { country, phoneNumber: parsedPhoneNumber } = parseInitialPhoneNumber(value, countries);
      setSelectedCountry(country);
      setPhoneNumber(formatPhoneNumber(parsedPhoneNumber));
      setIsInitialized(true);
    }
  }, [value, countries, isInitialized, formatPhoneNumber]);

  // Fetch countries data from REST Countries API - only once on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/countries');
        
        if (!response.ok) {
          throw new Error('Failed to fetch countries');
        }
        
        const data = await response.json();

        // Transform the API data to match our structure
        const countriesData: Country[] = data.data || [];

        if (countriesData.length > 0) {
          setCountries(countriesData);
          
          // If we have an initial value and haven't initialized yet, use the new countries data
          if (value && !isInitialized) {
            const { country, phoneNumber: parsedPhoneNumber } = parseInitialPhoneNumber(value, countriesData);
            setSelectedCountry(country);
            setPhoneNumber(formatPhoneNumber(parsedPhoneNumber));
            setIsInitialized(true);
          } else if (!isInitialized) {
            // Set default selected country to Indonesia if available, otherwise first country
            const idCountry: Country | undefined = countriesData.find(country => country.code === 'ID');
            setSelectedCountry(idCountry || countriesData[0] || null);
            setIsInitialized(true);
          }
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
        // If API fails, we already have initialCountries as fallback
        if (value && !isInitialized) {
          const { country, phoneNumber: parsedPhoneNumber } = parseInitialPhoneNumber(value, initialCountries);
          setSelectedCountry(country);
          setPhoneNumber(formatPhoneNumber(parsedPhoneNumber));
          setIsInitialized(true);
        }
        setIsInitialized(true); // Mark as initialized even if API fails
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we haven't initialized and have API endpoint
    if (!isInitialized) {
      fetchCountries();
    }
  }, [value, isInitialized, formatPhoneNumber]); // Remove countries from dependencies
  
  // Initialize with value prop if provided (for cases where API is not used)
  // useEffect(() => {
  //   if (value && !isInitialized && countries.length > 0) {
  //     const { country, phoneNumber: parsedPhoneNumber } = parseInitialPhoneNumber(value, countries);
  //     setSelectedCountry(country);
  //     setPhoneNumber(formatPhoneNumber(parsedPhoneNumber));
  //     setIsInitialized(true);
  //   }
  // }, [value, countries, isInitialized, formatPhoneNumber]);
  
  // Notify parent when country changes
  useEffect(() => {
    if (isTouched && isInitialized) {
      const fullNumber = selectedCountry ? `${selectedCountry.dial}${phoneNumber.replace(/\s/g, '')}` : '';
      onPhoneChange?.(fullNumber, isValid);
    }
  }, [isTouched, isValid, onPhoneChange, phoneNumber, selectedCountry, isInitialized]);

  return (
    <div className="flex flex-col gap-2">
        <div 
          {...props} 
          className={`
            flex h-10 border-2 rounded-lg overflow-hidden 
            focus-within:ring-2 focus-within:ring-neutral-100 focus-within:border-transparent
            ${showError 
              ? 'border-red-500 bg-red-50' 
              : 'border-neutral-40 bg-neutral-10'
            }
            ${props.className || ''}
          `}
        >
        {/* 1. Country Selector Popover (Trigger) */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              data-testid="popover-trigger"
              role="combobox"
              aria-controls=''
              aria-expanded={open}
              className="flex items-center gap-1 px-4 border-r border-neutral-40 bg-transparent hover:bg-neutral-20 transition-colors"
              disabled={!selectedCountry}
            >
              {/* --- FLAG IMAGE URL USED HERE --- */}
              {selectedCountry && (
                <Image width={16} height={12}
                  src={selectedCountry.flagUrl}
                  alt={`${selectedCountry.name} flag`}
                  className="w-4 h-4 rounded-full overflow-hidden border border-neutral-50 bg-gray-200 shrink-0 object-cover"
                />
              )}
              {/* --- END FLAG IMAGE --- */}
              
              <ChevronDown className="w-4 h-4 text-neutral-100" strokeWidth={1.5} />
            </button>
          </PopoverTrigger>

          {/* Popover Content (List) */}
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search country..." />
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  {countries.map((country) => (
                    <CommandItem
                      key={country.code}
                      value={`${country.name} ${country.dial} ${country.code}`}
                      onSelect={() => handleCountrySelect(country)}
                      className="cursor-pointer"
                    >
                      {/* --- FLAG IMAGE URL USED HERE (in the list) --- */}
                      <Image width={16} height={12}
                        src={country.flagUrl}
                        alt={`${country.name} flag`}
                        className="w-4 h-3 rounded-sm object-cover mr-2"
                      />
                      {/* --- END FLAG IMAGE --- */}
                      <span className="flex-1">{country.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {country.dial}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
            {loading && (
              <div className="flex h-10 border-2 border-neutral-40 bg-neutral-10 rounded-lg overflow-hidden">
                <div className="flex items-center justify-center px-4 border-r border-neutral-40">
                  <div className="w-4 h-3 bg-neutral-20 rounded-sm animate-pulse"></div>
                </div>
                <div className="flex-1 px-4 flex items-center">
                  <div className="w-full h-4 bg-neutral-20 rounded animate-pulse"></div>
                </div>
              </div>
            )}
          </PopoverContent>
        </Popover>

        <span className="flex items-center px-3 text-sm leading-6 text-neutral-90 font-sans border-r border-neutral-40">
          {selectedCountry?.dial || ''}
        </span>

        {/* Phone Number Input */}
        <Input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onBlur={() => setIsTouched(true)}
          disabled={!selectedCountry}
          placeholder="123 456 789 0"
          maxLength={maxLength + 5} // Extra space for formatting characters
          className="flex-1 px-4 text-sm leading-6 text-neutral-100 placeholder:text-neutral-60 font-sans bg-transparent border-none focus:ring-0 focus:outline-none"
        />
      </div>
    </div>
  );
}