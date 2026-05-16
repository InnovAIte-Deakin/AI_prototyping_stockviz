import os
import re

replacements = {
    r'#2d3433': 'var(--foreground)',
    r'#f9f9f8': 'var(--background)',
    r'#adb3b2': 'var(--border)',
    r'#5a6060': 'var(--muted-foreground)',
    r'#5f5e5e': 'var(--primary)',
    r'#f2f4f3': 'var(--muted)',
    r'bg-white': 'bg-card',
}

# Specific complex replacements for tailwind classes
tw_replacements = {
    r'text-\[#2d3433\]': 'text-foreground',
    r'bg-\[#2d3433\]': 'bg-foreground',
    r'border-\[#2d3433\]': 'border-foreground',
    r'text-\[#f9f9f8\]': 'text-background',
    r'bg-\[#f9f9f8\]': 'bg-background',
    r'border-\[#f9f9f8\]': 'border-background',
    r'text-\[#adb3b2\]': 'text-muted-foreground',
    r'bg-\[#adb3b2\]': 'bg-muted-foreground',
    r'border-\[#adb3b2\]': 'border-border',
    r'text-\[#5a6060\]': 'text-muted-foreground',
    r'bg-\[#5a6060\]': 'bg-muted-foreground',
    r'border-\[#5a6060\]': 'border-muted-foreground',
    r'text-\[#5f5e5e\]': 'text-primary',
    r'bg-\[#5f5e5e\]': 'bg-primary',
    r'border-\[#5f5e5e\]': 'border-primary',
    r'text-\[#f2f4f3\]': 'text-muted',
    r'bg-\[#f2f4f3\]': 'bg-muted',
    r'border-\[#f2f4f3\]': 'border-muted',
    r'shadow-\[#2d3433\]': 'shadow-foreground',
    r'selection:bg-\[#e4e2e1\]': 'selection:bg-accent',
    r'selection:text-\[#525251\]': 'selection:text-accent-foreground',
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    
    # Apply complex tailwind replacements first
    for pattern, replacement in tw_replacements.items():
        new_content = re.sub(pattern, replacement, new_content)
    
    # Apply simple hex replacements
    for pattern, replacement in replacements.items():
        # Only replace if not already part of a tailwind bracketed class that we might have missed
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
