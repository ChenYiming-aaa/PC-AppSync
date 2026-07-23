import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

let app;
let token;
let linkId;

beforeAll(async () => {
  app = require('../src/index.js');
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'dl-test@test.com', password: 'test1234' });
  token = res.body.token;
});

describe('POST /api/v1/downloads/links', () => {
  it('submits a new download link', async () => {
    const res = await request(app)
      .post('/api/v1/downloads/links')
      .set('Authorization', `Bearer ${token}`)
      .send({
        software_name: 'Google Chrome',
        official_url: 'https://www.google.com/chrome/',
        category: 'browser',
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    linkId = res.body.id;
  });

  it('returns 400 without required fields', async () => {
    const res = await request(app)
      .post('/api/v1/downloads/links')
      .set('Authorization', `Bearer ${token}`)
      .send({ software_name: 'Test' });
    expect(res.status).toBe(400);
  });

  it('returns 400 with invalid URL', async () => {
    const res = await request(app)
      .post('/api/v1/downloads/links')
      .set('Authorization', `Bearer ${token}`)
      .send({ software_name: 'Test', official_url: 'not-a-url' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/downloads/search', () => {
  it('finds links by name', async () => {
    const res = await request(app)
      .get('/api/v1/downloads/search?q=chrome')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 400 without query', async () => {
    const res = await request(app)
      .get('/api/v1/downloads/search')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/downloads/match', () => {
  it('batch matches names to links', async () => {
    const res = await request(app)
      .post('/api/v1/downloads/match')
      .set('Authorization', `Bearer ${token}`)
      .send({ names: ['Google Chrome', 'Firefox', 'Visual Studio Code'] });
    expect(res.status).toBe(200);
    expect(res.body['Google Chrome']).toBeTruthy();
  });

  it('returns 400 with empty names array', async () => {
    const res = await request(app)
      .post('/api/v1/downloads/match')
      .set('Authorization', `Bearer ${token}`)
      .send({ names: [] });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/downloads/links', () => {
  it('lists links with pagination', async () => {
    const res = await request(app)
      .get('/api/v1/downloads/links?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.links).toBeTruthy();
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(res.body.pages).toBeGreaterThanOrEqual(1);
  });

  it('filters by search query', async () => {
    const res = await request(app)
      .get('/api/v1/downloads/links?q=chrome')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.links.length).toBeGreaterThanOrEqual(1);
  });
});

describe('GET /api/v1/downloads/links/pending', () => {
  it('rejects non-admin access', async () => {
    const res = await request(app)
      .get('/api/v1/downloads/links/pending')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('PUT /api/v1/downloads/links/:id/verify', () => {
  it('rejects non-admin verify', async () => {
    const res = await request(app)
      .put(`/api/v1/downloads/links/${linkId}/verify`)
      .set('Authorization', `Bearer ${token}`)
      .send({ verified: true });
    expect(res.status).toBe(403);
  });
});

describe('Health check', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
