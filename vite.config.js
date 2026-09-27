import { defineConfig, loadEnv } from 'vite';

const PAGE_FILES = ['home.html', 'index.html', 'login.html', 'signup.html', 'coming-soon.html', 'admin.html'];

function servePages() {
  const names = new Set(PAGE_FILES.map(file => file.replace(/\.html$/, '')));
  const rewrite = (req, _res, next) => {
    const url = req.url || '';
    const queryIndex = url.indexOf('?');
    const path = queryIndex === -1 ? url : url.slice(0, queryIndex);
    const query = queryIndex === -1 ? '' : url.slice(queryIndex);
    if (path === '/' || path === '') {
      req.url = `/pages/home.html${query}`;
    } else {
      const match = path.match(/^\/([a-z0-9-]+)\.html$/);
      if (match && names.has(match[1])) req.url = `/pages/${match[1]}.html${query}`;
    }
    next();
  };

  return {
    name: 'serve-pages',
    configureServer(server) {
      server.middlewares.use(rewrite);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: './',
    plugins: [servePages()],
    build: {
      rollupOptions: {
        input: PAGE_FILES.map(file => `pages/${file}`),
      },
    },
    server: {
      port: 5173,
      proxy: { '/api': { target: env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000', changeOrigin: true } },
    },
  };
});
