// @ts-check

const { spawn } = require('child_process');

/**
 *
 * @param {string} command
 * @param {readonly string[]} args
 * @param {import('child_process').SpawnOptions} options
 * @returns {Promise<{ stdout: string; stderr: string }>}
 */
const spawnPromise = (command, args, options) => {
  return new Promise((resolve, reject) => {
    const cmdStream = spawn(command, args, options);
    let stdout = '';
    let stderr = '';

    if (cmdStream.stdout) {
      cmdStream.stdout.on('data', (data) => {
        stdout += String(data).trim();
      });
    }

    if (cmdStream.stderr) {
      cmdStream.stderr.on('data', (data) => {
        stderr += String(data).trim();
      });
    }

    cmdStream.on('error', (data) => {
      console.error(data);
    });

    cmdStream.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${command}${Array.isArray(args) ? ` ${args.join(' ')}` : ''} exited with non-zero code.`));
        return;
      }

      resolve({ stdout, stderr });
    });
  });
};

module.exports = spawnPromise;
