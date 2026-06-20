import { rgb } from 'pdf-lib';

const STRAY_ICON_MASK = { x: 318, y: 2, w: 72, h: 24 };
const PHONE_TEXT_MASK = { x: 300, y: 18, w: 210, h: 18 };

const fixLetterheadFooter = (page) => {
  const white = rgb(1, 1, 1);

  const stray = STRAY_ICON_MASK;
  page.drawRectangle({ x: stray.x, y: stray.y, width: stray.w, height: stray.h, color: white, borderWidth: 0 });

  const mask = PHONE_TEXT_MASK;
  page.drawRectangle({ x: mask.x, y: mask.y, width: mask.w, height: mask.h, color: white, borderWidth: 0 });
};

export const shrinkLetterheadPhoneIconOnAllPages = async (pdfDoc) => {
  const pages = pdfDoc.getPages();
  for (const page of pages) {
    fixLetterheadFooter(page);
  }
};
