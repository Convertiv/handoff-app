import { spawn } from 'child_process';

/** Fire-and-forget opening of a URL in the system browser. The printed URL remains the fallback. */
export const tryOpenBrowser = (url: string): void => {
  const platform = process.platform;
  const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = platform === 'win32' ? ['/c', 'start', '', url] : [url];

  try {
    const child = spawn(command, args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: platform === 'win32',
    });
    child.on('error', () => undefined);
    child.unref();
  } catch {
    // Headless and SSH environments can use the URL printed by the login flow.
  }
};
