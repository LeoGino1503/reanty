from pathlib import Path

path = Path(__file__).resolve().parent.parent / "src" / "styles.css"
css = path.read_text(encoding="utf-8")

replacements = [
    (
        ".hero-grid{display:grid;grid-template-columns:40% 60%;min-height:530px;align-items:stretch}",
        ".hero-grid{display:grid;grid-template-columns:minmax(0,42%) minmax(0,58%);min-height:530px;align-items:stretch;column-gap:18px}",
    ),
    (
        ".hero-copy{padding:70px 0 24px;position:relative;z-index:1;display:flex;flex-direction:column;min-height:100%}",
        ".hero-copy{padding:70px 8px 24px 0;position:relative;z-index:1;display:flex;flex-direction:column;min-height:100%;min-width:0;max-width:100%;overflow:hidden}",
    ),
    (
        ".hero h1{font-size:40px;line-height:1.16;letter-spacing:-.045em;margin:0 0 23px;max-width:390px}",
        ".hero h1{font-size:40px;line-height:1.16;letter-spacing:-.045em;margin:0 0 23px;max-width:100%}",
    ),
    (
        ".hero-title-arrow{display:inline-block;width:180px;height:auto;margin-left:6px;vertical-align:middle;transform:translateY(-2px)}",
        ".hero-title-arrow{display:inline-block;width:min(140px,38%);height:auto;margin-left:6px;vertical-align:middle;transform:translateY(-2px)}",
    ),
    (
        ".hero-copy>.house-carousel{margin-top:auto;padding-top:56px;position:relative;width:max-content;z-index:1}",
        ".hero-copy>.house-carousel{margin-top:auto;padding-top:56px;position:relative;z-index:1;display:flex;align-items:end;gap:12px;width:100%;max-width:100%}",
    ),
    (
        ".slide-dots{position:absolute;bottom:0;left:calc(100% + 14px);display:flex;align-items:center;gap:8px;color:#25383d;font-size:12px;white-space:nowrap}",
        ".slide-dots{position:static;display:flex;align-items:center;gap:8px;color:#25383d;font-size:12px;white-space:nowrap;flex-shrink:0;padding-bottom:2px}",
    ),
    (
        ".hero-visual{align-self:stretch;position:relative;min-width:0}",
        ".hero-visual{align-self:stretch;position:relative;min-width:0;z-index:2}",
    ),
]

for old, new in replacements:
    if old not in css:
        print("MISSING:", old[:90])
    else:
        css = css.replace(old, new, 1)
        print("OK:", old[:55])

path.write_text(css, encoding="utf-8")
print("done")
