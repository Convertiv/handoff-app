import readline from 'readline';

export const prompt = async (query: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

/**
 * Hide the Prompt
 * @param {string} query
 * @returns
 */
export const maskPrompt = (query: string, showAnswer?: boolean): Promise<string> =>
  new Promise((resolve) => {
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    // @ts-ignore
    rl.stdoutMuted = true;
    if (showAnswer) {
      // @ts-ignore
      rl.stdoutMuted = false;
    }
    // @ts-ignore
    rl._writeToOutput = function _writeToOutput(stringToWrite: string) {
      var match = /\r|\n/.exec(stringToWrite);
      if (!match) {
        // @ts-ignore
        if (rl.stdoutMuted) {
          // @ts-ignore
          rl.output.write('\x1B[2K\x1B[200D' + query + `${'*'.repeat(rl.line.length)}`);
        } else {
          // @ts-ignore
          rl.output.write(stringToWrite);
        }
      }
      return false;
    };
    return rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
