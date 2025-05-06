#!/usr/bin/env node

import prompts from "prompts";
import { execSync } from "child_process";
import chalk from "chalk";
import gradient from "gradient-string";
import process from "process";

function displayBanner() {
  // Custom gradient colors - using fewer colors for a smoother horizontal transition
  const gradientColors = gradient([
    "#F59E0B", // noiseKit AMBER
    "#B91C1C", // noiseKit RED
  ]).multiline;

  console.log(
    gradientColors(String.raw`
     _   _  ___  ___ ____  _____ _  _____ _____ 
    | \ | |/ _ \|_ _/ ___|| ____| |/ /_ _|_   _|
    |  \| | | | || |\___ \|  _| | ' / | |  | |  
    | |\  | |_| || | ___) | |___| . \ | |  | |  
    |_| \_|\___/|___|____/|_____|_|\_\___| |_|  
                                                
  `)
  );
}

async function run() {
  displayBanner();

  const response = await prompts({
    type: "text",
    name: "projectName",
    message: "What is the name of your project?",
    validate: (value) => (value ? true : "Project name cannot be empty"),
  });

  const projectName = response.projectName;

  if (!projectName) {
    console.error(chalk.red("Project name is required!"));
    process.exit(1);
  }

  const command = `npx sv create ${projectName} --template minimal --types ts --install npm`;

  try {
    console.log(chalk.blue(`Creating SvelteKit project: ${projectName}...`));
    execSync(command, { stdio: "inherit" });
    console.log(chalk.green(`Successfully created project ${projectName}!`));

    // Change directory to the newly created project
    const projectPath = `./${projectName}`;

    console.log(chalk.blue(`Adding Tailwind CSS to ${projectName}...`));
    const tailwindCommand = `npx sv@0.6.18 add tailwindcss`;
    execSync(tailwindCommand, { stdio: "inherit", cwd: projectPath });
    console.log(
      chalk.green(`Successfully added Tailwind CSS to ${projectName}!`)
    );

    console.log(chalk.blue(`Initializing shadcn-svelte in ${projectName}...`));
    const shadcnInitCommand = `npx shadcn-svelte@next init`;
    execSync(shadcnInitCommand, { stdio: "inherit", cwd: projectPath });
    console.log(
      chalk.green(`Successfully initialized shadcn-svelte in ${projectName}!`)
    );

    console.log(
      chalk.blue(
        `Adding shadcn-svelte components (button) to ${projectName}...`
      )
    );
    const shadcnAddComponentCommand = `npx shadcn-svelte@next add button input textarea label select checkbox radio-group card separator dialog aspect-ratio sidebar`;
    execSync(shadcnAddComponentCommand, { stdio: "inherit", cwd: projectPath });
    console.log(
      chalk.green(
        `Successfully added shadcn-svelte components to ${projectName}!`
      )
    );

    console.log(chalk.blue(`Installing svelte-seo in ${projectName}...`));
    const installSeoCommand = `npm install -D svelte-seo`;
    execSync(installSeoCommand, { stdio: "inherit", cwd: projectPath });
    console.log(
      chalk.green(`Successfully installed svelte-seo in ${projectName}!`)
    );

    console.log(
      chalk.bold.magenta(`
🎉 noisekit finished creating the ${projectName} project! 🎉
`)
    );
  } catch (error) {
    console.error(chalk.red(`Failed to create project: ${error.message}`));
    process.exit(1);
  }
}

run();
