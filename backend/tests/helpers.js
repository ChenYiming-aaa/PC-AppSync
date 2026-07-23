import request from 'supertest';

export async function registerUser(app, email = 'test@example.com', password = 'test1234') {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password, nickname: 'Test User' });
  return res.body;
}

export async function loginUser(app, email = 'test@example.com', password = 'test1234') {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body;
}

export async function authRequest(app, method, url, token, body) {
  const req = request(app)[method](url);
  if (token) req.set('Authorization', `Bearer ${token}`);
  if (body) req.send(body);
  return req;
}
