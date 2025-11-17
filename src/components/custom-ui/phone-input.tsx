import React, { useState, useEffect } from 'react';
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
const initialCountries = [
  { code: 'ID', name: 'Indonesia', dial: '+62', flagUrl: getFlagUrl('ID') },
  { code: 'US', name: 'United States', dial: '+1', flagUrl: getFlagUrl('US') },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flagUrl: getFlagUrl('GB') },
  { code: 'CA', name: 'Canada', dial: '+1', flagUrl: getFlagUrl('CA') },
  { code: 'AU', name: 'Australia', dial: '+61', flagUrl: getFlagUrl('AU') },
  { code: 'DE', name: 'Germany', dial: '+49', flagUrl: getFlagUrl('DE') },
  { code: 'FR', name: 'France', dial: '+33', flagUrl: getFlagUrl('FR') },
];
export default function PhoneInput({ ...props }: React.ComponentProps<"input">) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(initialCountries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch countries data from REST Countries API
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,idd,flags');
        const data = await response.json();

        // Transform the API data to match our structure
        const transformedCountries: Country[] = data
          .filter((country: { idd: { root?: string; suffixes?: string[] } }) => country.idd.root && country.idd.suffixes)
          .map((country: { cca2: string; name: { common: string }; idd: { root: string; suffixes: string[] } }) => {
            // Get the first suffix for the dial code (most countries have only one)
            const dialSuffix = country.idd.suffixes[0] || '';
            const dialCode = `${country.idd.root}${dialSuffix}`;
            
            return {
              code: country.cca2,
              name: country.name.common,
              dial: dialCode,
              flagUrl: getFlagUrl(country.cca2)
            };
          })
          // Sort countries alphabetically by name
          .sort((a: Country, b: Country) => a.name.localeCompare(b.name));

        setCountries(transformedCountries);
        
        // Set default selected country to United States if available, otherwise first country
        const idCountry: Country | undefined = transformedCountries.find(country => country.code === 'ID');
        setSelectedCountry(idCountry || transformedCountries[0] || null);
      } catch (error) {
        console.error('Error fetching countries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  const handlePhoneChange = (e: { target: { value: string; }; }) => {
    const value = e.target.value.replace(/[^\d\s()-]/g, '');
    setPhoneNumber(value);
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setOpen(false);
  };

  return (
    <div className="flex h-10 border-2 border-neutral-40 bg-neutral-10 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-neutral-100 focus-within:border-transparent">

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

      {/* 3. Phone Number Input */}
      <Input {...props}
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder="123 456 7890"
        className="flex-1 px-4 text-sm leading-6 text-neutral-100 placeholder:text-neutral-60 font-sans bg-transparent border-none focus:ring-0 focus:outline-none"
        disabled={!selectedCountry}
      />
    </div>
  );
}