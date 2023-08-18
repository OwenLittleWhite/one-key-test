'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  router.get('/:account_address/nft_last_updated_at', controller.nft.getLastUpdatedAt);
  router.put('/:account_address/nfts', controller.nft.update);
  router.get('/:account_address/nfts', controller.nft.query);
  router.get('/:account_address/nfts_total_value', controller.nft.getTotalValue);
};
