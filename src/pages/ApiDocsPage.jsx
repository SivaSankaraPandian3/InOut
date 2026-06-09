import { useEffect } from 'react';

const SWAGGER_CSS = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css';

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });

export default function ApiDocsPage() {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = SWAGGER_CSS;
    document.head.appendChild(link);

    let cancelled = false;

    Promise.all([
      loadScript('https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js'),
      loadScript('https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js'),
    ])
      .then(() => {
        if (cancelled || !window.SwaggerUIBundle) return;
        window.SwaggerUIBundle({
          url: '/openapi.yaml',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [window.SwaggerUIBundle.presets.apis, window.SwaggerUIStandalonePreset],
          layout: 'StandaloneLayout',
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      link.remove();
    };
  }, []);

  return (
    <div style={{ background: '#fafafa', minHeight: '100vh' }}>
      <div id="swagger-ui" />
    </div>
  );
}
