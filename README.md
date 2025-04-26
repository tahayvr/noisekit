# noisekit

`noisekit` is a command-line tool to quickly scaffold a new SvelteKit project with a pre-configured setup, including Tailwind CSS, shadcn-svelte, and svelte-seo.

## Features

- Initializes a SvelteKit project (using `minimal` template, TypeScript).
- Integrates Tailwind CSS.
- Initializes `shadcn-svelte`.
- Adds common `shadcn-svelte` components: `button`, `input`, `textarea`, `label`, `select`, `checkbox`, `radio-group`, `card`, `separator`, `dialog`, `aspect-ratio`, `sidebar`.
- Installs `svelte-seo` for basic SEO needs.

## Installation

To use `noisekit` locally or for development:

1.  Clone this repository:
    ```bash
    git clone
    cd noisekit
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Link the package globally:
    ```bash
    npm link
    ```

Alternatively, once published to npm, you can install it globally:

```bash
npm
```

## Usage

After installation (either via linking or global install), run the following command:

```bash
create-noisekit
```

The tool will prompt you for the name of your new project.

It will then perform the following steps:

1.  Create a new SvelteKit project in a directory with the name you provided.
2.  Install Tailwind CSS.
3.  Initialize `shadcn-svelte`.
4.  Add the pre-defined `shadcn-svelte` components.
5.  Install `svelte-seo`.
6.  Display a success message.

After the process completes, you can navigate into your new project directory:

```bash
cd <your-project-name>
npm run dev
```

## Development

If you want to contribute or modify `noisekit`:

1.  Follow the local installation steps above.
2.  Make your changes in the `bin/cli.js` or other relevant files.
3.  Since `npm link` creates a symbolic link, your changes will be reflected immediately when you run `create-noisekit`.

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
