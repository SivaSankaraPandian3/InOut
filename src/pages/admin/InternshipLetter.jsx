import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  CircularProgress
} from '@mui/material';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import Swal from 'sweetalert2';
import letterheadUrl from '../../assets/letterhead.pdf';

const InternshipLetter = () => {
  // simple form (no candidate lookup) to support students
  const [form, setForm] = useState({
    studentName: '',
    collegeName: '',
    registrationNumber: '',
    designation: 'Intern',
    company: '',
    duration: '',
    startDate: '',
    endDate: ''
  });
  const [titleText, setTitleText] = useState('INTERNSHIP CERTIFICATE');
  const [letterDate, setLetterDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [body, setBody] = useState(`\n\nTo Whom It May Concern,\n\nThis is to certify that {{studentName}}{{#college}}{{ , of }}{{collegeName}}{{/college}}{{#reg}}{{ (Reg. No: {{registrationNumber}}) }}{{/reg}} has successfully completed an internship at {{company}} in the role of {{designation}} for a duration of {{duration}}, from {{startDate}} to {{endDate}}.\n\nDuring the internship period, {{studentName}} was actively involved in the assigned tasks and responsibilities. The intern demonstrated a positive attitude, professional conduct, and a strong willingness to learn and adapt. They showed commitment toward understanding practical concepts and contributed responsibly to the work assigned during the training period.\n\nThroughout the internship, {{studentName}} maintained discipline, punctuality, and effective communication, and worked well under guidance and supervision. Their performance and behavior during the internship period were found to be satisfactory.\n\nThis certificate is issued upon the request of {{studentName}} and may be used for academic, professional, or personal reference purposes.\n\nWe wish {{studentName}} every success in their future academic pursuits and professional career.\n\nSincerely,\nHR Team\n{{company}}`);

  const [pdfUrl, setPdfUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [signatureFile, setSignatureFile] = useState(null);
  const [signatureBytes, setSignatureBytes] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSignatureUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setSignatureFile(file);
    setSignaturePreview(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = () => setSignatureBytes(reader.result);
    reader.readAsArrayBuffer(file);
  };

  // simple placeholder replace (supports optional fields by leaving tokens empty)
  const replacePlaceholders = (template, data) => {
    return template.replace(/{{\s*studentName\s*}}/gi, data.studentName || '')
      .replace(/{{\s*collegeName\s*}}/gi, data.collegeName || '')
      .replace(/{{\s*registrationNumber\s*}}/gi, data.registrationNumber || '')
      .replace(/{{\s*designation\s*}}/gi, data.designation || '')
      .replace(/{{\s*company\s*}}/gi, data.company || '')
      .replace(/{{\s*duration\s*}}/gi, data.duration || '')
      .replace(/{{\s*startDate\s*}}/gi, data.startDate || '')
      .replace(/{{\s*endDate\s*}}/gi, data.endDate || '');
  };

  const generatePdf = async () => {
    setGenerating(true);
    try {
      const resp = await fetch(letterheadUrl);
      const arrayBuffer = await resp.arrayBuffer();
      const srcPdf = await PDFDocument.load(arrayBuffer);
      const pdfDoc = await PDFDocument.create();

      const [copiedFirst] = await pdfDoc.copyPages(srcPdf, [0]);
      pdfDoc.addPage(copiedFirst);
      let page = pdfDoc.getPage(0);
      const { width, height } = page.getSize();

      const margins = { top: 143, bottom: 146, left: 40, right: 10 };

      const finalBody = replacePlaceholders(body, form);
      const lines = finalBody.split('\n');

  const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  let fontBold = fontRegular;
  try { fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold); } catch (e) {}
  // Title/bold color (#2b2b2b) and body color (#858585)
  const titleColor = rgb(53 / 255, 53 / 255, 53 / 255); // #2b2b2b
  const bodyColor = rgb(60 / 255, 60 / 255, 60 / 255); // #858585

      const contentTop = height - margins.top;
      const contentWidth = width - margins.left - margins.right;

      // date and title inside margins
      const fontDateSize = 10;
      let dateStr = '';
      try { dateStr = letterDate ? new Date(letterDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-GB'); } catch (e) { dateStr = new Date().toLocaleDateString('en-GB'); }
      const dateWidth = fontRegular.widthOfTextAtSize(dateStr, fontDateSize);
      const dateX = margins.left + (contentWidth - dateWidth);
      const dateY = contentTop - fontDateSize;
  page.drawText(dateStr, { x: dateX, y: dateY, size: fontDateSize, font: fontRegular, color: bodyColor });

      const titleSize = 16;
      const titleWidth = fontBold.widthOfTextAtSize(titleText, titleSize);
      const titleX = margins.left + (contentWidth - titleWidth) / 2;
      const titleY = contentTop - titleSize - 6;
  page.drawText(titleText, { x: titleX, y: titleY, size: titleSize, font: fontBold, color: titleColor });

      const fontSize = 12;
      const lineHeight = fontSize + 4;
      let cursorY = titleY - 14;
      const maxWidth = contentWidth;

      // letter spacing in points (adds small tracking between characters)
      const letterSpacing = 0.5;
      // width of a single space in the chosen font (used for wrapping)
      const spaceWidth = fontRegular.widthOfTextAtSize(' ', fontSize) + letterSpacing;

      const measureWord = (text, font) => {
        if (!text) return 0;
        return font.widthOfTextAtSize(text, fontSize) + letterSpacing * Math.max(0, text.length - 1);
      };
      const tokenizeLineForBold = (line) => {
        const parts = []; const pattern = /\*\*(.+?)\*\*/g; let lastIndex = 0; let match;
        while ((match = pattern.exec(line)) !== null) {
          if (match.index > lastIndex) parts.push({ text: line.slice(lastIndex, match.index), bold: false });
          parts.push({ text: match[1], bold: true });
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < line.length) parts.push({ text: line.slice(lastIndex), bold: false });
        return parts;
      };

      for (const rawLine of lines) {
        const segments = tokenizeLineForBold(rawLine);
        const words = [];
        segments.forEach(seg => seg.text.split(/\s+/).filter(Boolean).forEach(w => words.push({ text: w, bold: !!seg.bold })));

        let lineWords = []; let lineWidth = 0;
        const flushLine = async () => {
          if (lineWords.length === 0) return;
          if (cursorY - lineHeight < margins.bottom) {
            const [bg] = await pdfDoc.copyPages(srcPdf, [0]); pdfDoc.addPage(bg); page = pdfDoc.getPage(pdfDoc.getPageCount() - 1); cursorY = height - margins.top - fontSize;
          }
          let x = margins.left;
          for (let i = 0; i < lineWords.length; i++) {
            const wobj = lineWords[i];
            const usedFont = wobj.bold ? fontBold : fontRegular;
            // draw word character-by-character to apply letterSpacing
            let cx = x;
              for (let ci = 0; ci < wobj.text.length; ci++) {
              const ch = wobj.text[ci];
              const charColor = wobj.bold ? titleColor : bodyColor;
              page.drawText(ch, { x: cx, y: cursorY, size: fontSize, font: usedFont, color: charColor });
              const cw = usedFont.widthOfTextAtSize(ch, fontSize);
              cx += cw + letterSpacing;
            }
            const w = measureWord(wobj.text, usedFont);
            x += w; if (i !== lineWords.length - 1) x += spaceWidth;
          }
          cursorY -= lineHeight; lineWords = []; lineWidth = 0;
        };

        for (let i = 0; i < words.length; i++) {
          const wobj = words[i]; const usedFont = wobj.bold ? fontBold : fontRegular; const wordWidth = measureWord(wobj.text, usedFont);
          const extra = lineWords.length > 0 ? spaceWidth : 0;
          if (lineWidth + extra + wordWidth > maxWidth) await flushLine();
          lineWords.push(wobj); lineWidth = lineWidth + (lineWords.length > 1 ? spaceWidth : 0) + wordWidth;
        }
        await flushLine(); cursorY -= lineHeight / 2;
      }

      if (signatureBytes && signatureFile) {
        try {
          const sigUint8 = new Uint8Array(signatureBytes);
          let embeddedSig = null; const mime = signatureFile.type || '';
          if (mime.includes('png')) embeddedSig = await pdfDoc.embedPng(sigUint8); else embeddedSig = await pdfDoc.embedJpg(sigUint8);
          const maxSigWidth = 150; const maxSigHeight = 80; const origW = embeddedSig.width || 1; const origH = embeddedSig.height || 1;
          const scale = Math.min(1, maxSigWidth / origW, maxSigHeight / origH); const sigDims = embeddedSig.scale(scale);

          // place signature where content ends (below cursorY)
          let targetPage = pdfDoc.getPage(pdfDoc.getPageCount() - 1);
          let targetY = cursorY - lineHeight * 1.2;
          if (targetY < margins.bottom) {
            const [bg] = await pdfDoc.copyPages(srcPdf, [0]); pdfDoc.addPage(bg); targetPage = pdfDoc.getPage(pdfDoc.getPageCount() - 1); const { height: newH } = targetPage.getSize(); targetY = newH - margins.top - lineHeight * 2;
          }
          const x = margins.left;
          targetPage.drawImage(embeddedSig, { x, y: targetY, width: sigDims.width, height: sigDims.height });
        } catch (sigErr) { console.error('Signature embed error', sigErr); }
      }

      const pdfBytes = await pdfDoc.save(); const blob = new Blob([pdfBytes], { type: 'application/pdf' }); setPdfUrl(URL.createObjectURL(blob));
  } catch (err) { console.error('PDF generation error', err); Swal.fire({ icon: 'error', title: 'Failed', text: 'Failed to generate PDF. See console for details.' }); } finally { setGenerating(false); }
  };

  const downloadPdf = () => { if (!pdfUrl) return; const a = document.createElement('a'); a.href = pdfUrl; a.download = `${form.studentName || 'internship-certificate'}.pdf`; a.click(); };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Internship Certificate</Typography>
      <Box sx={{ display: 'flex', gap: 4 }}>
        <Box sx={{ flex: 1 }}>
          <TextField label="Student Name" fullWidth sx={{ mb: 2 }} value={form.studentName} onChange={(e) => handleChange('studentName', e.target.value)} />
          <TextField label="College Name (optional)" fullWidth sx={{ mb: 2 }} value={form.collegeName} onChange={(e) => handleChange('collegeName', e.target.value)} />
          <TextField label="Registration Number (optional)" fullWidth sx={{ mb: 2 }} value={form.registrationNumber} onChange={(e) => handleChange('registrationNumber', e.target.value)} />
          <TextField label="Designation / Role" fullWidth sx={{ mb: 2 }} value={form.designation} onChange={(e) => handleChange('designation', e.target.value)} />
          <TextField label="Company" fullWidth sx={{ mb: 2 }} value={form.company} onChange={(e) => handleChange('company', e.target.value)} />
          <TextField label="Duration (e.g. 3 months)" fullWidth sx={{ mb: 2 }} value={form.duration} onChange={(e) => handleChange('duration', e.target.value)} />
          <TextField label="Start Date" type="date" fullWidth sx={{ mb: 2 }} value={form.startDate} onChange={(e) => handleChange('startDate', e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField label="End Date" type="date" fullWidth sx={{ mb: 2 }} value={form.endDate} onChange={(e) => handleChange('endDate', e.target.value)} InputLabelProps={{ shrink: true }} />

          <TextField label="Title" fullWidth sx={{ mb: 2 }} value={titleText} onChange={(e) => setTitleText(e.target.value)} />
          <TextField label="Letter Date" type="date" fullWidth sx={{ mb: 2 }} value={letterDate} onChange={(e) => setLetterDate(e.target.value)} InputLabelProps={{ shrink: true }} />

          <TextField label="Letter Body" multiline minRows={6} fullWidth value={body} onChange={(e) => setBody(e.target.value)} sx={{ mb: 2 }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Signature (upload PNG/JPG)</Typography>
            <input type="file" accept="image/*" onChange={handleSignatureUpload} />
            {signaturePreview && (<Box sx={{ mt: 1 }}><img src={signaturePreview} alt="signature preview" style={{ maxWidth: 200, maxHeight: 80 }} /></Box>)}
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={generatePdf} disabled={generating}>{generating ? 'Generating...' : 'Generate Preview'}</Button>
            <Button variant="outlined" onClick={downloadPdf} disabled={!pdfUrl}>Download PDF</Button>
          </Box>
        </Box>

        <Box sx={{ width: 420, minHeight: 553, border: '1px solid #eee' }}>
          {pdfUrl ? (<iframe title="Preview" src={pdfUrl} width="100%" height="553px" />) : (<Box sx={{ p: 2 }}><Typography variant="body2" color="text.secondary">Preview will appear here after generating.</Typography></Box>)}
        </Box>
      </Box>
    </Container>
  );
};

export default InternshipLetter;
