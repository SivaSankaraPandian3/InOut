const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    createProxyMiddleware(
      [
        '/auth',
        '/api',
        '/users',
        '/attendance',
        '/schedules',
        '/employeesAttendance',
        '/uploads',
      ],
      {
        target: 'https://uc-attendance-system-1ts2.onrender.com',
        changeOrigin: true,
        secure: true,
      }
    )
  );
};
