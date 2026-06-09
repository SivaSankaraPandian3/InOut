/** Mirror of backend `config/officeLocation.js` — for UI preview only. */
export const OFFICE_LOCATIONS = [
  {
    name: 'Pallikaranai',
    latitude: 12.94198577,
    longitude: 80.21012198,
    radiusMeters: 200,
  },
  {
    name: 'Velechery',
    latitude: 12.9912597,
    longitude: 80.2201616,
    radiusMeters: 400,
  },
  {
    name: 'Tirunelveli',
    latitude: 8.6988125,
    longitude: 77.7269375,
    radiusMeters: 500,
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

/** Parse "lat,lng" and return nearest office within radius, or null. */
export const resolveOfficeFromLocation = (locationString, preferredOfficeName = null) => {
  if (!locationString || !String(locationString).includes(',')) return null;
  const [lat, lon] = String(locationString).split(',').map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const ordered = preferredOfficeName
    ? [
        ...OFFICE_LOCATIONS.filter((o) => o.name === preferredOfficeName),
        ...OFFICE_LOCATIONS.filter((o) => o.name !== preferredOfficeName),
      ]
    : OFFICE_LOCATIONS;

  for (const office of ordered) {
    const distance = haversineMeters(lat, lon, office.latitude, office.longitude);
    const boost = office.name === preferredOfficeName ? 1.5 : 1;
    if (distance <= office.radiusMeters * boost) {
      return { officeName: office.name, isInOffice: true, distanceMeters: Math.round(distance) };
    }
  }
  return { officeName: 'Outside Office', isInOffice: false, distanceMeters: null };
};

/** Map user profile branch to office config name (preview on check-in screen). */
export const branchToOfficeName = (user) => {
  const raw = [user?.branch, user?.bankDetails?.officeBranch, user?.address]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (raw.includes('tirunel') || raw.includes('tvl')) return 'Tirunelveli';
  if (raw.includes('pallikar')) return 'Pallikaranai';
  if (raw.includes('velach') || raw.includes('velech')) return 'Velechery';
  return null;
};
