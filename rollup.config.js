import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import path from "path";
import pkg from "./package.json";
import { terser } from "rollup-plugin-terser";
import camelCase from "lodash/camelCase";

const tsconfigPath = path.resolve(__dirname, "./tsconfig.json");
const ensureArray = maybeArr =>
    Array.isArray(maybeArr) ? maybeArr : [maybeArr];

const extensions = [".js"];
const deps = Object.keys(pkg.dependencies || {});
const peerDeps = Object.keys(pkg.peerDependencies || {});

const umdExportName = (() => {
    const pkgNameParts = pkg.name.split("/");
    const pkgName = camelCase(
        pkgNameParts.length > 1 ? pkgNameParts[1] : pkgNameParts[0]
    );
    return pkgName[0].toUpperCase() + pkgName.substring(1);
})();

const createConfig = ({
    input,
    output,
    tsOptions = {},
    external = "peers",
    min = false,
    ...props
}) => {
    return {
        input: input ? input : "src/index.ts",
        output: ensureArray(output).map(format =>
            Object.assign({}, format, {
                // UMD global export name
                name: umdExportName,
                exports: "named"
            })
        ),
        external: (() => {
            if (external === "peers") return peerDeps;
            else if (external === "all") return deps.concat(peerDeps);
            else return [];
        })(),
        onwarn(warning, warn) {
            if (warning.code === "CIRCULAR_DEPENDENCY") return;
            warn(warning);
        },
        plugins: [
            typescript({
                tsconfig: tsconfigPath,
                ...tsOptions
            }),
            nodeResolve({
                mainFields: ["main", "module", "jsnext:main"],
                extensions
            }),
            commonjs({
                include: "node_modules/**"
            }),
            min &&
                terser({
                    compress: {
                        pure_getters: true,
                        unsafe: true,
                        unsafe_comps: true,
                        warnings: false
                    }
                })
        ].filter(Boolean),
        ...props
    };
};

export default [
    // --- CommonJS
    createConfig({
        output: {
            format: "cjs",
            file: "dist/cjs/index.js"
        },
        external: "none"
    }),
    // --- ES Module
    createConfig({
        output: {
            format: "esm",
            file: "dist/esm/index.js"
        },
        tsOptions: {
            target: "es6"
        },
        external: "none"
    }),
    // --- ES Module for Web Browser
    createConfig({
        output: {
            format: "esm",
            file: "dist/mjs/index.mjs"
        },
        tsOptions: {
            target: "es6"
        },
        external: "none",
        min: true
    }),
    // --- UMD Development
    createConfig({
        output: {
            file: "dist/umd-dev/index.js",
            format: "umd"
        },
        external: "none"
    }),
    // --- UMD Production
    createConfig({
        output: {
            file: "dist/umd-prod/index.js",
            format: "umd"
        },
        external: "none",
        min: true
    })
];
