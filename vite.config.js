import { defineConfig, loadEnv } from 'vite';

function serveHomeAtRoot() {
  const rewriteRoot = (req, _res, next) => {
    const url = req.url || '';
    const path = url.split('?')[0];
    if (path === '/' || path === '') {
      const query = url.includes('?') ? url.slice(url.indexOf('?')) : '';
      req.url = `/home.html${query}`;
    }
    next();
  };

  return {
    name: 'serve-home-at-root',
    configureServer(server) {
      server.middlewares.use(rewriteRoot);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewriteRoot);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: './',
    plugins: [serveHomeAtRoot()],
    build: {
      rollupOptions: {
        input: ['home.html', 'index.html', 'login.html', 'signup.html', 'coming-soon.html', 'admin.html'],
      },
    },
    server: {
      port: 5173,
      proxy: { '/api': { target: env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000', changeOrigin: true } },
    },
  };
});
