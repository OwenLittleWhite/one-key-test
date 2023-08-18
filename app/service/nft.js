'use strict';

const { Service } = require('egg');
const axios = require('axios');
const fs = require('fs');
const request = require('request');
const sharp = require('sharp');
const NFT_SCAN_API_KEY = 'tWY4O3tm1jxgAWjlD5KSLNk8';
const NFT_BLOCK_IN_API_KEY = '0e041c32eb62446cac066480643a0515';
const crypto = require('crypto');
const path = require('path');
function md5(input) {
  const md5Hash = crypto.createHash('md5');
  md5Hash.update(input);
  return md5Hash.digest('hex');
}
async function processTasksWithLimit(tasks, limit) {
  const results = [];
  for (let i = 0; i < tasks.length; i += limit) {
    const batch = tasks.slice(i, i + limit);
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }
  return results;
}
const chainDominMap = {
  ethereum: 'restapi',
  bnb: 'bnbapi',
  polygon: 'polygonapi',
  arbitrum: 'arbitrumapi',
  op_mainnet: 'optimismapi',
  zkSync_era: 'zksyncapi',
  linea: 'lineaapi',
  avalanche_c: 'avaxapi',
  cronos: 'cronosapi',
  platon: 'platonapi',
  moonbeam: 'moonbeamapi',
  fantom: 'fantomapi',
  gnosis: 'gnosisapi',
};
class NftService extends Service {
  async getFromNftScan(account_address, chain, erc_type) {
    const domin = chainDominMap[chain];
    const res = [];
    let next = '';
    do {
      const data = (await axios({
        method: 'get',
        headers: { 'X-API-KEY': NFT_SCAN_API_KEY },
        url: `https://${domin}.nftscan.com/api/v2/account/own/${account_address}?erc_type=${erc_type}&limit=100&cursor=${next}`,
      })).data;
      res.push(...data.data.content.map(i => {
        return {
          account_address,
          chain,
          contract_address: i.contract_address,
          contract_name: i.contract_name,
          token_id: i.token_id,
          amount: i.amount,
          erc_type,
          last_price: i.latest_trade_price,
          image_url: i.image_uri,
          own_timestamp: i.own_timestamp,
          deleted_at: null,
        };
      }));
      next = data.data.next;
    } while (next);
    return res;
  }
  async getAllFromNftScan(account_address) {
    const promises = [];
    promises.push(...Object.keys(chainDominMap).map(i => {
      return this.getFromNftScan(account_address, i, 'erc721');
    }));
    promises.push(...Object.keys(chainDominMap).map(i => {
      return this.getFromNftScan(account_address, i, 'erc1155');
    }));
    const data = await Promise.all(promises);
    let res = [];
    data.forEach(i => {
      res = res.concat(i);
    });
    console.log('from nft scan', res.length);
    return res;
  }
  async getFromBlockIn(account_address) {
    let page = 1;
    let count_page = 0;
    const res = [];
    do {
      const { pagination, list } = (await axios({
        method: 'get',
        headers: { AccessKey: NFT_BLOCK_IN_API_KEY },
        url: `https://api.blockin.ai/v2/user/nft/wallet_item_list?chain_name=eth&address=${account_address}&page=${page}&page_size=100`,
      })).data.data;
      count_page = pagination.count_page;
      page++;
      list.forEach(i => {
        res.push({
          account_address,
          chain: 'ethereum',
          contract_address: i.collection_address,
          contract_name: i.name,
          token_id: i.token_id,
          amount: i.amount,
          erc_type: i.contract_type.toLowerCase(),
          image_url: i.item_metadata ? i.item_metadata.image : '',
          deleted_at: null,
        });
      });
    } while (page <= count_page);
    console.log('from blockIn', res.length);
    return res;
  }

  async processImage(nft) {
    const imgUrl = nft.image_url;
    if (!imgUrl) {
      return;
    }
    let suffix = '';
    if (imgUrl.endsWith('.png')) {
      suffix = '.png';
    } else if (imgUrl.endsWith('.gif')) {
      suffix = '.gif';
    } else {
      suffix = '.jpeg';
    }
    const originalUrl = `localhost:${this.app.config.cluster.listen.port}/public/original/${md5(this.getKeyByNft(nft))}${suffix}`;
    const thumbnailUrl = `localhost:${this.app.config.cluster.listen.port}/public/thumbnail/${md5(this.getKeyByNft(nft))}${suffix}`;
    const originalPath = path.join(this.app.config.baseDir, '/public/original', `${md5(this.getKeyByNft(nft))}${suffix}`);
    const thumbnailPath = path.join(this.app.config.baseDir, '/public/thumbnail', `${md5(this.getKeyByNft(nft))}${suffix}`);
    const promise = new Promise((resolve, reject) => {
      let remoteImageStream;
      try {
        remoteImageStream = request(imgUrl, error => {
          if (error) {
            reject(error);
          }

        });
        const originalImageWriteStream = fs.createWriteStream(originalPath);

        const thumbnailImageWriteStream = fs.createWriteStream(thumbnailPath);

        const thumbnailTransformStream = sharp()
          .resize(100, 100);
        // 根据输出路径的文件扩展名来选择输出格式
        if (thumbnailPath.endsWith('.png')) {
          thumbnailTransformStream.png();
        } else if (thumbnailPath.endsWith('.gif')) {
          thumbnailTransformStream.gif();
        } else {
          thumbnailTransformStream.jpeg();
        }

        remoteImageStream.pipe(thumbnailTransformStream).pipe(thumbnailImageWriteStream);

        remoteImageStream.pipe(originalImageWriteStream);

        thumbnailTransformStream.on('error', error => {
          reject(error);
        });

        thumbnailImageWriteStream.on('finish', () => {
          resolve();
        });

        thumbnailImageWriteStream.on('error', error => {
          reject(error);
        });

        originalImageWriteStream.on('finish', () => {
        });

        originalImageWriteStream.on('error', error => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
    try {
      await promise;
      nft.thumbnail_url = thumbnailUrl;
      nft.original_url = originalUrl;
    } catch (error) {
      fs.promises.unlink(originalPath).catch(() => { });
      fs.promises.unlink(thumbnailPath).catch(() => { });
      this.app.logger.error('process img error', nft.image_url, error);
    }
  }

  async getMergedDataFromRemote(account_address) {
    const [first, second] = await Promise.all([this.getFromBlockIn(account_address), this.getAllFromNftScan(account_address)]);
    const secondMap = new Map();
    second.forEach(i => {
      secondMap.set(this.getKeyByNft(i), i);
    });
    first.forEach(i => {
      const found = secondMap.get(this.getKeyByNft(i));
      if (!found) {
        second.push(i);
      } else {
        const _found = second.find(j => {
          return this.getKeyByNft(j) === this.getKeyByNft(i);
        });
        if (_found && _found.image_url && !_found.image_url.startsWith('http')) {
          _found.image_url = i.image_url;
        }
      }
    });
    return second;
  }

  getKeyByNft(nft) {
    return `${nft.account_address}-${nft.contract_address}-${nft.token_id}-${nft.chain}`;
  }

  async processAllImageToNTFs(account_address, nfts) {
    // 查出账户下处理过的图片
    const exist = await this.ctx.model.AccountNft.findAll({
      where: {
        account_address,
      },
    });
    const set = new Set();
    exist.forEach(i => {
      set.add(this.getKeyByNft(i));
    });
    // 筛选出未处理过图片的nft
    const unProcessed = nfts.filter(i => {
      return !set.has(this.getKeyByNft(i));
    });
    // 批量处理
    const promises = unProcessed.map(i => {
      return this.processImage(i);
    });
    await processTasksWithLimit(promises, 100);
  }

  getQueryKey(account_address) {
    return `nftQuery:${account_address}`;
  }

  async updateNfts(account_address) {
    // 先获取锁
    const lockKey = `updateNfts:lock:${account_address}`;
    const lockRes = await this.app.redis.set(lockKey, '1', 'EX', 120, 'NX');
    this.logger.info(lockRes, '++++');
    console.log(lockRes, '------');
    if (lockRes !== 'OK') {
      return await this.getLastUpdatedAt(account_address);
    }
    let now = new Date();
    try {
      const nfts = await this.getMergedDataFromRemote(account_address);
      await this.processAllImageToNTFs(account_address, nfts);
      await this.ctx.model.AccountNft.bulkCreate(nfts, {
        updateOnDuplicate: ['updated_at', 'deleted_at', 'own_timestamp'],
      });
      await this.ctx.model.AccountNft.update({
        deleted_at: now,
      }, {
        where: {
          account_address,
          updated_at: {
            [this.app.Sequelize.Op.lt]: now,
          },
        },
      });
    } catch (error) {
      this.ctx.logger.error(error);
    } finally {
      await this.app.redis.del(this.getQueryKey(account_address), lockKey);
      now = new Date();
      await this.app.redis.set(this.getLastUpdatedKey(account_address), now.getTime());
    }
    return {
      last_updated_at: now.getTime(),
    };

  }

  getLastUpdatedKey(account_address) {
    return `lastUpdateKey:${account_address}`;
  }

  async getLastUpdatedAt(account_address) {
    const timestamp = await this.app.redis.get(this.getLastUpdatedKey(account_address));
    return {
      last_updated_at: timestamp ? +timestamp : null,
    };
  }

  async query(account_address, page, page_count) {
    const fieldKey = `${page}-${page_count}`;
    let res = await this.app.redis.hget(this.getQueryKey(account_address), fieldKey);
    if (res) {
      res = JSON.parse(res);
    } else {
      res = await this.ctx.model.AccountNft.findAndCountAll({
        where: {
          account_address,
          deleted_at: { [this.app.Sequelize.Op.not]: null },
        },
        limit: page_count,
        offset: page_count * (page - 1),
      });
      await this.app.redis.hset(this.getQueryKey(account_address), fieldKey, JSON.stringify(res));
    }
    return res;
  }
}

module.exports = NftService;
