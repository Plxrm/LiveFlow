const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.astro')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const adminRegex = /import\s+\{\s*supabaseAdmin\s*\}\s+from\s+['"]([^'"]+)['"]/g;
  if (adminRegex.test(content)) {
    content = content.replace(adminRegex, "import { getSupabaseAdmin } from '$1'\nconst supabaseAdmin = getSupabaseAdmin()");
    changed = true;
  }

  const clientRegex = /import\s+\{\s*supabase\s*\}\s+from\s+['"]([^'"]+)['"]/g;
  if (clientRegex.test(content)) {
    content = content.replace(clientRegex, "import { getSupabaseClient } from '$1'\nconst supabase = getSupabaseClient()");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
}
