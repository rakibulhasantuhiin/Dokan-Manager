/**
 * Utility functions for Bengali digits, currency formatting, and date display
 */

const EN_TO_BN_DIGITS: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

const BN_TO_EN_DIGITS: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

const BN_MONTHS = [
  'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'
];

/**
 * Converts English number or string with digits to Bengali numeral string
 */
export function toBengaliNumber(val: number | string): string {
  if (val === undefined || val === null || val === '') return '০';
  const str = String(val);
  return str.replace(/[0-9]/g, (digit) => EN_TO_BN_DIGITS[digit] || digit);
}

/**
 * Converts Bengali numeral string to English number string
 */
export function fromBengaliNumber(val: string): string {
  if (!val) return '';
  return val.replace(/[০-৯]/g, (digit) => BN_TO_EN_DIGITS[digit] || digit);
}

/**
 * Formats a currency value with Bengali Taka symbol (৳) and Bengali comma grouping
 * Example: 6384 -> "৳ ৬,৩৮৪"
 */
export function formatTaka(amount: number): string {
  if (isNaN(amount) || amount === 0) return '৳ ০';
  const isNegative = amount < 0;
  const absVal = Math.round(Math.abs(amount));
  
  // Format with standard Indian/South Asian grouping: last 3 digits, then groups of 2
  const str = absVal.toString();
  let result = '';
  if (str.length <= 3) {
    result = str;
  } else {
    const lastThree = str.slice(-3);
    const remaining = str.slice(0, -3);
    const groups: string[] = [];
    let rem = remaining;
    while (rem.length > 2) {
      groups.unshift(rem.slice(-2));
      rem = rem.slice(0, -2);
    }
    if (rem.length > 0) {
      groups.unshift(rem);
    }
    result = groups.join(',') + ',' + lastThree;
  }
  
  const bnNumber = toBengaliNumber(result);
  return `${isNegative ? '-' : ''}৳ ${bnNumber}`;
}

/**
 * Formats a date in Bengali format like "৮ নভে, ২০২৬"
 */
export function formatBengaliDate(dateInput: string | Date | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const day = toBengaliNumber(d.getDate());
  const month = BN_MONTHS[d.getMonth()];
  const year = toBengaliNumber(d.getFullYear());
  return `${day} ${month}, ${year}`;
}

/**
 * Formats a date and time in Bengali like "৮ নভে, ২০২৬, ০৪:১৫ অপরাহ্ন"
 */
export function formatBengaliDateTime(dateInput: string | Date | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const dateStr = formatBengaliDate(d);
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'অপরাহ্ন' : 'পূর্বাহ্ন';
  hours = hours % 12 || 12;
  const hoursStr = toBengaliNumber(hours);
  const minutesStr = toBengaliNumber(minutes < 10 ? '0' + minutes : minutes);
  return `${dateStr}, ${hoursStr}:${minutesStr} ${ampm}`;
}
