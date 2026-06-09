import React, { useEffect, useRef } from 'react';

const SPEC_URL =
  'https://raw.githubusercontent.com/ucattendance/InOut/main/public/openapi.yaml';

const ApiDocsPage = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const loadSwagger = async () => {
      if (!document.querySelector('link[data-swagger-ui]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css';
        link.setAttribute('data-swagger-ui', 'true');
        document.head.appendChild(link);
      }

      if (!window.SwaggerUIBundle) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      if (cancelled || !containerRef.current) return;

      window.SwaggerUIBundle({
        url: SPEC_URL,
        domNode: containerRef.current,
        deepLinking: true,
        presets: [window.SwaggerUIBundle.presets.apis, window.SwaggerUIStandalonePreset],
        layout: 'StandaloneLayout',
      });
    };

    loadSwagger().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="uc-users-wrap" style={{ padding: 0 }}>
      <h1 className="uc-page-title" style={{ marginBottom: '1rem' }}>API Documentation</h1>
      <div ref={containerRef} />
    </div>
  );
};

export default ApiDocsPage;
