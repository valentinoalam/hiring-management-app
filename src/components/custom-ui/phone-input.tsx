import React, { useState, useEffect, useImperativeHandle, Ref  } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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

export default function PhoneInput({ 
  onPhoneChange, 
  maxLength = DEFAULT_MAX_LENGTH,
  allowedCharacters = DEFAULT_ALLOWED_CHARS,
  showValidation = false,
  ref, 
  ...props }: PhoneInputProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(initialCountries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [open, setOpen] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const formatPhoneNumber = (value: string): string => {
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
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Filter and limit the input
    const filteredValue = filterAndLimitInput(rawValue);
    
    // Format the phone number
    const formattedValue = formatPhoneNumber(filteredValue);
    
    setPhoneNumber(formattedValue);
    setIsTouched(true);
    
    // Notify parent component
    const fullNumber = selectedCountry ? `${selectedCountry.dial}${filteredValue.replace(/\s/g, '')}` : '';
    onPhoneChange?.(fullNumber, isValid);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    
    // Filter and limit pasted content
    const filteredValue = filterAndLimitInput(pastedData);
    const formattedValue = formatPhoneNumber(filteredValue);
    
    setPhoneNumber(formattedValue);
    setIsTouched(true);
    
    // Notify parent component
    const fullNumber = selectedCountry ? `${selectedCountry.dial}${filteredValue.replace(/\s/g, '')}` : '';
    onPhoneChange?.(fullNumber, isValid);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow only specific keys: digits, backspace, delete, tab, arrow keys
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 
      'ArrowUp', 'ArrowDown', 'Home', 'End'
    ];
    
    if (!/^\d$/.test(e.key) && !allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setOpen(false);
    
    // Notify parent about change
    const fullNumber = `${country.dial}${phoneNumber.replace(/\s/g, '')}`;
    onPhoneChange?.(fullNumber, isValid);
  };

  // Fetch countries data from REST Countries API
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/countries');
        const data = await response.json();

        // Transform the API data to match our structure
        const countriesData: Country[] = data.data;

        setCountries(countriesData);
        
        // Set default selected country to United States if available, otherwise first country
        const idCountry: Country | undefined = countriesData.find(country => country.code === 'ID');
        setSelectedCountry(idCountry || countriesData[0] || null);
      } catch (error) {
        console.error('Error fetching countries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);
  
  // Notify parent when country changes
  useEffect(() => {
      if (isTouched) {
        const fullNumber = selectedCountry ? `${selectedCountry.dial}${phoneNumber.replace(/\s/g, '')}` : '';
        onPhoneChange?.(fullNumber, isValid);
      }
    }, [isTouched, isValid, onPhoneChange, phoneNumber, selectedCountry]);
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

        {/* 2. Dial Code Display (Restored) */}
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