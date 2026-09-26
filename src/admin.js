import { API, apiRequest, esc } from './main.js';

const titles = {
  branding: 'Branding', contact: 'Contact info & social media', hero: 'Hero', guides: 'Guides',
  about: 'About', today: 'Today Sells Properties', services: 'Services', properties: 'Properties',
  showcase: 'Featured property', testimonial: 'Testimonial', projects: 'Projects', blog: 'Blog',
  contact_section: 'Contact section', footer: 'Footer',
};
const fields = {
  name: 'Name', title: 'Title', description: 'Description', email: 'Email', phone: 'Phone number',
  address: 'Address', head_office: 'Head office address', tagline: 'Tagline', button: 'Button label',
  revenue: 'Revenue', icon: 'Icon', items: 'Items', features: 'Features', media_id: 'Image/video',
  media_ids: 'Image/video gallery', location: 'Location', category: 'Category', price: 'Price', beds: 'Bedrooms',
  baths: 'Bathrooms', area: 'Area', unit: 'Unit number', quote: 'Quote', role: 'Role', city: 'City',
  excerpt: 'Excerpt', date: 'Date', author: 'Author', bullets: 'Bullet points', eyebrow: 'Eyebrow label',
  company_links: 'Company links', contact_links: 'Contact links', more_links: 'More links',
  copyright: 'Copyright', thumbnail_media_id: 'Thumbnail', thumbnail_media_ids: 'HOUSE 1/2/3 thumbnails',
  thumbnail_prices: 'HOUSE 1/2/3 prices',
};
const clone = value => structuredClone(value);
const pathCode = path => encodeURIComponent(JSON.stringify(path));
const readPath = encoded => JSON.parse(decodeURIComponent(encoded));

export function mountAdmin(root) {
  const state = { token: sessionStorage.getItem('reanty_admin_token') || '', site: null, media: [], section: 'branding', tab: 'content', templates: null };
  const authed = (path, options = {}) => apiRequest(path, { ...options, headers: { ...options.headers, Authorization: `Bearer ${state.token}` } });

  function login(error = '') {
    root.innerHTML = `<main class="admin-login"><form id="admin-login"><a href="/" class="brand"><img class="brand-logo" src="/logo.png" alt="Reanty." width="198" height="70"></a><h1>Content management</h1><p>Enter the ADMIN_TOKEN from the project .env file.</p><label>Admin token<input type="password" name="token" autocomplete="off" required></label><button class="btn btn-primary" type="submit">Log in</button><p class="admin-notice" role="status">${esc(error)}</p><a href="/">← View homepage</a></form></main>`;
    root.querySelector('#admin-login').addEventListener('submit', async event => {
      event.preventDefault(); state.token = new FormData(event.currentTarget).get('token');
      try { await load(); sessionStorage.setItem('reanty_admin_token', state.token); render(); }
      catch (failure) { state.token = ''; login(failure.message); }
    });
  }

  async function load() {
    const [site, media] = await Promise.all([authed('/admin/site'), authed('/admin/media')]);
    state.site = site; state.media = media; state.templates ||= clone(site.content);
  }

  function mediaSelect(value, path, title) {
    const chosen = value && !state.media.some(item => item.id === value) ? `<option value="${esc(value)}" selected>Media ${esc(value)} (not found)</option>` : '';
    return `<label class="editor-field"><span>${esc(title)}</span><select data-path="${pathCode(path)}"><option value="">— No media assigned —</option>${chosen}${state.media.map(item => `<option value="${esc(item.id)}" ${item.id === value ? 'selected' : ''}>${esc(item.filename)} (${esc(item.mime_type)})</option>`).join('')}</select><small>Upload files in the Media tab, then select them here and click Save.</small></label>`;
  }

  function editor(value, path, key) {
    const title = fields[key] || key.replaceAll('_', ' ');
    if (typeof value === 'string') {
      if (key === 'media_id' || key === 'thumbnail_media_id' || path.includes('media_ids') || path.includes('thumbnail_media_ids')) return mediaSelect(value, path, title);
      const encoded = pathCode(path);
      const input = value.length > 90 || ['description', 'message', 'excerpt', 'quote', 'head_office'].includes(key)
        ? `<textarea data-path="${encoded}" rows="3">${esc(value)}</textarea>`
        : `<input data-path="${encoded}" value="${esc(value)}" type="text">`;
      return `<label class="editor-field"><span>${esc(title)}</span>${input}</label>`;
    }
    if (Array.isArray(value)) {
      return `<fieldset class="editor-list"><legend>${esc(title)}</legend>${value.map((item, i) => `<div class="editor-item"><div class="item-head"><strong>Item ${i + 1}</strong><button type="button" class="text-button" data-remove="${pathCode([...path, i])}">Delete</button></div>${editor(item, [...path, i], typeof item === 'string' ? (key.endsWith('media_ids') ? 'media_id' : title) : `item-${i + 1}`)}</div>`).join('')}<button type="button" class="btn btn-outline btn-small" data-add="${pathCode(path)}">+ Add item</button></fieldset>`;
    }
    return `<div class="editor-group">${path.length > 1 ? `<h4>${esc(title)}</h4>` : ''}${Object.entries(value).map(([child, val]) => editor(val, [...path, child], child)).join('')}</div>`;
  }

  function contentPanel() {
    return `<div class="admin-section-head"><div><h2>${esc(titles[state.section])}</h2><p>Edit content and choose uploaded media for each image/video slot.</p></div><button class="btn btn-primary" id="save-site" type="button">Save changes</button></div><div class="editor-layout"><aside class="section-list">${Object.entries(titles).map(([id, label]) => `<button type="button" data-section="${id}" class="${id === state.section ? 'selected' : ''}">${esc(label)}</button>`).join('')}</aside><div class="editor-panel">${editor(state.site.content[state.section], [state.section], state.section)}</div></div>`;
  }

  function mediaPanel() {
    return `<div class="admin-section-head"><div><h2>Media library</h2><p>Images and videos are stored in MinIO. The maximum size is set by MAX_UPLOAD_MB.</p></div></div><form id="media-upload" class="upload-form"><input type="file" name="file" accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm" required><button class="btn btn-primary" type="submit">Upload</button></form><p class="upload-hint">Choose a file, then click Upload. JPEG, PNG, GIF, WebP, MP4 or WebM only.</p><div class="media-library">${state.media.map(item => `<article class="media-tile"><div class="media-preview">${item.mime_type.startsWith('video/') ? `<video src="${API}/media/${esc(item.id)}/file" controls preload="metadata"></video>` : `<img src="${API}/media/${esc(item.id)}/file" alt="${esc(item.filename)}" loading="lazy">`}</div><strong title="${esc(item.filename)}">${esc(item.filename)}</strong><small>${esc(item.mime_type)} · ${item.size < 1024 * 1024 ? `${(item.size / 1024).toFixed(1)} KB` : `${(item.size / 1024 / 1024).toFixed(1)} MB`}</small><button type="button" data-delete-media="${esc(item.id)}" class="text-button">Delete</button></article>`).join('') || '<p>No images or videos yet. Upload a file to get started.</p>'}</div>`;
  }

  function inboxPanel() {
    return `<div class="admin-section-head"><div><h2>Messages and newsletter</h2><p>The 100 most recent records of each type.</p></div><button type="button" id="refresh-inbox" class="btn btn-outline">Refresh</button></div><div id="inbox-content">Loading…</div>`;
  }

  function render(message = '') {
    root.innerHTML = `<div class="admin-shell"><header class="admin-header"><a href="/" class="brand"><img class="brand-logo" src="/logo.png" alt="Reanty." width="198" height="70"></a><nav><a href="/" target="_blank" rel="noopener">View homepage ↗</a><button type="button" id="logout">Log out</button></nav></header><main class="admin-main"><div class="admin-title"><div><span class="eyebrow">Reanty CMS</span><h1>Homepage admin</h1></div><span class="admin-notice" role="status">${esc(message)}</span></div><div class="admin-tabs">${[['content', 'Content'], ['media', 'Media'], ['inbox', 'Inbox']].map(([id, label]) => `<button data-tab="${id}" class="${state.tab === id ? 'active' : ''}">${label}</button>`).join('')}</div>${state.tab === 'content' ? contentPanel() : state.tab === 'media' ? mediaPanel() : inboxPanel()}</main></div>`;
    root.querySelector('#logout').addEventListener('click', () => { sessionStorage.removeItem('reanty_admin_token'); state.token = ''; login(); });
    root.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => { state.tab = button.dataset.tab; render(); }));
    if (state.tab === 'content') wireContent();
    if (state.tab === 'media') wireMedia();
    if (state.tab === 'inbox') wireInbox();
  }

  function atPath(path) { return path.reduce((acc, key) => acc[key], state.site.content); }
  function wireContent() {
    root.querySelectorAll('[data-section]').forEach(button => button.addEventListener('click', () => { state.section = button.dataset.section; render(); }));
    root.querySelectorAll('[data-path]').forEach(control => control.addEventListener('input', () => {
      const path = readPath(control.dataset.path); const last = path.pop();
      atPath(path)[last] = control.value;
    }));
    root.querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', () => {
      const path = readPath(button.dataset.add), list = atPath(path);
      const template = path.reduce((acc, key) => acc?.[key], state.templates) || list[0] || '';
      list.push(clone(template)); render('New item added but not saved yet.');
    }));
    root.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => {
      const path = readPath(button.dataset.remove), index = path.pop(); atPath(path).splice(index, 1); render('Item removed from the draft.');
    }));
    root.querySelector('#save-site').addEventListener('click', async event => {
      event.currentTarget.disabled = true;
      try {
        state.site = await authed('/admin/site', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: state.site.content, version: state.site.version }) });
        render('Saved. Reload the homepage to see your changes.');
      } catch (error) { render(error.message); }
    });
  }

  function wireMedia() {
    root.querySelector('#media-upload').addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const button = form.querySelector('button');
      const file = form.file?.files?.[0];
      if (!file) {
        render('Choose a file before uploading.');
        return;
      }
      button.disabled = true;
      button.textContent = 'Uploading…';
      try {
        const body = new FormData();
        body.append('file', file, file.name);
        await authed('/admin/media', { method: 'POST', body });
        state.media = await authed('/admin/media');
        render(`Uploaded ${file.name}. Assign it to a slot in the Content tab.`);
      } catch (error) {
        render(`Upload failed: ${error.message}`);
      }
    });
    root.querySelectorAll('[data-delete-media]').forEach(button => button.addEventListener('click', async () => {
      if (!confirm('Delete this file from the library?')) return;
      try { await authed(`/admin/media/${button.dataset.deleteMedia}`, { method: 'DELETE' }); state.media = await authed('/admin/media'); render('Media deleted.'); }
      catch (error) { render(error.message); }
    }));
  }

  async function wireInbox() {
    const refresh = async () => {
      try {
        const [messages, subscribers] = await Promise.all([authed('/admin/messages'), authed('/admin/subscribers')]);
        root.querySelector('#inbox-content').innerHTML = `<div class="inbox-grid"><section><h3>Messages (${messages.length})</h3>${messages.map(x => `<article class="inbox-item"><strong>${esc(x.name)}</strong> &lt;${esc(x.email)}&gt;<small>${esc(x.created_at)}</small><p>${esc(x.message)}</p></article>`).join('') || '<p>No messages yet.</p>'}</section><section><h3>Newsletter subscribers (${subscribers.length})</h3>${subscribers.map(x => `<article class="inbox-item">${esc(x.email)}<small>${esc(x.created_at)}</small></article>`).join('') || '<p>No subscribers yet.</p>'}</section></div>`;
      } catch (error) { root.querySelector('#inbox-content').textContent = error.message; }
    };
    root.querySelector('#refresh-inbox').addEventListener('click', refresh); await refresh();
  }

  if (state.token) load().then(() => render()).catch(() => { state.token = ''; sessionStorage.removeItem('reanty_admin_token'); login('Your admin session expired or the token is invalid.'); });
  else login();
}
