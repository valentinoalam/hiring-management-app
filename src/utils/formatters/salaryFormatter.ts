/**
 * Helper function to round a number down to the nearest thousand if it's 100,000 or greater.
 * E.g., 5,750,000 -> 5,750,000
 * E.g., 9,999 -> 9,999
 * E.g., 10,000 -> 10,000 (No rounding applied for 5 digits, as requested for > 5 digits)
 * E.g., 1,250,789 -> 1,250,000 (Rounds down to nearest thousand)
 */
const roundToNearestThousand = (num: number): number => {
  // Check if the number has more than 5 digits (i.e., >= 100,000)
  if (num >= 1000000) {
    // Math.floor(num / 1000) truncates the last three digits.
    // Multiplying by 1000 restores the magnitude, resulting in a number rounded down to the nearest thousand.
    return Math.floor(num / 1000) * 1000;
  }
  return num; // Return the original number if it's 5 digits or less
};

// --- IMPROVED FORMATTER ---
export const formatSalary = (salary: number, currencyCode: string): string => {
  // 1. Apply the rounding logic
  const roundedSalary = roundToNearestThousand(salary);

  // 2. Format the rounded number
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currencyCode, // Use the provided ISO currency code (e.g., 'IDR')
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(roundedSalary);
};

// --- DISPLAY FUNCTION (NO CHANGES NEEDED HERE) ---
export const salaryDisplay = (min: number | null, max: number | null, currency: string) => {
  if (!min && !max) return "Salary not specified";
  if (min && max) return `${formatSalary(min, currency)} - ${formatSalary(max, currency)}`;
  if (min) return `From ${formatSalary(min, currency)}`;
  return `Up to ${formatSalary(max || 0, currency)}`;
};