/** Mirror of backend `config/officeLocation.js` — for UI preview only. */
export const OFFICE_LOCATIONS = [
  {
    name: 'Pallikaranai',
    branchName: 'Chennai Pallikarani',
    latitude: 12.94198577,
    longitude: 80.21012198,
    radiusMeters: 200,
  },
  {
    name: 'Velechery',
    branchName: 'Chennai Velachery',
    latitude: 12.9912597,
    longitude: 80.2201616,
    radiusMeters: 400,
  },
  {
    name: 'Tirunelveli',
    branchName: 'Tirunelveli',
    latitude: 8.6988125,
    longitude: 77.7269375,
    radiusMeters: 750,
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

/** Within branch radius → branch name; otherwise Outside Office. */
export const resolveOfficeFromLocation = (locationString) => {
  if (!locationString || !String(locationString).includes(',')) return null;
  const [lat, lon] = String(locationString).split(',').map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  let best = null;

  for (const office of OFFICE_LOCATIONS) {
    const distance = haversineMeters(lat, lon, office.latitude, office.longitude);
    if (distance <= office.radiusMeters) {
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

/** Dashboard / reports: prefer GPS-based branch when coordinates exist. */
export const getLogOfficeName = (log) => {
  if (!log) return '—';
  if (log.location) {
    const resolved = resolveOfficeFromLocation(log.location);
    if (resolved?.isInOffice) return resolved.officeName;
  }
  return log.officeName || '—';
};
