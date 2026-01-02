# Auto-Commit Feature

This project includes an auto-commit script that automatically commits changes after every 3 file modifications.

## How It Works

1. The script `auto-commit.sh` tracks changes using a counter stored in `.git/change-counter.txt`
2. After every 3 changes, it automatically:
   - Stages all changes (`git add -A`)
   - Creates a commit with a timestamp message
   - Resets the counter to 0

## Usage

### Manual Trigger
To manually trigger the auto-commit check:
```bash
./auto-commit.sh
```

### Automatic Monitoring (Optional)
You can set up file watching to automatically run the script on file changes:

**Using `watchman` (if installed):**
```bash
watchman-make -p '**/*.ts' '**/*.tsx' '**/*.js' '**/*.jsx' '**/*.css' -t ./auto-commit.sh
```

**Using `entr` (if installed):**
```bash
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.css" | entr ./auto-commit.sh
```

**Using VS Code/Cursor:**
You can add a task in `.vscode/tasks.json` to run the script on file save.

## Counter Reset

The change counter resets to 0:
- After each auto-commit
- After manual commits (via `post-commit` hook)
- After merges/pulls (via `post-merge` hook)

## Notes

- The counter file (`.git/change-counter.txt`) is stored in the `.git` directory and is not tracked by git
- You can manually reset the counter: `echo "0" > .git/change-counter.txt`
- The auto-commit will only commit if there are actual changes to commit

