import {defineConfig} from "zotero-plugin-scaffold";
import pkg from "./package.json";

export default defineConfig({
	source: ["src", "addon"],
	dist: ".scaffold/build",
	name: pkg.config.addonName,
	id: pkg.config.addonID,
	namespace: pkg.config.addonRef,
	build: {
		assets: ["addon/**/*.*"],
		define: {
			...pkg.config,
			author: pkg.author,
			description: pkg.description,
			homepage: pkg.homepage ?? "https://github.com/MCXCC303/just-enough-color",
			buildVersion: pkg.version,
			buildTime: "{{buildTime}}",
			updateURL: "",
		},
		prefs: {
			prefix: pkg.config.prefsPrefix,
		},
		esbuildOptions: [
			{
				entryPoints: ["src/index.ts"],
				define: {
					__env__: `"${process.env.NODE_ENV}"`,
				},
				bundle: true,
				target: "firefox115",
				outfile: `.scaffold/build/addon/content/scripts/${pkg.config.addonRef}.js`,
			},
		],
	},
	release: {
		bumpp: {
			// Run the build before releasing (used in CI)
			execute: "npm run build",
		},
		github: {
			// Only release to GitHub in CI; locally `zotero-plugin release`
			// just bumps the version, commits and pushes the tag
			enable: "ci",
		},
	},
});
