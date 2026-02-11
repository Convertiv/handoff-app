/** @type {import('handoff-app').Component} */
module.exports = {
  title: "Button",
  description: "Interactive buttons that trigger actions and allow users to complete tasks, such as submitting a form or confirming a choice. This component includes click tracking to demonstrate stateful component behavior.",
  group: "Atomic Elements",
  type: "element",
  categories: [
    "functionality",
    "interactive"
  ],
  entries: {
    template: "Button.tsx",
    // schema: "Schema.ts"
  },
  // Intentionally omit figmaComponentId so docs variants are not sourced from Figma.
  previews: {
    primary: {
      title: "Primary Button",
      values: {
        type: "primary",
        children: "Click me!",
        showCounter: true
      }
    },
    secondary: {
      title: "Secondary Button",
      values: {
        type: "secondary",
        children: "Click me too!",
        showCounter: true
      }
    },
    primaryDisabled: {
      title: "Disabled State",
      values: {
        type: "primary",
        children: "Disabled",
        disabled: true,
        showCounter: true
      }
    },
    withoutCounter: {
      title: "Without Counter",
      values: {
        type: "primary",
        children: "Submit",
        showCounter: false
      }
    }
  },
  should_do: [
    "Keep one primary button per section so main action is clear.",
    "Use the secondary variant for less important actions.",
    "Provide clear, action-oriented labels that describe what will happen.",
    "Show visual feedback on hover and click interactions."
  ],
  should_not_do: [
    "Do not use vague labels like Click here or OK when the action can be specific.",
    "Do not mix primary and secondary styles inconsistently.",
    "Do not disable buttons without providing alternative guidance or feedback."
  ]
};
