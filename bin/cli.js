#!/usr/bin/env node

import { execSync, spawn } from "child_process";
import gradient from "gradient-string";
import process from "process";
import * as p from "@clack/prompts";
import { setTimeout as sleep } from "node:timers/promises";
import color from "picocolors";

// Banner
function displayBanner() {
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

// Execute command silently and return output
function execSilent(command, cwd = process.cwd()) {
  try {
    return execSync(command, { stdio: "pipe", cwd, encoding: "utf-8" });
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

// Execute interactive command with real-time user input/output
async function execInteractive(command, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    // Don't log the command as it might be disruptive
    // console.log(color.dim(`Running: ${command}`));

    // Split the command string into command and arguments
    const parts = command.split(" ");
    const cmd = parts[0];
    const args = parts.slice(1);

    // Spawn the process with stdio inherited for interactive prompts
    const childProcess = spawn(cmd, args, {
      cwd,
      stdio: "inherit", // This allows the interactive prompts to work
      shell: true,
    });

    childProcess.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}: ${command}`));
      }
    });
  });
}

// Main function
async function run() {
  // Start with banner and intro
  displayBanner();
  p.intro(`${color.red("noiseKit")} - Modern SvelteKit Starter`);

  // Get project name
  const projectName = await p.text({
    message: "What would you like to name your app?",
    placeholder: "my-sveltekit-app",
    validate(value) {
      if (!value) return "Please enter an app name.";
      if (value.includes(" ")) return "App name cannot contain spaces.";
      if (!/^[a-z0-9-_]+$/i.test(value))
        return "App name can only include alphanumeric characters, hyphens, and underscores.";
    },
  });

  // Handle cancellation
  if (p.isCancel(projectName)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  // Project path
  const projectPath = `./${projectName}`;

  // Additional utilities
  const utilities = await p.multiselect({
    message: "Would you like to install additional packages?",
    options: [
      { value: "eslint", label: "ESLint", hint: "linting" },
      {
        value: "prettier",
        label: "Prettier",
        hint: "code formatting",
      },
      { value: "playwright", label: "Playwright", hint: "browser testing" },
      { value: "vitest", label: "Vitest", hint: "testing" },
      {
        value: "svelte-seo",
        label: "Svelte SEO",
        hint: "SEO for svelte apps",
      },
    ],
    required: false,
  });

  // Handle cancellation
  if (p.isCancel(utilities)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  // Define package installation configuration with custom commands
  const packageConfigs = {
    eslint: {
      command: "npx sv add eslint --no-preconditions",
      description: "Installing ESLint",
    },
    prettier: {
      command: "npx sv add prettier --no-preconditions",
      description: "Installing Prettier",
    },
    playwright: {
      command: "npx sv add playwright --no-preconditions",
      description: "Installing Playwright",
    },
    vitest: {
      command: "npx sv add vitest --no-preconditions",
      description: "Installing Vitest",
    },
    "svelte-seo": {
      command: "npm install -D svelte-seo",
      description: "Installing SEO package",
    },
  };

  // Create list of selected package configurations
  const selectedPackageConfigs = utilities
    .map((util) => packageConfigs[util])
    .filter(Boolean);

  // Show summary before starting
  p.note(
    `• App Name: ${color.yellow(projectName)}\n` +
      // No need to show components in summary since it's not selectable now
      `• Additional Packages: ${
        utilities.length > 0
          ? "\n  " +
            utilities.map((pkg) => color.yellow(`- ${pkg}`)).join("\n  ")
          : color.yellow("None")
      }`,
    "Creating your noiseKit project"
  );

  // Confirmation
  const confirmed = await p.confirm({
    message: "Ready to create your app?",
  });

  if (p.isCancel(confirmed) || !confirmed) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  // Use task system to execute all tasks with spinners
  await p.tasks([
    {
      title: "Creating SvelteKit project",
      task: async () => {
        await sleep(500); // Slight delay for UX
        execSilent(
          `npx sv create ${projectName} --template minimal --types ts --no-add-ons --install npm`
        );
        return "SvelteKit project created successfully!";
      },
    },

    // Create dynamic tasks for each selected package
    ...selectedPackageConfigs.map((pkg) => ({
      title: pkg.description,
      task: async () => {
        await sleep(300);
        execSilent(pkg.command, projectPath);

        // Run post-install steps if they exist
        if (pkg.postInstall) {
          await pkg.postInstall(projectPath);
        }

        return `${pkg.description} completed`;
      },
    })),

    {
      title: "Setting up Tailwind CSS with Typography",
      task: async () => {
        await sleep(300);
        execSilent(
          `npx sv@0.6.18 add --tailwindcss=typography --no-install --no-preconditions`,
          projectPath
        );
        // Install dependencies after Tailwind is set up
        execSilent(`npm install`, projectPath);
        return "Tailwind CSS configured successfully!";
      },
    },

    {
      title: "Finalizing project setup",
      task: async () => {
        await sleep(300);
        execSilent(`npm install`, projectPath);
        return "All dependencies installed successfully!";
      },
    },
  ]);

  // After all main tasks are completed, ask about shadcn UI components
  const wantsShadcn = await p.confirm({
    message: "Would you like to install shadcn-svelte UI components?",
  });

  if (p.isCancel(wantsShadcn)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  if (wantsShadcn) {
    p.log.info("Setting up shadcn-svelte UI components...");
    p.log.info(
      "Please answer the following prompts to configure shadcn-svelte:"
    );

    try {
      // Run the interactive shadcn init command
      await execInteractive(`npx shadcn-svelte@latest init`, projectPath);

      p.log.success("shadcn-svelte initialized successfully!");
    } catch (error) {
      p.log.error(`Error initializing shadcn-svelte: ${error.message}`);
    }
  }

  // Final success message
  p.outro(
    `${color.red("✓")} ${color.bold("Project created successfully!")}\n\n` +
      `To get started:\n` +
      `•  ${color.yellow(`cd ${projectName}`)}\n` +
      `•  ${color.yellow("npm install")}\n` +
      `•  ${color.yellow("npm run dev")}\n\n` +
      `Happy coding! 🚀`
  );
}

// Run with error handling
run().catch((error) => {
  p.log.error(`An unexpected error occurred: ${error.message}`);
  process.exit(1);
});
