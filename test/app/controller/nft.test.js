'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/nft.test.js', () => {

  describe('PUT /:account_address/nfts', () => {
    it('should get lock', async () => {
      return app.httpRequest()
        .put('/0xca1257ade6f4fa6c6834fdc42e030be6c0f5a813/nfts')
        .expect(200);
    });
  });
});
