import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import svg from "esbuild-plugin-svg";

const isProduction = process.argv.includes("production");

const commonOptions = {
	entryPoints: ["./src/main.ts"],
	bundle: true,
	external: [
		"obsidian", // Obsidian API is always external
		...builtins,
	],
	format: "cjs", // Obsidian plugins use CommonJS
	treeShaking: true,
	plugins: [svg()],
};

const buildOptions = {
	...commonOptions,
	outfile: "main.js",
	minify: isProduction,
	sourcemap: !isProduction,
	define: {
		"process.env.NODE_ENV": isProduction ? '"production"' : '"development"',
	},
};
if (isProduction) {
	esbuild.build(buildOptions).catch(() => process.exit(1));
} else {
	esbuild
		.context(buildOptions)
		.then((context) => {
			console.log("Watching for changes...");
			context.watch();
		})
		.catch(() => process.exit.bind(1));
}
