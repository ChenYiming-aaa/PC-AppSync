import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.JWT_SECRET = 'test-secret-change-me';
process.env.NODE_ENV = 'test';

const testDbPath = path.join(__dirname, '..', 'data', 'test-appsync.db');
process.env.TEST_DB_PATH = testDbPath;

if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}
