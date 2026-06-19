/** pdf-lib standard fonts only support WinAnsi encoding; unsupported characters
 * (smart quotes, em dashes, ₹, emoji, etc.) throw at drawText time and abort the
 * whole PDF. Replace common ones with safe equivalents, then drop anything else
 * the given font(s) can't encode, so letter generation never crashes on input text. */
const REPLACEMENTS = {
  '‘': "'", '’': "'", '‚': "'", '′': "'",
  '“': '"', '”': '"', '„': '"', '″': '"',
  '–': '-', '—': '-', '−': '-',
  '…': '...',
  '•': '-', '●': '-', '◦': '-',
  '₹': 'Rs.',
  ' ': ' ',
  '​': '', '‌': '', '‍': '', '﻿': '',
};

const REPLACEMENT_PATTERN = new RegExp(`[${Object.keys(REPLACEMENTS).join('')}]`, 'g');

const isEncodableBy = (font, ch) => {
  try {
    font.widthOfTextAtSize(ch, 10);
    return true;
  } catch {
    return false;
  }
};

export const sanitizeTextForStandardFonts = (text, fonts) => {
  if (!text) return text;
  const fontList = Array.isArray(fonts) ? fonts : [fonts];
  const replaced = text.replace(REPLACEMENT_PATTERN, (ch) => REPLACEMENTS[ch] ?? '');

  let result = '';
  for (const ch of replaced) {
    if (ch === '\n' || fontList.every((font) => isEncodableBy(font, ch))) {
      result += ch;
    } else if (ch === ' ' || ch === '\t') {
      result += ' ';
    }
  }
  return result;
};
