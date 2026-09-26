from pathlib import Path
import re

path = Path(r"z:\Downloads\reanty-local-source(1)\reanty-local\src\styles.css")
css = path.read_text(encoding="utf-8")

# Split admin CSS so we only bump public site text
admin_marker = "/* Content editor */"
if admin_marker in css:
    public, admin = css.split(admin_marker, 1)
else:
    public, admin = css, ""

reps = [
    # base / headings descriptions
    (".section-heading p,.property-heading p{color:#8b9ca7;font-size:12px;",
     ".section-heading p,.property-heading p{color:#8b9ca7;font-size:18px;"),
    (".eyebrow{color:#ff5945;font-size:13px;",
     ".eyebrow{color:#ff5945;font-size:15px;"),
    (".btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:39px;padding:9px 20px;border:1px solid transparent;border-radius:5px;font-size:11px;",
     ".btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:44px;padding:11px 24px;border:1px solid transparent;border-radius:5px;font-size:14px;"),
    (".topbar{background:#071c20;color:#fff;font-size:9px}",
     ".topbar{background:#071c20;color:#fff;font-size:13px}"),
    ("gap:29px;font-size:11px;",  # nav-links likely
     "gap:29px;font-size:15px;"),
    (".revenue-card strong{font-size:19px}",
     ".revenue-card strong{font-size:22px}"),
    (".revenue-card small{font-size:10px;color:#9aadb6}",
     ".revenue-card small{font-size:13px;color:#9aadb6}"),
    (".how-card{position:absolute;bottom:18%;right:0;background:#ff5945;color:#fff;font-size:10px;",
     ".how-card{position:absolute;bottom:18%;right:0;background:#ff5945;color:#fff;font-size:14px;"),
    (".slide-dots{position:static;display:flex;align-items:center;gap:8px;color:#25383d;font-size:12px;",
     ".slide-dots{position:static;display:flex;align-items:center;gap:8px;color:#25383d;font-size:15px;"),
    (".slide-dots button{border:0;background:none;padding:0;color:#9aadb6;font-size:11px;",
     ".slide-dots button{border:0;background:none;padding:0;color:#9aadb6;font-size:14px;"),
    (".slide-dots button.is-active{color:#25383d;font-size:16px;",
     ".slide-dots button.is-active{color:#25383d;font-size:20px;"),
    (".guide-card p{color:#8a9eaa;font-size:11px;",
     ".guide-card p{color:#8a9eaa;font-size:15px;"),
    (".rating-badge small{font-size:7px}",
     ".rating-badge small{font-size:11px}"),
    (".split-copy>p{color:#8a9ca6;font-size:11px;",
     ".split-copy>p{color:#8a9ca6;font-size:16px;"),
    (".feature-item h3{font-size:14px;",
     ".feature-item h3{font-size:18px;"),
    (".feature-item p{color:#8ba0aa;font-size:10px;",
     ".feature-item p{color:#8ba0aa;font-size:14px;"),
    (".today-list li{font-size:10px;",
     ".today-list li{font-size:15px;"),
    (".service-card p{font-size:10px;",
     ".service-card p{font-size:14px;"),
    (".service-card a{font-size:10px;",
     ".service-card a{font-size:14px;"),
    ("color:#7e929f;font-size:13px;",  # property tabs
     "color:#7e929f;font-size:15px;"),
    (".property-info h3{font-size:12px;",
     ".property-info h3{font-size:16px;"),
    (".property-info small{font-size:9px;",
     ".property-info small{font-size:13px;"),
    (".property-bottom strong{font-size:12px}",
     ".property-bottom strong{font-size:18px}"),
    (".showcase-card small{display:block;font-size:8px;",
     ".showcase-card small{display:block;font-size:12px;"),
    (".unit-badge", None),  # skip fuzzy
    (".testimonial blockquote p{font-size:13px;",
     ".testimonial blockquote p{font-size:18px;"),
    (".testimonial blockquote strong{font-size:14px}",
     ".testimonial blockquote strong{font-size:18px}"),
    (".testimonial blockquote small{color:#a1b1ba;font-size:10px}",
     ".testimonial blockquote small{color:#a1b1ba;font-size:14px}"),
    (".project-card h3{font-size:12px}",
     ".project-card h3{font-size:16px}"),
    ("border-radius:5px;font-size:10px}.sub",  # project see more link area - careful
     None),
    (".blog-body h3{font-size:12px;",
     ".blog-body h3{font-size:17px;"),
    (".blog-body>.accent{font-size:10px}",
     ".blog-body>.accent{font-size:13px}"),
    (".blog-body p{font-size:10px;",
     ".blog-body p{font-size:14px;"),
    ("color:#8a9295;font-size:9px;",
     "color:#8a9295;font-size:12px;"),
    (".contact-copy>p{font-size:11px;",
     ".contact-copy>p{font-size:16px;"),
    (".contact-copy li{font-size:10px;",
     ".contact-copy li{font-size:15px;"),
    (".contact-form label{display:block;color:#737d82;font-size:10px;",
     ".contact-form label{display:block;color:#737d82;font-size:14px;"),
    ("padding:12px;font-size:10px;outl",
     "padding:12px;font-size:14px;outl"),
    (".form-status{font-size:11px;",
     ".form-status{font-size:13px;"),
    (".footer p{font-size:10px;",
     ".footer p{font-size:14px;"),
    (".footer h3{font-size:10px;",
     ".footer h3{font-size:15px;"),
    (".footer-grid a:not(.brand){display:block;font-size:9px;",
     ".footer-grid a:not(.brand){display:block;font-size:13px;"),
    (".footer-newsletter input", None),
]

# More precise replacements using exact snippets from file
exact = [
    (".section-heading p,.property-heading p{color:#8b9ca7;font-size:12px;max-width:340px;margin:0 auto}",
     ".section-heading p,.property-heading p{color:#8b9ca7;font-size:18px;max-width:520px;margin:0 auto;line-height:1.7}"),
    (".eyebrow{color:#ff5945;font-size:13px;letter-spacing:.025em}",
     ".eyebrow{color:#ff5945;font-size:15px;letter-spacing:.025em}"),
    (".btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:39px;padding:9px 20px;border:1px solid transparent;border-radius:5px;font-size:11px;font-weight:500;",
     ".btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:46px;padding:12px 26px;border:1px solid transparent;border-radius:5px;font-size:14px;font-weight:500;"),
    (".topbar{background:#071c20;color:#fff;font-size:9px}",
     ".topbar{background:#071c20;color:#fff;font-size:13px}"),
    (".guide-card p{color:#8a9eaa;font-size:11px;",
     ".guide-card p{color:#8a9eaa;font-size:15px;"),
    (".rating-badge small{font-size:7px}",
     ".rating-badge small{font-size:11px}"),
    (".split-copy>p{color:#8a9ca6;font-size:11px;",
     ".split-copy>p{color:#8a9ca6;font-size:16px;"),
    (".feature-item h3{font-size:14px;",
     ".feature-item h3{font-size:18px;"),
    (".feature-item p{color:#8ba0aa;font-size:10px;",
     ".feature-item p{color:#8ba0aa;font-size:14px;"),
    (".today-list li{font-size:10px;",
     ".today-list li{font-size:15px;"),
    (".service-card p{font-size:10px;",
     ".service-card p{font-size:14px;"),
    (".service-card a{font-size:10px;",
     ".service-card a{font-size:14px;"),
    (".property-info h3{font-size:12px;",
     ".property-info h3{font-size:16px;"),
    (".property-info small{font-size:9px;",
     ".property-info small{font-size:13px;"),
    (".property-bottom strong{font-size:12px}",
     ".property-bottom strong{font-size:18px}"),
    (".showcase-card small{display:block;font-size:8px;",
     ".showcase-card small{display:block;font-size:12px;"),
    (".testimonial blockquote p{font-size:13px;",
     ".testimonial blockquote p{font-size:18px;"),
    (".testimonial blockquote strong{font-size:14px}",
     ".testimonial blockquote strong{font-size:18px}"),
    (".testimonial blockquote small{color:#a1b1ba;font-size:10px}",
     ".testimonial blockquote small{color:#a1b1ba;font-size:14px}"),
    (".project-card h3{font-size:12px}",
     ".project-card h3{font-size:16px}"),
    (".blog-body h3{font-size:12px;",
     ".blog-body h3{font-size:17px;"),
    (".blog-body>.accent{font-size:10px}",
     ".blog-body>.accent{font-size:13px}"),
    (".blog-body p{font-size:10px;",
     ".blog-body p{font-size:14px;"),
    (".contact-copy>p{font-size:11px;",
     ".contact-copy>p{font-size:16px;"),
    (".contact-copy li{font-size:10px;",
     ".contact-copy li{font-size:15px;"),
    (".contact-form label{display:block;color:#737d82;font-size:10px;",
     ".contact-form label{display:block;color:#737d82;font-size:14px;"),
    (".footer p{font-size:10px;",
     ".footer p{font-size:14px;"),
    (".footer h3{font-size:10px;",
     ".footer h3{font-size:15px;"),
    (".footer-grid a:not(.brand){display:block;font-size:9px;",
     ".footer-grid a:not(.brand){display:block;font-size:13px;"),
    (".revenue-card strong{font-size:19px}",
     ".revenue-card strong{font-size:22px}"),
    (".revenue-card small{font-size:10px;color:#9aadb6}",
     ".revenue-card small{font-size:13px;color:#9aadb6}"),
    (".how-card{position:absolute;bottom:18%;right:0;background:#ff5945;color:#fff;font-size:10px;padding:14px 18px;",
     ".how-card{position:absolute;bottom:18%;right:0;background:#ff5945;color:#fff;font-size:14px;padding:16px 22px;"),
    (".slide-dots{position:static;display:flex;align-items:center;gap:8px;color:#25383d;font-size:12px;white-space:nowrap;flex-shrink:0;padding-bottom:2px}",
     ".slide-dots{position:static;display:flex;align-items:center;gap:8px;color:#25383d;font-size:15px;white-space:nowrap;flex-shrink:0;padding-bottom:2px}"),
    (".slide-dots button{border:0;background:none;padding:0;color:#9aadb6;font-size:11px;font-weight:500;line-height:1;cursor:pointer;transition:color .3s,font-size .3s,transform .3s}",
     ".slide-dots button{border:0;background:none;padding:0;color:#9aadb6;font-size:14px;font-weight:500;line-height:1;cursor:pointer;transition:color .3s,font-size .3s,transform .3s}"),
    (".slide-dots button.is-active{color:#25383d;font-size:16px;font-weight:600;transform:translateY(-1px)}",
     ".slide-dots button.is-active{color:#25383d;font-size:20px;font-weight:600;transform:translateY(-1px)}"),
]

# Also bump nav links - find exact
nav_pat = re.search(r"\.nav-links\{[^}]*font-size:\d+px", public)
if nav_pat:
    old_nav = nav_pat.group(0)
    new_nav = re.sub(r"font-size:\d+px", "font-size:15px", old_nav)
    exact.append((old_nav, new_nav))

# nav-actions
na = re.search(r"\.nav-actions[^}]*font-size:\d+px", public)
if na:
    exact.append((na.group(0), re.sub(r"font-size:\d+px", "font-size:14px", na.group(0))))

# guide/service card titles
for pat in [r"\.guide-card h3\{[^}]*\}", r"\.service-card h3\{[^}]*\}", r"\.split-copy h2\{[^}]*\}", r"\.property-heading h2\{[^}]*\}", r"\.section-heading h2\{[^}]*\}"]:
    m = re.search(pat, public)
    if m:
        chunk = m.group(0)
        if "font-size" in chunk:
            bumped = re.sub(r"font-size:(\d+)px", lambda x: f"font-size:{max(int(x.group(1))+4, 18)}px" if int(x.group(1)) < 40 else x.group(0), chunk)
            if bumped != chunk:
                exact.append((chunk, bumped))
        elif "guide-card h3" in chunk or "service-card h3" in chunk:
            exact.append((chunk, chunk[:-1] + ";font-size:20px}"))

ok = 0
miss = 0
for old, new in exact:
    if old is None or new is None:
        continue
    if old in public:
        public = public.replace(old, new, 1)
        ok += 1
    else:
        miss += 1
        print("MISS:", old[:80])

# Generic bumps for remaining tiny public site sizes (not in admin)
def bump_public_fonts(text):
    def repl(m):
        n = int(m.group(1))
        if n <= 8:
            return f"font-size:{n+4}px"
        if n <= 11:
            return f"font-size:{n+4}px"
        if n == 12:
            return "font-size:15px"
        if n == 13:
            return "font-size:16px"
        return m.group(0)
    # only apply to leftover very small - careful not to re-bump already updated
    return text

out = public + ((admin_marker + admin) if admin else "")
path.write_text(out, encoding="utf-8")
print(f"done ok={ok} miss={miss}")
