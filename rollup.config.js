import typescript from "rollup-plugin-typescript2";
import nodeResolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import pkg from "./package.json";
import { terser } from "rollup-plugin-terser";

const ensureArray = maybeArr =>
    Array.isArray(maybeArr) ? maybeArr : [maybeArr];

const makeExternalPredicate = externalArr => {
    if (!externalArr.length) {
        return () => false;
    }
    const pattern = new RegExp(`^(${externalArr.join("|")})($|/)`);
    return id => pattern.test(id);
};

const extensions = [".js"];
const deps = Object.keys(pkg.dependencies || {});
const peerDeps = Object.keys(pkg.peerDependencies || {});

const createConfig = ({
    input,
    output,
    external,
    env,
    min = false,
    useBabel = false,
    ...props
}) => {
    return {
        input: input ? input : "src/index.ts",
        output: ensureArray(output).map(format =>
            Object.assign({}, format, {
                name: "opa-compile-response-parser",
                exports: "named"
            })
        ),
        external: makeExternalPredicate(
            external === "peers" ? peerDeps : deps.concat(peerDeps)
        ),
        onwarn(warning, warn) {
            if (warning.code === "CIRCULAR_DEPENDENCY") return;
            warn(warning);
        },
        plugins: [
            typescript({
                rollupCommonJSResolveHack: true,
                useTsconfigDeclarationDir: true
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
            file: "dist/index.cjs.js"
        }
    }),
    // --- ES Module
    createConfig({
        output: {
            format: "esm",
            file: "dist/index.esm.js"
        }
    }),
    // --- ES Module for Web Browser
    createConfig({
        output: {
            format: "esm",
            file: "dist/index.min.mjs"
        },
        external: "peers",
        env: "production",
        min: true
    }),
    // --- UMD Development
    createConfig({
        output: {
            file: "dist/index.umd.js",
            format: "umd"
        },
        external: "peers",
        env: "development"
    }),
    // --- UMD Production
    createConfig({
        output: {
            file: "dist/index.min.umd.js",
            format: "umd"
        },
        external: "peers",
        env: "production",
        min: true
    })
];
