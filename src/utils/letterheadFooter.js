import { StandardFonts, rgb } from 'pdf-lib';

const STRAY_ICON_MASK = { x: 318, y: 2, w: 72, h: 24 };
const PHONE_TEXT_MASK = { x: 368, y: 22, w: 132, h: 14 };
const PHONE_NUMBER = '+91 98787 98797';
const PHONE_TEXT_SIZE = 10;
const PHONE_TEXT_Y = 25.5; // slightly below original letterhead baseline
const PHONE_RIGHT_PAD = 118;

const fixLetterheadFooter = async (page, pdfDoc) => {
  const white = rgb(1, 1, 1);
  const textColor = rgb(0.2, 0.2, 0.2);
  const { width } = page.getSize();

  const stray = STRAY_ICON_MASK;
  page.drawRectangle({ x: stray.x, y: stray.y, width: stray.w, height: stray.h, color: white, borderWidth: 0 });

  const mask = PHONE_TEXT_MASK;
  page.drawRectangle({ x: mask.x, y: mask.y, width: mask.w, height: mask.h, color: white, borderWidth: 0 });

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const textWidth = font.widthOfTextAtSize(PHONE_NUMBER, PHONE_TEXT_SIZE);
  page.drawText(PHONE_NUMBER, {
    x: width - PHONE_RIGHT_PAD - textWidth,
    y: PHONE_TEXT_Y,
    size: PHONE_TEXT_SIZE,
    font,
    color: textColor,
  });
};

export const shrinkLetterheadPhoneIconOnAllPages = async (pdfDoc) => {
  const pages = pdfDoc.getPages();
  for (const page of pages) {
    await fixLetterheadFooter(page, pdfDoc);
  }
};
