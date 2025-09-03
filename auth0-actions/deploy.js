#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Deploy Auth0 Actions from local files
 */
async function deployActions() {
  const actionsDir = path.join(__dirname);
  const actionFolders = fs.readdirSync(actionsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const folder of actionFolders) {
    const folderPath = path.join(actionsDir, folder);
    const configPath = path.join(folderPath, `${folder}.json`);
    
    if (!fs.existsSync(configPath)) {
      console.log(`⚠️  Skipping ${folder} - no config file found`);
      continue;
    }

    console.log(`\n🚀 Deploying ${folder}...`);

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const codePath = path.join(folderPath, config.code.replace('./', ''));
      const code = fs.readFileSync(codePath, 'utf8');

      // Create or update action via Auth0 CLI
      const deployCmd = `auth0 actions deploy --name "${config.name}" --trigger "${config.supported_triggers[0].id}" --code "${codePath}" --runtime "${config.runtime}"`;
      
      await execCommand(deployCmd);
      console.log(`✅ ${config.name} deployed successfully`);

    } catch (error) {
      console.error(`❌ Failed to deploy ${folder}:`, error.message);
    }
  }
}

function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      console.log(stdout);
      if (stderr) console.error(stderr);
      resolve(stdout);
    });
  });
}

if (require.main === module) {
  deployActions().catch(console.error);
}

module.exports = { deployActions };