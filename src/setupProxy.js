const { createProxyMiddleware } = require('http-proxy-middleware');

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
        logLevel: 'silent',
      }
    )
  );
};
