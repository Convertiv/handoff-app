// @ts-check
const { buildTmpDir, buildStaticSite } = require('./build/scripts');

(async function () {
  await buildTmpDir();
  await buildStaticSite();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
