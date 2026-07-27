import { spawnSync } from "node:child_process";

const checks = [
  ["Database schema", "npm", ["run", "db:validate"]],
  ["Lint", "npm", ["run", "lint"]],
  ["Typecheck", "npm", ["run", "typecheck"]],
  ["Unit tests", "npm", ["test"]],
  ["Production build", "npm", ["run", "build"]],
  ["E2E tests", "npm", ["run", "test:e2e"]],
];

for (const [label, executable, args] of checks) {
  console.log(`\n=== ${label} ===`);

  const result = spawnSync(executable, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: false,
  });

  if (result.error) {
    console.error(`\n${label} failed to start: ${result.error.message}`);
    process.exit(result.status ?? 1);
  }

  if (result.status !== 0) {
    console.error(`\n${label} failed with exit code ${result.status}.`);
    process.exit(result.status ?? 1);
  }
}

console.log("\n=== Verification complete: all checks passed ===");