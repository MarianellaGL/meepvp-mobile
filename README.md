# TableScore mobile

The app uses the published [`@decodadev02/scoreui`](https://www.npmjs.com/package/@decodadev02/scoreui) package for its shared design system.

Install dependencies with pnpm:

```sh
pnpm install --ignore-scripts
```

The `--ignore-scripts` flag avoids a pnpm policy failure for an unrelated dependency (`unrs-resolver`). The app does not need that build script for its verified Android and web exports.
