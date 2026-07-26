import { cleanupStaleTestFixtures } from "./cleanup-stale-fixtures";

export default async function globalSetup() {
  await cleanupStaleTestFixtures();
}
