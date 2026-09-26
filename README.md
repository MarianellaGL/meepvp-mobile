# TableScore mobile

The app currently uses a local build of `@marianellagl/scoreui` from the sibling `scoreUI` repository. Keep both repositories in the same parent directory.

After changing scoreUI, rebuild and refresh the local package snapshot:

```sh
cd ../scoreUI
pnpm build:package
cd ../tablescore-mobile
pnpm install --ignore-scripts
```

Once scoreUI is published, replace the `file:../scoreUI/package-dist` dependency with the published version and update the lockfile.

The `--ignore-scripts` flag avoids a pnpm policy failure for an unrelated dependency (`unrs-resolver`). The app's Android and web exports work with this local install.
