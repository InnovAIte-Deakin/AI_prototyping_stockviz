import os
import re

tw_replacements = {
    r'bg-\[#7a7c7b\]': 'bg-primary',
    r'text-\[#7a7c7b\]': 'text-primary',
    r'border-\[#7a7c7b\]': 'border-primary',
    r'hover:bg-\[#e4e2e1\]': 'hover:bg-accent',
    r'bg-\[#e4e2e1\]': 'bg-accent',
    r'hover:bg-\[#4a4a4a\]': 'hover:bg-primary/90',
    r'text-\[#752121\]': 'text-destructive',
    r'border-\[#fe8983\]/30': 'border-destructive/30',
    r'bg-\[#fe8983\]/10': 'bg-destructive/10',
    r'text-white!': 'text-primary-foreground!',
    r'bg-\[#7a7c7b\]!': 'bg-primary!',
    r'fill="#7a7c7b"': 'fill="currentColor" className="text-primary"',
    r'fill="#10b981"': 'fill="#10b981"', # Keep chart colors for now or map to green
    r'stopColor="#10b981"': 'stopColor="#10b981"',
    r'stroke="#10b981"': 'stroke="#10b981"',
    r'bg-red-50!': 'bg-destructive/10!',
    r'focus:bg-red-50!': 'focus:bg-destructive/10!',
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    for pattern, replacement in tw_replacements.items():
        new_content = re.sub(pattern, replacement, new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

def main():
    root_dirs = ['app', 'components']
    for root_dir in root_dirs:
        for root, dirs, files in os.walk(root_dir):
            for file in files:
                if file.endswith(('.tsx', '.ts', '.js', '.jsx', '.css')):
                    filepath = os.path.join(root, file)
                    if process_file(filepath):
                        print(f"Updated {filepath}")

if __name__ == "__main__":
    main()
