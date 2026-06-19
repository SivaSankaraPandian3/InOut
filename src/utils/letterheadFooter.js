import { rgb, StandardFonts } from 'pdf-lib';

const STRAY_ICON_MASK = { x: 318, y: 2, w: 72, h: 24 };
const PHONE_TEXT_MASK = { x: 300, y: 18, w: 210, h: 18 };
const HEADER_ADDRESS_MASK = { x: 90, y: 749, w: 410, h: 15 };
const HEADER_CIN_GST_MASK = { x: 90, y: 735, w: 410, h: 13 };
const HEADER_TITLE_MASK = { x: 35, y: 765, w: 500, h: 40 };
const HEADER_TITLE_TEXT = 'Urbancode Edutech Solutions Pvt Ltd';
const HEADER_TITLE_X = 53;
const HEADER_TITLE_Y = 756;
const HEADER_TITLE_SIZE = 20;
const HEADER_TITLE_COLOR = rgb(53 / 255, 53 / 255, 53 / 255);

const fixLetterheadFooter = (page, titleFont) => {
  const white = rgb(1, 1, 1);

  const stray = STRAY_ICON_MASK;
  page.drawRectangle({ x: stray.x, y: stray.y, width: stray.w, height: stray.h, color: white, borderWidth: 0 });

  const mask = PHONE_TEXT_MASK;
  page.drawRectangle({ x: mask.x, y: mask.y, width: mask.w, height: mask.h, color: white, borderWidth: 0 });

  const addressMask = HEADER_ADDRESS_MASK;
  page.drawRectangle({ x: addressMask.x, y: addressMask.y, width: addressMask.w, height: addressMask.h, color: white, borderWidth: 0 });

  const cinGstMask = HEADER_CIN_GST_MASK;
  page.drawRectangle({ x: cinGstMask.x, y: cinGstMask.y, width: cinGstMask.w, height: cinGstMask.h, color: white, borderWidth: 0 });

  const titleMask = HEADER_TITLE_MASK;
  page.drawRectangle({ x: titleMask.x, y: titleMask.y, width: titleMask.w, height: titleMask.h, color: white, borderWidth: 0 });
  page.drawText(HEADER_TITLE_TEXT, {
    x: HEADER_TITLE_X,
    y: HEADER_TITLE_Y,
    size: HEADER_TITLE_SIZE,
    font: titleFont,
    color: HEADER_TITLE_COLOR,
  });
};

export const shrinkLetterheadPhoneIconOnAllPages = async (pdfDoc) => {
  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();
  for (const page of pages) {
    fixLetterheadFooter(page, titleFont);
  }
};
