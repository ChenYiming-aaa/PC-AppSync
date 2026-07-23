import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import fs from 'fs';

const testDbPath = process.env.TEST_DB_PATH;

let app;
let token;
let inventoryId;

const sampleScan = {
  version: '1.0',
  machine_name: 'TEST-PC',
  scan_time: new Date().toISOString(),
  scan_mode: 'standard',
  os: { family: 'Windows', edition: 'Windows 11 Pro', version: '23H2', build: '22631', architecture: 'x86_64' },
  applications: [
    { name: 'Google Chrome', version: '120.0.6099.109', publisher: 'Google LLC', source: 'registry' },
    { name: 'Visual Studio Code', version: '1.85.0', publisher: 'Microsoft Corporation', source: 'registry' },
    { name: '7-Zip', version: '23.01', publisher: 'Igor Pavlov', source: 'registry' },
  ],
  runtimes: [
    { name: 'Python', version: '3.12.0', packages: [{ name: 'requests', version: '2.31.0' }] },
  ],
};

const secondScan = {
  ...sampleScan,
  machine_name: 'NEW-PC',
  scan_time: new Date().toISOString(),
};

beforeAll(async () => {
  app = require('../src/index.js');
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'inv-test@test.com', password: 'test1234' });
  token = res.body.token;
});

afterAll(() => {
  if (testDbPath && fs.existsSync(testDbPath)) {
    try { fs.unlinkSync(testDbPath); } catch {}
  }
});

describe('POST /api/v1/inventories', () => {
  it('uploads a scan inventory', async () => {
    const res = await request(app)
      .post('/api/v1/inventories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        scan_data: sampleScan,
        machine_name: sampleScan.machine_name,
        scan_mode: sampleScan.scan_mode,
        scan_time: sampleScan.scan_time,
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    inventoryId = res.body.id;
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/v1/inventories')
      .send({ scan_data: sampleScan });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/inventories', () => {
  it('lists user inventories', async () => {
    const res = await request(app)
      .get('/api/v1/inventories')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});

describe('GET /api/v1/inventories/latest', () => {
  it('returns the latest inventory', async () => {
    const res = await request(app)
      .get('/api/v1/inventories/latest')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.scan_data).toBeTruthy();
    expect(res.body.scan_data.machine_name).toBe('TEST-PC');
  });
});

describe('GET /api/v1/inventories/compare', () => {
  it('returns 400 when no comparison available', async () => {
    const res = await request(app)
      .get('/api/v1/inventories/compare?other_id=99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/inventories/:id', () => {
  it('returns a specific inventory', async () => {
    const res = await request(app)
      .get(`/api/v1/inventories/${inventoryId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(inventoryId);
  });

  it('returns 404 for non-existent inventory', async () => {
    const res = await request(app)
      .get('/api/v1/inventories/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/inventories/:id', () => {
  it('deletes an inventory', async () => {
    const res = await request(app)
      .delete(`/api/v1/inventories/${inventoryId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
