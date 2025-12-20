#!/usr/bin/env python3
import subprocess
import os
import json
import re
from datetime import datetime

def run_command(cmd, capture=True):
    """Run a shell command and return output"""
    try:
        if capture:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            return result.stdout.strip(), result.returncode
        else:
            result = subprocess.run(cmd, shell=True)
            return "", result.returncode
    except Exception as e:
        return str(e), 1

def get_highest_number_from_specs(specs_dir):
    """Get highest feature number from specs directory"""
    highest = 0
    if os.path.exists(specs_dir):
        for item in os.listdir(specs_dir):
            match = re.match(r'^(\d+)-', item)
            if match:
                num = int(match.group(1))
                if num > highest:
                    highest = num
    return highest

def get_highest_number_from_branches():
    """Get highest feature number from git branches"""
    highest = 0
    output, code = run_command("git branch -a")
    if code == 0:
        for line in output.split('\n'):
            # Clean branch name
            branch = line.strip().lstrip('* ').replace('remotes/origin/', '')
            match = re.match(r'^(\d+)-', branch)
            if match:
                num = int(match.group(1))
                if num > highest:
                    highest = num
    return highest

def clean_branch_name(name):
    """Convert name to clean branch format"""
    cleaned = re.sub(r'[^a-z0-9]+', '-', name.lower())
    cleaned = re.sub(r'-+', '-', cleaned)
    cleaned = cleaned.strip('-')
    return cleaned

def get_branch_name(description):
    """Generate branch name from description"""
    stop_words = {
        'i', 'a', 'an', 'the', 'to', 'for', 'of', 'in', 'on', 'at', 'by', 'with', 'from',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
        'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must', 'shall',
        'this', 'that', 'these', 'those', 'my', 'your', 'our', 'their',
        'want', 'need', 'add', 'get', 'set'
    }
    
    # Extract words
    words = re.findall(r'[a-zA-Z0-9]+', description.lower())
    meaningful_words = [w for w in words if w not in stop_words and len(w) >= 3]
    
    if meaningful_words:
        return '-'.join(meaningful_words[:4])
    else:
        return clean_branch_name(description)[:50]

# Main execution
repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(repo_root)

# Feature description
feature_desc = "專案導向提示詞管理桌面應用程式"

# Fetch latest branches
run_command("git fetch --all --prune", capture=False)

# Determine next number
specs_dir = os.path.join(repo_root, 'specs')
os.makedirs(specs_dir, exist_ok=True)

highest_branch = get_highest_number_from_branches()
highest_spec = get_highest_number_from_specs(specs_dir)
next_num = max(highest_branch, highest_spec) + 1

# Generate branch name
branch_suffix = "prompt-management-app"
branch_name = f"{next_num:03d}-{branch_suffix}"

print(f"Creating branch: {branch_name}")

# Create branch
output, code = run_command(f"git checkout -b {branch_name}")
if code != 0:
    print(f"Warning: Failed to create branch (may already exist or no git)")

# Create feature directory
feature_dir = os.path.join(specs_dir, branch_name)
os.makedirs(feature_dir, exist_ok=True)

# Copy template to spec file
template_path = os.path.join(repo_root, '.specify', 'templates', 'spec-template.md')
spec_file = os.path.join(feature_dir, 'spec.md')

if os.path.exists(template_path):
    import shutil
    shutil.copy(template_path, spec_file)
else:
    with open(spec_file, 'w', encoding='utf-8') as f:
        f.write("# Feature Specification\n\n")

# Output JSON
result = {
    "BRANCH_NAME": branch_name,
    "SPEC_FILE": spec_file,
    "FEATURE_NUM": f"{next_num:03d}",
    "FEATURE_DIR": feature_dir,
    "HAS_GIT": True
}

print(json.dumps(result, indent=2))
