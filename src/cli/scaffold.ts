import * as p from '@clack/prompts';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { isEntryCovered, writeEntries } from '../config/entries';
import Handoff from '../index';

// Constants
const COMPONENTS_DIR = 'components';
const DEFAULT_GROUPS = [
  { value: 'Atomic Elements', label: 'Atomic Elements' },
  { value: 'Forms', label: 'Forms' },
  { value: 'Navigation', label: 'Navigation' },
  { value: 'Layout', label: 'Layout' },
  { value: 'Feedback', label: 'Feedback' },
  { value: 'custom', label: 'Custom...' },
] as const;

// Interfaces
interface FigmaComponent {
  name: string;
  instanceCount: number;
  variantProps: string[];
}

interface ComponentConfig {
  name: string;
  title: string;
  description: string;
  group: string;
  generateTsx: boolean;
  generateScss: boolean;
  variantProps: string[];
}

/**
 * Convert a string to Title Case
 */
const toTitleCase = (str: string): string => {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Generate the component JS stub content
 */
const generateComponentStub = (config: ComponentConfig): string => {
  const entriesLines: string[] = [];
  if (config.generateTsx) {
    entriesLines.push(`    component: './${config.name}.tsx',`);
  } else {
    entriesLines.push(`    template: './${config.name}.hbs',`);
  }
  if (config.generateScss) {
    entriesLines.push(`    scss: './${config.name}.scss',`);
  }

  const commonMetadata = `  id: "${config.name}",
  name: "${config.title}",
  description: "${config.description}",
  group: "${config.group}",
  type: "element",
  figmaComponentId: "${config.name}",`;

  if (config.generateTsx) {
    return `const { defineReactComponent } = require('handoff-app');
const ${toTitleCase(config.name).replace(/\s/g, '')} = require('./${config.name}').default;

module.exports = defineReactComponent(${toTitleCase(config.name).replace(/\s/g, '')}, {
${commonMetadata}
  entries: {
${entriesLines.join('\n')}
  },
  previews: {
    default: { title: "Default", args: {} }
  }
});
`;
  }

  return `const { defineHandlebarsComponent } = require('handoff-app');

module.exports = defineHandlebarsComponent({
${commonMetadata}
  entries: {
${entriesLines.join('\n')}
  },
  previews: {
    default: { title: "Default", args: {} }
  }
});
`;
};

/**
 * Generate a basic React component stub with variant props
 */
const generateReactComponentStub = (name: string, variantProps: string[]): string => {
  const componentName = toTitleCase(name).replace(/\s/g, '');
  
  // Build props interface
  const propsLines = variantProps.map((prop) => `  ${prop}?: string;`);
  propsLines.push('  children?: React.ReactNode;');
  
  // Build destructured props
  const destructuredProps = [...variantProps, 'children'].join(', ');
  
  // Build display content showing variant values
  const displayContent = variantProps.length > 0
    ? `{[${variantProps.join(', ')}].filter(Boolean).join(' • ') || children}`
    : '{children}';

  return `import React from 'react';

interface ${componentName}Props {
${propsLines.join('\n')}
}

const ${componentName}: React.FC<${componentName}Props> = ({ ${destructuredProps} }) => {
  return <div>${displayContent}</div>;
};

export default ${componentName};
`;
};

/**
 * Generate a basic SCSS stub
 */
const generateScssStub = (name: string): string => {
  return `// ${toTitleCase(name)} component styles
.${name} {
  // Add your styles here
}
`;
};

/**
 * Extract unique variant property names from component instances
 */
const extractVariantProps = (instances: Array<{ variantProperties?: Array<[string, string]> }>): string[] => {
  const propSet = new Set<string>();
  for (const instance of instances) {
    if (instance.variantProperties) {
      for (const [propName] of instance.variantProperties) {
        propSet.add(propName);
      }
    }
  }
  return Array.from(propSet);
};

/**
 * Get list of Figma components from the documentation object
 */
const getFigmaComponents = async (handoff: Handoff): Promise<FigmaComponent[]> => {
  const documentationObject = await handoff.getDocumentationObject();
  if (!documentationObject?.components) {
    return [];
  }

  return Object.entries(documentationObject.components).map(([name, data]) => ({
    name,
    instanceCount: data.instances?.length || 0,
    variantProps: extractVariantProps(data.instances || []),
  }));
};

/**
 * Get list of registered component IDs from runtime config
 */
const getRegisteredComponentIds = (handoff: Handoff): string[] => {
  const components = handoff.runtimeConfig?.entries?.components || {};
  return Object.keys(components);
};

/**
 * Find unregistered components (in Figma but not locally defined)
 */
const findUnregisteredComponents = (
  figmaComponents: FigmaComponent[],
  registeredIds: string[]
): FigmaComponent[] => {
  const registeredSet = new Set(registeredIds.map((id) => id.toLowerCase()));
  return figmaComponents.filter(
    (component) => !registeredSet.has(component.name.toLowerCase())
  );
};

/**
 * Count registered components that match Figma components
 */
const countMatchingRegisteredComponents = (
  figmaComponents: FigmaComponent[],
  registeredIds: string[]
): number => {
  const figmaSet = new Set(figmaComponents.map((c) => c.name.toLowerCase()));
  return registeredIds.filter((id) => figmaSet.has(id.toLowerCase())).length;
};

/**
 * Create component files
 */
const createComponentFiles = async (
  handoff: Handoff,
  config: ComponentConfig
): Promise<string[]> => {
  const createdFiles: string[] = [];
  const componentDir = path.resolve(
    handoff.workingPath,
    COMPONENTS_DIR,
    config.name
  );

  // Ensure directory exists
  await fs.ensureDir(componentDir);

  // Create the main component declaration file
  const jsPath = path.join(componentDir, `${config.name}.handoff.js`);
  await fs.writeFile(jsPath, generateComponentStub(config));
  createdFiles.push(jsPath);

  // Optionally create TSX file
  if (config.generateTsx) {
    const tsxPath = path.join(componentDir, `${config.name}.tsx`);
    await fs.writeFile(tsxPath, generateReactComponentStub(config.name, config.variantProps));
    createdFiles.push(tsxPath);
  } else {
    const hbsTemplatePath = path.resolve(handoff.modulePath, 'config/templates/component/template.hbs');
    const hbsTemplate = await fs.readFile(hbsTemplatePath, 'utf8');
    const hbsPath = path.join(componentDir, `${config.name}.hbs`);
    await fs.writeFile(hbsPath, hbsTemplate);
    createdFiles.push(hbsPath);
  }

  // Optionally create SCSS file
  if (config.generateScss) {
    const scssPath = path.join(componentDir, `${config.name}.scss`);
    await fs.writeFile(scssPath, generateScssStub(config.name));
    createdFiles.push(scssPath);
  }

  return createdFiles;
};

/**
 * Display a preview of the component stub
 */
const displayComponentPreview = (config: ComponentConfig): void => {
  const stub = generateComponentStub(config);
  const lines = stub.split('\n');
  const preview = lines.slice(0, 12).join('\n') + '\n  ...\n};';
  p.note(preview, `Preview: ${config.name}.handoff.js`);
};

/**
 * Main scaffold entry point
 */
export const runScaffold = async (handoff: Handoff): Promise<void> => {
  p.intro(chalk.bgCyan.black(' Handoff Component Scaffold '));

  // Step 1: Validate tokens.json exists
  const tokensPath = handoff.getTokensFilePath();
  if (!fs.existsSync(tokensPath)) {
    p.cancel(
      chalk.red(
        'No tokens.json found. Please run "handoff-app fetch" first to fetch Figma components.'
      )
    );
    process.exit(1);
  }

  // Step 2: Analyze components
  const spinner = p.spinner();
  spinner.start('Analyzing Figma components...');

  const figmaComponents = await getFigmaComponents(handoff);
  const registeredIds = getRegisteredComponentIds(handoff);
  const unregisteredComponents = findUnregisteredComponents(figmaComponents, registeredIds);
  const matchingCount = countMatchingRegisteredComponents(figmaComponents, registeredIds);

  spinner.stop('Analysis complete');

  // Display summary
  p.log.info(
    `Found ${chalk.cyan(figmaComponents.length)} components in Figma, ` +
      `${chalk.green(matchingCount)} already have local implementations.`
  );

  if (unregisteredComponents.length === 0) {
    p.outro(chalk.green('All Figma components have local implementations. Nothing to do!'));
    return;
  }

  p.log.info(
    `${chalk.yellow(unregisteredComponents.length)} components need stubs.`
  );

  // Step 3: Component selection
  const selectedComponents = await p.multiselect({
    message: 'Select components to scaffold:',
    options: unregisteredComponents.map((component) => ({
      value: component.name,
      label: `${component.name} (${component.instanceCount} variants)`,
    })),
    required: true,
  });

  if (p.isCancel(selectedComponents)) {
    p.cancel('Scaffold cancelled.');
    process.exit(0);
  }

  const componentConfigs: ComponentConfig[] = [];

  // Create a map for quick lookup of variant props
  const componentVariantMap = new Map(
    unregisteredComponents.map((c) => [c.name, c.variantProps])
  );

  // Step 4: Configure each selected component
  for (const componentName of selectedComponents as string[]) {
    p.log.step(`Configure "${componentName}"`);

    const title = await p.text({
      message: 'Title:',
      initialValue: toTitleCase(componentName),
      validate: (value) => {
        if (!value.trim()) return 'Title is required';
      },
    });

    if (p.isCancel(title)) {
      p.cancel('Scaffold cancelled.');
      process.exit(0);
    }

    const description = await p.text({
      message: 'Description:',
      initialValue: '',
      placeholder: 'Optional description for this component',
    });

    if (p.isCancel(description)) {
      p.cancel('Scaffold cancelled.');
      process.exit(0);
    }

    const group = await p.select({
      message: 'Group:',
      options: [...DEFAULT_GROUPS],
    });

    if (p.isCancel(group)) {
      p.cancel('Scaffold cancelled.');
      process.exit(0);
    }

    let finalGroup = group as string;
    if (group === 'custom') {
      const customGroup = await p.text({
        message: 'Enter custom group name:',
        validate: (value) => {
          if (!value.trim()) return 'Group name is required';
        },
      });

      if (p.isCancel(customGroup)) {
        p.cancel('Scaffold cancelled.');
        process.exit(0);
      }
      finalGroup = customGroup as string;
    }

    const generateTsx = await p.confirm({
      message: 'Generate .tsx React component template?',
      initialValue: true,
    });

    if (p.isCancel(generateTsx)) {
      p.cancel('Scaffold cancelled.');
      process.exit(0);
    }

    const generateScss = await p.confirm({
      message: 'Generate .scss style file?',
      initialValue: true,
    });

    if (p.isCancel(generateScss)) {
      p.cancel('Scaffold cancelled.');
      process.exit(0);
    }

    const config: ComponentConfig = {
      name: componentName,
      title: title as string,
      description: (description as string) || '',
      group: finalGroup,
      generateTsx: generateTsx as boolean,
      generateScss: generateScss as boolean,
      variantProps: componentVariantMap.get(componentName) || [],
    };

    componentConfigs.push(config);

    // Display preview
    displayComponentPreview(config);
  }

  // Step 5: Config update prompt
  const updateConfig = await p.confirm({
    message: 'Update handoff config file to include these components?',
    initialValue: true,
  });

  if (p.isCancel(updateConfig)) {
    p.cancel('Scaffold cancelled.');
    process.exit(0);
  }

  // Step 6: Generate files
  const generationSpinner = p.spinner();
  generationSpinner.start('Creating component files...');

  const allCreatedFiles: string[] = [];
  const componentNames: string[] = [];

  for (const config of componentConfigs) {
    const createdFiles = await createComponentFiles(handoff, config);
    allCreatedFiles.push(...createdFiles);
    componentNames.push(config.name);
  }

  generationSpinner.stop('Files created successfully');

  // Display summary
  p.log.success('Created files:');
  for (const file of allCreatedFiles) {
    const relativePath = path.relative(handoff.workingPath, file);
    console.log(chalk.dim(`  ${relativePath}`));
  }

  // Update config if requested. Components already covered by a collection directory auto-load,
  // so we only write the uncovered ones into entries.components.
  if (updateConfig) {
    const componentDirs = componentNames.map((name) => path.resolve(handoff.workingPath, COMPONENTS_DIR, name));
    const uncovered = componentDirs.filter((dir) => !isEntryCovered(handoff, 'components', dir));

    if (uncovered.length === 0) {
      p.log.info(`Config already covers these components - they'll auto-load`);
    } else {
      const result = await writeEntries(handoff, 'components', uncovered);
      if (result.status === 'added') {
        const configFileName = result.configPath ? path.basename(result.configPath) : 'handoff.config.json';
        p.log.success(`Updated ${configFileName} with component paths`);
      } else {
        const where = result.configPath ? path.relative(handoff.workingPath, result.configPath) : 'handoff.config';
        p.log.warn(`Could not automatically update ${where}. Please manually add these paths to entries.components:`);
        for (const rel of result.pending) {
          console.log(chalk.yellow(`  '${rel}'`));
        }
      }
    }
  }

  p.outro(
    chalk.green(
      `Successfully created ${componentConfigs.length} component stub(s)!`
    )
  );
};

