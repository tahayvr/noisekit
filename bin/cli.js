#!/usr/bin/env node

import { execSync } from "child_process";
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

// Main function
async function run() {
  // Start with banner and intro
  displayBanner();
  p.intro(`${color.red("noiseKit")} - noiseRandom SvelteKit Starter`);

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

  // Use task system to execute all tasks with spinners
  await p.tasks([
    {
      title: "Creating SvelteKit project",
      task: async () => {
        await sleep(500); // Slight delay for UX
        execSilent(
          `npx sv create ${projectName} --template minimal --types ts --no-add-ons --install npm`
        );
        execSilent(`mkdir -p src/lib/components`, projectPath);
        execSilent(`mkdir -p src/lib/utils`, projectPath);
        execSilent(`mkdir -p src/lib/hooks`, projectPath);
        execSilent(`mkdir -p src/lib/components/ui`, projectPath);
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

        return `${pkg.description} completed!`;
      },
    })),

    {
      title: "Setting up Tailwind CSS with Typography",
      task: async () => {
        await sleep(300);
        try {
          // Try the basic tailwindcss installation first
          execSilent(
            `npx sv add tailwindcss="plugins:typography" --no-preconditions --no-install`,
            projectPath
          );

          // Install dependencies after Tailwind is set up
          execSilent(`npm install`, projectPath);
          return "Tailwind CSS configured successfully!";
        } catch (error) {
          console.error("Tailwind installation error:", error.message);
          throw error;
        }
      },
    },

    //install shadcn-svelte
    {
      title: "Installing shadcn-svelte",
      task: async () => {
        await sleep(300);
        execSilent(
          `npx shadcn-svelte@latest init --base-color zinc --css 'src/app.css' --components-alias '$lib/components' --lib-alias '$lib' --utils-alias '$lib/utils' --hooks-alias '$lib/hooks' --ui-alias '$lib/components/ui'`,
          projectPath
        );
        return "shadcn-svelte installed successfully!";
      },
    },

    //install shadcn-svelte component
    {
      title: "Installing shadcn-svelte components",
      task: async () => {
        await sleep(300);
        execSilent(
          `npx shadcn-svelte@latest add --yes button input textarea label select checkbox radio-group card separator dialog aspect-ratio sidebar`,
          projectPath
        );
        return "shadcn-svelte components installed successfully!";
      },
    },

    //finalize project setup
    {
      title: "Finalizing project setup",
      task: async () => {
        await sleep(300);
        execSilent(`npm install`, projectPath);
        return "All dependencies installed successfully!";
      },
    },
  ]);

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
