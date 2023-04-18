---
title: Style Guide
description: This is a sample page where you could insert a style guide.
weight: -5
metaTitle: 'Style Guide | Handoff Design System'
metaDescription: 'A sample page in the handoff design system, in markdown'
enabled: true
menu:
  - path: false
    title: Standards
  - path: styles/accessibility
    title: Accessibility Standards
    image: false
---

Handoff supports fully custom pages. This is a sample markdown page where you
could put a style guide or other content. You can remove this page by deleting
this file from your project

These pages accept html so you use html classes and semantic structure.

<div class="c-hero c-hero--boxed c-hero--bg-yellow">
  <div>
    <h1 class="c-title--extra-large">Hero Block</h1>
    <p>I'm a sample of an HTML Hero block in a custom page.</p>
  </div>
  <svg class="o-icon c-hero__img c-hero__img--small">
    <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/assets/icons.svg#icon-hero-design"></use>
  </svg>
</div>

You can also add code blocks. We currently handle syntax highlighting for yaml,
sass/css, html, and javascript/typescript.

```html
<script src="/components/bundle.js"></script>

<body class="preview-body">
  <div class="alert alert-{{ type }} w-100 mb-0" role="alert">{{ parts.text.characters }}</div>
</body>
```

```sass
#test {
    border-color: blue;
}
```
