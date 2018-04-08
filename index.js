const squel = require('squel').useFlavour('mysql');
const mysql = require('mysql2/promise');

class ForUpdateBlock extends squel.cls.Block {
  // Add the FOR UPDATE keyword to the query.
  forUpdate() {
    this._lockForUpdate = true;
  }

  _toParamString() {
    return {
      text: this._lockForUpdate ? "FOR UPDATE"  : "",
      values: [],
    };
  }
}

squel.select = function(options) {
  return new squel.cls.Select(options, [
    new squel.cls.StringBlock(options, 'SELECT'),
    new squel.cls.FunctionBlock(options),
    new squel.cls.DistinctBlock(options),
    new squel.cls.GetFieldBlock(options),
    new squel.cls.FromTableBlock(options),
    new squel.cls.JoinBlock(options),
    new squel.cls.WhereBlock(options),
    new squel.cls.GroupByBlock(options),
    new squel.cls.HavingBlock(options),
    new squel.cls.OrderByBlock(options),
    new squel.cls.LimitBlock(options),
    new squel.cls.OffsetBlock(options),
    new squel.cls.UnionBlock(options),
    new ForUpdateBlock(options)
  ]);
};

function executeQuery(connection) {
  return async function exec(bindings) {
    return connection.exec(this.toString(), bindings);
  }
}

function injectConnection(connection, builder) {
  builder.exec = executeQuery(connection);
  return builder;
}

class Connection {
  constructor(connection) {
    this.connection = connection;
  }

  insert(options) { // C
    return injectConnection(this, squel.insert({ replaceSingleQuotes: true, singleQuoteReplacement: '\\\'', ...options }));
  }

  select(options) { // R
    return injectConnection(this, squel.select({ replaceSingleQuotes: true, singleQuoteReplacement: '\\\'', ...options }));
  }

  update(options) { // U
    return injectConnection(this, squel.update({ replaceSingleQuotes: true, singleQuoteReplacement: '\\\'', ...options }));
  }

  delete(options) { // D
    return injectConnection(this, squel.delete({ replaceSingleQuotes: true, singleQuoteReplacement: '\\\'', ...options }));
  }

  async exec(query, bindings) {
    if (typeof bindings === 'object' && !Array.isArray(bindings)) return this.execute(query, bindings);
    else return this.query(query, bindings);
  }

  async execute(query, bindings = {}) {
    const [result] = await this.connection.execute(query, bindings);
    return result;
  }

  async query(query, bindings = []) {
    const [result] = await this.connection.query(query, bindings);
    return result;
  }
}

class Transaction extends Connection {
  constructor(connection) {
    super(connection);
  }

  async commit() {
    await this.connection.commit();
    this.connection.release();
  }

  async rollback() {
    await this.connection.rollback();
    this.connection.release();
  }
}

class Pool extends Connection {
  constructor(options) {
    super(mysql.createPool(options));
  }

  async beginTransaction() {
    const connection = await this.connection.getConnection();
    await connection.beginTransaction();
    return new Transaction(connection);
  }
}

module.exports = Pool;
