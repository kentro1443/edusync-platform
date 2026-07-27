import { cleanupStaleTestFixtures } from "../src/test/cleanup-stale-fixtures";

export default async function globalSetup() {
  await cleanupStaleTestFixtures();
}
