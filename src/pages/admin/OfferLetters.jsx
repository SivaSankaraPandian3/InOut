import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../utils/api';
import {
  Box,
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Select,
  MenuItem,
  TextField,
  Button,
  FormControl,
  InputLabel,
  CircularProgress
} from '@mui/material';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import letterheadUrl from '../../assets/letterhead.pdf';
import Swal from 'sweetalert2';
import { shrinkLetterheadPhoneIconOnAllPages } from '../../utils/letterheadFooter';

const SIGN_OFF_GAP = 14;
const MIN_PAGE_BOTTOM = 88;

const stripSignOffFromBody = (text) => {
  const lines = text.split('\n');
  const signOffIndex = lines.findIndex((line) => /^\s*(\*\*)?warm\s+regards?,?(\*\*)?\s*$/i.test(line.trim()));
  if (signOffIndex >= 0) return lines.slice(0, signOffIndex).join('\n').trimEnd();
  return text;
};

const OfferLetters = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('');
  const [form, setForm] = useState({
    candidateName: '',
    designation: '',
    company: '',
    salary: '',
    addressLine1: '',
    addressLine2: '',
    joiningDate: '',
    email: '',
    probationPeriod: '',
    workingHours: '',
    workLocation: '',
    noticePeriod: '',
    founderName: 'Sivagaminathan',
  });
  const [titleText, setTitleText] = useState('OFFER LETTER');
  const [letterDate, setLetterDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [body, setBody] = useState(`To,
{{name}},
{{addressLine1}},
{{addressLine2}}.

**Subject: Offer Letter for the Position of {{designation}}**

**Dear {{name}},**

We are pleased to offer you the position of **{{designation}}** at **{{company}}**. Based on your qualifications, experience, and performance during the selection process, we believe that you will be a valuable addition to our team.

Your employment with **{{company}}** will commence on **{{joiningDate}}**. On your joining date, you will be required to report to your designated reporting manager or management representative. Your annual compensation for this position will be **{{salary}}**, along with other benefits and entitlements as per the company's policies.

Your roles and responsibilities will be communicated in detail by your reporting manager. We expect you to perform your duties with dedication, professionalism, and integrity while adhering to all company policies, rules, and regulations.

This offer of employment is subject to the successful verification of all documents, credentials, and information provided by you during the recruitment process.

During your employment with **{{company}}**, you will be required to maintain strict confidentiality regarding company information, internal processes, client data, and any other proprietary information. Any breach of confidentiality or professional conduct may result in disciplinary action, including termination of employment.

To confirm your acceptance of this offer, please sign and return a copy of this letter or provide your confirmation via email before your joining date.

We are excited to welcome you to the **{{company}}** team and look forward to your contributions and success with us. We wish you a rewarding and successful career journey ahead.

If you have any questions or require further clarification, please feel free to contact the Founder.`);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfBytesData, setPdfBytesData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [signatureFile, setSignatureFile] = useState(null);
  const [signatureBytes, setSignatureBytes] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(API_ENDPOINTS.getUsers, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const active = (res.data || []).filter(u => u.isActive && u.role === 'employee');
        setCandidates(active);
      } catch (err) {
        console.error('Failed to fetch candidates', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  useEffect(() => {
    if (!selected) return;
    const cand = candidates.find(c => c._id === selected);
    if (cand) {
      setForm(prev => ({
        ...prev,
        candidateName: cand.name || '',
        designation: cand.position || '',
        company: cand.company || '',
        salary: cand.salary || '',
        addressLine1: cand.addressLine1 || cand.address?.line1 || cand.address?.addressLine1 || cand.location || '',
        addressLine2: cand.addressLine2 || cand.address?.line2 || cand.address?.addressLine2 || cand.city || '',
        joiningDate: cand.dateOfJoining ? cand.dateOfJoining.slice(0, 10) : '',
        email: cand.email || '',
        probationPeriod: cand.probationPeriod || '',
        workingHours: cand.workingHours || '',
        workLocation: cand.workLocation || '',
        noticePeriod: cand.noticePeriod || '',
      }));
    }
  }, [selected, candidates]);

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

  const formatJoiningDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(`${dateStr}T12:00:00`);
      if (Number.isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const sanitizeBoldMarkers = (text) => {
    let out = text.replace(/\*\*([^*]*)\*\*/g, (_, inner) => {
      const trimmed = inner.trim();
      if (!trimmed) return '';
      const stripped = trimmed.replace(/[,.\s]/g, '');
      if (!stripped || /^Dear$/i.test(stripped)) {
        return trimmed.toLowerCase().startsWith('dear') ? 'Dear,' : '';
      }
      return `**${trimmed}**`;
    });
    out = out.replace(/\*\*/g, '');
    return out;
  };

  const normalizeLetterLines = (text) =>
    text
      .split('\n')
      .map((line) => line.replace(/,\s*$/, '').trimEnd())
      .filter((line) => {
        const t = line.trim();
        return t !== '' && t !== ',' && t !== '.';
      })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n');

  const replacePlaceholders = (template, data) => {
    const replaced = template
      .replace(/{{\s*name\s*}}/gi, data.candidateName || '')
      .replace(/{{\s*designation\s*}}/gi, data.designation || '')
      .replace(/{{\s*company\s*}}/gi, data.company || '')
      .replace(/{{\s*salary\s*}}/gi, data.salary || '')
      .replace(/{{\s*joiningDate\s*}}/gi, data.joiningDate ? formatJoiningDate(data.joiningDate) : '')
      .replace(/{{\s*probationPeriod\s*}}/gi, data.probationPeriod || '')
      .replace(/{{\s*workingHours\s*}}/gi, data.workingHours || '')
      .replace(/{{\s*workLocation\s*}}/gi, data.workLocation || '')
      .replace(/{{\s*noticePeriod\s*}}/gi, data.noticePeriod || '')
      .replace(/{{\s*addressLine1\s*}}/gi, data.addressLine1 || '')
      .replace(/{{\s*addressLine2\s*}}/gi, data.addressLine2 || '');

    return normalizeLetterLines(sanitizeBoldMarkers(replaced));
  };

  const drawSignOffBlock = async (page, pdfDoc, fontRegular, fontBold, fontSize, startY) => {
    const x = 40;
    const lineHeight = fontSize + 1.5;
    const bodyColor = rgb(60 / 255, 60 / 255, 60 / 255);
    const titleColor = rgb(53 / 255, 53 / 255, 53 / 255);
    const founderName = form.founderName?.trim() || 'Sivagaminathan';
    const company = form.company?.trim() || '';

    let y = startY;

    // 1. Warm Regards,
    page.drawText('Warm Regards,', { x, y, size: fontSize, font: fontRegular, color: bodyColor });
    y -= lineHeight + 4;

    // 2. Sivagaminathan
    page.drawText(founderName, { x, y, size: fontSize, font: fontBold, color: titleColor });
    y -= lineHeight;

    // 3. Founder
    page.drawText('Founder', { x, y, size: fontSize, font: fontBold, color: titleColor });
    y -= lineHeight;

    // 4. Urbancode (company)
    if (company) {
      page.drawText(company, { x, y, size: fontSize, font: fontBold, color: titleColor });
      y -= lineHeight;
    }

    y -= 6;

    // 5. Signature (last)
    if (signatureBytes && signatureFile) {
      try {
        const sigUint8 = new Uint8Array(signatureBytes);
        const embeddedSig = (signatureFile.type || '').includes('png')
          ? await pdfDoc.embedPng(sigUint8)
          : await pdfDoc.embedJpg(sigUint8);

        const maxSigWidth = 120;
        const maxSigHeight = 48;
        const scale = Math.min(1, maxSigWidth / (embeddedSig.width || 1), maxSigHeight / (embeddedSig.height || 1));
        const sigDims = embeddedSig.scale(scale);

        page.drawImage(embeddedSig, {
          x,
          y: y - sigDims.height,
          width: sigDims.width,
          height: sigDims.height,
        });
      } catch (sigErr) {
        console.error('Signature embed error', sigErr);
        page.drawText('Signature', { x, y, size: fontSize, font: fontRegular, color: bodyColor });
      }
    } else {
      page.drawText('Signature', { x, y, size: fontSize, font: fontRegular, color: bodyColor });
    }
  };

  const generatePdf = async () => {
    if (!form.candidateName?.trim() || !form.company?.trim() || !form.designation?.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing details',
        text: 'Select a candidate and ensure name, company, and designation are filled before generating.',
      });
      return;
    }

    setGenerating(true);
    try {
      const resp = await fetch(letterheadUrl);
      const arrayBuffer = await resp.arrayBuffer();
      const srcPdf = await PDFDocument.load(arrayBuffer);
      const pdfDoc = await PDFDocument.create();
      const [copiedFirst] = await pdfDoc.copyPages(srcPdf, [0]);
      pdfDoc.addPage(copiedFirst);
      const page = pdfDoc.getPage(0);
      const { width, height } = page.getSize();

      const margins = { top: 132, left: 40, right: 50 };
      const contentTop = height - margins.top;
      const contentWidth = width - margins.left - margins.right;
      const titleSize = 14;
      const titleY = contentTop - titleSize - 8;
      const bodyStartY = titleY - 10;
      const signOffReserve = signatureBytes ? 140 : 92;
      const maxBodyHeight = bodyStartY - MIN_PAGE_BOTTOM - signOffReserve - SIGN_OFF_GAP;

      const finalBody = stripSignOffFromBody(replacePlaceholders(body, form));
      const sourceLines = finalBody.split('\n');

      const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      let fontBold = fontRegular;
      try {
        fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      } catch {
        fontBold = fontRegular;
      }

      const titleColor = rgb(53 / 255, 53 / 255, 53 / 255);
      const bodyColor = rgb(60 / 255, 60 / 255, 60 / 255);
      const letterSpacing = 0.15;

      const tokenizeLineForBold = (line) => {
        const parts = [];
        const pattern = /\*\*(.+?)\*\*/g;
        let lastIndex = 0;
        let match;
        while ((match = pattern.exec(line)) !== null) {
          if (match.index > lastIndex) {
            parts.push({ text: line.slice(lastIndex, match.index), bold: false });
          }
          parts.push({ text: match[1], bold: true });
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < line.length) parts.push({ text: line.slice(lastIndex), bold: false });
        return parts;
      };

      const buildLayout = (fontSize) => {
        const lineHeight = fontSize + 1.5;
        const paragraphGap = 3;
        const spaceWidth = fontRegular.widthOfTextAtSize(' ', fontSize) + letterSpacing;

        const measureWord = (text, font) => {
          if (!text) return 0;
          return font.widthOfTextAtSize(text, fontSize) + letterSpacing * Math.max(0, text.length - 1);
        };

        const visualLines = [];

        for (const rawLine of sourceLines) {
          const segments = tokenizeLineForBold(rawLine);
          const words = [];
          segments.forEach(seg => {
            seg.text.split(/\s+/).filter(Boolean).forEach(w => {
              words.push({ text: w, bold: !!seg.bold });
            });
          });

          if (words.length === 0) {
            visualLines.push({ words: [], isParagraphBreak: true });
            continue;
          }

          let lineWords = [];
          let lineWidth = 0;

          const pushLine = () => {
            if (lineWords.length === 0) return;
            visualLines.push({ words: lineWords, isParagraphBreak: false });
            lineWords = [];
            lineWidth = 0;
          };

          for (const wobj of words) {
            const usedFont = wobj.bold ? fontBold : fontRegular;
            const wordWidth = measureWord(wobj.text, usedFont);
            const extra = lineWords.length > 0 ? spaceWidth : 0;
            if (lineWidth + extra + wordWidth > contentWidth) pushLine();
            lineWords.push(wobj);
            lineWidth = lineWidth + (lineWords.length > 1 ? spaceWidth : 0) + wordWidth;
          }
          pushLine();
          visualLines.push({ words: [], isParagraphBreak: true });
        }

        let totalHeight = 0;
        visualLines.forEach((vl, idx) => {
          if (vl.isParagraphBreak) {
            if (idx > 0 && idx < visualLines.length - 1) totalHeight += paragraphGap;
            return;
          }
          totalHeight += lineHeight;
        });

        return { visualLines, totalHeight, lineHeight, paragraphGap, fontSize, spaceWidth, measureWord };
      };

      let layout = buildLayout(11);
      for (let size = 11; size >= 9 && layout.totalHeight > maxBodyHeight; size -= 0.5) {
        layout = buildLayout(size);
      }

      const { visualLines, lineHeight, paragraphGap, fontSize, spaceWidth, measureWord } = layout;

      let dateStr = '';
      try {
        dateStr = letterDate
          ? new Date(letterDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
          : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      } catch {
        dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      }

      const fontDateSize = 9.5;
      const dateWidth = fontRegular.widthOfTextAtSize(dateStr, fontDateSize);
      const dateX = margins.left + (contentWidth - dateWidth);
      const dateY = contentTop - fontDateSize;
      page.drawText(dateStr, { x: dateX, y: dateY, size: fontDateSize, font: fontRegular, color: bodyColor });

      const title = titleText || '';
      const titleWidth = fontBold.widthOfTextAtSize(title, titleSize);
      const titleX = margins.left + (contentWidth - titleWidth) / 2;
      page.drawText(title, { x: titleX, y: titleY, size: titleSize, font: fontBold, color: titleColor });

      let cursorY = bodyStartY;

      for (const vl of visualLines) {
        if (vl.isParagraphBreak) {
          cursorY -= paragraphGap;
          continue;
        }
        if (vl.words.length === 0) continue;

        let x = margins.left;
        for (let i = 0; i < vl.words.length; i++) {
          const wobj = vl.words[i];
          const usedFont = wobj.bold ? fontBold : fontRegular;
          let cx = x;
          for (let ci = 0; ci < wobj.text.length; ci++) {
            const ch = wobj.text[ci];
            page.drawText(ch, {
              x: cx,
              y: cursorY,
              size: fontSize,
              font: usedFont,
              color: wobj.bold ? titleColor : bodyColor
            });
            cx += usedFont.widthOfTextAtSize(ch, fontSize) + letterSpacing;
          }
          x += measureWord(wobj.text, usedFont);
          if (i !== vl.words.length - 1) x += spaceWidth;
        }
        cursorY -= lineHeight;
      }

      await drawSignOffBlock(page, pdfDoc, fontRegular, fontBold, fontSize, cursorY - SIGN_OFF_GAP);
      await shrinkLetterheadPhoneIconOnAllPages(pdfDoc);

      const pdfBytes = await pdfDoc.save();
      setPdfBytesData(pdfBytes);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setPdfUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error('PDF generation error', err);
      Swal.fire({ icon: 'error', title: 'Failed', text: 'Failed to generate PDF. See console for details.' });
    } finally {
      setGenerating(false);
    }
  };

  const printPdf = () => {
    if (!pdfUrl) return;
    const win = window.open(pdfUrl, '_blank');
    if (win) {
      win.addEventListener('load', () => {
        win.focus();
        win.print();
      });
    }
  };

  const downloadPdf = () => {
    if (!pdfUrl) return;
    const uploadAndDownload = async () => {
      try {
        if (pdfBytesData) {
          const { uploadLetterBytes } = await import('../../utils/uploadLetter');
          await uploadLetterBytes(pdfBytesData, `${form.candidateName || 'offer-letter'}.pdf`, selected || undefined);
          Swal.fire({ icon: 'success', title: 'Saved', text: 'Letter uploaded to cloud', timer: 1300, showConfirmButton: false });
        }
      } catch (err) {
        console.error('Upload failed', err);
        Swal.fire({ icon: 'warning', title: 'Upload failed', text: 'Letter could not be uploaded to cloud. Download will continue.' });
      } finally {
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = `${form.candidateName || 'offer-letter'}.pdf`;
        a.click();
      }
    };
    uploadAndDownload();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Offer Letters</Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <Box sx={{ display: 'flex', gap: 4 }}>
          <Box sx={{ flex: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="candidate-label">Candidate</InputLabel>
              <Select
                labelId="candidate-label"
                value={selected}
                label="Candidate"
                onChange={(e) => setSelected(e.target.value)}
              >
                <MenuItem value="">-- Select --</MenuItem>
                {candidates.map(c => (
                  <MenuItem key={c._id} value={c._id}>{c.name} — {c.position}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField label="Name" fullWidth sx={{ mb: 2 }} value={form.candidateName} onChange={(e) => handleChange('candidateName', e.target.value)} />
            <TextField label="Address Line 1" fullWidth sx={{ mb: 2 }} value={form.addressLine1} onChange={(e) => handleChange('addressLine1', e.target.value)} />
            <TextField label="Address Line 2" fullWidth sx={{ mb: 2 }} value={form.addressLine2} onChange={(e) => handleChange('addressLine2', e.target.value)} />
            <TextField label="Designation" fullWidth sx={{ mb: 2 }} value={form.designation} onChange={(e) => handleChange('designation', e.target.value)} />
            <TextField label="Company" fullWidth sx={{ mb: 2 }} value={form.company} onChange={(e) => handleChange('company', e.target.value)} />
            <TextField label="Salary" fullWidth sx={{ mb: 2 }} value={form.salary} onChange={(e) => handleChange('salary', e.target.value)} />
            <TextField label="Joining Date" type="date" fullWidth sx={{ mb: 2 }} value={form.joiningDate} onChange={(e) => handleChange('joiningDate', e.target.value)} InputLabelProps={{ shrink: true }} />

            <TextField label="Probation Period (months)" fullWidth sx={{ mb: 2 }} value={form.probationPeriod} onChange={(e) => handleChange('probationPeriod', e.target.value)} />
            <TextField label="Working Hours" fullWidth sx={{ mb: 2 }} value={form.workingHours} onChange={(e) => handleChange('workingHours', e.target.value)} />
            <TextField label="Work Location" fullWidth sx={{ mb: 2 }} value={form.workLocation} onChange={(e) => handleChange('workLocation', e.target.value)} />
            <TextField label="Notice Period (days)" fullWidth sx={{ mb: 2 }} value={form.noticePeriod} onChange={(e) => handleChange('noticePeriod', e.target.value)} />

            <TextField
              label="Founder Name"
              fullWidth
              sx={{ mb: 2 }}
              value={form.founderName}
              onChange={(e) => handleChange('founderName', e.target.value)}
            />

            <TextField
              label="Title"
              fullWidth
              sx={{ mb: 2 }}
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
            />

            <TextField
              label="Letter Date"
              type="date"
              fullWidth
              sx={{ mb: 2 }}
              value={letterDate}
              onChange={(e) => setLetterDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Letter Body"
              multiline
              minRows={8}
              fullWidth
              value={body}
              onChange={(e) => setBody(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Signature (upload PNG/JPG)</Typography>
              <input type="file" accept="image/*" onChange={handleSignatureUpload} />
              {signaturePreview && (
                <Box sx={{ mt: 1 }}>
                  <img src={signaturePreview} alt="signature preview" style={{ maxWidth: 200, maxHeight: 80 }} />
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Button variant="contained" onClick={generatePdf} disabled={generating}>{generating ? 'Generating...' : 'Generate Preview'}</Button>
              <Button variant="outlined" onClick={downloadPdf} disabled={!pdfUrl}>Download PDF</Button>
              <Button variant="outlined" onClick={printPdf} disabled={!pdfUrl}>Print</Button>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Print panna &quot;Print&quot; button use pannunga — browser Ctrl+P preview maathram print aagum.
            </Typography>

            {selected && (candidates.find(c => c._id === selected)?.letterCopies || []).length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Uploaded copies</Typography>
                <List dense>
                  {(candidates.find(c => c._id === selected).letterCopies || []).map((lc, i) => (
                    <ListItem key={i} disableGutters>
                      <ListItemText primary={lc.filename || lc.url?.split('/').pop() || `Letter ${i+1}`} secondary={lc.uploadedAt ? new Date(lc.uploadedAt).toLocaleString() : ''} />
                      <ListItemSecondaryAction>
                        <Button size="small" variant="text" onClick={() => window.open(lc.url, '_blank')}>View</Button>
                        <Button size="small" variant="text" onClick={() => { const a = document.createElement('a'); a.href = lc.url; a.download = lc.filename || ''; a.click(); }}>Download</Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>

          <Box sx={{ width: 420, minHeight: 553, border: '1px solid #eee' }}>
            {pdfUrl ? (
              <iframe title="Preview" src={pdfUrl} width="100%" height="553px" />
            ) : (
              <Box sx={{ p: 2 }}><Typography variant="body2" color="text.secondary">Preview will appear here after generating.</Typography></Box>
            )}
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default OfferLetters;
