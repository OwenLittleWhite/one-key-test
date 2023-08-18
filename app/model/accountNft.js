'use strict';

module.exports = app => {
  const { INTEGER, DATE, STRING } = app.Sequelize;

  const model = app.model.define(
    'account_nfts',
    {
      id: {
        type: INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      account_address: {
        type: STRING(42),
        allowNull: false,
        comment: '账户地址',
      },
      chain: {
        type: STRING(42),
        allowNull: false,
        comment: '链',
      },
      contract_address: {
        type: STRING(42),
        allowNull: false,
        comment: 'NFT地址',
      },
      contract_name: {
        type: STRING(128),
        comment: '名称',
      },
      token_id: {
        type: STRING(42),
        allowNull: false,
        comment: 'token_id',
      },
      erc_type: {
        type: STRING(30),
      },
      amount: {
        type: INTEGER,
        defaultValue: 0,
      },
      last_price: {
        type: STRING(30),
      },
      image_url: {
        type: STRING(256),
      },
      thumbnail_url: {
        type: STRING(256),
        comment: '转存缩略图',
      },
      original_url: {
        type: STRING(256),
        comment: '转存原始图',
      },
      own_timestamp: {
        type: DATE,
      },
      created_at: {
        type: DATE,
      },
      updated_at: {
        type: DATE,
      },
      deleted_at: {
        type: DATE,
      },
    },
    {
      charset: 'utf8mb4',
      collate: 'utf8mb4_bin',
      comment: '账户nft表',
      indexes: [{
        fields: [ 'account_address', 'chain', 'contract_address', 'token_id' ],
        name: 'uk_aa_chain_ca_ti',
        unique: true,
      }],
    }
  );

  return model;
};
