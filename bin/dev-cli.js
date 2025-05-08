#!/usr/bin/env node

// This is a clone of the main CLI script for development testing
// You can modify this file without affecting the published CLI

import { execSync, spawn } from "child_process";
import gradient from "gradient-string";
import process from "process";
import * as p from "@clack/prompts";
import { setTimeout as sleep } from "node:timers/promises";
import color from "picocolors";

// Banner display with "DEV MODE" indicator
function displayBanner() {
  // Custom gradient colors
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
  console.log(color.magenta("  [ DEVELOPMENT MODE ]"));
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
  p.intro(`${color.magenta("noiseKit DEV")} - Modern SvelteKit Starter`);

  // Get project name with test prefix to avoid conflicts
  const projectName = await p.text({
    message: "What would you like to name your project?",
    placeholder: "test-project",
    initialValue: `test-${Date.now().toString().slice(-6)}`,
    validate(value) {
      if (!value) return "Please enter a project name.";
      if (value.includes(" ")) return "Project name cannot contain spaces.";
      if (!/^[a-z0-9-_]+$/i.test(value))
        return "Project name can only include alphanumeric characters, hyphens, and underscores.";
    },
  });

  // Handle cancellation
  if (p.isCancel(projectName)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  // Project path
  const projectPath = `./${projectName}`;

  // Additional features selection
  const components = await p.multiselect({
    message: "Which UI component sets would you like to include?",
    options: [
      // Temporarily commenting out shadcn components until we figure out options
      // { value: 'basic', label: 'Basic Components', hint: 'button, input, textarea, label' },
      // { value: 'form', label: 'Form Components', hint: 'select, checkbox, radio-group' },
      // { value: 'layout', label: 'Layout Components', hint: 'card, separator, aspect-ratio, sidebar' },
      // { value: 'dialog', label: 'Dialog Components', hint: 'dialog' }
      {
        value: "none",
        label: "None for now",
        hint: "shadcn integration coming soon",
      },
    ],
    required: true,
    initialValues: ["none"],
  });

  // Handle cancellation
  if (p.isCancel(components)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  // Additional utilities
  const utilities = await p.multiselect({
    message: "Would you like to install additional packages?",
    options: [
      { value: "svelte-seo", label: "SEO Support", hint: "svelte-seo" },
    ],
    initialValues: ["svelte-seo"],
  });

  // Handle cancellation
  if (p.isCancel(utilities)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  // Create component list for shadcn
  const componentMap = {
    // basic: ["button", "input", "textarea", "label"],
    // form: ["select", "checkbox", "radio-group"],
    // layout: ["card", "separator", "aspect-ratio", "sidebar"],
    // dialog: ["dialog"]
    none: [],
  };

  const selectedComponents = components
    .flatMap((set) => componentMap[set] || [])
    .join(" ");

  // Create packages list
  const packageMap = {
    "svelte-seo": "svelte-seo",
  };

  const selectedPackages = utilities
    .map((util) => packageMap[util])
    .filter(Boolean)
    .join(" ");

  // Show summary before starting
  p.note(
    `${color.magenta("Project setup summary:")}\n` +
      `• Project Name: ${color.green(projectName)}\n` +
      // `• Components: ${color.green(components.join(', ') || 'None')}\n` +
      `• Additional Packages: ${color.green(utilities.join(", ") || "None")}`,
    "Creating your noiseKit project"
  );

  // Confirmation
  const confirmed = await p.confirm({
    message: "Ready to create your project?",
  });

  if (p.isCancel(confirmed) || !confirmed) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  // Use task system to execute all tasks with spinners
  const results = await p.tasks([
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
    {
      title: "Setting up Tailwind CSS with Typography",
      task: async () => {
        await sleep(300);
        execSilent(
          `npx sv@0.6.18 add --tailwindcss=typography --no-install`,
          projectPath
        );
        // Install dependencies after Tailwind is set up
        execSilent(`npm install`, projectPath);
        return "Tailwind CSS configured successfully!";
      },
    },
    // Commenting out shadcn initialization temporarily
    /*
    {
      title: 'Initializing shadcn-svelte',
      task: async () => {
        await sleep(300);
        execSilent(`npx shadcn-svelte@next init`, projectPath);
        return 'shadcn-svelte initialized successfully!';
      }
    },
    {
      title: 'Installing UI components',
      task: async () => {
        await sleep(300);
        if (selectedComponents) {
          execSilent(`npx shadcn-svelte@next add -y ${selectedComponents}`, projectPath);
        }
        return 'UI components installed successfully!';
      }
    },
    */
    {
      title: "Installing additional packages",
      task: async () => {
        await sleep(300);
        if (selectedPackages) {
          execSilent(`npm install -D ${selectedPackages}`, projectPath);
        }
        return "Additional packages installed successfully!";
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

  // Final success message
  p.outro(
    `${color.green("✓")} ${color.bold("Project created successfully!")}\n\n` +
      `To get started:\n` +
      `  ${color.cyan(`cd ${projectName}`)}\n` +
      `  ${color.cyan("npm run dev")}\n\n` +
      `Happy coding! 🚀`
  );
}

// Run with error handling
run().catch((error) => {
  p.log.error(`An unexpected error occurred: ${error.message}`);
  process.exit(1);
});
