"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runScaffold = void 0;
const p = __importStar(require("@clack/prompts"));
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
// Constants
const CONFIG_FILES = ['handoff.config.json', 'handoff.config.js', 'handoff.config.cjs'];
const COMPONENTS_DIR = 'components';
const DEFAULT_VERSION = '1.0.0';
const DEFAULT_GROUPS = [
    { value: 'Atomic Elements', label: 'Atomic Elements' },
    { value: 'Forms', label: 'Forms' },
    { value: 'Navigation', label: 'Navigation' },
    { value: 'Layout', label: 'Layout' },
    { value: 'Feedback', label: 'Feedback' },
    { value: 'custom', label: 'Custom...' },
];
/**
 * Convert a string to Title Case
 */
const toTitleCase = (str) => {
    return str
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
};
/**
 * Generate the component JS stub content
 */
const generateComponentStub = (config) => {
    // Build entries object with relative paths to generated files
    const entriesLines = [];
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
const generateReactComponentStub = (name, variantProps) => {
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
const generateScssStub = (name) => {
    return `// ${toTitleCase(name)} component styles
.${name} {
  // Add your styles here
}
`;
};
/**
 * Extract unique variant property names from component instances
 */
const extractVariantProps = (instances) => {
    const propSet = new Set();
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
const getFigmaComponents = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    const documentationObject = yield handoff.getDocumentationObject();
    if (!(documentationObject === null || documentationObject === void 0 ? void 0 : documentationObject.components)) {
        return [];
    }
    return Object.entries(documentationObject.components).map(([name, data]) => {
        var _a;
        return ({
            name,
            instanceCount: ((_a = data.instances) === null || _a === void 0 ? void 0 : _a.length) || 0,
            variantProps: extractVariantProps(data.instances || []),
        });
    });
});
/**
 * Get list of registered component IDs from runtime config
 */
const getRegisteredComponentIds = (handoff) => {
    var _a, _b;
    const components = ((_b = (_a = handoff.runtimeConfig) === null || _a === void 0 ? void 0 : _a.entries) === null || _b === void 0 ? void 0 : _b.components) || {};
    return Object.keys(components);
};
/**
 * Find unregistered components (in Figma but not locally defined)
 */
const findUnregisteredComponents = (figmaComponents, registeredIds) => {
    const registeredSet = new Set(registeredIds.map((id) => id.toLowerCase()));
    return figmaComponents.filter((component) => !registeredSet.has(component.name.toLowerCase()));
};
/**
 * Count registered components that match Figma components
 */
const countMatchingRegisteredComponents = (figmaComponents, registeredIds) => {
    const figmaSet = new Set(figmaComponents.map((c) => c.name.toLowerCase()));
    return registeredIds.filter((id) => figmaSet.has(id.toLowerCase())).length;
};
/**
 * Check if components will be auto-loaded by an existing entry
 * e.g., if 'components' directory is listed, all subdirectories are auto-loaded
 */
const willComponentsAutoLoad = (existingPaths) => {
    // Normalize paths for comparison
    const normalizedPaths = existingPaths.map((p) => p.replace(/\/$/, '').toLowerCase());
    // If 'components' directory itself is in the list, all components auto-load
    return normalizedPaths.includes(COMPONENTS_DIR);
};
/**
 * Format component paths as a properly indented array string for JS files
 */
const formatComponentsArray = (paths, indent = '      ') => {
    if (paths.length === 0)
        return '[]';
    if (paths.length === 1)
        return `['${paths[0]}']`;
    return `[\n${paths.map((p) => `${indent}'${p}',`).join('\n')}\n${indent.slice(2)}]`;
};
/**
 * Update handoff config file to add component paths
 */
const updateConfigFile = (handoff, componentNames) => __awaiter(void 0, void 0, void 0, function* () {
    const configFile = CONFIG_FILES.find((file) => fs_extra_1.default.existsSync(path_1.default.resolve(handoff.workingPath, file)));
    const newComponentPaths = componentNames.map((name) => `${COMPONENTS_DIR}/${name}`);
    if (!configFile) {
        // Create a new handoff.config.json
        const newConfig = {
            entries: {
                components: newComponentPaths,
            },
        };
        const configPath = path_1.default.resolve(handoff.workingPath, 'handoff.config.json');
        yield fs_extra_1.default.writeJSON(configPath, newConfig, { spaces: 2 });
        return { success: true, isJsConfig: false, configPath, skipped: false };
    }
    const configPath = path_1.default.resolve(handoff.workingPath, configFile);
    if (configFile.endsWith('.json')) {
        const config = yield fs_extra_1.default.readJSON(configPath);
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
        yield fs_extra_1.default.writeJSON(configPath, config, { spaces: 2 });
        return { success: true, isJsConfig: false, configPath, skipped: false };
    }
    // For JS/CJS config files, try to update them programmatically
    if (configFile.endsWith('.js') || configFile.endsWith('.cjs')) {
        try {
            let content = yield fs_extra_1.default.readFile(configPath, 'utf8');
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
                        yield fs_extra_1.default.writeFile(configPath, content, 'utf8');
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
                content = content.replace(/(entries\s*:\s*\{)/, `$1\n    components: ${formattedArray},`);
                yield fs_extra_1.default.writeFile(configPath, content, 'utf8');
                return { success: true, isJsConfig: true, configPath, skipped: false };
            }
            // No entries object, try to add it before the closing of module.exports
            const formattedArray = formatComponentsArray(newComponentPaths);
            const entriesBlock = `  entries: {\n    components: ${formattedArray},\n  },\n`;
            // Try to insert after module.exports = {
            if (content.includes('module.exports = {')) {
                content = content.replace(/(module\.exports\s*=\s*\{)/, `$1\n${entriesBlock}`);
                yield fs_extra_1.default.writeFile(configPath, content, 'utf8');
                return { success: true, isJsConfig: true, configPath, skipped: false };
            }
            // Fallback: couldn't parse the JS config
            return { success: false, isJsConfig: true, configPath, skipped: false };
        }
        catch (_a) {
            return { success: false, isJsConfig: true, configPath, skipped: false };
        }
    }
    return { success: false, isJsConfig: false, configPath, skipped: false };
});
/**
 * Create component files
 */
const createComponentFiles = (handoff, config) => __awaiter(void 0, void 0, void 0, function* () {
    const createdFiles = [];
    const componentDir = path_1.default.resolve(handoff.workingPath, COMPONENTS_DIR, config.name, DEFAULT_VERSION);
    // Ensure directory exists
    yield fs_extra_1.default.ensureDir(componentDir);
    // Create the main component JS file
    const jsPath = path_1.default.join(componentDir, `${config.name}.js`);
    yield fs_extra_1.default.writeFile(jsPath, generateComponentStub(config));
    createdFiles.push(jsPath);
    // Optionally create TSX file
    if (config.generateTsx) {
        const tsxPath = path_1.default.join(componentDir, `${config.name}.tsx`);
        yield fs_extra_1.default.writeFile(tsxPath, generateReactComponentStub(config.name, config.variantProps));
        createdFiles.push(tsxPath);
    }
    // Optionally create SCSS file
    if (config.generateScss) {
        const scssPath = path_1.default.join(componentDir, `${config.name}.scss`);
        yield fs_extra_1.default.writeFile(scssPath, generateScssStub(config.name));
        createdFiles.push(scssPath);
    }
    return createdFiles;
});
/**
 * Display a preview of the component stub
 */
const displayComponentPreview = (config) => {
    const stub = generateComponentStub(config);
    const lines = stub.split('\n');
    const preview = lines.slice(0, 12).join('\n') + '\n  ...\n};';
    p.note(preview, `Preview: ${config.name}.js`);
};
/**
 * Main scaffold entry point
 */
const runScaffold = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    p.intro(chalk_1.default.bgCyan.black(' Handoff Component Scaffold '));
    // Step 1: Validate tokens.json exists
    const tokensPath = handoff.getTokensFilePath();
    if (!fs_extra_1.default.existsSync(tokensPath)) {
        p.cancel(chalk_1.default.red('No tokens.json found. Please run "handoff-app fetch" first to fetch Figma components.'));
        process.exit(1);
    }
    // Step 2: Analyze components
    const spinner = p.spinner();
    spinner.start('Analyzing Figma components...');
    const figmaComponents = yield getFigmaComponents(handoff);
    const registeredIds = getRegisteredComponentIds(handoff);
    const unregisteredComponents = findUnregisteredComponents(figmaComponents, registeredIds);
    const matchingCount = countMatchingRegisteredComponents(figmaComponents, registeredIds);
    spinner.stop('Analysis complete');
    // Display summary
    p.log.info(`Found ${chalk_1.default.cyan(figmaComponents.length)} components in Figma, ` +
        `${chalk_1.default.green(matchingCount)} already have local implementations.`);
    if (unregisteredComponents.length === 0) {
        p.outro(chalk_1.default.green('All Figma components have local implementations. Nothing to do!'));
        return;
    }
    p.log.info(`${chalk_1.default.yellow(unregisteredComponents.length)} components need stubs.`);
    // Step 3: Component selection
    const selectedComponents = yield p.multiselect({
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
    const componentConfigs = [];
    // Create a map for quick lookup of variant props
    const componentVariantMap = new Map(unregisteredComponents.map((c) => [c.name, c.variantProps]));
    // Step 4: Configure each selected component
    for (const componentName of selectedComponents) {
        p.log.step(`Configure "${componentName}"`);
        const title = yield p.text({
            message: 'Title:',
            initialValue: toTitleCase(componentName),
            validate: (value) => {
                if (!value.trim())
                    return 'Title is required';
            },
        });
        if (p.isCancel(title)) {
            p.cancel('Scaffold cancelled.');
            process.exit(0);
        }
        const description = yield p.text({
            message: 'Description:',
            initialValue: '',
            placeholder: 'Optional description for this component',
        });
        if (p.isCancel(description)) {
            p.cancel('Scaffold cancelled.');
            process.exit(0);
        }
        const group = yield p.select({
            message: 'Group:',
            options: [...DEFAULT_GROUPS],
        });
        if (p.isCancel(group)) {
            p.cancel('Scaffold cancelled.');
            process.exit(0);
        }
        let finalGroup = group;
        if (group === 'custom') {
            const customGroup = yield p.text({
                message: 'Enter custom group name:',
                validate: (value) => {
                    if (!value.trim())
                        return 'Group name is required';
                },
            });
            if (p.isCancel(customGroup)) {
                p.cancel('Scaffold cancelled.');
                process.exit(0);
            }
            finalGroup = customGroup;
        }
        const generateTsx = yield p.confirm({
            message: 'Generate .tsx React component template?',
            initialValue: true,
        });
        if (p.isCancel(generateTsx)) {
            p.cancel('Scaffold cancelled.');
            process.exit(0);
        }
        const generateScss = yield p.confirm({
            message: 'Generate .scss style file?',
            initialValue: true,
        });
        if (p.isCancel(generateScss)) {
            p.cancel('Scaffold cancelled.');
            process.exit(0);
        }
        const config = {
            name: componentName,
            title: title,
            description: description || '',
            group: finalGroup,
            generateTsx: generateTsx,
            generateScss: generateScss,
            variantProps: componentVariantMap.get(componentName) || [],
        };
        componentConfigs.push(config);
        // Display preview
        displayComponentPreview(config);
    }
    // Step 5: Config update prompt
    const updateConfig = yield p.confirm({
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
    const allCreatedFiles = [];
    const componentNames = [];
    for (const config of componentConfigs) {
        const createdFiles = yield createComponentFiles(handoff, config);
        allCreatedFiles.push(...createdFiles);
        componentNames.push(config.name);
    }
    // Update config if requested
    let configUpdateResult = null;
    if (updateConfig) {
        configUpdateResult = yield updateConfigFile(handoff, componentNames);
        if (!configUpdateResult.success) {
            const relativePath = path_1.default.relative(handoff.workingPath, configUpdateResult.configPath);
            p.log.warn(`Could not automatically update ${relativePath}. Please manually add these paths to entries.components:`);
            for (const name of componentNames) {
                console.log(chalk_1.default.yellow(`  'components/${name}'`));
            }
        }
    }
    generationSpinner.stop('Files created successfully');
    // Display summary
    p.log.success('Created files:');
    for (const file of allCreatedFiles) {
        const relativePath = path_1.default.relative(handoff.workingPath, file);
        console.log(chalk_1.default.dim(`  ${relativePath}`));
    }
    if (updateConfig && (configUpdateResult === null || configUpdateResult === void 0 ? void 0 : configUpdateResult.success)) {
        const configFileName = path_1.default.basename(configUpdateResult.configPath);
        if (configUpdateResult.skipped) {
            p.log.info(`Config already includes 'components' directory - new components will auto-load`);
        }
        else {
            p.log.success(`Updated ${configFileName} with component paths`);
        }
    }
    p.outro(chalk_1.default.green(`Successfully created ${componentConfigs.length} component stub(s)!`));
});
exports.runScaffold = runScaffold;
