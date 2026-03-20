import { spawn } from "node:child_process";
import net from "node:net";
import process from "node:process";

const HOST = "127.0.0.1";
const START_PORT = 3100;
const MAX_PORT = 3199;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, HOST);
  });
}

async function findFreePort(): Promise<number> {
  for (let port = START_PORT; port <= MAX_PORT; port += 1) {
    if (await isPortFree(port)) {
      return port;
    }
  }

  throw new Error(`Fant ingen ledig port mellom ${START_PORT} og ${MAX_PORT}.`);
}

async function waitForServer(port: number) {
  const url = `http://localhost:${port}/api/countries`;

  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(1000),
        redirect: "manual",
      });
      if (response.status === 200) {
        return;
      }
    } catch {
      // Server not ready yet.
    }

    await wait(1000);
  }

  throw new Error(`Dev-server ble ikke klar på ${url} i tide.`);
}

function runCommand(command: string, args: string[], env: Record<string, string> = {}) {
  return new Promise<number>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: { ...process.env, ...env },
    });

    child.once("error", reject);
    child.once("close", (code) => resolve(code ?? 1));
  });
}

async function main() {
  const port = await findFreePort();
  const server = spawn("npm", ["run", "dev", "--", "--port", `${port}`], {
    stdio: "inherit",
    env: process.env,
  });

  let shuttingDown = false;

  const shutdown = () => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    server.kill("SIGTERM");
  };

  process.on("SIGINT", () => {
    shutdown();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    shutdown();
    process.exit(143);
  });

  try {
    await waitForServer(port);

    const exitCode = await runCommand("npx", ["jest"], {
      TEST_BASE_URL: `http://localhost:${port}`,
    });

    shutdown();
    await new Promise((resolve) => server.once("close", resolve));
    process.exit(exitCode);
  } catch (error) {
    shutdown();
    await new Promise((resolve) => server.once("close", resolve));
    throw error;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
