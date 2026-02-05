const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// 1. Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Setup interface for input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function run() {
    // 2. Parse arguments
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

    // If no message provided, ask interactively
    if (!customMessage) {
        console.log('\n📝 Nenhuma descrição fornecida.');
        const answer = await askQuestion('Digite o título/descrição da versão (em português): ');
        customMessage = answer.trim();
    }

    rl.close();

    // Calculate version
    const versionParts = packageJson.version.split('.').map(Number);
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

    console.log(`\n🚀 Atualizando para versão: v${newVersion}`);

    // 3. Write package.json
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

    // 4. Git commands
    try {
        console.log('📦 Preparando arquivos (Stage)...');
        execSync('git add .', { stdio: 'inherit' });

        // Use standard "V" prefix for git tags/commits as requested, but ensure message is formatted
        // User asked for "Titulo na frente em portugues" -> "Versão X - Message"
        const commitPrefix = `Versão ${newVersion}`;
        const finalMessage = customMessage ? `${commitPrefix} - ${customMessage}` : commitPrefix;

        console.log(`💾 Commitando como: "${finalMessage}"...`);
        execSync(`git commit -m "${finalMessage}"`, { stdio: 'inherit' });

        // Create tag (using short 'v' for technical standard, or 'V' as user used before)
        const tagName = `v${newVersion}`;
        console.log(`🏷️  Criando tag ${tagName}...`);
        execSync(`git tag ${tagName}`, { stdio: 'inherit' });

        console.log('⬆️  Enviando para o GitHub...');
        execSync('git push && git push --tags', { stdio: 'inherit' });

        console.log('\n✅ Salvo com sucesso! 🎉\n');
    } catch (error) {
        console.error('\n❌ Erro nas operações do Git:', error.message);
        process.exit(1);
    }
}

run();
