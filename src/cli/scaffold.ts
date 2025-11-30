import * as p from '@clack/prompts';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import Handoff from '../index';

// Constants
const CONFIG_FILES = ['handoff.config.json', 'handoff.config.js', 'handoff.config.cjs'] as const;
const COMPONENTS_DIR = 'components';
const DEFAULT_VERSION = '1.0.0';
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
  // Build entries object with relative paths to generated files
  const entriesLines: string[] = [];
  if (config.generateTsx) {
    entriesLines.push(`    template: './${config.name}.tsx',`);
  }
  if (config.generateScss) {
    entriesLines.push(`    scss: './${config.name}.scss',`);
  }

  const entriesBlock = entriesLines.length > 0
    ? `  entries: {\n${entriesLines.join('\n')}\n  },\n`
    : '';

  return `/** @type {import('handoff-app').Component} */
module.exports = {
  title: "${config.title}",
  description: "${config.description}",
  group: "${config.group}",
  type: "element",
  figmaComponentId: "${config.name}",
${entriesBlock}};
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
 * Check if components will be auto-loaded by an existing entry
 * e.g., if 'components' directory is listed, all subdirectories are auto-loaded
 */
const willComponentsAutoLoad = (existingPaths: string[]): boolean => {
  // Normalize paths for comparison
  const normalizedPaths = existingPaths.map((p) => p.replace(/\/$/, '').toLowerCase());
  // If 'components' directory itself is in the list, all components auto-load
  return normalizedPaths.includes(COMPONENTS_DIR);
};

/**
 * Format component paths as a properly indented array string for JS files
 */
const formatComponentsArray = (paths: string[], indent: string = '      '): string => {
  if (paths.length === 0) return '[]';
  if (paths.length === 1) return `['${paths[0]}']`;
  return `[\n${paths.map((p) => `${indent}'${p}',`).join('\n')}\n${indent.slice(2)}]`;
};

/**
 * Update handoff config file to add component paths
 */
const updateConfigFile = async (
  handoff: Handoff,
  componentNames: string[]
): Promise<{ success: boolean; isJsConfig: boolean; configPath: string; skipped: boolean }> => {
  const configFile = CONFIG_FILES.find((file) =>
    fs.existsSync(path.resolve(handoff.workingPath, file))
  );

  const newComponentPaths = componentNames.map((name) => `${COMPONENTS_DIR}/${name}`);

  if (!configFile) {
    // Create a new handoff.config.json
    const newConfig = {
      entries: {
        components: newComponentPaths,
      },
    };
    const configPath = path.resolve(handoff.workingPath, 'handoff.config.json');
    await fs.writeJSON(configPath, newConfig, { spaces: 2 });
    return { success: true, isJsConfig: false, configPath, skipped: false };
  }

  const configPath = path.resolve(handoff.workingPath, configFile);

  if (configFile.endsWith('.json')) {
    const config = await fs.readJSON(configPath);

    // Initialize entries if not present
    if (!config.entries) {
      config.entries = {};
    }
    if (!config.entries.components) {
      config.entries.components = [];
    }

    // Check if components will auto-load
    if (willComponentsAutoLoad(config.entries.components)) {
      return { success: true, isJsConfig: false, configPath, skipped: true };
    }

    // Add new component paths
    const existingPaths = new Set(config.entries.components);
    for (const componentPath of newComponentPaths) {
      if (!existingPaths.has(componentPath)) {
        config.entries.components.push(componentPath);
      }
    }

    await fs.writeJSON(configPath, config, { spaces: 2 });
    return { success: true, isJsConfig: false, configPath, skipped: false };
  }

  // For JS/CJS config files, try to update them programmatically
  if (configFile.endsWith('.js') || configFile.endsWith('.cjs')) {
    try {
      let content = await fs.readFile(configPath, 'utf8');

      // Check if entries.components already exists
      const hasEntriesComponents = /entries\s*:\s*\{[\s\S]*?components\s*:/.test(content);
      
      if (hasEntriesComponents) {
        // Find and update the components array
        // Match: components: [...] or components: ["..."]
        const componentsArrayRegex = /(components\s*:\s*\[)([^\]]*)(\])/;
        const match = content.match(componentsArrayRegex);
        
        if (match) {
          const existingContent = match[2].trim();
          const existingPaths = existingContent
            .split(',')
            .map((s) => s.trim().replace(/['"]/g, ''))
            .filter((s) => s.length > 0);
          
          // Check if components will auto-load
          if (willComponentsAutoLoad(existingPaths)) {
            return { success: true, isJsConfig: true, configPath, skipped: true };
          }
          
          const existingSet = new Set(existingPaths);
          const pathsToAdd = newComponentPaths.filter((p) => !existingSet.has(p));
          
          if (pathsToAdd.length > 0) {
            const allPaths = [...existingPaths, ...pathsToAdd];
            // Format with proper indentation (detect existing indentation)
            const indentMatch = content.match(/components\s*:\s*\[\s*\n(\s*)/);
            const indent = indentMatch ? indentMatch[1] : '      ';
            const formattedArray = formatComponentsArray(allPaths, indent);
            content = content.replace(componentsArrayRegex, `components: ${formattedArray}`);
            await fs.writeFile(configPath, content, 'utf8');
          }
          return { success: true, isJsConfig: true, configPath, skipped: false };
        }
      }
      
      // If entries exists but no components, or no entries at all
      // Try to add the entries.components section
      const hasEntries = /entries\s*:\s*\{/.test(content);
      
      if (hasEntries) {
        // Add components to existing entries object with proper formatting
        const formattedArray = formatComponentsArray(newComponentPaths);
        content = content.replace(
          /(entries\s*:\s*\{)/,
          `$1\n    components: ${formattedArray},`
        );
        await fs.writeFile(configPath, content, 'utf8');
        return { success: true, isJsConfig: true, configPath, skipped: false };
      }
      
      // No entries object, try to add it before the closing of module.exports
      const formattedArray = formatComponentsArray(newComponentPaths);
      const entriesBlock = `  entries: {\n    components: ${formattedArray},\n  },\n`;
      
      // Try to insert after module.exports = {
      if (content.includes('module.exports = {')) {
        content = content.replace(
          /(module\.exports\s*=\s*\{)/,
          `$1\n${entriesBlock}`
        );
        await fs.writeFile(configPath, content, 'utf8');
        return { success: true, isJsConfig: true, configPath, skipped: false };
      }
      
      // Fallback: couldn't parse the JS config
      return { success: false, isJsConfig: true, configPath, skipped: false };
    } catch {
      return { success: false, isJsConfig: true, configPath, skipped: false };
    }
  }

  return { success: false, isJsConfig: false, configPath, skipped: false };
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
    config.name,
    DEFAULT_VERSION
  );

  // Ensure directory exists
  await fs.ensureDir(componentDir);

  // Create the main component JS file
  const jsPath = path.join(componentDir, `${config.name}.js`);
  await fs.writeFile(jsPath, generateComponentStub(config));
  createdFiles.push(jsPath);

  // Optionally create TSX file
  if (config.generateTsx) {
    const tsxPath = path.join(componentDir, `${config.name}.tsx`);
    await fs.writeFile(tsxPath, generateReactComponentStub(config.name, config.variantProps));
    createdFiles.push(tsxPath);
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
  p.note(preview, `Preview: ${config.name}.js`);
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

  // Update config if requested
  let configUpdateResult: { success: boolean; isJsConfig: boolean; configPath: string; skipped: boolean } | null = null;
  if (updateConfig) {
    configUpdateResult = await updateConfigFile(handoff, componentNames);
    if (!configUpdateResult.success) {
      const relativePath = path.relative(handoff.workingPath, configUpdateResult.configPath);
      p.log.warn(
        `Could not automatically update ${relativePath}. Please manually add these paths to entries.components:`
      );
      for (const name of componentNames) {
        console.log(chalk.yellow(`  'components/${name}'`));
      }
    }
  }

  generationSpinner.stop('Files created successfully');

  // Display summary
  p.log.success('Created files:');
  for (const file of allCreatedFiles) {
    const relativePath = path.relative(handoff.workingPath, file);
    console.log(chalk.dim(`  ${relativePath}`));
  }

  if (updateConfig && configUpdateResult?.success) {
    const configFileName = path.basename(configUpdateResult.configPath);
    if (configUpdateResult.skipped) {
      p.log.info(`Config already includes 'components' directory - new components will auto-load`);
    } else {
      p.log.success(`Updated ${configFileName} with component paths`);
    }
  }

  p.outro(
    chalk.green(
      `Successfully created ${componentConfigs.length} component stub(s)!`
    )
  );
};

