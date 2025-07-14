import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const projectRoot = process.cwd();
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupDir = path.join(projectRoot, '..', `rechnung-meister-backup-${timestamp}`);

console.log('🔄 Creating project backup...');
console.log(`📁 Source: ${projectRoot}`);
console.log(`📁 Backup: ${backupDir}`);

// Create backup directory
fs.mkdirSync(backupDir, { recursive: true });

// Copy entire project excluding node_modules and other unnecessary files
const excludePatterns = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.nuxt',
  'coverage',
  '.nyc_output',
  '.cache',
  'logs',
  '*.log',
  '.env.local',
  '.env.*.local',
  '.DS_Store',
  'Thumbs.db'
];

// Create .gitignore-like exclusion function
function shouldExclude(filePath) {
  const relativePath = path.relative(projectRoot, filePath);
  return excludePatterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(relativePath);
    }
    return relativePath.includes(pattern);
  });
}

// Recursive copy function
function copyDirectory(src, dest) {
  if (shouldExclude(src)) {
    console.log(`⏭️  Skipping: ${path.relative(projectRoot, src)}`);
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const items = fs.readdirSync(src);

  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);

    if (shouldExclude(srcPath)) {
      continue;
    }

    const stats = fs.statSync(srcPath);

    if (stats.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`📄 Copied: ${path.relative(projectRoot, srcPath)}`);
    }
  }
}

try {
  // Copy project files
  copyDirectory(projectRoot, backupDir);

  // Create backup metadata
  const metadata = {
    timestamp: new Date().toISOString(),
    description: 'Working state backup with English UI and mock data workarounds',
    features: [
      'All Hebrew text converted to English',
      'Mock company data working (bypasses hanging Supabase queries)',
      'Mock user data working', 
      'Company management functional',
      'User permissions working',
      'Authentication working with getSession()',
      'UI fully functional in English'
    ],
    issues: [
      'Supabase companies table queries hang indefinitely',
      'Supabase company_users table queries hang indefinitely',
      'Mock data used as workaround'
    ],
    nextSteps: [
      'Investigate Supabase query hanging issue',
      'Fix RLS policies or database locks',
      'Replace mock data with real Supabase queries once fixed'
    ]
  };

  fs.writeFileSync(
    path.join(backupDir, 'BACKUP_INFO.json'), 
    JSON.stringify(metadata, null, 2)
  );

  // Create restore instructions
  const restoreInstructions = `# Project Backup Restore Instructions

## Backup Information
- **Created**: ${metadata.timestamp}
- **Description**: ${metadata.description}

## What's Working
${metadata.features.map(f => `- ${f}`).join('\n')}

## Known Issues
${metadata.issues.map(i => `- ${i}`).join('\n')}

## To Restore This Backup

1. **Navigate to the backup directory:**
   \`\`\`bash
   cd "${backupDir}"
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables:**
   - Copy your Supabase URL and keys to \`.env.local\`
   - Make sure Supabase project is accessible

4. **Start the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

## Key Files with Mock Data Workarounds

- **\`src/hooks/useCompanies.ts\`**: Contains mock company data (line 47-62)
- **\`src/hooks/useCompanyUsers.ts\`**: Contains mock user data (line 47-74)
- **\`src/contexts/CompanyContext.tsx\`**: Mock permissions setup (line 60-75)

## To Remove Mock Data (when Supabase is fixed)

1. In \`useCompanies.ts\`, replace lines 47-66 with the original Supabase query
2. In \`useCompanyUsers.ts\`, replace lines 35-85 with the original Supabase query
3. In \`CompanyContext.tsx\`, remove mock permissions (lines 60-75)

## Current State
✅ UI fully functional in English
✅ Company management working  
✅ User management working
✅ Authentication working
⚠️  Using mock data due to hanging Supabase queries

## Next Steps
${metadata.nextSteps.map(s => `- ${s}`).join('\n')}
`;

  fs.writeFileSync(
    path.join(backupDir, 'RESTORE_INSTRUCTIONS.md'), 
    restoreInstructions
  );

  console.log('\n✅ Backup completed successfully!');
  console.log(`📁 Backup location: ${backupDir}`);
  console.log('📋 Backup includes:');
  console.log('   - All source code with English translations');
  console.log('   - Mock data workarounds for Supabase issues');
  console.log('   - Package.json and configuration files');
  console.log('   - Backup metadata and restore instructions');
  console.log('\n📖 See RESTORE_INSTRUCTIONS.md in the backup folder for details');

} catch (error) {
  console.error('❌ Backup failed:', error);
  process.exit(1);
}