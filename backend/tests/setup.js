import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.JWT_SECRET = 'test-secret-change-me';
process.env.NODE_ENV = 'test';

process.env.TEST_DB_PATH = path.join(__dirname, '..', 'data', 'test-' + randomUUID() + '.db');
