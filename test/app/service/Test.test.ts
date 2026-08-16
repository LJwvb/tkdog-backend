import { app } from 'egg-mock/bootstrap';

describe('test/app/service/Test.test.js', () => {
  before(async () => {
    app.mockContext();
  });
});
