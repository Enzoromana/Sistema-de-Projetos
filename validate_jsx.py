import re
import sys

def count_tokens(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    open_divs = len(re.findall(r'<div', content))
    close_divs = len(re.findall(r'</div', content))
    open_braces = content.count('{')
    close_braces = content.count('}')
    open_parens = content.count('(')
    close_parens = content.count(')')
    
    print(f"Divs: {open_divs} / {close_divs} (Diff: {open_divs - close_divs})")
    print(f"Braces: {open_braces} / {close_braces} (Diff: {open_braces - close_braces})")
    print(f"Parens: {open_parens} / {close_parens} (Diff: {open_parens - close_parens})")

if __name__ == "__main__":
    count_tokens(sys.argv[1])
