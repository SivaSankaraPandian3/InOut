const { createProxyMiddleware } = require('http-proxy-middleware');

const API_TARGET =
  process.env.REACT_APP_API_PROXY_TARGET ||
  'https://uc-attendance-system-1ts2.onrender.com';

const ATTENDANCE_API_SEGMENTS = new Set(['me', 'all', 'last', 'date', 'user']);

/** Proxy API only — never proxy React page GET /attendance or GET /attendance/:userId */
const shouldProxy = (pathname, req) => {
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/api-docs') ||
    pathname.startsWith('/users') ||
    pathname.startsWith('/schedules') ||
    pathname.startsWith('/employeesAttendance') ||
    pathname.startsWith('/uploads') ||
    pathname === '/ping' ||
    pathname === '/version'
  ) {
    return true;
  }

  if (!pathname.startsWith('/attendance')) {
    return false;
  }

  // React page: GET /attendance
  if (pathname === '/attendance' && req.method === 'GET') {
    return false;
  }

  // React page: GET /attendance/:mongoId (not /attendance/me, /attendance/user/...)
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 2 && segments[0] === 'attendance' && req.method === 'GET') {
    if (!ATTENDANCE_API_SEGMENTS.has(segments[1])) {
      return false;
    }
  }

  return true;
};

module.exports = function (app) {
  app.use(
    createProxyMiddleware(shouldProxy, {
      target: API_TARGET,
      changeOrigin: true,
      secure: true,
    })
  );
};
