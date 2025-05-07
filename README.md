<p align="center">
<img src="assets/noiseKit-banner.svg" alt="noiseKit" width="300"/>
</p>

`noisekit` is a CLI tool to quickly scaffold a new SvelteKit project with the noiseKit stack.

## The noiseKit Stack

A web dev stack by noiseRandom.

- [SvelteKit](https://svelte.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn-svelte](https://next.shadcn-svelte.com/)

## Getting Started

To start a new project using the noiseKit stack, run the following command:

```bash
npx noisekit
```

The tool will prompt you for the name of your new project.

It will then perform the following steps:

1.  Create a new SvelteKit project in a directory with the name you provided.
2.  Install Tailwind CSS.
3.  Initialize `shadcn-svelte`.
4.  Add the pre-defined `shadcn-svelte` components.
5.  Install `svelte-seo`.
6.  Display a success message.

After the process completes, you can navigate into your new SvelteKit project directory:

```bash
cd <your-project-name>
npm run dev
```

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
