import { CleanupTaskGenerator, CleanupTasks, TaskPriority } from './cleanup';
import { AuditResult, AuditIssue } from './audit';

describe('CleanupTaskGenerator', () => {
  const mockAuditResult: AuditResult = {
    issues: [
      {
        category: 'accessibility',
        severity: 'critical',
        description: 'Poor contrast between "text-muted" and "bg-light": 2.8:1 (needs 4.5:1 for text)',
        tokens: ['text-muted', 'bg-light'],
        files: ['colors.css'],
        suggestion: 'Increase color contrast to meet WCAG AA standards'
      },
      {
        category: 'duplicate',
        severity: 'warning',
        description: 'Colors "primary-color" and "secondary-color" are 96% similar',
        tokens: ['primary-color', 'secondary-color'],
        files: ['colors.css'],
        suggestion: 'Consider consolidating these near-duplicate colors into a single token'
      },
      {
        category: 'naming',
        severity: 'warning',
        description: '1 tokens use snake_case, but kebab-case is dominant (7 tokens)',
        tokens: ['primary_blue'],
        suggestion: 'Consider renaming snake_case tokens to kebab-case for consistency'
      },
      {
        category: 'scale-gap',
        severity: 'warning',
        description: 'spacing scale has a gap between 16px and 48px',
        tokens: ['spacing-md', 'spacing-xl'],
        suggestion: 'Consider adding intermediate values: 24px, 32px, 40px'
      },
      {
        category: 'palette-imbalance',
        severity: 'info',
        description: 'Color palette is imbalanced: 10 blue tokens vs 2 red tokens',
        tokens: ['blue-500', 'blue-600', 'red-500'],
        suggestion: 'Consider expanding the red palette or reducing the blue palette for better balance'
      }
    ],
    summary: {
      critical: 1,
      warnings: 3,
      info: 1
    }
  };

  describe('Task Generation', () => {
    test('should generate tasks from audit result', () => {
      const generator = new CleanupTaskGenerator(mockAuditResult);
      const tasks = generator.generateTasks();

      expect(tasks).toHaveProperty('priority1');
      expect(tasks).toHaveProperty('priority2');
      expect(tasks).toHaveProperty('priority3');
    });

    test('should prioritize critical issues as Priority 1', () => {
      const generator = new CleanupTaskGenerator(mockAuditResult);
      const tasks = generator.generateTasks();

      expect(tasks.priority1.length).toBeGreaterThan(0);

      const contrastTask = tasks.priority1.find(t =>
        t.description.includes('contrast') || t.description.includes('text-muted')
      );
      expect(contrastTask).toBeDefined();
    });

    test('should prioritize warnings as Priority 2', () => {
      const generator = new CleanupTaskGenerator(mockAuditResult);
      const tasks = generator.generateTasks();

      expect(tasks.priority2.length).toBeGreaterThan(0);

      const warningTasks = tasks.priority2.filter(t =>
        t.description.includes('duplicate') ||
        t.description.includes('naming') ||
        t.description.includes('scale')
      );
      expect(warningTasks.length).toBeGreaterThan(0);
    });

    test('should prioritize info issues as Priority 3', () => {
      const generator = new CleanupTaskGenerator(mockAuditResult);
      const tasks = generator.generateTasks();

      expect(tasks.priority3.length).toBeGreaterThan(0);

      const infoTask = tasks.priority3.find(t =>
        t.description.includes('palette') || t.description.includes('balance')
      );
      expect(infoTask).toBeDefined();
    });

    test('should include file references in tasks', () => {
      const generator = new CleanupTaskGenerator(mockAuditResult);
      const tasks = generator.generateTasks();

      const allTasks = [...tasks.priority1, ...tasks.priority2, ...tasks.priority3];
      const tasksWithFiles = allTasks.filter(t => t.files && t.files.length > 0);

      expect(tasksWithFiles.length).toBeGreaterThan(0);
    });

    test('should include suggested fixes in tasks', () => {
      const generator = new CleanupTaskGenerator(mockAuditResult);
      const tasks = generator.generateTasks();

      const allTasks = [...tasks.priority1, ...tasks.priority2, ...tasks.priority3];
      const tasksWithSuggestions = allTasks.filter(t => t.suggestedFix);

      expect(tasksWithSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Markdown Generation', () => {
    test('should generate markdown checklist', () => {
      const generator = new CleanupTaskGenerator(mockAuditResult);
      const markdown = generator.generateMarkdown();

      expect(markdown).toContain('# Design System Cleanup Tasks');
      expect(markdown).toContain('## Priority 1: Critical');
      expect(markdown).toContain('## Priority 2: Important');
      expect(markdown).toContain('## Priority 3: Enhancements');
    });

    test('should format tasks with checkboxes', () => {
      const generator = new CleanupTaskGenerator(mockAuditResult);
      const markdown = generator.generateMarkdown();

      expect(markdown).toMatch(/- \[ \]/);
    });

    test('should include task counts in headers', () => {
      const generator = new CleanupTaskGenerator(mockAuditResult);
      const markdown = generator.generateMarkdown();

      expect(markdown).toMatch(/Priority 1: Critical \(\d+ task/);
      expect(markdown).toMatch(/Priority 2: Important \(\d+ task/);
      expect(markdown).toMatch(/Priority 3: Enhancements \(\d+ task/);
    });

    test('should include file references in markdown', () => {
      const generator = new CleanupTaskGenerator(mockAuditResult);
      const markdown = generator.generateMarkdown();

      expect(markdown).toContain('colors.css');
    });

    test('should include suggested fixes in markdown', () => {
      const generator = new CleanupTaskGenerator(mockAuditResult);
      const markdown = generator.generateMarkdown();

      expect(markdown).toContain('Increase color contrast');
      expect(markdown).toContain('consolidating');
    });

    test('should format markdown properly with indentation', () => {
      const generator = new CleanupTaskGenerator(mockAuditResult);
      const markdown = generator.generateMarkdown();

      // Check for proper indentation of file references
      expect(markdown).toMatch(/  File: /);
      expect(markdown).toMatch(/  Fix: /);
    });
  });

  describe('Priority Logic', () => {
    test('should handle empty audit results', () => {
      const emptyAudit: AuditResult = {
        issues: [],
        summary: { critical: 0, warnings: 0, info: 0 }
      };

      const generator = new CleanupTaskGenerator(emptyAudit);
      const tasks = generator.generateTasks();

      expect(tasks.priority1.length).toBe(0);
      expect(tasks.priority2.length).toBe(0);
      expect(tasks.priority3.length).toBe(0);
    });

    test('should handle audit with only critical issues', () => {
      const criticalOnlyAudit: AuditResult = {
        issues: [
          {
            category: 'accessibility',
            severity: 'critical',
            description: 'Critical issue',
            tokens: ['token1'],
          }
        ],
        summary: { critical: 1, warnings: 0, info: 0 }
      };

      const generator = new CleanupTaskGenerator(criticalOnlyAudit);
      const tasks = generator.generateTasks();

      expect(tasks.priority1.length).toBe(1);
      expect(tasks.priority2.length).toBe(0);
      expect(tasks.priority3.length).toBe(0);
    });

    test('should sort tasks within priority levels', () => {
      const generator = new CleanupTaskGenerator(mockAuditResult);
      const tasks = generator.generateTasks();

      // Tasks within each priority should maintain order or be sorted logically
      expect(tasks.priority2.length).toBeGreaterThan(1);
    });
  });

  describe('Task Descriptions', () => {
    test('should create actionable descriptions', () => {
      const generator = new CleanupTaskGenerator(mockAuditResult);
      const tasks = generator.generateTasks();

      const allTasks = [...tasks.priority1, ...tasks.priority2, ...tasks.priority3];

      allTasks.forEach(task => {
        expect(task.description).toBeTruthy();
        expect(task.description.length).toBeGreaterThan(10);
      });
    });

    test('should include token names in descriptions', () => {
      const generator = new CleanupTaskGenerator(mockAuditResult);
      const tasks = generator.generateTasks();

      const contrastTask = tasks.priority1.find(t =>
        t.description.includes('text-muted') || t.description.includes('bg-light')
      );
      expect(contrastTask).toBeDefined();
    });

    test('should include specific values when available', () => {
      const generator = new CleanupTaskGenerator(mockAuditResult);
      const tasks = generator.generateTasks();

      const contrastTask = tasks.priority1.find(t => t.description.includes('2.8:1'));
      expect(contrastTask).toBeDefined();
    });
  });
});
