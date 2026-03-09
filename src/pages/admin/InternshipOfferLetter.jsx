import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem, CircularProgress, List, ListItem, ListItemText, ListItemSecondaryAction } from '@mui/material';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import Swal from 'sweetalert2';
import letterheadUrl from '../../assets/letterhead.pdf';
import axios from 'axios';
import { API_ENDPOINTS } from '../../utils/api';

const InternshipOfferLetter = () => {
  const [form, setForm] = useState({
    studentName: '',
    collegeName: '',
    degree: '',
    registrationNumber: '',
    startDate: '',
    duration: '',
    company: ''
  });

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('');

  const [titleText, setTitleText] = useState('INTERNSHIP OFFER LETTER');
  const [letterDate, setLetterDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfBytesData, setPdfBytesData] = useState(null);
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

  const defaultBody = (f) => `To,\n${f.studentName || ''},\n${f.collegeName || ''},\n${f.degree || ''}\nReg no : ${f.registrationNumber || ''}\n\nSubject: Internship offer letter effective from ${f.startDate ? new Date(f.startDate).toLocaleDateString('en-GB') : ''}.\n\nDear ${f.studentName || ''},\n\nWe are pleased to inform you that you have been selected for an internship at\n${f.company || ''} in the domain of Full Stack Web Development\nfor duration of ${f.duration || ''}.\n\nDuring your internship, you will be assigned practical tasks, projects, and\nresponsibilities aligned with your learning path. You are expected to maintain\nprofessional conduct, adhere to company policies, and complete all assigned work\nwithin the given timelines.\n\nPlease note that this internship does not guarantee permanent employment.\nHowever, interns who demonstrate exceptional performance, strong technical skills,\nprofessionalism, and a consistent commitment to learning may be considered for\nfull-time or part-time employment opportunities with ${f.company || ''}, subject to organizational requirements and role availability.\n\nWe look forward to having you as a part of the ${f.company || ''} learning ecosystem and\nwish you a productive and enriching internship journey.`;

  const [body, setBody] = useState(defaultBody(form));

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

      const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      let fontBold = fontRegular;
      try { fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold); } catch (e) {}

      // Colors aligned with other letters
      const titleColor = rgb(53 / 255, 53 / 255, 53 / 255);
      const bodyColor = rgb(60 / 255, 60 / 255, 60 / 255);

      const contentTop = height - margins.top;
      const contentWidth = width - margins.left - margins.right;

      // date
      const fontDateSize = 10;
      const dateStr = letterDate ? new Date(letterDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-GB');
      const dateWidth = fontRegular.widthOfTextAtSize(dateStr, fontDateSize);
      const dateX = margins.left + (contentWidth - dateWidth);
      const dateY = contentTop - fontDateSize;
      page.drawText(dateStr, { x: dateX, y: dateY, size: fontDateSize, font: fontRegular, color: bodyColor });

      // title
      const titleSize = 16;
      const titleWidth = fontBold.widthOfTextAtSize(titleText, titleSize);
      const titleX = margins.left + (contentWidth - titleWidth) / 2;
      const titleY = contentTop - titleSize - 6;
      page.drawText(titleText, { x: titleX, y: titleY, size: titleSize, font: fontBold, color: titleColor });

      // body drawing
      const fontSize = 12;
      const lineHeight = fontSize + 4;
      let cursorY = titleY - 14;
      const maxWidth = contentWidth;
      const letterSpacing = 0.2;
      const spaceWidth = fontRegular.widthOfTextAtSize(' ', fontSize) + letterSpacing;
      const measureWord = (text, font) => font.widthOfTextAtSize(text, fontSize) + letterSpacing * Math.max(0, text.length - 1);

  // allow placeholders in the body like {{studentName}} and also respect manual edits
  const finalBody = replacePlaceholders(body, form);
  const lines = finalBody.split('\n');
      for (const rawLine of lines) {
        const words = rawLine.split(/\s+/).filter(Boolean);
        let lineWords = [];
        let lineWidth = 0;

        const flushLine = async () => {
          if (lineWords.length === 0) return;
          if (cursorY - lineHeight < margins.bottom) {
            const [bg] = await pdfDoc.copyPages(srcPdf, [0]); pdfDoc.addPage(bg); page = pdfDoc.getPage(pdfDoc.getPageCount() - 1); cursorY = height - margins.top - fontSize;
          }
          let x = margins.left;
          for (let i = 0; i < lineWords.length; i++) {
            const w = lineWords[i];
            let cx = x;
            for (let ci = 0; ci < w.length; ci++) {
              const ch = w[ci];
              page.drawText(ch, { x: cx, y: cursorY, size: fontSize, font: fontRegular, color: bodyColor });
              const cw = fontRegular.widthOfTextAtSize(ch, fontSize);
              cx += cw + letterSpacing;
            }
            const wWidth = measureWord(w, fontRegular);
            x += wWidth; if (i !== lineWords.length - 1) x += spaceWidth;
          }
          cursorY -= lineHeight;
          lineWords = []; lineWidth = 0;
        };

        for (let i = 0; i < words.length; i++) {
          const w = words[i];
          const wWidth = measureWord(w, fontRegular);
          const extra = lineWords.length > 0 ? spaceWidth : 0;
          if (lineWidth + extra + wWidth > maxWidth) {
            await flushLine();
          }
          lineWords.push(w);
          lineWidth = lineWidth + (lineWords.length > 1 ? spaceWidth : 0) + wWidth;
        }
        await flushLine();
        cursorY -= lineHeight / 2;
      }

      // signature: place where content ends (below the last drawn line)
      if (signatureBytes && signatureFile) {
        try {
          const sigUint8 = new Uint8Array(signatureBytes);
          const mime = signatureFile.type || '';
          const embeddedSig = mime.includes('png') ? await pdfDoc.embedPng(sigUint8) : await pdfDoc.embedJpg(sigUint8);
          const maxSigWidth = 150; const maxSigHeight = 80;
          const origW = embeddedSig.width || 1; const origH = embeddedSig.height || 1;
          const scale = Math.min(1, maxSigWidth / origW, maxSigHeight / origH);
          const sigDims = embeddedSig.scale(scale);

          let targetPage = pdfDoc.getPage(pdfDoc.getPageCount() - 1);
          let targetY = cursorY - lineHeight * 1.2;
          if (targetY < margins.bottom) {
            const [bg] = await pdfDoc.copyPages(srcPdf, [0]);
            pdfDoc.addPage(bg);
            targetPage = pdfDoc.getPage(pdfDoc.getPageCount() - 1);
            const { height: newH } = targetPage.getSize();
            targetY = newH - margins.top - lineHeight * 2;
          }

          const x = margins.left;
          targetPage.drawImage(embeddedSig, { x, y: targetY, width: sigDims.width, height: sigDims.height });
        } catch (sigErr) { console.error('Signature embed error', sigErr); }
      }

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

  // Fetch candidates (similar to OfferLetters.jsx)
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(API_ENDPOINTS.getUsers, { headers: { Authorization: `Bearer ${token}` } });
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
      setForm({
        studentName: cand.name || '',
        collegeName: cand.collegeName || cand.college || '',
        degree: cand.degree || cand.position || '',
        registrationNumber: cand.registrationNumber || cand.regNo || '',
        startDate: cand.startDate ? cand.startDate.slice(0,10) : '',
        duration: cand.duration || '',
        company: cand.company || ''
      });
      // populate the editable body with template filled for this candidate
      setBody(defaultBody({
        studentName: cand.name || '',
        collegeName: cand.collegeName || cand.college || '',
        degree: cand.degree || cand.position || '',
        registrationNumber: cand.registrationNumber || cand.regNo || '',
        startDate: cand.startDate ? cand.startDate.slice(0,10) : '',
        duration: cand.duration || '',
        company: cand.company || ''
      }));
    }
  }, [selected, candidates]);

  const replacePlaceholders = (template, data) => {
    return template.replace(/{{\s*studentName\s*}}/gi, data.studentName || '')
      .replace(/{{\s*collegeName\s*}}/gi, data.collegeName || '')
      .replace(/{{\s*degree\s*}}/gi, data.degree || '')
      .replace(/{{\s*registrationNumber\s*}}/gi, data.registrationNumber || '')
      .replace(/{{\s*startDate\s*}}/gi, data.startDate || '')
      .replace(/{{\s*duration\s*}}/gi, data.duration || '')
      .replace(/{{\s*company\s*}}/gi, data.company || '');
  };

  const downloadPdf = () => {
    if (!pdfUrl) return;
    const uploadAndDownload = async () => {
      try {
        if (pdfBytesData) {
          const { uploadLetterBytes } = await import('../../utils/uploadLetter');
          await uploadLetterBytes(pdfBytesData, `${form.studentName || 'internship-offer'}.pdf`, selected || undefined);
          Swal.fire({ icon: 'success', title: 'Saved', text: 'Letter uploaded to cloud', timer: 1300, showConfirmButton: false });
        }
      } catch (err) {
        console.error('Upload failed', err);
        Swal.fire({ icon: 'warning', title: 'Upload failed', text: 'Letter could not be uploaded to cloud. Download will continue.' });
      } finally {
        const a = document.createElement('a'); a.href = pdfUrl; a.download = `${form.studentName || 'internship-offer'}.pdf`; a.click();
      }
    };
    uploadAndDownload();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Internship Offer Letter</Typography>
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
              {loading ? (
                <MenuItem disabled><em>Loading...</em></MenuItem>
              ) : (
                candidates.map(c => (
                  <MenuItem key={c._id} value={c._id}>{c.name} — {c.position || c.degree || ''}</MenuItem>
                ))
              )}
            </Select>
          </FormControl>
          <TextField label="Name" fullWidth sx={{ mb: 2 }} value={form.studentName} onChange={(e) => handleChange('studentName', e.target.value)} />
          <TextField label="College" fullWidth sx={{ mb: 2 }} value={form.collegeName} onChange={(e) => handleChange('collegeName', e.target.value)} />
          <TextField label="Degree" fullWidth sx={{ mb: 2 }} value={form.degree} onChange={(e) => handleChange('degree', e.target.value)} />
          <TextField label="Registration Number" fullWidth sx={{ mb: 2 }} value={form.registrationNumber} onChange={(e) => handleChange('registrationNumber', e.target.value)} />
          <TextField label="Company" fullWidth sx={{ mb: 2 }} value={form.company} onChange={(e) => handleChange('company', e.target.value)} />
          <TextField label="Start Date" type="date" fullWidth sx={{ mb: 2 }} value={form.startDate} onChange={(e) => handleChange('startDate', e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField label="Duration" fullWidth sx={{ mb: 2 }} value={form.duration} onChange={(e) => handleChange('duration', e.target.value)} />

          <TextField label="Title" fullWidth sx={{ mb: 2 }} value={titleText} onChange={(e) => setTitleText(e.target.value)} />
          <TextField label="Letter Date" type="date" fullWidth sx={{ mb: 2 }} value={letterDate} onChange={(e) => setLetterDate(e.target.value)} InputLabelProps={{ shrink: true }} />

          <TextField label="Letter Body" multiline minRows={8} fullWidth value={body} onChange={(e) => setBody(e.target.value)} sx={{ mb: 2 }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Signature (upload PNG/JPG)</Typography>
            <input type="file" accept="image/*" onChange={handleSignatureUpload} />
            {signaturePreview && (<Box sx={{ mt: 1 }}><img src={signaturePreview} alt="signature preview" style={{ maxWidth: 200, maxHeight: 80 }} /></Box>)}
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={generatePdf} disabled={generating}>{generating ? 'Generating...' : 'Generate Preview'}</Button>
            <Button variant="outlined" onClick={downloadPdf} disabled={!pdfUrl}>Download PDF</Button>
          </Box>
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
          {pdfUrl ? (<iframe title="Preview" src={pdfUrl} width="100%" height="553px" />) : (<Box sx={{ p: 2 }}><Typography variant="body2" color="text.secondary">Preview will appear here after generating.</Typography></Box>)}
        </Box>
      </Box>
    </Container>
  );
};

export default InternshipOfferLetter;
