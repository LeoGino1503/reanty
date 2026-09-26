from pathlib import Path

path = Path(r"z:\Downloads\reanty-local-source(1)\reanty-local\src\styles.css")
css = path.read_text(encoding="utf-8")
old = (
    ".house-step span{position:relative;background:#f8fafb;color:#33464a;font-size:6px;"
    "flex:1;height:62%;align-self:end;overflow:hidden;transition:height .45s ease}"
    ".house-step span.is-active{height:100%}"
    ".house-step span .media-frame{height:100%}"
    ".house-step span .missing-label{display:none}"
    ".house-step span b{position:absolute;top:4px;left:4px;font-size:6px;font-weight:400;"
    "background:#ffffffc9;padding:2px}"
    ".house-step span em{position:absolute;left:0;right:0;bottom:0;padding:3px 4px;"
    "font-size:6px;font-style:normal;font-weight:600;color:#fff;background:#092025cc;text-align:center}"
)
new = (
    ".house-step span{position:relative;background:#f8fafb;flex:1;height:62%;"
    "align-self:end;overflow:hidden;transition:height .45s ease}"
    ".house-step span.is-active{height:100%}"
    ".house-step span .media-frame{height:100%}"
    ".house-step span .missing-label{display:none}"
    ".house-step span:not(.is-active)::after{content:'';position:absolute;inset:0;"
    "background:#ffffffb3;pointer-events:none;z-index:1}"
)
if old not in css:
    i = css.find(".house-step span{")
    print("NOT FOUND")
    print(css[i : i + 500])
else:
    path.write_text(css.replace(old, new, 1), encoding="utf-8")
    print("OK")
