'use strict';

const { app, assert, mock } = require('egg-mock/bootstrap');

describe('test/service/nft.test.js', () => {
  const address = '0xca1257ade6f4fa6c6834fdc42e030be6c0f5a813';
  beforeEach(async () => {

  });
  describe('# processImage', () => {
    it('## success', async () => {
      const ctx = app.mockContext();
      // const a = { image_url: 'https://github.com/settings/security' };
      // await ctx.service.nft.processImage(
      //   a
      // );
      // console.log(a);
      await ctx.service.nft.updateNfts(address);
    });
  });
});
