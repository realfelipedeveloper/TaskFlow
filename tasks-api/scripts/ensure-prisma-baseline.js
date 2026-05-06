const { spawnSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function toNumber(value) {
  if (typeof value === 'bigint') return Number(value);
  return Number(value || 0);
}

async function countRows(sql, ...params) {
  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  return toNumber(rows[0]?.count);
}

async function tableExists(tableName) {
  const count = await countRows(
    `SELECT COUNT(*) AS count
     FROM information_schema.tables
     WHERE table_schema = DATABASE()
       AND table_name = ?`,
    tableName,
  );

  return count > 0;
}

async function columnExists(tableName, columnName) {
  const count = await countRows(
    `SELECT COUNT(*) AS count
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = ?
       AND column_name = ?`,
    tableName,
    columnName,
  );

  return count > 0;
}

async function appliedMigrations() {
  if (!(await tableExists('_prisma_migrations'))) {
    return new Set();
  }

  const rows = await prisma.$queryRawUnsafe(
    `SELECT migration_name
     FROM _prisma_migrations
     WHERE rolled_back_at IS NULL`,
  );

  return new Set(rows.map((row) => row.migration_name));
}

function prismaCli(args) {
  const prismaCliPath = require.resolve('prisma/build/index.js');
  const result = spawnSync(process.execPath, [prismaCliPath, ...args], {
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(`[prisma-baseline] Failed to run Prisma CLI: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

async function main() {
  const applied = await appliedMigrations();

  const hasBaseSchema =
    (await tableExists('users')) &&
    (await tableExists('tasks')) &&
    (await tableExists('roles')) &&
    (await tableExists('user_roles')) &&
    (await tableExists('role_permissions'));

  const hasTaskAssignees =
    (await tableExists('task_assignees')) &&
    !(await columnExists('tasks', 'developer'));

  const hasProjectsMigration =
    (await tableExists('projects')) &&
    (await columnExists('tasks', 'project_id'));

  const hasCommitPrMigration =
    (await columnExists('tasks', 'commit')) &&
    (await columnExists('tasks', 'pr'));

  const baselines = [
    ['20260410_initial_schema', hasBaseSchema],
    ['20260411_task_assignees', hasTaskAssignees],
    ['20260416_projects_management', hasProjectsMigration],
    ['20260506_task_commit_pr_fields', hasCommitPrMigration],
  ];

  for (const [migrationName, shouldBaseline] of baselines) {
    if (!shouldBaseline || applied.has(migrationName)) continue;

    console.log(`[prisma-baseline] Marking ${migrationName} as applied.`);
    await prisma.$disconnect();
    prismaCli(['migrate', 'resolve', '--applied', migrationName]);
  }
}

main()
  .catch(async (error) => {
    console.error('[prisma-baseline] Failed to inspect migration baseline.');
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
