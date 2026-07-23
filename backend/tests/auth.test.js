import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

let app;
let token;
let userId;

beforeAll(async () => {
  app = require('../src/index.js');
});

describe('POST /api/v1/auth/register', () => {
  it('registers a new user and returns token + user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'new@test.com', password: 'test1234', nickname: 'New User' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('new@test.com');
    expect(res.body.user.nickname).toBe('New User');
  });

  it('returns 400 when email missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ password: 'test1234' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password too short', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'short@test.com', password: 'abc123' });
    expect(res.status).toBe(400);
  });

  it('returns 409 for duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'new@test.com', password: 'test1234' });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'new@test.com', password: 'test1234' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('new@test.com');
    token = res.body.token;
    userId = res.body.user.id;
  });

  it('returns 401 with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'new@test.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  it('returns 401 with unknown email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'unknown@test.com', password: 'test1234' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('returns a new token with valid old token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    token = res.body.token;
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/v1/auth/refresh');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/auth/profile', () => {
  it('returns user profile with valid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('new@test.com');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/auth/profile');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/v1/auth/password', () => {
  it('changes password with correct current password', async () => {
    const res = await request(app)
      .put('/api/v1/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'test1234', newPassword: 'newpass456' });
    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(true);
    expect(res.body.token).toBeTruthy();
    token = res.body.token;
  });

  it('returns 401 with wrong current password', async () => {
    const res = await request(app)
      .put('/api/v1/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrong', newPassword: 'newpass456' });
    expect(res.status).toBe(401);
  });

  it('logs in with new password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'new@test.com', password: 'newpass456' });
    expect(res.status).toBe(200);
    token = res.body.token;
  });
});
