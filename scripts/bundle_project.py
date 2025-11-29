import os
import json

# Configuration
PROJECT_ROOT = r"c:\Users\RAY\OneDrive\Documents\Trinibuild"
OUTPUT_FILE = r"c:\Users\RAY\OneDrive\Documents\Trinibuild\trinibuild_project_bundle.json"

# Directories to ignore
IGNORE_DIRS = {
    'node_modules', '.git', '.vercel', '.vite', 'dist', 'build', '__pycache__', 
    'coverage', '.idea', '.vscode', 'trinibuild-google-ai-studio-', 'temp_app',
    'TRINI ANTIGRAVITY' # Looks like a backup or nested folder
}

# File extensions to include (source code and config)
INCLUDE_EXTENSIONS = {
    '.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.json', '.md', '.py', '.txt', '.sql', '.yml', '.yaml'
}

# Files to specifically ignore
IGNORE_FILES = {
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'trinibuild_project_bundle.json', 'session.json'
}

def is_text_file(filename):
    return any(filename.endswith(ext) for ext in INCLUDE_EXTENSIONS)

def bundle_project():
    project_data = {}
    
    print(f"Scanning project at {PROJECT_ROOT}...")

    for root, dirs, files in os.walk(PROJECT_ROOT):
        # Modify dirs in-place to skip ignored directories
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            if file in IGNORE_FILES:
                continue
                
            if not is_text_file(file):
                continue

            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, PROJECT_ROOT)
            
            # Normalize path separators to forward slashes for consistency
            rel_path = rel_path.replace('\\', '/')

            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    project_data[rel_path] = content
            except Exception as e:
                print(f"Skipping {rel_path}: {e}")

    print(f"Bundled {len(project_data)} files.")
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(project_data, f, indent=2)
        
    print(f"Project bundle saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    bundle_project()
