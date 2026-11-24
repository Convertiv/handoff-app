import { ARTIFACTS_ROUTE_SEGMENT, normalizeBasePath } from '../artifacts/url';
import { RENDER_SHELL_SUFFIX } from './shell';

// Pure module: the docs API serves the canvas document in every mode, and the static build writes it.

/**
 * The component canvas: one composer document that renders an ordered list of component instances
 * together. It sits at the artifact root, outside `component/`, so it never collides with a
 * component's own render shell. It ends in `.render.html`, so the artifact route sends the sandbox
 * CSP with it.
 *
 * postMessage protocol:
 * - canvas → parent `{ type: 'handoff:ready' }` once it listens
 * - parent → canvas `{ type: 'handoff:render-canvas', items: [{ id, componentId, args }], selectedId, mode }`
 *   (`mode`: `edit`, the default, or `view`)
 * - canvas → parent `{ type: 'handoff:rendered', count }` after a render pass
 * - canvas → parent `{ type: 'handoff:render-error', instanceId?, componentId?, message }`
 * - canvas → parent `{ type: 'handoff:resize', height }`
 * - canvas → parent `{ type: 'handoff:select', instanceId }` when a reader clicks an instance in `edit` mode
 *
 * For each component it needs, the canvas reads the component's render shell
 * (`component/<id>.render.html`) and loads only the stylesheets and scripts that shell names, then
 * imports its client artifact. The artifact registers a mount function (`registerClientMount` in
 * `src/transformers/utils/render-shell.ts`), which renders each instance into its own container.
 *
 * Like the render shell, the canvas runs at an opaque origin (see `sandbox.ts`), because the args
 * come from any member and can run script. It therefore loads artifacts as CORS requests.
 */
export const CANVAS_DOCUMENT_PATH = `canvas${RENDER_SHELL_SUFFIX}`;

/** How long the canvas waits for a loaded client artifact to register its mount. */
const MOUNT_TIMEOUT_MS = 15000;

const CANVAS_SCRIPT = `
(() => {
  const artifactsRoot = __ARTIFACTS_ROOT__;
  const root = document.getElementById('handoff-canvas');
  const instances = new Map();
  const components = new Map();
  const loadedScripts = new Set();
  // Stylesheets follow the components on the canvas: a component's styles leave with its last
  // instance, so a page-level rule in one component does not outlive it.
  const componentStyles = new Map();
  const styleLinks = new Map();
  let activeComponents = new Set();
  let selectedId = null;
  let viewMode = false;
  let generation = 0;
  // Instance ids in the order of the last render, to tell which instances moved.
  let order = [];
  let hasRendered = false;
  const reducedMotion = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const motionAllowed = () => !(reducedMotion && reducedMotion.matches);
  const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
  const LIFT_SHADOW = '0 24px 48px -16px rgba(15, 23, 42, 0.35)';
  const NO_SHADOW = '0 0 0 0 rgba(15, 23, 42, 0)';
  const SCROLL_MARGIN = 24;

  const notify = (message) => {
    if (window.parent !== window) window.parent.postMessage(message, window.location.origin);
  };
  const messageOf = (error) => (error && error.message ? error.message : String(error));
  const artifactUrl = (path) => artifactsRoot + path.split('/').map(encodeURIComponent).join('/');

  const waitForMount = (componentId) =>
    new Promise((resolve, reject) => {
      const registered = () => (window.__handoffMounts || {})[componentId];
      if (registered()) return resolve(registered());
      const done = () => {
        clearTimeout(timer);
        window.removeEventListener('handoff:mount-registered', onRegistered);
      };
      const onRegistered = (event) => {
        if (event.detail !== componentId) return;
        done();
        resolve(registered());
      };
      const timer = setTimeout(() => {
        done();
        reject(new Error('Component "' + componentId + '" was built before canvases existed. Rebuild it, or republish it to the registry.'));
      }, ${MOUNT_TIMEOUT_MS});
      window.addEventListener('handoff:mount-registered', onRegistered);
    });

  const append = (element) =>
    new Promise((resolve) => {
      element.onload = element.onerror = resolve;
      document.head.appendChild(element);
    });

  // Classic scripts, such as the global script, cannot be unloaded, so each loads once.
  const addScript = (url) => {
    if (loadedScripts.has(url)) return Promise.resolve();
    loadedScripts.add(url);
    const element = document.createElement('script');
    element.src = url;
    return append(element);
  };

  const syncStyles = () => {
    // Nodes a client artifact added to the head itself (see registerClientMount) leave with its component.
    document.head.querySelectorAll('[data-handoff-owner]').forEach((node) => {
      if (!activeComponents.has(node.getAttribute('data-handoff-owner'))) node.remove();
    });
    const needed = new Set();
    activeComponents.forEach((id) => (componentStyles.get(id) || []).forEach((url) => needed.add(url)));
    styleLinks.forEach((entry, url) => {
      if (!needed.has(url)) {
        entry.element.remove();
        styleLinks.delete(url);
      }
    });
    const pending = [];
    needed.forEach((url) => {
      if (styleLinks.has(url)) return pending.push(styleLinks.get(url).loaded);
      const element = document.createElement('link');
      element.rel = 'stylesheet';
      element.href = url;
      const loaded = append(element);
      styleLinks.set(url, { element, loaded });
      pending.push(loaded);
    });
    return Promise.all(pending);
  };

  const loadComponent = (componentId) => {
    if (!components.has(componentId)) {
      const loading = (async () => {
        const response = await fetch(artifactUrl('component/' + componentId + '${RENDER_SHELL_SUFFIX}'));
        if (!response.ok) throw new Error('Component "' + componentId + '" has no client render artifact. Build it, or republish it to the registry.');
        const shell = new DOMParser().parseFromString(await response.text(), 'text/html');
        const absolute = (value) => new URL(value, window.location.href).href;
        const pending = [];
        let moduleUrl = null;
        componentStyles.set(
          componentId,
          Array.from(shell.head.querySelectorAll('link[rel="stylesheet"][href]')).map((link) => absolute(link.getAttribute('href')))
        );
        pending.push(syncStyles());
        shell.head.querySelectorAll('script[src]').forEach((script) => {
          const url = absolute(script.getAttribute('src'));
          if (script.getAttribute('type') === 'module') moduleUrl = url;
          else pending.push(addScript(url));
        });
        await Promise.all(pending);
        if (!moduleUrl) throw new Error('The render shell of "' + componentId + '" names no client artifact.');
        await import(moduleUrl);
        return waitForMount(componentId);
      })();
      // A failure is not kept, so the next render retries.
      loading.catch(() => components.delete(componentId));
      components.set(componentId, loading);
    }
    return components.get(componentId);
  };

  const showError = (instance, message) => {
    const box = document.createElement('pre');
    box.setAttribute('data-handoff-render-error', '');
    box.textContent = 'Render error: ' + message;
    instance.element.setAttribute('data-error', '');
    instance.mountNode.replaceChildren(box);
  };

  const markSelection = () => {
    instances.forEach((instance, id) => instance.element.toggleAttribute('data-selected', id === selectedId));
  };

  // Indices of the longest run of old positions that is still in order (a negative position is a
  // new instance). Those instances stay in place; the others are the ones that moved.
  const keptInOrder = (positions) => {
    const length = positions.map(() => 0);
    const previous = positions.map(() => -1);
    let best = -1;
    positions.forEach((position, i) => {
      if (position < 0) return;
      length[i] = 1;
      for (let j = 0; j < i; j++) {
        if (positions[j] >= 0 && positions[j] < position && length[j] + 1 > length[i]) {
          length[i] = length[j] + 1;
          previous[i] = j;
        }
      }
      if (best < 0 || length[i] > length[best]) best = i;
    });
    const kept = new Set();
    for (let i = best; i >= 0; i = previous[i]) kept.add(i);
    return kept;
  };

  // Plays an element from where it was drawn to where it now is. A moved instance lifts above the
  // others while it travels.
  const slide = (element, offset, lift) => {
    if (Math.abs(offset) < 0.5) return;
    const id = lift ? 'handoff-lift' : 'handoff-slide';
    const duration = lift ? 460 : 380;
    element.animate([{ transform: 'translateY(' + offset + 'px)' }, { transform: 'none' }], { id, duration, easing: EASE });
    if (!lift) return;
    // The shadow holds while the instance travels, and settles as it lands.
    element.animate(
      [
        { zIndex: 2, boxShadow: LIFT_SHADOW },
        { zIndex: 2, boxShadow: LIFT_SHADOW, offset: 0.55 },
        { zIndex: 2, boxShadow: NO_SHADOW },
      ],
      { id, duration, easing: 'ease-in-out' }
    );
  };

  const stopSliding = (element) => {
    let lifted = false;
    element.getAnimations().forEach((animation) => {
      if (animation.id !== 'handoff-slide' && animation.id !== 'handoff-lift') return;
      lifted = lifted || animation.id === 'handoff-lift';
      animation.cancel();
    });
    return lifted;
  };

  // An instance leaves by folding away, so the ones below close the gap smoothly.
  const leave = (element, animate) => {
    if (!animate || element.hasAttribute('data-entering')) return element.remove();
    element.setAttribute('data-leaving', '');
    stopSliding(element);
    const height = element.offsetHeight;
    element.style.overflow = 'hidden';
    const remove = () => element.remove();
    element
      .animate([{ height: height + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 280, easing: EASE, fill: 'forwards' })
      .finished.then(remove, remove);
  };

  // A new instance starts folded (see 'data-entering') and unfolds once its content rendered.
  const afterLayout = () =>
    new Promise((resolve) => {
      const timer = setTimeout(resolve, 120);
      requestAnimationFrame(() => requestAnimationFrame(() => (clearTimeout(timer), resolve())));
    });

  const reveal = (instance) => {
    const element = instance.element;
    if (!element.hasAttribute('data-entering')) return;
    const height = element.scrollHeight;
    element.removeAttribute('data-entering');
    if (element.hasAttribute('data-selected')) follow(element, height);
    if (!motionAllowed()) return;
    element.style.overflow = 'hidden';
    const settle = () => (element.style.overflow = '');
    element
      .animate([{ height: '0px', opacity: 0 }, { height: height + 'px', opacity: 1 }], { duration: 440, easing: EASE })
      .finished.then(settle, settle);
    instance.mountNode.animate([{ transform: 'translateY(16px)' }, { transform: 'none' }], { duration: 520, easing: EASE });
  };

  // Scrolls just enough to show an instance, from its layout box, so a running slide does not skew it.
  const follow = (element, height) => {
    const top = element.offsetTop;
    const bottom = top + (height === undefined ? element.offsetHeight : height);
    const viewTop = window.scrollY;
    const viewBottom = viewTop + window.innerHeight;
    if (top >= viewTop + SCROLL_MARGIN && bottom <= viewBottom - SCROLL_MARGIN) return;
    const tall = bottom - top + 2 * SCROLL_MARGIN > window.innerHeight;
    const target = top < viewTop || tall ? top - SCROLL_MARGIN : bottom - window.innerHeight + SCROLL_MARGIN;
    window.scrollTo({ top: Math.max(0, target), behavior: motionAllowed() ? 'smooth' : 'auto' });
  };

  const render = async (items, nextSelectedId) => {
    const run = ++generation;
    const selectionMoved = nextSelectedId !== selectedId;
    selectedId = nextSelectedId;
    // The first render draws every instance at once; later changes animate.
    const animate = hasRendered && motionAllowed();
    hasRendered = true;
    const wanted = new Set(items.map((item) => item.id));
    activeComponents = new Set(items.map((item) => item.componentId));
    syncStyles();

    // Where each instance is drawn now, mid-slide included, before anything moves.
    const drawnAt = new Map();
    if (animate) instances.forEach((instance, id) => drawnAt.set(id, instance.element.getBoundingClientRect().top));

    instances.forEach((instance, id) => {
      if (!wanted.has(id)) {
        leave(instance.element, animate);
        instances.delete(id);
      }
    });

    const created = new Set();
    items.forEach((item) => {
      let instance = instances.get(item.id);
      if (instance && instance.componentId !== item.componentId) {
        instance.element.remove();
        instances.delete(item.id);
        instance = undefined;
      }
      if (!instance) {
        const element = document.createElement('div');
        element.className = 'handoff-instance';
        element.setAttribute('data-handoff-instance', item.id);
        if (animate) element.setAttribute('data-entering', '');
        const mountNode = document.createElement('div');
        element.appendChild(mountNode);
        instance = { element, mountNode, componentId: item.componentId, render: null, ready: null, argsKey: null };
        instances.set(item.id, instance);
        created.add(item.id);
      }
    });

    // Place the instances, moving only those out of order, so the rest keep their DOM (and any
    // embedded media) untouched. Leaving instances keep their place until they have folded away.
    const oldIndex = new Map(order.map((id, index) => [id, index]));
    const kept = keptInOrder(items.map((item) => (created.has(item.id) || !oldIndex.has(item.id) ? -1 : oldIndex.get(item.id))));
    let next = null;
    for (let i = items.length - 1; i >= 0; i--) {
      const element = instances.get(items[i].id).element;
      if (!kept.has(i)) root.insertBefore(element, next);
      next = element;
    }
    order = items.map((item) => item.id);

    if (animate) {
      items.forEach((item, i) => {
        if (created.has(item.id) || !drawnAt.has(item.id)) return;
        const element = instances.get(item.id).element;
        const lifted = stopSliding(element);
        slide(element, drawnAt.get(item.id) - element.getBoundingClientRect().top, lifted || !kept.has(i));
      });
    }

    markSelection();
    const selected = selectedId && instances.get(selectedId);
    if (selected && !selected.element.hasAttribute('data-entering')) {
      const movedSelection = animate && !kept.has(order.indexOf(selectedId));
      if (selectionMoved || movedSelection) follow(selected.element);
    }

    await Promise.all(
      items.map(async (item) => {
        const instance = instances.get(item.id);
        if (!instance) return;
        try {
          instance.ready =
            instance.ready ||
            loadComponent(item.componentId).then((mount) => {
              instance.render = mount(instance.mountNode, { hydrate: false });
            });
          await instance.ready;
          const argsKey = JSON.stringify(item.args);
          if (argsKey !== instance.argsKey) {
            instance.argsKey = argsKey;
            instance.element.removeAttribute('data-error');
            instance.render(item.args);
          }
        } catch (error) {
          instance.ready = null;
          instance.argsKey = null;
          showError(instance, messageOf(error));
          notify({ type: 'handoff:render-error', instanceId: item.id, componentId: item.componentId, message: messageOf(error) });
        }
        if (instance.element.hasAttribute('data-entering')) {
          await afterLayout();
          reveal(instance);
        }
      })
    );
    if (run === generation) notify({ type: 'handoff:rendered', count: items.length });
  };

  const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
  const readItems = (value) =>
    (Array.isArray(value) ? value : []).filter(
      (item) => isObject(item) && typeof item.id === 'string' && typeof item.componentId === 'string'
    ).map((item) => ({ id: item.id, componentId: item.componentId, args: isObject(item.args) ? item.args : {} }));

  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin || event.source !== window.parent) return;
    const data = event.data;
    if (data && data.type === 'handoff:render-canvas') {
      viewMode = data.mode === 'view';
      root.toggleAttribute('data-view', viewMode);
      render(readItems(data.items), typeof data.selectedId === 'string' ? data.selectedId : null);
    }
  });

  // In edit mode, clicks select an instance. In view mode, they reach the components. A click never
  // follows a link or submits a form, which would leave the canvas.
  root.addEventListener(
    'click',
    (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (viewMode) {
        if (target && target.closest('a[href]')) event.preventDefault();
        return;
      }
      const element = target ? target.closest('[data-handoff-instance]') : null;
      if (!element) return;
      event.preventDefault();
      notify({ type: 'handoff:select', instanceId: element.getAttribute('data-handoff-instance') });
    },
    true
  );
  root.addEventListener('submit', (event) => event.preventDefault(), true);

  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(() => notify({ type: 'handoff:resize', height: document.documentElement.scrollHeight })).observe(root);
  }
  notify({ type: 'handoff:ready' });
})();
`;

const CANVAS_STYLE = `
html, body { margin: 0; min-height: 100%; }
#handoff-canvas { min-height: 100vh; }
.handoff-instance { position: relative; }
.handoff-instance[data-entering] { height: 0; overflow: hidden; opacity: 0; }
.handoff-instance[data-leaving] { pointer-events: none; }
.handoff-instance::after { content: ''; position: absolute; inset: 0; z-index: 1; pointer-events: none; transition: box-shadow 160ms ease, background-color 160ms ease; }
.handoff-instance:hover::after { box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.6); }
.handoff-instance[data-selected]::after { box-shadow: inset 0 0 0 2px rgb(59, 130, 246); background-color: rgba(59, 130, 246, 0.04); }
.handoff-instance[data-error]::after { box-shadow: inset 0 0 0 1px rgb(220, 38, 38); }
.handoff-instance[data-leaving]::after, #handoff-canvas[data-view] .handoff-instance:not([data-error])::after { display: none; }
[data-handoff-render-error] { margin: 0; padding: 1rem; color: #b91c1c; font: 13px/1.5 monospace; white-space: pre-wrap; }
`;

/** The canvas document for a deployment under `basePath`. */
export const generateCanvasDocument = (basePath?: string | null): string => {
  const artifactsRoot = `${normalizeBasePath(basePath)}/${ARTIFACTS_ROUTE_SEGMENT}/`;
  const script = CANVAS_SCRIPT.replace('__ARTIFACTS_ROOT__', JSON.stringify(artifactsRoot).replace(/</g, '\\u003c'));
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Component canvas</title>
    <style>${CANVAS_STYLE}</style>
  </head>
  <body>
    <div id="handoff-canvas"></div>
    <script>${script}</script>
  </body>
</html>`;
};
