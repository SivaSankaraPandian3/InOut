import axios from 'axios';
import { API_ENDPOINTS } from './api';

// Upload PDF bytes to backend which stores on Cloudinary.
// pdfBytes: Uint8Array or ArrayBuffer
// filename: string
// candidateId: optional user id to attach the letter to (backend will attach to uploader if omitted)
export async function uploadLetterBytes(pdfBytes, filename, candidateId) {
  const token = localStorage.getItem('token');
  const file = new File([pdfBytes], filename, { type: 'application/pdf' });
  const fd = new FormData();
  fd.append('letter', file);
  if (candidateId) fd.append('candidateId', candidateId);
  const res = await axios.post(API_ENDPOINTS.uploadLetter, fd, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
}
