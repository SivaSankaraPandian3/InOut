/** Browser must be HTTPS or localhost for geolocation. */
export const isSecureLocationContext = () =>
  typeof window !== 'undefined' && window.isSecureContext;

/** Parse "lat, lon" or "lat lon" into "lat,lon". */
export const parseCoordsInput = (value) => {
  const parts = String(value).trim().split(/[,\s]+/).filter(Boolean);
  if (parts.length !== 2) return null;

  const lat = Number(parts[0]);
  const lon = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;

  return `${lat},${lon}`;
};

export const getGeolocationErrorMessage = (err) => {
  if (!isSecureLocationContext()) {
    return 'Location needs HTTPS or localhost. Use https://inout.urbancode.tech — not an http:// IP address.';
  }

  switch (err?.code) {
    case 1:
      return 'Location permission blocked. Click the lock icon in the address bar → Site settings → Allow Location. On phone: Settings → Apps → Browser → Location → Allow.';
    case 2:
      return 'GPS signal unavailable. Turn on device Location, move near a window, or enter coordinates manually.';
    case 3:
      return 'Location timed out. Ensure GPS is on and try again, or enter coordinates manually.';
    default:
      return err?.message || 'Could not detect your location.';
  }
};

const toResult = (pos) => ({
  coords: `${pos.coords.latitude},${pos.coords.longitude}`,
  accuracy: pos.coords.accuracy,
});

/** watchPosition often works on mobile when getCurrentPosition fails indoors. */
const watchGeolocation = (timeoutMs = 28000) =>
  new Promise((resolve, reject) => {
    let watchId = null;

    const stop = () => {
      if (watchId != null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
    };

    const timeoutId = setTimeout(() => {
      stop();
      reject(Object.assign(new Error('GPS watch timed out.'), { code: 3 }));
    }, timeoutMs);

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        clearTimeout(timeoutId);
        stop();
        resolve(toResult(pos));
      },
      (err) => {
        clearTimeout(timeoutId);
        stop();
        reject(err);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: timeoutMs }
    );
  });

/**
 * Try geolocation: getCurrentPosition (3 attempts) then watchPosition.
 * Resolves with { coords: "lat,lon", accuracy }.
 */
export const requestGeolocation = async () => {
  if (!navigator.geolocation) {
    throw Object.assign(new Error('GPS not supported on this device.'), { code: 2 });
  }

  if (!isSecureLocationContext()) {
    throw Object.assign(new Error('Insecure page context.'), { code: 0 });
  }

  const attempts = [
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 120000 },
    { enableHighAccuracy: true, timeout: 22000, maximumAge: 0 },
    { enableHighAccuracy: false, timeout: 30000, maximumAge: 600000 },
  ];

  let lastError = null;

  for (const options of attempts) {
    try {
      return await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(toResult(pos)),
          reject,
          options
        );
      });
    } catch (err) {
      lastError = err;
    }
  }

  try {
    return await watchGeolocation();
  } catch (err) {
    throw lastError || err;
  }
};
