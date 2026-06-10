import { branchToOfficeName } from './branches';

/** Mirror of backend `config/officeLocation.js` — for UI preview only. */
export const OFFICE_LOCATIONS = [
  {
    name: 'Pallikaranai',
    branchName: 'Pallikaranai',
    latitude: 12.94198577,
    longitude: 80.21012198,
    radiusMeters: 200,
  },
  {
    name: 'Velechery',
    branchName: 'Velachery',
    latitude: 12.9912597,
    longitude: 80.2201616,
    radiusMeters: 400,
  },
  {
    name: 'Tirunelveli',
    branchName: 'Tirunelveli',
    latitude: 8.7237565,
    longitude: 77.722212,
    radiusMeters: 1500,
    address:
      '3rd Floor, Fab Sapphire Towers, 29/5, S Bypass Rd, Vasanth Nagar, Tirunelveli, Tamil Nadu 627005',
    plusCode: 'MPXG+GQ Tirunelveli',
  },
];

const toRad = (deg) => (deg * Math.PI) / 180;

const haversineMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

const effectiveRadius = (office, preferredOfficeName) => {
  if (!preferredOfficeName || office.name !== preferredOfficeName) return office.radiusMeters;
  if (office.name === 'Tirunelveli') return 2000;
  return Math.round(office.radiusMeters * 1.5);
};

/** Within branch radius → branch name; otherwise Outside Office. */
export const resolveOfficeFromLocation = (locationString, preferredOfficeName = null) => {
  if (!locationString || !String(locationString).includes(',')) return null;
  const [lat, lon] = String(locationString).split(',').map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  let best = null;

  for (const office of OFFICE_LOCATIONS) {
    const distance = haversineMeters(lat, lon, office.latitude, office.longitude);
    const radius = effectiveRadius(office, preferredOfficeName);
    if (distance <= radius) {
      if (!best || distance < best.distanceMeters) {
        best = {
          officeName: office.branchName || office.name,
          isInOffice: true,
          distanceMeters: Math.round(distance),
        };
      }
    }
  }

  if (best) return best;
  return { officeName: 'Outside Office', isInOffice: false, distanceMeters: null };
};

/** Show short office label (e.g. Pallikaranai, not Chennai Pallikarani). */
export const formatOfficeDisplayName = (name) => {
  if (!name || name === '—') return name;
  const n = String(name).trim();
  if (/chennai\s+pallikar/i.test(n)) return 'Pallikaranai';
  if (/chennai\s+velach/i.test(n) || /^velechery$/i.test(n)) return 'Velachery';
  return n;
};

/** Dashboard / reports: prefer GPS-based branch when coordinates exist. */
export const getLogOfficeName = (log, preferredOfficeName = null) => {
  if (!log) return '—';
  const preferred = preferredOfficeName || branchToOfficeName(log.userBranch);

  if (log.location) {
    const resolved = resolveOfficeFromLocation(log.location, preferred);
    if (resolved?.isInOffice) return formatOfficeDisplayName(resolved.officeName);
    return 'Outside Office';
  }

  return formatOfficeDisplayName(log.officeName) || '—';
};
