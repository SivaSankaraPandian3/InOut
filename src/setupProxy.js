const { createProxyMiddleware } = require('http-proxy-middleware');

/** React pages — must not be proxied to the API server. */
const isAttendancePageRequest = (req) => {
  if (req.method !== 'GET') return false;
  const path = req.url.split('?')[0];
  const accept = req.headers.accept || '';
  if (!accept.includes('text/html')) return false;

  if (path === '/attendance') return true;

  // /attendance/:userId (admin view) — not /attendance/me, /attendance/user/...
  if (/^\/attendance\/(me|all|last|date|user)(\/|$)/.test(path)) return false;
  if (/^\/attendance\/[^/]+$/.test(path)) return true;

  return false;
};

module.exports = function (app) {
  app.use(
    createProxyMiddleware(
      [
        '/auth',
        '/api',
        '/api-docs',
        '/users',
        '/attendance',
        '/schedules',
        '/employeesAttendance',
        '/uploads',
        '/ping',
        '/version',
      ],
      {
        target: 'https://uc-attendance-system-1ts2.onrender.com',
        changeOrigin: true,
        secure: true,
        bypass(req) {
          if (isAttendancePageRequest(req)) {
            return '/index.html';
          }
          return null;
        },
      }
    )
  );
};
