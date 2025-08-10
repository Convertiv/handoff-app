#!/usr/bin/env node
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
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prompt_1 = require("./utils/prompt");
class CreateError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CreateError';
    }
}
/**
 * Simple spinner for showing progress
 */
class Spinner {
    constructor() {
        this.interval = null;
        this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        this.i = 0;
    }
    start(message) {
        process.stdout.write(chalk_1.default.blue(`${this.frames[this.i]} ${message}`));
        this.interval = setInterval(() => {
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            this.i = (this.i + 1) % this.frames.length;
            process.stdout.write(chalk_1.default.blue(`${this.frames[this.i]} ${message}`));
        }, 80);
    }
    stop(message) {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        if (message) {
            console.log(chalk_1.default.green(`✓ ${message}`));
        }
    }
}
/**
 * Check if directory exists
 */
const directoryExists = (dirPath) => {
    try {
        return fs.existsSync(dirPath);
    }
    catch (_a) {
        return false;
    }
};
/**
 * Create directory recursively
 */
const createDirectory = (dirPath) => {
    try {
        fs.mkdirSync(dirPath, { recursive: true });
    }
    catch (error) {
        throw new CreateError(`Failed to create directory: ${error}`);
    }
};
/**
 * Create package.json file
 */
const createPackageJson = (options) => {
    const packageJson = {
        name: options.projectName,
        version: '0.1.0',
        description: 'A handoff app project',
        private: true,
        scripts: {
            start: 'handoff-app start',
            dev: 'handoff-app dev',
            build: 'handoff-app build:app',
            fetch: 'handoff-app fetch',
        },
        dependencies: {
            'handoff-app': '^0.17.0',
        },
        devDependencies: {},
        engines: {
            node: '>=16.0.0',
            npm: '>=8.0.0',
        },
    };
    return JSON.stringify(packageJson, null, 2);
};
/**
 * Create .env file
 */
const createEnvFile = (options) => {
    return `HANDOFF_FIGMA_PROJECT_ID=${options.figmaProjectId}
HANDOFF_DEV_ACCESS_TOKEN=${options.figmaAccessToken}
`;
};
/**
 * Create .gitignore file
 */
const createGitignore = () => {
    return `node_modules/
.env
dist/
.next/
out/
.DS_Store
*.log
`;
};
/**
 * Create handoff.config.js file
 */
const createHandoffConfig = (options) => {
    return `const path = require('path');

/** @type {import('handoff-app').Config} */
module.exports = {
  app: {
    theme: "default",
    title: "${options.projectName} Design System",
    client: "${options.projectName}",
    google_tag_manager: null,
    attribution: true,
    type_copy: "Almost before we knew it, we had left the ground.",
    type_sort: [
      "Heading 1",
      "Heading 2",
      "Heading 3",
      "Heading 4",
      "Heading 5",
      "Heading 6",
      "Paragraph",
      "Subheading",
      "Blockquote",
      "Input Labels",
      "Link"
    ],
    color_sort: [
      "primary",
      "secondary",
      "extra",
      "system"
    ],
    component_sort: [
      "primary",
      "secondary",
      "transparent"
    ],
    base_path: "",
    breakpoints: {
      sm: { size: 576, name: "Small" },
      md: { size: 768, name: "Medium" },
      lg: { size: 992, name: "Large" },
      xl: { size: 1200, name: "Extra Large" }
    }
  },

  hooks: {
    /**
     * Optional validation callback for components
     * @param component - The component instance to validate
     * @returns A record of validation results where keys are validation types and values are detailed validation results
     *
     * @example
     * validateComponent: async (component) => ({
     *   a11y: {
     *     description: 'Accessibility validation check',
     *     passed: true,
     *     messages: ['No accessibility issues found']
     *   },
     *   responsive: {
     *     description: 'Responsive design validation',
     *     passed: false,
     *     messages: ['Component breaks at mobile breakpoint']
     *   }
     * })
     */
    // validateComponent: async (component) => {
    //   // Add your custom validation logic here
    //   return {};
    // },

    /**
     * Optional hook to override the SSR build configuration used in the ssrRenderPlugin
     * @param config - The default esbuild configuration
     * @returns Modified esbuild configuration
     *
     * @example
     * ssrBuildConfig: (config) => {
     *   // Modify the esbuild config as needed
     *   return config;
     * }
     */
    // ssrBuildConfig: (config) => {
    //   // Add your custom SSR build configuration here
    //   return config;
    // },

    /**
     * Optional hook to override the client-side build configuration used in the ssrRenderPlugin
     * @param config - The default esbuild configuration
     * @returns Modified esbuild configuration
     *
     * @example
     * clientBuildConfig: (config) => {
     *   // Modify the esbuild config as needed
     *   return config;
     * }
     */
    // clientBuildConfig: (config) => {
    //   // Add your custom client build configuration here
    //   return config;
    // },

    /**
     * Optional hook to specify which export property contains the schema
     * @param exports - The module exports object containing the schema
     * @returns The schema object from the exports
     *
     * @example
     * getSchemaFromExports: (exports) => exports.customSchema || exports.default
     */
    // getSchemaFromExports: (exports) => {
    //   // Add your custom schema extraction logic here
    //   return exports.default;
    // },

    /**
     * Optional hook to transform the schema into properties
     * @param schema - The schema object to transform
     * @returns The transformed properties object
     */
    // schemaToProperties: (schema) => {
    //   // Add your custom schema to properties transformation here
    //   return {};
    // },

    /**
     * Optional hook to override the JavaScript Vite configuration
     * @param config - The default Vite configuration
     * @returns Modified Vite configuration
     *
     * @example
     * jsBuildConfig: (config) => {
     *   // Modify the Vite config as needed
     *   return config;
     * }
     */
    // jsBuildConfig: (config) => {
    //   // Add your custom JavaScript build configuration here
    //   return config;
    // },

    /**
     * Optional hook to override the CSS Vite configuration
     * @param config - The default Vite configuration
     * @returns Modified Vite configuration
     *
     * @example
     * cssBuildConfig: (config) => {
     *   // Modify the Vite config as needed
     *   return config;
     * }
     */
    // cssBuildConfig: (config) => {
    //   // Add your custom CSS build configuration here
    //   return config;
    // },

    /**
     * Optional hook to override the HTML Vite configuration
     * @param config - The default Vite configuration
     * @returns Modified Vite configuration
     *
     * @example
     * htmlBuildConfig: (config) => {
     *   // Modify the Vite config as needed
     *   return config;
     * }
     */
    // htmlBuildConfig: (config) => {
    //   // Add your custom HTML build configuration here
    //   return config;
    // },
  },
};
`;
};
/**
 * Execute npm install
 */
const runNpmInstall = (projectPath) => {
    return new Promise((resolve, reject) => {
        var _a;
        const spinner = new Spinner();
        spinner.start('Installing dependencies...');
        const npmProcess = (0, child_process_1.spawn)('npm', ['install'], {
            cwd: projectPath,
            stdio: 'pipe',
            shell: true,
        });
        let stderr = '';
        (_a = npmProcess.stderr) === null || _a === void 0 ? void 0 : _a.on('data', (data) => {
            stderr += data.toString();
        });
        npmProcess.on('close', (code) => {
            if (code === 0) {
                spinner.stop('Dependencies installed successfully');
                resolve();
            }
            else {
                spinner.stop();
                reject(new CreateError(`npm install failed: ${stderr}`));
            }
        });
        npmProcess.on('error', (error) => {
            spinner.stop();
            reject(new CreateError(`Failed to run npm install: ${error.message}`));
        });
    });
};
/**
 * Validate project name
 */
const validateProjectName = (name) => {
    const validNameRegex = /^[a-zA-Z0-9-_]+$/;
    return validNameRegex.test(name) && name.length > 0;
};
/**
 * Main create function
 */
const create = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(chalk_1.default.blue.bold('Welcome to Handoff App Creator!'));
        console.log(chalk_1.default.gray('This will help you set up a new Handoff App project.\n'));
        // Get project name
        let projectName = '';
        while (!projectName || !validateProjectName(projectName)) {
            projectName = yield (0, prompt_1.prompt)(chalk_1.default.cyan('Enter project name: '));
            if (!validateProjectName(projectName)) {
                console.log(chalk_1.default.red('Invalid project name. Use only letters, numbers, hyphens, and underscores.'));
            }
        }
        const projectPath = path.resolve(process.cwd(), projectName);
        // Check if directory exists
        if (directoryExists(projectPath)) {
            console.log(chalk_1.default.yellow(`Directory "${projectName}" already exists.`));
            const overwrite = yield (0, prompt_1.prompt)(chalk_1.default.cyan('Do you want to overwrite it? (y/N): '));
            if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
                console.log(chalk_1.default.gray('Project creation cancelled.'));
                process.exit(0);
            }
            // Remove existing directory
            console.log(chalk_1.default.blue('Removing existing directory...'));
            fs.rmSync(projectPath, { recursive: true, force: true });
        }
        // Create project directory
        console.log(chalk_1.default.blue('Creating project directory...'));
        createDirectory(projectPath);
        // Get Figma project ID
        console.log(chalk_1.default.blue('\nFigma Configuration'));
        const figmaProjectId = yield (0, prompt_1.prompt)(chalk_1.default.cyan('Enter Figma project ID: '));
        // Accept empty string, no error thrown
        // Get Figma access token
        const figmaAccessToken = yield (0, prompt_1.maskPrompt)(chalk_1.default.cyan('Enter Figma developer access token: '));
        console.log(); // Add newline after masked prompt
        // Accept empty string, no error thrown
        const options = {
            projectName,
            figmaProjectId: figmaProjectId.trim(),
            figmaAccessToken: figmaAccessToken.trim(),
        };
        // Create package.json
        console.log(chalk_1.default.blue('Creating package.json...'));
        const packageJsonContent = createPackageJson(options);
        fs.writeFileSync(path.join(projectPath, 'package.json'), packageJsonContent);
        // Create .env file
        console.log(chalk_1.default.blue('Creating .env file...'));
        const envContent = createEnvFile(options);
        fs.writeFileSync(path.join(projectPath, '.env'), envContent);
        // Create .gitignore
        console.log(chalk_1.default.blue('Creating .gitignore...'));
        const gitignoreContent = createGitignore();
        fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignoreContent);
        // Create handoff.config.js
        console.log(chalk_1.default.blue('Creating handoff.config.js...'));
        const handoffConfigContent = createHandoffConfig(options);
        fs.writeFileSync(path.join(projectPath, 'handoff.config.js'), handoffConfigContent);
        // Install dependencies
        yield runNpmInstall(projectPath);
        // Success message
        console.log(chalk_1.default.green.bold('\nProject created successfully!'));
        console.log(chalk_1.default.gray('\nNext steps:'));
        console.log(chalk_1.default.cyan(`  cd ${projectName}`));
        console.log(chalk_1.default.cyan('  npm run fetch'));
        console.log(chalk_1.default.cyan('  npm run start'));
        console.log(chalk_1.default.gray('\nFirst, fetch your Figma data, then start the documentation site.'));
        console.log(chalk_1.default.gray('Your project is ready to use!'));
    }
    catch (error) {
        if (error instanceof CreateError) {
            console.error(chalk_1.default.red(`Error: ${error.message}`));
        }
        else {
            console.error(chalk_1.default.red(`Unexpected error: ${error}`));
        }
        process.exit(1);
    }
});
// Run the create function if this file is executed directly
if (require.main === module) {
    create();
}
exports.default = create;
