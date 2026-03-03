import Handlebars from 'handlebars';
import { PlaygroundComponent } from './types';

Handlebars.registerHelper('eq', function (a: any, b: any) {
  return a === b;
});

export async function constructComponentPreview(components: PlaygroundComponent[], basePath: string = ''): Promise<string> {
  let html = '';
  for (const component of components) {
    if (component.rendered) {
      html += component.rendered;
    } else {
      html += component.html;
    }
  }
  return `<html>
    <head>
      <link rel="stylesheet" href="${basePath}/api/component/main.css" />
    </head>
    <body>
      ${html}
    </body>
    <script src="${basePath}/api/component/main.js"></script>
  </html>`;
}

export function previewRenderedHtml(html: string, basePath: string = ''): string {
  return `<html>
  <head>
    <link rel="stylesheet" href="${basePath}/api/component/main.css" />
  </head>
  <body>
    ${html}
  </body>
  <script src="${basePath}/api/component/main.js"></script>
</html>`;
}

export async function renderPreview(component: PlaygroundComponent, data: any = null): Promise<string> {
  Handlebars.registerHelper('field', (_field: string, options: Handlebars.HelperOptions) => {
    return options.fn(this);
  });

  const template = Handlebars.compile(component.code);
  if (!data) {
    return template({ properties: component.data });
  } else {
    return template({ properties: data });
  }
}
