from pathlib import Path

path = Path(r"z:\Downloads\reanty-local-source(1)\reanty-local\src\styles.css")
css = path.read_text(encoding="utf-8")

replacements = [
    (
        ".hero-grid{display:grid;grid-template-columns:40% 60%;grid-template-rows:1fr auto;min-height:530px;align-items:center;row-gap:22px}",
        ".hero-grid{display:grid;grid-template-columns:40% 60%;min-height:530px;align-items:stretch}",
    ),
    (
        ".hero-copy{padding:70px 0 20px;position:relative;z-index:1;grid-column:1;grid-row:1;align-self:center}",
        ".hero-copy{padding:70px 0 24px;position:relative;z-index:1;display:flex;flex-direction:column;min-height:100%}",
    ),
    (
        ".hero-visual{grid-column:2;grid-row:1;align-self:stretch;position:relative;min-width:0}",
        ".hero-visual{align-self:stretch;position:relative;min-width:0}",
    ),
    (
        ".hero-grid>.house-carousel{grid-column:1/-1;grid-row:2;justify-self:start;align-self:start;position:relative;z-index:1;margin:0 0 10px;width:max-content}"
        ".house-carousel{position:relative;margin-top:40px;width:max-content}",
        ".hero-copy>.house-carousel{margin-top:auto;padding-top:56px;position:relative;width:max-content;z-index:1}"
        ".house-carousel{position:relative;margin-top:40px;width:max-content}",
    ),
    (
        ".revenue-card{position:absolute;bottom:47px;left:-34px;",
        ".revenue-card{position:absolute;bottom:56px;left:-34px;",
    ),
]

for old, new in replacements:
    if old not in css:
        print("MISSING:", old[:80])
    else:
        css = css.replace(old, new, 1)
        print("OK:", old[:50])

path.write_text(css, encoding="utf-8")
print("done")
