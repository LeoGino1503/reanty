import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/inter/400.css';
import './styles.css';
import { mountAdmin } from './admin.js';

const currentPage = location.pathname.replace(/\/+$/, '').split('/').pop().replace(/\.html$/, '');

export const API = (import.meta.env.VITE_API_BASE || './api').replace(/\/$/, '');
export const esc = (value = '') => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API}${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.detail;
    const message = typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map(item => item.msg || JSON.stringify(item)).join('; ')
        : `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

function mediaMarkup(id, key, label, media, extraClass = '') {
  const info = media[id];
  const url = info ? `${API}/media/${encodeURIComponent(id)}/file` : `./media-not-yet-uploaded/${encodeURIComponent(key)}.jpg`;
  const visual = info?.mime_type?.startsWith('video/')
    ? `<video src="${esc(url)}" controls playsinline preload="metadata" aria-label="${esc(label)}"></video>`
    : `<img src="${esc(url)}" alt="${esc(info ? label : `${label} — image not added yet`)}" loading="lazy">`;
  return `<div class="media-frame ${extraClass} ${info ? 'has-media' : 'needs-media'}">${visual}${info ? '' : '<span class="missing-label">Image/video not added yet</span>'}</div>`;
}

const comingSoon = feature => `./coming-soon?feature=${encodeURIComponent(feature)}`;

function safeLink(url) {
  return /^https?:\/\//i.test(url || '') ? esc(url) : '#contact';
}

const svgIcon = (path, viewBox = '0 0 24 24') =>
  `<svg viewBox="${viewBox}" aria-hidden="true" focusable="false"><path fill="currentColor" d="${path}"/></svg>`;

const icons = {
  facebook: svgIcon('M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4z'),
  twitter: svgIcon('M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.52 8.52 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z'),
  instagram: svgIcon('M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'),
  youtube: svgIcon('M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8zM9.75 15.5v-7l6.5 3.5z'),
  pinterest: svgIcon('M12.017 1.5C6.3 1.5 2.1 5.7 2.1 11.3c0 4.1 2.5 7.6 6.1 8.9-.1-.8-.2-2 0-2.9.2-.8 1.3-5.5 1.3-5.5s-.3-.7-.3-1.6c0-1.5.9-2.6 2-2.6.9 0 1.4.7 1.4 1.5 0 .9-.6 2.3-.9 3.5-.3 1.1.5 1.9 1.6 1.9 1.9 0 3.2-2.4 3.2-5.3 0-2.2-1.5-3.8-4.2-3.8-3.1 0-5 2.3-5 4.8 0 .9.3 1.5.7 2 .2.2.2.3.1.6l-.3 1c-.1.3-.3.4-.6.3-1.7-.7-2.5-2.6-2.5-4.7 0-3.5 3-7.7 8.9-7.7 4.8 0 7.9 3.4 7.9 7.1 0 4.8-2.7 8.4-6.6 8.4-1.3 0-2.6-.7-3-1.5l-.8 3.2c-.3 1.1-1.1 2.4-1.7 3.3 1.5.4 3 .7 4.6.7 5.7 0 10.3-4.2 10.3-10.9C22.3 5.7 17.8 1.5 12.017 1.5z'),
  linkedin: svgIcon('M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002zM7 8.48H3V21h4zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91z'),
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="5" width="19" height="14" rx="1"/><path d="m3 6 9 7 9-7"/></g></svg>',
  'guide-buyer': '<img src="./icon-buyer.png" alt="" aria-hidden="true">',
  'guide-renter': '<img src="./icon-renter.png" alt="" aria-hidden="true">',
  'guide-seller': '<img src="./icon-seller.png" alt="" aria-hidden="true">',
  'dream-residency': '<img src="./icon-dreamliving-residency.png" alt="" aria-hidden="true">',
  'dream-global': '<img src="./icon-dreamliving-global.png" alt="" aria-hidden="true">',
  'dream-built-in': '<img src="./icon-dreamliving-built-in.png" alt="" aria-hidden="true">',
  'service-bedrooms': '<img src="./icon-service-bedrooms.png" alt="" aria-hidden="true">',
  'service-swimmingpool': '<img src="./icon-service-swimmingpool.png" alt="" aria-hidden="true">',
  'service-copywriting': '<img src="./icon-service-copywritingcontent.png" alt="" aria-hidden="true">',
  'service-smarthome': '<img src="./icon-service-smarthome.png" alt="" aria-hidden="true">',
  'service-library': '<img src="./icon-service-libararyarea.png" alt="" aria-hidden="true">',
  'service-responsive': '<img src="./icon-service-responsiveduity.png" alt="" aria-hidden="true">',
  location: '<img class="location-icon" src="./icon-location.png" alt="" aria-hidden="true">',
};

const brandLogo = (name, variant = '') => {
  const src = variant === 'light' ? './logo-light.png' : './logo.png';
  return `<img class="brand-logo" src="${src}" alt="${esc(name || 'Reanty.')}" width="198" height="70">`;
};

function wireForm(form, path, success) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const status = form.querySelector('.form-status');
    status.textContent = 'Sending…';
    try {
      await apiRequest(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      status.textContent = success; form.reset();
    } catch (error) { status.textContent = error.message; }
  });
}

const homeMenu = [
  { label: 'Properties', href: '#market', children: ['For Sale', 'For Rent', 'Featured Listings'] },
  { label: 'Services', href: '#services', children: ['Buy a Home', 'Sell a Home', 'Rent a Home'] },
  { label: 'Resources', href: '#feature', children: [['Guides', '#feature'], ['Blog', '#blog'], ['Contact Us', '#contact']] },
];

// `base` is prepended to in-page anchors so pages other than home link back to "/#section".
function siteHeaderMarkup(c, base = '') {
  const socials = ['facebook', 'twitter', 'instagram', 'youtube', 'pinterest'];
  const menuLink = child => {
    const [label, href] = [].concat(child);
    return `<li><a href="${href ? base + href : comingSoon(label)}">${label}</a></li>`;
  };
  return `
    <div class="topbar"><div class="container topbar-inner">
      <div class="topbar-contact"><a href="mailto:${esc(c.contact.email)}">✉ &nbsp;${esc(c.contact.email)}</a><span class="with-location"><i class="location-icon location-icon-accent" aria-hidden="true"></i>${esc(c.contact.address)}</span></div>
      <div class="socials">${socials.map(key => `<a href="${safeLink(c.contact[key])}" aria-label="${key}">${icons[key]}</a>`).join('')}</div>
    </div></div>
    <header class="site-header"><div class="container nav-wrap">
      <a class="brand" href="${base}#home">${brandLogo(c.branding.name)}</a>
      <button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false">☰</button>
      <nav class="nav-links" aria-label="Main navigation">
        <div class="nav-dropdown">
          <a href="${base}#home"${base ? '' : ' class="active"'} aria-haspopup="true">Home</a>
          <ul class="nav-submenu">${homeMenu.map(item => `<li class="has-submenu"><a href="${base}${item.href}" aria-haspopup="true">${item.label}<i class="nav-caret nav-caret-side" aria-hidden="true"></i></a><ul class="nav-submenu nav-submenu-side">${item.children.map(menuLink).join('')}</ul></li>`).join('')}</ul>
        </div>${[['About', '#about'], ['Feature', '#featured-property'], ['Market', '#market'], ['Services', '#services'], ['Contact', '#contact']].map(([label, href]) => `<a href="${base}${href}">${label}</a>`).join('')}
      </nav><div class="nav-actions"><a href="./login">Log In</a><a class="btn btn-primary" href="./signup">Sign Up</a></div>
    </div></header>`;
}

const contactFormMarkup = '<form class="contact-form"><h3>Contact Us</h3><label>Name<input name="name" type="text" placeholder="Enter your name" required minlength="2"></label><label>Email<input name="email" type="email" placeholder="Enter your email" required></label><label>Message<textarea name="message" placeholder="Enter your message" required minlength="5"></textarea></label><button class="btn btn-primary" type="submit">Send</button><p class="form-status" role="status"></p></form>';

function wireMenuToggle(root) {
  const menu = root.querySelector('.nav-links');
  root.querySelector('.menu-toggle').addEventListener('click', event => {
    menu.classList.toggle('open');
    event.currentTarget.setAttribute('aria-expanded', String(menu.classList.contains('open')));
  });
}

function renderHome(root, data) {
  const c = data.content;
  const m = data.media;
  const media = (id, key, label, css = '') => mediaMarkup(id, key, label, m, css);
  const projectImages = ['./SanFranciscoCalifornia.png', './WashingtonDC.png', './Chicago.png'];
  const blogImages = Array(3).fill('./image-How%20to%20rent%20a%20home%20very%20easily.png');
  const testimonials = [
    {
      quote: c.testimonial.quote, name: c.testimonial.name, role: c.testimonial.role,
      image: m[c.testimonial.media_id] ? media(c.testimonial.media_id, 'testimonial', 'Customer portrait') : '<img src="./customer-1.png" alt="Customer portrait" loading="lazy">',
    },
    {
      quote: 'Reanty helped me find a bright apartment close to my office in just two weeks. The team was honest, patient and always ready to answer my questions.',
      name: 'Daniel Mensah', role: 'Software Engineer',
      image: '<img src="./customer-2.png" alt="Customer portrait" loading="lazy">',
    },
  ];

  root.innerHTML = `${siteHeaderMarkup(c)}

    <main>
      <section class="hero" id="home"><div class="container hero-grid">
        <div class="hero-copy">
          <h1>${esc(c.hero.title)}</h1>
          <p>${esc(c.hero.description)}</p>
          <a href="${comingSoon(c.hero.button)}" class="btn btn-primary">${esc(c.hero.button)} <span aria-hidden="true">›</span></a>
          <div class="house-carousel" data-house-carousel data-hero-sync>
            <div class="house-step">${c.hero.thumbnail_media_ids.map((id, i) => `<span data-house="${i}" data-price="${esc(c.hero.thumbnail_prices?.[i] || c.hero.revenue)}" class="${i === 0 ? 'is-active' : ''}">${media(id, `hero-thumb-${i + 1}`, `HOUSE ${i + 1}`)}</span>`).join('')}</div>
            <div class="slide-dots" role="tablist" aria-label="House slides"><span class="slide-line" aria-hidden="true">${c.hero.thumbnail_media_ids.map((_, i) => `<i data-line="${i}" class="${i === 0 ? 'is-active' : ''}"></i>`).join('')}</span>${c.hero.thumbnail_media_ids.map((_, i) => `<button type="button" role="tab" data-slide="${i}" class="${i === 0 ? 'is-active' : ''}" aria-label="House ${i + 1}" aria-selected="${i === 0}">${i + 1}</button>`).join('')}</div>
          </div>
        </div>
        <img class="hero-arrow" src="./hero-arrow.png" alt="" aria-hidden="true">
        <div class="hero-visual">${media(c.hero.thumbnail_media_ids[0] || c.hero.media_id, 'hero', 'Hero property', 'hero-image')}
          <div class="revenue-card"><img class="revenue-icon" src="./icon-home-revenue.png" alt="" aria-hidden="true"><strong data-hero-revenue>${esc(c.hero.thumbnail_prices?.[0] || c.hero.revenue)}</strong><small>Revenue</small></div>
          <button type="button" class="how-card" data-open-video>How it works &nbsp; <span aria-hidden="true"><svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M8 5.5v13l11-6.5z"/></svg></span></button>
        </div>
      </div></section>

      <section class="section guides" id="feature"><div class="container">
        <div class="section-heading"><h2>${esc(c.guides.title)}</h2><p>${esc(c.guides.description)}</p></div>
        <div class="guide-grid">${c.guides.items.map((item, i) => {
          const guideIconKeys = ['guide-buyer', 'guide-renter', 'guide-seller'];
          const icon = icons[guideIconKeys[i]] || icons[item.icon] || esc(item.icon);
          return `<article class="guide-card"><div class="guide-icon">${icon}</div><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p></article>`;
        }).join('')}</div>
      </div></section>

      <section class="section about" id="about"><div class="container split-grid">
        <div class="about-visual reveal-left" data-reveal>
          <div class="about-photo about-photo-back"><img src="./dream-living-1.png" alt="" loading="lazy" aria-hidden="true"></div>
          <div class="about-photo about-photo-front"><img src="./dream-living-2.png" alt="Dream living spaces" loading="lazy"></div>
          <div class="rating-badge"><b aria-hidden="true"><svg class="rating-star" viewBox="0 0 24 24" focusable="false"><path fill="currentColor" d="M12 2.2 14.9 9h7.1l-5.7 4.3 2.2 7-6.5-4.5L5.5 20.3l2.2-7L2 9h7.1z"/></svg></b><small>Five Star<br>Rating</small></div>
        </div>
        <div class="split-copy reveal-right" data-reveal><h2>${esc(c.about.title)}</h2><p>${esc(c.about.description).replace(/(SeaWire Web is a wireframe kit that has more than 15)\s+/i, '$1<br>')}</p>
          <div class="feature-list">${c.about.features.map((item, i) => {
            const dreamIconKeys = ['dream-residency', 'dream-global', 'dream-built-in'];
            const icon = icons[dreamIconKeys[i]] || icons[item.icon] || esc(item.icon);
            return `<div class="feature-item"><span class="feature-icon">${icon}</span><div><h3>${esc(item.title)}</h3><p>${esc(item.description).replace(/\s+(neighborhood photos\.?)/i, '<br>$1')}</p></div></div>`;
          }).join('')}</div>
        </div>
      </div></section>

      <section class="section today"><div class="container split-grid today-grid">
        <div class="split-copy"><span class="eyebrow"><img class="eyebrow-icon" src="./icon-abouthome.png" alt="" aria-hidden="true"> About home</span><h2>${esc(c.today.title)}</h2><p>${esc(c.today.description)}</p>
          <ul class="today-list">${c.today.items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>
          <div class="house-carousel" data-house-carousel data-tiered data-today-sync>
            <div class="house-step">${c.today.thumbnail_media_ids.map((id, i) => `<span data-house="${i}" class="${i === 0 ? 'is-active' : i === 1 ? 'is-mid' : 'is-low'}">${media(id, `today-thumb-${i + 1}`, `HOUSE ${i + 1}`)}</span>`).join('')}</div>
            <div class="slide-dots" role="tablist" aria-label="House slides"><span class="slide-line" aria-hidden="true">${c.today.thumbnail_media_ids.map((_, i) => `<i data-line="${i}" class="${i === 0 ? 'is-active' : ''}"></i>`).join('')}</span>${c.today.thumbnail_media_ids.map((_, i) => `<button type="button" role="tab" data-slide="${i}" class="${i === 0 ? 'is-active' : ''}" aria-label="House ${i + 1}" aria-selected="${i === 0}">${i + 1}</button>`).join('')}</div>
          </div>
        </div>
        <div class="today-mosaic" data-today-mosaic>${c.today.thumbnail_media_ids.map((id, i) => media(id, `today-${i + 1}`, `Property gallery ${i + 1}`)).join('')}</div>
      </div></section>

      <section class="section services" id="services"><div class="container">
        <div class="section-heading"><h2>${esc(c.services.title)}</h2><p>${esc(c.services.description)}</p></div>
        <div class="service-grid">${c.services.items.map((item, i) => {
          const serviceIconKeys = ['service-bedrooms', 'service-swimmingpool', 'service-copywriting', 'service-smarthome', 'service-library', 'service-responsive'];
          const icon = icons[serviceIconKeys[i]] || icons[item.icon] || esc(item.icon);
          return `<article class="service-card"><div class="service-icon">${icon}</div><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p><a href="${comingSoon(item.title)}">Learn more <span class="service-arrow" aria-hidden="true"></span></a></article>`;
        }).join('')}</div>
      </div></section>

      <section class="section properties" id="market"><div class="container">
        <div class="property-heading" id="featured-property"><div><h2>${esc(c.properties.title)}</h2><p>${esc(c.properties.description)}</p></div><div class="property-tabs" role="group" aria-label="Property category">${[...new Set(c.properties.items.map(item => item.category))].map((item, i) => `<button type="button" data-category="${esc(item)}" class="${i === 0 ? 'active' : ''}">${esc(item)}</button>`).join('')}</div></div>
        <div class="property-grid">${c.properties.items.map((item, i) => `<article class="property-card" data-kind="${esc(item.category)}">${media(item.media_id, `property-${i + 1}`, item.title)}<div class="property-info"><h3>${esc(item.title)}</h3><small class="with-location">${icons.location}${esc(item.location)}</small><div class="property-bottom"><strong>${esc(item.price)}</strong><a href="#contact" aria-label="Enquire about ${esc(item.title)}">→</a></div></div></article>`).join('')}</div>
        <a class="btn btn-outline" href="${comingSoon('Property Listings')}">Explore Property</a>
      </div></section>

      <section class="showcase">${m[c.showcase.media_id] ? media(c.showcase.media_id, 'showcase', 'Featured property showcase', 'showcase-image') : '<div class="media-frame showcase-image has-media"><img src="./feature-property-showcase.png" alt="Featured property showcase" loading="lazy"></div>'}<div class="container showcase-content"><div class="showcase-card"><div class="showcase-thumb">${m[c.showcase.thumbnail_media_id] ? media(c.showcase.thumbnail_media_id, 'showcase-thumbnail', 'Property thumbnail') : '<div class="media-frame has-media"><img src="./house-4.png" alt="Property thumbnail" loading="lazy"></div>'}<img class="showcase-thumb-icon" src="./icon-service-cost.png" alt="" aria-hidden="true"></div><div><strong>${esc(c.showcase.price)}</strong><small class="showcase-address">${esc(c.showcase.address)}</small><small class="showcase-specs"><span><img src="./icon-service-bedrooms.png" alt="" aria-hidden="true">${esc(c.showcase.beds)}</span><span><img src="./icon-service-swimmingpool.png" alt="" aria-hidden="true">${esc(c.showcase.baths)}</span><span><img src="./icon-service-copywritingcontent.png" alt="" aria-hidden="true">${esc(c.showcase.area)}</span></small></div></div><div class="unit-badge">UNIT NO.<strong>${esc(c.showcase.unit)}</strong></div></div></section>

      <section class="section testimonial"><div class="container"><div class="section-heading"><h2>${esc(c.testimonial.title)}</h2><p>${esc(c.testimonial.description)}</p></div>
        <div class="testimonial-grid" data-testimonials><button type="button" class="testimonial-arrow testimonial-arrow-prev" data-testimonial-prev aria-label="Previous testimonial"><span aria-hidden="true"></span></button><div class="testimonial-visual"><div class="testimonial-stack">${testimonials.map((item, i) => `<div class="media-frame has-media testimonial-card ${i ? 'is-back' : 'is-front'}">${item.image}</div>`).join('')}</div></div><blockquote aria-live="polite"><img class="quote-mark" src="./icon-quote.png" alt="" aria-hidden="true"><p data-testimonial-quote>${esc(testimonials[0].quote)}</p><div class="stars" role="img" aria-label="5 out of 5 stars">${'<img src="./icon-star.png" alt="" aria-hidden="true">'.repeat(5)}</div><strong data-testimonial-name>${esc(testimonials[0].name)}</strong><small data-testimonial-role>${esc(testimonials[0].role)}</small></blockquote><button type="button" class="testimonial-arrow testimonial-arrow-next" data-testimonial-next aria-label="Next testimonial"><span aria-hidden="true"></span></button></div>
      </div></section>

      <section class="section projects"><div class="container"><div class="section-heading"><h2>${esc(c.projects.title)}</h2></div><div class="project-grid">${c.projects.items.map((item, i) => { const fallback = projectImages[i]; const hasMedia = m[item.media_id] || fallback; return `<article class="project-card ${hasMedia ? 'has-media' : 'needs-media'}">${m[item.media_id] || !fallback ? media(item.media_id, `project-${i + 1}`, item.city) : `<div class="media-frame has-media"><img src="${fallback}" alt="${esc(item.city)}" loading="lazy"></div>`}<div><h3>${esc(item.city)}</h3><a href="${comingSoon(`${item.city} projects`)}">See more &nbsp; ›</a></div></article>`; }).join('')}</div>
        <form class="subscribe-form" id="subscribe"><label for="subscribe-email"><img class="subscribe-icon" src="./icon-mail.png" alt="Email"></label><input id="subscribe-email" type="email" name="email" placeholder="Enter your email here" required><button class="btn btn-primary" type="submit">Subscribe</button><span class="form-status" role="status"></span></form>
      </div></section>

      <section class="section blog" id="blog"><div class="container"><div class="section-heading"><h2>${esc(c.blog.title)}</h2><p>${esc(c.blog.description)}</p></div><div class="blog-grid">${c.blog.items.map((item, i) => `<article class="blog-card">${m[item.media_id] || !blogImages[i] ? media(item.media_id, `blog-${i + 1}`, item.title) : `<div class="media-frame has-media"><img src="${blogImages[i]}" alt="${esc(item.title)}" loading="lazy"></div>`}<div class="blog-body"><h3>${esc(item.title)}</h3><span class="accent blog-category"><img class="blog-category-icon" src="./icon-save.png" alt="">${esc(item.category)}</span><p>${esc(item.excerpt)}</p><div class="blog-meta"><span class="blog-meta-item"><img class="blog-meta-icon" src="./icon-calendar.png" alt="">${esc(item.date)}</span><span class="blog-meta-item"><img class="blog-meta-icon" src="./icon-person.png" alt="">By <b>${esc(item.author)}</b></span></div></div></article>`).join('')}</div><a class="btn btn-outline" href="${comingSoon('Blog')}">Read All</a></div></section>

      <section class="section contact-section" id="contact"><div class="container"><div class="section-heading"><span class="eyebrow">${esc(c.contact_section.eyebrow)}</span><h2>${esc(c.contact_section.title)}</h2></div>
        <div class="contact-grid"><div class="contact-copy"><p>${esc(c.contact_section.description)}</p><ul>${c.contact_section.bullets.map(item => `<li>${esc(item)}</li>`).join('')}</ul><div class="contact-visual"><span class="contact-deco contact-deco-square" aria-hidden="true"></span><span class="contact-deco contact-deco-dark" aria-hidden="true"></span><div class="contact-photo contact-photo-back"><img src="./image-contact-1.png" alt="" loading="lazy" aria-hidden="true"></div><div class="contact-photo contact-photo-front"><img src="./image-contact-2.png" alt="Contact property" loading="lazy"></div></div></div>
          ${contactFormMarkup}
        </div>
      </div></section>
    </main>

    <footer class="footer"><div class="container footer-grid"><div><a class="brand" href="#home">${brandLogo(c.branding.name, 'light')}</a><p>${esc(c.branding.tagline)}</p><div class="footer-socials">${['linkedin', 'facebook', 'twitter'].map(key => `<a href="${safeLink(c.contact[key])}" aria-label="${key}">${icons[key]}</a>`).join('')}</div></div>
      ${[['Company', c.footer.company_links], ['Contact', c.footer.contact_links], ['More', c.footer.more_links]].map(([title, links]) => `<div><h3>${title}</h3>${links.map(text => `<a href="${comingSoon(text)}">${esc(text)}</a>`).join('')}</div>`).join('')}
      <div><h3>Head Office</h3><p>${esc(c.contact.head_office)}</p><h3 class="newsletter-title">News letter</h3><form class="footer-newsletter"><input type="email" name="email" placeholder="Enter your email address" aria-label="Email address" required><button type="submit" aria-label="Subscribe">${icons.mail}</button><span class="form-status" role="status"></span></form></div>
    </div><div class="container footer-bottom"><a href="mailto:${esc(c.contact.email)}">${esc(c.contact.email)}</a><a href="tel:${esc(c.contact.phone.replace(/[^+\d]/g, ''))}">${esc(c.contact.phone)}</a><small>${esc(c.footer.copyright)}</small></div></footer>
    <button type="button" class="theme-toggle" aria-label="Toggle dark mode" aria-pressed="false">
      <svg class="theme-icon-moon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M20.7 14.3A8.5 8.5 0 0 1 9.7 3.3a8.5 8.5 0 1 0 11 11z"/></svg>
      <svg class="theme-icon-sun" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 1.5v2.5M12 20v2.5M1.5 12H4M20 12h2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/></svg>
    </button>
    <button type="button" class="back-to-top" aria-label="Back to top" hidden>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 4.5 4.5 12l1.4 1.4L11 8.3V20h2V8.3l5.1 5.1L19.5 12z"/></svg>
    </button>
    <div class="video-modal" hidden>
      <div class="video-modal-backdrop" data-close-video></div>
      <div class="video-modal-dialog" role="dialog" aria-modal="true" aria-label="How it works video">
        <button type="button" class="video-modal-close" data-close-video aria-label="Close">&times;</button>
        <div class="video-modal-frame">
          <iframe title="How it works" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
        </div>
      </div>
    </div>`;

  const howItWorksVideo = (() => {
    const raw = c.contact.youtube || 'https://www.youtube.com/watch?v=ScMzIvxBSi4';
    const idMatch = raw.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
    return idMatch ? `https://www.youtube.com/embed/${idMatch[1]}` : 'https://www.youtube.com/embed/ScMzIvxBSi4';
  })();

  const videoModal = root.querySelector('.video-modal');
  const videoFrame = videoModal.querySelector('iframe');
  const openVideoModal = () => {
    videoFrame.src = `${howItWorksVideo}?autoplay=1&rel=0`;
    videoModal.hidden = false;
    document.body.style.overflow = 'hidden';
  };
  const closeVideoModal = () => {
    videoModal.hidden = true;
    videoFrame.src = '';
    document.body.style.overflow = '';
  };
  root.querySelector('[data-open-video]').addEventListener('click', openVideoModal);
  videoModal.querySelectorAll('[data-close-video]').forEach(el => el.addEventListener('click', closeVideoModal));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !videoModal.hidden) closeVideoModal();
  });

  const themeToggle = root.querySelector('.theme-toggle');
  const syncThemeToggle = () => themeToggle.setAttribute('aria-pressed', String(document.documentElement.classList.contains('dark')));
  syncThemeToggle();
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    try { localStorage.setItem('reanty-theme', isDark ? 'dark' : 'light'); } catch {}
    syncThemeToggle();
  });

  const backToTop = root.querySelector('.back-to-top');
  const syncBackToTop = () => {
    backToTop.hidden = window.scrollY < 280;
  };
  const smoothScrollTo = (top, duration = 700) => {
    const start = window.scrollY;
    const delta = top - start;
    if (Math.abs(delta) < 2) return;
    if (duration <= 0) return window.scrollTo({ top, behavior: 'instant' });
    const t0 = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    const step = now => {
      const p = Math.min(1, (now - t0) / duration);
      window.scrollTo({ top: start + delta * ease(p), behavior: 'instant' });
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const navTopLinks = [...root.querySelectorAll('.nav-links > a, .nav-dropdown > a')];
  window.addEventListener('scroll', syncBackToTop, { passive: true });
  syncBackToTop();
  backToTop.addEventListener('click', () => {
    smoothScrollTo(0);
    history.pushState(null, '', '#home');
    navTopLinks.forEach((item, index) => item.classList.toggle('active', index === 0));
  });

  const setActiveNav = (hash, link) => {
    const activeLink = navTopLinks.includes(link) ? link : navTopLinks.find(item => item.getAttribute('href') === hash);
    if (activeLink) navTopLinks.forEach(item => item.classList.toggle('active', item === activeLink));
  };
  const scrollToSection = (hash, duration) => {
    const section = hash.startsWith('#') && document.getElementById(hash.slice(1));
    if (!section) return false;
    if (hash === '#home') return smoothScrollTo(0, duration), true;
    const heading = section.matches('section') ? section.querySelector('.section-heading, .property-heading') || section : section;
    const headerHeight = root.querySelector('.site-header').getBoundingClientRect().height;
    smoothScrollTo(heading.getBoundingClientRect().top + window.scrollY - headerHeight - 24, duration);
    return true;
  };

  wireMenuToggle(root);
  root.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', event => {
    root.querySelector('.nav-links').classList.remove('open');
    link.blur();
    const hash = link.getAttribute('href');
    setActiveNav(hash, link);
    if (!scrollToSection(hash)) return;
    event.preventDefault();
    history.pushState(null, '', hash);
  }));
  if (location.hash && location.hash !== '#home') {
    setActiveNav(location.hash);
    requestAnimationFrame(() => scrollToSection(location.hash, 0));
  }
  root.querySelectorAll('.property-tabs button').forEach(button => button.addEventListener('click', () => {
    const wasActive = button.classList.contains('active') && root.querySelector('.property-grid').classList.contains('filtered');
    root.querySelectorAll('.property-tabs button').forEach(x => x.classList.toggle('active', x === button && !wasActive));
    root.querySelector('.property-grid').classList.toggle('filtered', !wasActive);
    root.querySelectorAll('.property-card').forEach(card => card.hidden = !wasActive && card.dataset.kind !== button.dataset.category);
  }));
  wireForm(root.querySelector('.contact-form'), '/contact', 'Message sent successfully.');
  wireForm(root.querySelector('.subscribe-form'), '/newsletter', 'Subscribed successfully.');
  wireForm(root.querySelector('.footer-newsletter'), '/newsletter', 'Subscribed successfully.');
  initHouseCarousels(root);
  initTestimonials(root, testimonials);
  initContactSwap(root);
  initReveal(root);
}

function initReveal(root) {
  const items = root.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('is-visible');
    else if (entry.boundingClientRect.top > 0) entry.target.classList.remove('is-visible');
  }), { threshold: 0.2 });
  items.forEach(el => observer.observe(el));
}

function initContactSwap(root) {
  const visual = root.querySelector('.contact-visual');
  if (!visual) return;
  const photos = [...visual.querySelectorAll('.contact-photo')];
  let timer;
  const swap = () => photos.forEach(photo => {
    const toFront = photo.classList.contains('contact-photo-back');
    photo.classList.toggle('contact-photo-front', toFront);
    photo.classList.toggle('contact-photo-back', !toFront);
  });
  const start = () => {
    window.clearInterval(timer);
    timer = window.setInterval(swap, 4000);
  };
  visual.addEventListener('click', () => { swap(); start(); });
  start();
}

function initTestimonials(root, items) {
  const grid = root.querySelector('[data-testimonials]');
  if (!grid || items.length < 2) return;
  const stack = grid.querySelector('.testimonial-stack');
  const cards = [...stack.children];
  const quote = grid.querySelector('blockquote');
  const fields = {
    quote: grid.querySelector('[data-testimonial-quote]'),
    name: grid.querySelector('[data-testimonial-name]'),
    role: grid.querySelector('[data-testimonial-role]'),
  };

  let active = 0;
  let timer;
  const show = index => {
    active = (index + items.length) % items.length;
    stack.classList.remove('is-animating');
    void stack.offsetWidth;
    stack.classList.add('is-animating');
    cards.forEach((card, i) => {
      card.classList.toggle('is-front', i === active);
      card.classList.toggle('is-back', i !== active);
    });
    quote.classList.add('is-switching');
    window.setTimeout(() => {
      Object.entries(fields).forEach(([key, el]) => { el.textContent = items[active][key]; });
      quote.classList.remove('is-switching');
    }, 400);
  };
  const start = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => show(active + 1), 5000);
  };
  grid.querySelector('[data-testimonial-prev]').addEventListener('click', () => { show(active - 1); start(); });
  grid.querySelector('[data-testimonial-next]').addEventListener('click', () => { show(active + 1); start(); });
  start();
}

function initHouseCarousels(root) {
  root.querySelectorAll('[data-house-carousel]').forEach(carousel => {
    const cards = [...carousel.querySelectorAll('.house-step > span')];
    const dots = [...carousel.querySelectorAll('.slide-dots [data-slide]')];
    const lines = [...carousel.querySelectorAll('.slide-line [data-line]')];
    if (cards.length < 2) return;

    const syncHero = carousel.hasAttribute('data-hero-sync');
    const tiered = carousel.hasAttribute('data-tiered');
    const mosaic = carousel.hasAttribute('data-today-sync') ? root.querySelector('[data-today-mosaic]') : null;
    const revenue = syncHero ? root.querySelector('[data-hero-revenue]') : null;
    const heroFrame = syncHero ? root.querySelector('.hero-image') : null;

    let active = 0;
    let timer;
    let mosaicReady = false;

    const applyMedia = (frame, source, label) => {
      if (!frame || !source) return;
      let target = frame.querySelector('img, video');
      if (!target || target.tagName !== source.tagName) {
        frame.querySelectorAll('img, video, .missing-label').forEach(node => node.remove());
        target = source.cloneNode(true);
        target.removeAttribute('loading');
        frame.prepend(target);
        frame.classList.add('has-media');
        frame.classList.remove('needs-media');
      } else {
        target.src = source.currentSrc || source.src;
        if (target.tagName === 'IMG') target.alt = label;
        else target.setAttribute('aria-label', label);
      }
      return target;
    };

    const syncMosaic = (animate) => {
      if (!mosaic) return;
      const frames = [...mosaic.querySelectorAll(':scope > .media-frame')];
      const n = Math.min(frames.length, cards.length);
      const firstRects = new Map();

      if (animate) {
        frames.forEach((frame, slot) => {
          const mediaEl = frame.querySelector('img, video');
          const cardIndex = Number(frame.dataset.cardIndex ?? slot);
          if (mediaEl) firstRects.set(cardIndex, mediaEl.getBoundingClientRect());
        });
      }

      const order = Array.from({ length: n }, (_, slot) => (active + slot) % cards.length);
      const movers = [];

      order.forEach((cardIndex, slot) => {
        const frame = frames[slot];
        frame.dataset.cardIndex = String(cardIndex);
        const mediaEl = applyMedia(frame, cards[cardIndex]?.querySelector('img, video'), `Property gallery ${slot + 1}`);
        if (mediaEl) movers.push({ mediaEl, cardIndex });
      });

      if (!animate) return;

      mosaic.classList.add('is-rotating');
      movers.forEach(({ mediaEl, cardIndex }) => {
        const first = firstRects.get(cardIndex);
        if (!first) return;
        const last = mediaEl.getBoundingClientRect();
        const zoom = mediaEl.currentCSSZoom || 1;
        const dx = (first.left - last.left) / zoom;
        const dy = (first.top - last.top) / zoom;
        const sx = first.width / (last.width || 1);
        const sy = first.height / (last.height || 1);
        mediaEl.style.transition = 'none';
        mediaEl.style.transformOrigin = 'top left';
        mediaEl.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
        mediaEl.getBoundingClientRect();
        mediaEl.style.transition = 'transform .7s cubic-bezier(.22,.7,0,1)';
        mediaEl.style.transform = 'translate(0,0) scale(1)';
      });

      window.clearTimeout(mosaic._rotateTimer);
      mosaic._rotateTimer = window.setTimeout(() => {
        movers.forEach(({ mediaEl }) => {
          mediaEl.style.transition = '';
          mediaEl.style.transform = '';
          mediaEl.style.transformOrigin = '';
        });
        mosaic.classList.remove('is-rotating');
      }, 720);
    };

    const sync = () => {
      const others = cards
        .map((_, i) => i)
        .filter(i => i !== active)
        .sort((a, b) => Math.abs(a - active) - Math.abs(b - active) || a - b);

      cards.forEach((card, i) => {
        card.classList.toggle('is-active', i === active);
        if (tiered) {
          card.classList.toggle('is-mid', others[0] === i);
          card.classList.toggle('is-low', others[1] === i);
        }
      });
      dots.forEach(dot => {
        const on = Number(dot.dataset.slide) === active;
        dot.classList.toggle('is-active', on);
        dot.setAttribute('aria-selected', String(on));
      });
      lines.forEach(line => line.classList.toggle('is-active', Number(line.dataset.line) === active));

      if (mosaic) {
        syncMosaic(mosaicReady);
        mosaicReady = true;
      }

      if (!syncHero) return;
      const card = cards[active];
      if (revenue && card.dataset.price) revenue.textContent = card.dataset.price;
      const source = card.querySelector('img, video');
      if (!heroFrame || !source) return;
      applyMedia(heroFrame, source, 'Hero property');
      heroFrame.classList.add('is-switching');
      window.setTimeout(() => heroFrame.classList.remove('is-switching'), 350);
    };

    const goTo = index => {
      active = ((index % cards.length) + cards.length) % cards.length;
      sync();
    };

    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => goTo(active + 1), 5000);
    };

    dots.forEach(dot => dot.addEventListener('click', () => {
      goTo(Number(dot.dataset.slide));
      start();
    }));
    cards.forEach((card, i) => {
      card.setAttribute('role', 'button');
      card.tabIndex = 0;
      card.setAttribute('aria-label', `House ${i + 1}`);
      const select = () => {
        goTo(i);
        start();
      };
      card.addEventListener('click', select);
      card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          select();
        }
      });
    });
    carousel.addEventListener('mouseenter', () => window.clearInterval(timer));
    carousel.addEventListener('mouseleave', start);
    sync();
    start();
  });
}

async function mountComingSoon(root) {
  const feature = new URLSearchParams(location.search).get('feature')?.trim() || 'This feature';
  document.title = `${feature} — Coming soon | Reanty`;
  let content = null;
  try { content = (await apiRequest('/site')).content; } catch {}
  root.innerHTML = `${content ? siteHeaderMarkup(content, './') : ''}
    <main class="coming-soon"><div class="container coming-soon-grid">
      <div class="coming-soon-copy">
        ${content ? '' : `<a class="brand" href="./">${brandLogo('Reanty.')}</a>`}
        <span class="eyebrow">Coming soon</span>
        <h1>${esc(feature)} is on the way</h1>
        <p>We're still building this part of Reanty. Leave your email and we'll let you know as soon as it's ready.</p>
        <a class="btn btn-outline" href="./">Back to home</a>
      </div>
      ${contactFormMarkup}
    </div></main>`;
  wireForm(root.querySelector('.contact-form'), '/contact', 'Message sent successfully.');
  if (content) wireMenuToggle(root);
}

const authModes = {
  login: {
    title: 'Log In',
    fields: `<label>Username or Email<input name="identifier" type="text" autocomplete="username" placeholder="Enter your username or email" required></label>
        <label>Password<input name="password" type="password" autocomplete="current-password" placeholder="Enter your password" required></label>
        <a class="login-forgot" href="${comingSoon('Forgot Password')}">Forgot password?</a>`,
    missing: 'Please enter your username/email and password.',
    done: 'Account login is coming soon.',
  },
  signup: {
    title: 'Sign Up',
    fields: `<label>Username<input name="username" type="text" autocomplete="username" placeholder="Choose a username" required></label>
        <label>Email<input name="email" type="email" autocomplete="email" placeholder="Enter your email" required></label>
        <label>Password<input name="password" type="password" autocomplete="new-password" placeholder="Create a password" required></label>`,
    missing: 'Please fill in all fields.',
    done: 'Account sign up is coming soon.',
  },
};

function mountLogin(root) {
  let mode = currentPage === 'signup' ? 'signup' : 'login';
  root.innerHTML = `
    <main class="login-page">
      <form class="login-popup" role="dialog" aria-label="Account" novalidate>
        <a class="brand" href="./">${brandLogo('Reanty.')}</a>
        <div class="login-switch" role="tablist" aria-label="Account">${Object.entries(authModes).map(([key, item]) => `<button type="button" role="tab" data-mode="${key}">${item.title}</button>`).join('<span aria-hidden="true">|</span>')}</div>        <div class="login-fields"></div>
        <button class="btn btn-primary login-submit" type="submit"></button>
        <p class="form-status" role="status"></p>
      </form>
    </main>`;
  const form = root.querySelector('.login-popup');
  const status = form.querySelector('.form-status');
  const setMode = next => {
    mode = next;
    const { title, fields } = authModes[mode];
    document.title = `${title} | Reanty`;
    form.classList.toggle('is-signup', mode === 'signup');    form.querySelector('.login-submit').textContent = title;
    form.querySelector('.login-fields').innerHTML = fields;
    form.querySelectorAll('[data-mode]').forEach(tab => {
      const on = tab.dataset.mode === mode;
      tab.classList.toggle('active', on);
      tab.setAttribute('aria-selected', String(on));
    });
    status.textContent = '';
    history.replaceState(null, '', mode === 'signup' ? './signup' : './login');
  };
  form.querySelectorAll('[data-mode]').forEach(tab => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.values(Object.fromEntries(new FormData(form)));
    status.textContent = values.some(value => !String(value).trim()) ? authModes[mode].missing : authModes[mode].done;
  });
  setMode(mode);
}

async function mountHome(root) {
  root.innerHTML = '<div class="loading">Loading Reanty…</div>';
  try { renderHome(root, await apiRequest('/site')); }
  catch (error) { root.innerHTML = `<div class="error-state"><h1>Could not load the site</h1><p>${esc(error.message)}</p><p>Start MongoDB, MinIO and the FastAPI server, then refresh this page.</p></div>`; }
}

const app = document.querySelector('#app');
if (currentPage === 'admin') {
  mountAdmin(app);
} else if (currentPage === 'login' || currentPage === 'signup') {
  mountLogin(app);
} else if (currentPage === 'coming-soon') {
  mountComingSoon(app);
} else {
  mountHome(app);
}
