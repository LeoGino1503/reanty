from pathlib import Path

path = Path(__file__).resolve().parent.parent / "src" / "styles.css"
css = path.read_text(encoding="utf-8")

replacements = [
    (
        ".hero-grid{display:grid;grid-template-columns:minmax(0,42%) minmax(0,58%);min-height:530px;align-items:stretch;column-gap:18px}",
        ".hero-grid{display:grid;grid-template-columns:minmax(0,42%) minmax(0,58%);min-height:530px;align-items:stretch;column-gap:18px;position:relative}",
    ),
    (
        ".hero-title-arrow{display:inline-block;width:min(140px,38%);height:auto;margin-left:6px;vertical-align:middle;transform:translateY(-2px)}",
        ".hero-arrow{position:absolute;left:42%;top:78px;z-index:3;width:168px;height:auto;pointer-events:none;transform:translateX(-42%);user-select:none}",
    ),
]

# Also hide arrow on mobile where hero stacks
old_mobile = ".hero .house-carousel{display:none}"
new_mobile = ".hero .house-carousel,.hero-arrow{display:none}"

for old, new in replacements:
    if old not in css:
        print("MISSING:", old[:80])
    else:
        css = css.replace(old, new, 1)
        print("OK:", old[:50])

if old_mobile in css:
    css = css.replace(old_mobile, new_mobile, 1)
    print("OK mobile")
else:
    print("MISSING mobile")

path.write_text(css, encoding="utf-8")
print("done")
