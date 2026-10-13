import os

def test_index_html_exists():
    "Verify index.html exists and has proper HTML5 structure"
    assert os.path.exists(index.html), index.html is missing
    with open(index.html, r, encoding=utf-8) as f:
        content = f.read()
    assert <!DOCTYPE html> in content, Missing HTML5 DOCTYPE
    assert AttendFlow in content, Title does not match expected project
    assert 'id=app' in content or 'class=app-layout' in content, Main app wrapper missing

def test_style_css_exists():
    "Verify style.css exists and contains root variables"
    assert os.path.exists(style.css), style.css is missing
    with open(style.css, r, encoding=utf-8) as f:
        content = f.read()
    assert :root in content, Root CSS variables definition missing
    assert len(content) > 500, style.css appears suspiciously empty

def test_app_js_exists():
    "Verify app.js exists and contains core application logic"
    assert os.path.exists(app.js), app.js is missing
    with open(app.js, r, encoding=utf-8) as f:
        content = f.read()
    assert localStorage in content, Local storage persistence missing
    assert addEventListener in content, Event listeners missing in app.js

if __name__ == __main__:
    test_index_html_exists()
    test_style_css_exists()
    test_app_js_exists()
    print(All tests passed successfully! (3/3))
