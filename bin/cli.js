#!/usr/bin/env node

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import gradient from "gradient-string";
import process from "process";
import * as p from "@clack/prompts";
import { setTimeout as sleep } from "node:timers/promises";
import color from "picocolors";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Execute command with inherited stdio (for interactive commands)
function execInteractive(command, cwd = process.cwd()) {
  try {
    return execSync(command, { stdio: "inherit", cwd });
  } catch (error) {
    throw new Error(`Command failed: ${command}`);
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

  // Adapter selection
  const adapter = await p.select({
    message: "Which adapter would you like to use?",
    options: [
      {
        value: "node",
        label: "Node",
        hint: "standalone Node server",
      },
      {
        value: "static",
        label: "Static",
        hint: "static site generator (SSG)",
      },
    ],
  });

  // Handle cancellation
  if (p.isCancel(adapter)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  // Drizzle ORM setup
  const useDrizzle = await p.confirm({
    message: "Would you like to add Drizzle ORM?",
    initialValue: false,
  });

  // Handle cancellation
  if (p.isCancel(useDrizzle)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  let drizzleConfig = null;
  if (useDrizzle) {
    const database = await p.select({
      message: "Which database would you like to use?",
      options: [
        {
          value: "postgresql",
          label: "PostgreSQL",
          hint: "most popular open source database",
        },
        {
          value: "mysql",
          label: "MySQL",
          hint: "another popular open source database",
        },
        {
          value: "sqlite",
          label: "SQLite",
          hint: "file-based database",
        },
      ],
    });

    if (p.isCancel(database)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    // Client options based on database
    const clientOptions = {
      postgresql: [
        { value: "postgres.js", label: "postgres.js" },
        { value: "neon", label: "Neon" },
      ],
      mysql: [
        { value: "mysql2", label: "mysql2" },
        { value: "planetscale", label: "PlanetScale" },
      ],
      sqlite: [
        { value: "better-sqlite3", label: "better-sqlite3" },
        { value: "libsql", label: "libsql" },
        { value: "turso", label: "Turso" },
      ],
    };

    const client = await p.select({
      message: "Which SQL client would you like to use?",
      options: clientOptions[database],
    });

    if (p.isCancel(client)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    let docker = false;
    if (database === "postgresql" || database === "mysql") {
      docker = await p.confirm({
        message: "Would you like to add Docker Compose configuration?",
        initialValue: false,
      });

      if (p.isCancel(docker)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }
    }

    drizzleConfig = {
      database,
      client,
      docker,
    };
  }

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
      command: "npx sv add eslint",
      description: "Installing ESLint",
    },
    prettier: {
      command: "npx sv add prettier",
      description: "Installing Prettier",
    },
    playwright: {
      command: "npx sv add playwright",
      description: "Installing Playwright",
    },
    vitest: {
      command: "npx sv add vitest",
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
      `• Adapter: ${color.yellow(adapter)}\n` +
      `• Drizzle ORM: ${
        drizzleConfig
          ? color.yellow(
              `${drizzleConfig.database} + ${drizzleConfig.client}${
                drizzleConfig.docker ? " + Docker" : ""
              }`
            )
          : color.yellow("No")
      }\n` +
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
        // Install Tailwind CSS v4 with typography plugin
        execSilent(
          `npx sv add --no-git-check tailwindcss="plugins:typography"`,
          projectPath
        );
        return "Tailwind CSS configured successfully!";
      },
    },

    // Configure SvelteKit adapter
    {
      title: `Configuring ${adapter} adapter`,
      task: async () => {
        await sleep(300);
        execSilent(
          `npx sv add --no-git-check sveltekit-adapter=adapter:${adapter}`,
          projectPath
        );

        // If static adapter, add prerender to root layout
        if (adapter === "static") {
          const layoutPath = join(projectPath, "src", "routes", "+layout.ts");
          const layoutContent = `// Prerender all pages for static site generation
export const prerender = true;
`;
          writeFileSync(layoutPath, layoutContent);
        }

        return `${adapter} adapter configured successfully!`;
      },
    },

    // Configure Drizzle ORM if selected
    ...(drizzleConfig
      ? [
          {
            title: "Setting up Drizzle ORM",
            task: async () => {
              await sleep(300);
              let drizzleCommand = `npx sv add --no-git-check drizzle=database:${drizzleConfig.database}+client:${drizzleConfig.client}`;
              if (drizzleConfig.docker) {
                drizzleCommand += "+docker:yes";
              }
              execSilent(drizzleCommand, projectPath);
              return "Drizzle ORM configured successfully!";
            },
          },
        ]
      : []),

    //install shadcn-svelte
    {
      title: "Installing shadcn-svelte",
      task: async () => {
        await sleep(300);
        execSilent(
          `npx shadcn-svelte@latest init --no-deps --overwrite --base-color neutral --css src/app.css --components-alias '$lib/components' --lib-alias '$lib' --utils-alias '$lib/utils' --hooks-alias '$lib/hooks' --ui-alias '$lib/components/ui'`,
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

        // Replace README with custom template
        const templatePath = join(__dirname, "..", "templates", "README.md");
        const readmePath = join(projectPath, "README.md");
        const template = readFileSync(templatePath, "utf-8");

        // Build Drizzle setup text
        let drizzleSetup = "";
        if (drizzleConfig) {
          drizzleSetup = `\n- **Drizzle ORM**: ${drizzleConfig.database} with ${
            drizzleConfig.client
          }${drizzleConfig.docker ? " + Docker Compose" : ""}`;
        }

        // Build additional packages text
        let additionalPackages = "";
        if (utilities.length > 0) {
          const formattedTools = utilities
            .map((tool) => tool.charAt(0).toUpperCase() + tool.slice(1))
            .join(", ");
          additionalPackages = "\n- **Additional Tools**: " + formattedTools;
        }

        // Replace all placeholders
        const customReadme = template
          .replace(/{{PROJECT_NAME}}/g, projectName)
          .replace(/{{ADAPTER}}/g, adapter)
          .replace(/{{DRIZZLE_SETUP}}/g, drizzleSetup)
          .replace(/{{ADDITIONAL_PACKAGES}}/g, additionalPackages);

        writeFileSync(readmePath, customReadme);

        return "All dependencies installed successfully!";
      },
    },
  ]);

  // Final success message
  p.outro(
    `${color.red("✓")} ${color.bold("Project created successfully!")}\n\n` +
      `To get started:\n` +
      `•  ${color.yellow(`cd ${projectName}`)}\n` +
      `•  ${color.yellow("npm run dev")}\n\n` +
      `Happy coding! 🚀`
  );
}

// Run with error handling
run().catch((error) => {
  p.log.error(`An unexpected error occurred: ${error.message}`);
  process.exit(1);
});
