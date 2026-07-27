import { cleanupStaleTestFixtures } from "../src/test/cleanup-stale-fixtures";

async function main() {
  const summary = await cleanupStaleTestFixtures();

  console.log(
    `Đã dọn ${summary.schools} trường kiểm thử, ${summary.users} người dùng và ${summary.storedFiles} tệp lưu trữ.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
