import { spawn } from 'node:child_process';

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code ?? 'unknown'}`));
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  await run('npm', ['exec', 'tsc']);
  await run('npm', ['exec', 'vite', 'build']);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
