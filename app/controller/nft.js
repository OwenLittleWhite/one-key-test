'use strict';

const { Controller } = require('egg');

class NftController extends Controller {
  async getLastUpdatedAt() {
    const { account_address } = this.ctx.params;
    this.ctx.body = await this.ctx.service.nft.getLastUpdatedAt(account_address);
  }

  async update() {
    const { account_address } = this.ctx.params;
    this.ctx.body = await this.ctx.service.nft.updateNfts(account_address);
  }

  async query() {
    const { account_address } = this.ctx.params;
    const { page, page_count } = this.ctx.query;
    this.ctx.body = await this.ctx.service.nft.query(account_address, page, page_count);
  }
}

module.exports = NftController;
