import { API_ENDPOINTS, BASE_URL } from './api';

/** Image path from attendance record (supports alternate backend field names). */
export function getAttendanceImage(record) {
  if (!record) return '';
  const value = record.image ?? record.imageUrl ?? record.photo ?? '';
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Build a browser-ready URL for attendance photos.
 * Handles Cloudinary/full URLs, /uploads/... paths, and bare filenames.
 */
export function resolveAttendanceImageUrl(image) {
  const value = typeof image === 'string' ? image.trim() : '';
  if (!value) return '';

  if (/^https?:\/\//i.test(value)) return value;

  if (value.startsWith('//')) return `https:${value}`;

  if (value.startsWith('/uploads/')) {
    return `${BASE_URL}${value}`;
  }

  if (value.startsWith('/')) {
    return `${BASE_URL}${value}`;
  }

  return `${API_ENDPOINTS.uploadPath}/${value.replace(/^\/+/, '')}`;
}

/** Append attendance photo for multer (field name must match backend: "image"). */
export function appendAttendanceImage(formData, fileOrBlob) {
  const file =
    fileOrBlob instanceof File
      ? fileOrBlob
      : new File([fileOrBlob], 'attendance.jpg', { type: 'image/jpeg' });

  const name = file.name || 'attendance.jpg';
  formData.append('image', file, name);
  return formData;
}
