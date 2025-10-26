import { useState, useEffect, Dispatch, SetStateAction } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function useDebouncedValidation(fieldName: string, form: any, delay = 500) {
  const [inputValue, setInputValue] = useState<string>(''); // Explicit string type
  
  useEffect(() => {
    if (inputValue.length === 0) return
    const handler = setTimeout(() => {
      form.setValue(fieldName, inputValue);
      form.trigger(fieldName);
    }, delay);

    return () => clearTimeout(handler);
  }, [inputValue, fieldName, form, delay]);

  return [inputValue, setInputValue] as [string, Dispatch<SetStateAction<string>>];
  }