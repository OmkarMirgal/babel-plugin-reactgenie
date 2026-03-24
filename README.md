# @garrix82/babel-plugin-reactgenie

Babel plugin for ReactGenie that:
- emits decorator metadata used by ReactGenie and related TypeScript reflection flows
- preserves a stable `__genieClassName` on `@GenieClass` declarations so production minification does not break Genie class identity

## Fork Notice

This package is a fork of `babel-plugin-reactgenie`, which itself was derived from `babel-plugin-transform-typescript-metadata`.

- Original upstream: [StanfordHCI/babel-plugin-reactgenie](https://github.com/StanfordHCI/babel-plugin-reactgenie)
- Fork maintained by: [Omkar Mirgal](https://github.com/OmkarMirgal)

The fork keeps the original MIT license. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).

## What Changed In This Fork

In addition to the existing metadata emission, this fork injects:

```ts
static __genieClassName = "OriginalClassName";
```

for classes decorated with `@GenieClass(...)`.

That injection happens at build time, before minification. ReactGenie then uses `__genieClassName` instead of relying on minified runtime names like `e` or `t`.

## Installation

With npm:

```sh
npm install --save-dev @garrix82/babel-plugin-reactgenie
```

With pnpm:

```sh
pnpm add --save-dev @garrix82/babel-plugin-reactgenie
```

With Yarn:

```sh
yarn add --dev @garrix82/babel-plugin-reactgenie
```

## Usage

Place the plugin before the decorators/class-properties transforms.

```js
{
  "plugins": [
    "@garrix82/babel-plugin-reactgenie",
    ["@babel/plugin-proposal-decorators", { "legacy": true }],
    ["@babel/plugin-transform-class-properties", { "loose": true }]
  ],
  "presets": [
    "@babel/preset-typescript"
  ]
}
```

## Stable Genie Class Names

Input:

```ts
@GenieClass("Probe-specific date and time value.")
class ProbeDateTime extends HelperClass {}
```

Output includes:

```ts
ProbeDateTime.__genieClassName = "ProbeDateTime";
```

This is intended for ReactGenie environments where DSL descriptors, prompt examples, serialization, and `Current()` resolution must survive production minification.

## License

MIT.
