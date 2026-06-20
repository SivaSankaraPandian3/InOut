import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem, CircularProgress, List, ListItem, ListItemText, ListItemSecondaryAction } from '@mui/material';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import Swal from 'sweetalert2';
import letterheadUrl from '../../assets/letterhead.pdf';
import { shrinkLetterheadPhoneIconOnAllPages } from '../../utils/letterheadFooter';
import { sanitizeTextForStandardFonts } from '../../utils/pdfTextSanitizer';
import axios from 'axios';
import { API_ENDPOINTS } from '../../utils/api';

const InternshipOfferLetter = () => {
  const [form, setForm] = useState({
    candidateName: '',
    designation: '',
    department: '',
    company: '',
    salary: '',
    employmentType: '',
    addressLine1: '',
    addressLine2: '',
    joiningDate: '',
    workLocation: '',
    reportingTo: ''
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

  const formatLongDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(`${dateStr}T12:00:00`);
      if (Number.isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const defaultBody = (f) => `To,
Mr./Ms. ${f.candidateName || ''},
Address: ${f.addressLine1 || ''}
${f.addressLine2 || ''}

Subject: Offer of Employment - ${f.designation || ''}

Dear Mr./Ms. ${f.candidateName || ''}

We are pleased to offer you employment with ${f.company || ''} for the position of ${f.designation || ''} with an Annual Cost to Company (CTC): Rs. ${f.salary || ''}. Your expertise, communication skills, and passion for training have impressed us, and we are delighted to welcome you to our learning and development ecosystem. We believe your contribution will play a vital role in empowering learners with the language proficiency and communication skills required for academic, professional, and personal success.

Employment Details
Designation: ${f.designation || ''}
Department: ${f.department || ''}
Employment Type: ${f.employmentType || ''}
Date of Joining: ${formatLongDate(f.joiningDate)}
Work Location: ${f.workLocation || ''}
Reporting To: ${f.reportingTo || ''}

Key Responsibilities
As a ${f.designation || 'Trainer'}, your responsibilities will include:
- Delivering high-quality language training sessions to students and professionals.
- Developing learners' speaking, listening, reading, and writing skills.
- Conducting assessments, evaluations, and progress tracking.
- Preparing lesson plans, training materials, assignments, and learning activities.
- Supporting students in improving communication, presentation, and interpersonal skills.
- Maintaining attendance records, performance reports, and training documentation.
- Participating in curriculum enhancement and academic development initiatives.
- Upholding the educational standards and values of ${f.company || ''}.

Professional Expectations
You are expected to:
- Demonstrate professionalism, punctuality, and commitment to excellence.
- Foster a positive and inclusive learning environment.
- Maintain confidentiality of student information and organizational data.
- Adhere to company policies, academic guidelines, and code of conduct.
- Represent the organization with integrity and professionalism at all times.

Terms and Conditions
1. Your employment shall be governed by the rules, regulations, and policies of ${f.company || ''}.
2. All training materials, content, presentations, assessments, and intellectual property created during employment shall remain the property of the organization.
3. Any misconduct, breach of confidentiality, unethical behavior, or violation of company policies may result in disciplinary action, including termination of employment.
4. The company reserves the right to modify responsibilities and reporting structures based on organizational requirements.
5. Either party may terminate the employment relationship by providing notice as per company policy.

We are excited to welcome you to the ${f.company || ''} family and look forward to your valuable contribution in shaping confident communicators and future professionals.

Warm Regards,
Founder
${f.company || ''}`;

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
  const finalBody = sanitizeTextForStandardFonts(replacePlaceholders(body, form), [fontRegular, fontBold]);
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
      const next = {
        candidateName: cand.name || '',
        designation: cand.position || '',
        department: cand.department || '',
        company: cand.company || '',
        salary: cand.salary || '',
        employmentType: cand.employmentType || '',
        addressLine1: cand.addressLine1 || cand.address?.line1 || cand.address?.addressLine1 || cand.location || '',
        addressLine2: cand.addressLine2 || cand.address?.line2 || cand.address?.addressLine2 || cand.city || '',
        joiningDate: cand.dateOfJoining ? cand.dateOfJoining.slice(0, 10) : '',
        workLocation: cand.workLocation || '',
        reportingTo: cand.reportingTo || ''
      };
      setForm(next);
      // populate the editable body with template filled for this candidate
      setBody(defaultBody(next));
    }
  }, [selected, candidates]);

  const replacePlaceholders = (template, data) => {
    return template.replace(/{{\s*name\s*}}/gi, data.candidateName || '')
      .replace(/{{\s*designation\s*}}/gi, data.designation || '')
      .replace(/{{\s*department\s*}}/gi, data.department || '')
      .replace(/{{\s*employmentType\s*}}/gi, data.employmentType || '')
      .replace(/{{\s*joiningDate\s*}}/gi, formatLongDate(data.joiningDate))
      .replace(/{{\s*workLocation\s*}}/gi, data.workLocation || '')
      .replace(/{{\s*reportingTo\s*}}/gi, data.reportingTo || '')
      .replace(/{{\s*addressLine1\s*}}/gi, data.addressLine1 || '')
      .replace(/{{\s*addressLine2\s*}}/gi, data.addressLine2 || '')
      .replace(/{{\s*salary\s*}}/gi, data.salary || '')
      .replace(/{{\s*company\s*}}/gi, data.company || '');
  };

  const downloadPdf = () => {
    if (!pdfUrl) return;
    const uploadAndDownload = async () => {
      try {
        if (pdfBytesData) {
          const { uploadLetterBytes } = await import('../../utils/uploadLetter');
          await uploadLetterBytes(pdfBytesData, `${form.candidateName || 'internship-offer'}.pdf`, selected || undefined);
          Swal.fire({ icon: 'success', title: 'Saved', text: 'Letter uploaded to cloud', timer: 1300, showConfirmButton: false });
        }
      } catch (err) {
        console.error('Upload failed', err);
        Swal.fire({ icon: 'warning', title: 'Upload failed', text: 'Letter could not be uploaded to cloud. Download will continue.' });
      } finally {
        const a = document.createElement('a'); a.href = pdfUrl; a.download = `${form.candidateName || 'internship-offer'}.pdf`; a.click();
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
                  <MenuItem key={c._id} value={c._id}>{c.name} ΓÇö {c.position || c.degree || ''}</MenuItem>
                ))
              )}
            </Select>
          </FormControl>
          <TextField label="Name" fullWidth sx={{ mb: 2 }} value={form.candidateName} onChange={(e) => handleChange('candidateName', e.target.value)} />
          <TextField label="Address Line 1" fullWidth sx={{ mb: 2 }} value={form.addressLine1} onChange={(e) => handleChange('addressLine1', e.target.value)} />
          <TextField label="Address Line 2" fullWidth sx={{ mb: 2 }} value={form.addressLine2} onChange={(e) => handleChange('addressLine2', e.target.value)} />
          <TextField label="Designation" fullWidth sx={{ mb: 2 }} value={form.designation} onChange={(e) => handleChange('designation', e.target.value)} />
          <TextField label="Department" fullWidth sx={{ mb: 2 }} value={form.department} onChange={(e) => handleChange('department', e.target.value)} />
          <TextField label="Company" fullWidth sx={{ mb: 2 }} value={form.company} onChange={(e) => handleChange('company', e.target.value)} />
          <TextField label="Salary (CTC)" fullWidth sx={{ mb: 2 }} value={form.salary} onChange={(e) => handleChange('salary', e.target.value)} />
          <TextField label="Employment Type" fullWidth sx={{ mb: 2 }} value={form.employmentType} onChange={(e) => handleChange('employmentType', e.target.value)} />
          <TextField label="Date of Joining" type="date" fullWidth sx={{ mb: 2 }} value={form.joiningDate} onChange={(e) => handleChange('joiningDate', e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField label="Work Location" fullWidth sx={{ mb: 2 }} value={form.workLocation} onChange={(e) => handleChange('workLocation', e.target.value)} />
          <TextField label="Reporting To" fullWidth sx={{ mb: 2 }} value={form.reportingTo} onChange={(e) => handleChange('reportingTo', e.target.value)} />

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
