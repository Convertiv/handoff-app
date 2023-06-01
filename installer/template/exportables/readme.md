# Figma Exportable Schemas

Exportable schemas allows Handoff to connect to any component sets in Figma and
generate tokens. In simple json, developers can define the structure of a Figma
component and what tokens to extract from each element. This allows Handoff to
adapt to the component set of any Figma file, and define semantic meaning for the
Figma component. This will enable many features going forward, including -

- Figma Linting
- Component Change Detection and Changelog
- Automatic Figma Schema Detection

Exportables are stored in `./exportables`. In 0.5.0 we only support exportable
components, so put component definitions in `./exportables/components`.
An exportable consists of 3 components -

- Metadata - describe the component (id, group)
- Options - control how the component is rendered in Handoff (tokens, preview)
- Parts - define the semantic structure of the Figma component

## How to use exportables

Using exportables will allow quick tokenization of new components. For example,
here is an annotated exportable for badges, a component not currently supported
by handoff. https://www.handoff.com/docs/customization/exportables/#badgejson
If you add this file to `exportables/components` and add `components/badge`
to the `figma.definitions` in your config.js, Handoff will start looking for a
Badges component set, and generate tokens, css, scss, and types for you.

With no other changes, handoff will create a set of badge token files for you.
For example, it will render something like this for css variables -
https://gist.github.com/bradmering/020429c30f11d95bfb2577ea57809878. You can see
that creates a comprehensive list of all the tokens you would need to render
badges in a css frontend framework.

If you want badges to work in the Handoff component preview as well, you would
need to add a badge template to `integration/templates/badge/default.html`.
That file would look like this for Bootstrap 5.2 -
https://www.handoff.com/docs/customization/exportables/#adding-a-template-to-preview-the-new-exportable.

You would also want to map these tokens to the framework. This is how you might
do that in Bootstrap 5.2, adding this file to `integration/sass/extended/badge.scss`
https://www.handoff.com/docs/customization/exportables/#mapping-the-new-exportable-to-scss