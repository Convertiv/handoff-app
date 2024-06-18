import Handoff from 'handoff/index';

import { BuildStaticStandaloneOptions, buildStaticStandalone } from '@storybook/core-server';
import { cache } from '@storybook/core-common';
import { readPackageUp } from 'read-package-up';
import { DocumentationObject } from 'handoff/types';

export const buildStorybookPreview = async (handoff: Handoff) => {
  if (!handoff) {
    throw Error('Handoff not initialized');
  }
  const readUpResult = await readPackageUp();
  const options: BuildStaticStandaloneOptions = {
    configDir: './.storybook',
    outputDir: './storybook-static',
    ignorePreview: false,
    configType: 'PRODUCTION',
    cache,
    packageJson: readUpResult,
  };

  buildStaticStandalone(options);
};

const storybookPreviewTransformer = async (handoff: Handoff, documentation: DocumentationObject) => {
  if (!handoff) {
    throw Error('Handoff not initialized');
  }
  console.log('Building Storybook Preview');
  console.log('Handoff:', handoff);
  console.log('Documentation:', documentation);
  await buildStorybookPreview(handoff);
};
export default storybookPreviewTransformer;
