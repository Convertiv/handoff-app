import { spawn } from 'child_process';

/** Fire-and-forget opening of a URL in the system browser. The printed URL remains the fallback. */
export const tryOpenBrowser = (url: string): void => {
  try {
    const { protocol } = new URL(url);
    if (protocol !== 'http:' && protocol !== 'https:') return;
  } catch {
    return;
  }

  const platform = process.platform;
  // rundll32 is a plain executable rather than a shell, so spawn hands it the URL as one
  // untouched argument. `cmd /c start` would re-parse shell metacharacters in it.
  const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'rundll32.exe' : 'xdg-open';
  const args = platform === 'win32' ? ['url.dll,FileProtocolHandler', url] : [url];

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
