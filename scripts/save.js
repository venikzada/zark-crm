const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// 2. Parse and increment version (Patch by default)
// Supports 'major', 'minor', 'patch' as arguments. Usage: npm run save -- minor
const versionParts = packageJson.version.split('.').map(Number);
const args = process.argv.slice(2);

let type = 'patch';
let customMessage = '';

// Check if first arg is a version type
if (['major', 'minor', 'patch'].includes(args[0])) {
    type = args[0];
    customMessage = args.slice(1).join(' ');
} else {
    customMessage = args.join(' ');
}

if (type === 'major') {
    versionParts[0]++;
    versionParts[1] = 0;
    versionParts[2] = 0;
} else if (type === 'minor') {
    versionParts[1]++;
    versionParts[2] = 0;
} else {
    versionParts[2]++; // default to patch
}

const newVersion = versionParts.join('.');
packageJson.version = newVersion;

console.log(`\n🚀 Bumped version to: v${newVersion}`);

// 3. Write package.json (preserve formatting)
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

// 4. Git commands
try {
    console.log('📦 Staging files...');
    execSync('git add .', { stdio: 'inherit' });

    const finalMessage = customMessage ? `V${newVersion} - ${customMessage}` : `V${newVersion}`;
    console.log(`💾 Committing as "${finalMessage}"...`);
    execSync(`git commit -m "${finalMessage}"`, { stdio: 'inherit' });

    // Optional: Create a tag
    console.log(`🏷️  Creating tag V${newVersion}...`);
    execSync(`git tag V${newVersion}`, { stdio: 'inherit' });

    console.log('⬆️  Pushing to GitHub...');
    execSync('git push && git push --tags', { stdio: 'inherit' });

    console.log('\n✅ Auto-save complete! Version saved to GitHub.\n');
} catch (error) {
    console.error('\n❌ Error during git operations:', error.message);
    process.exit(1);
}
