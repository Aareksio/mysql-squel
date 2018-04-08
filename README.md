## Motivation
Finding `knex` too complex I went looking for solid query builder without too much additional options.
`squel` seem perfect, but its lack of direct integration with database makes it hard to use.
This module adds such integration, offering much easier interface for developer.

## Description
Easy to use mysql pool connection with integrated query builder and transaction support focused on simple API and ease to use with `async/await`.

## Example
```JS
const Database = require('@doctormole/mysql');

const db = new Database({
  host: 'localhost',
  user: 'demo',
  password: 'demo',
  database: 'demo'
});

async function queryBuilder() {
  // https://hiddentao.com/squel/

  await db.insert().into('users').setFields({ name: 'demo' }).exec();
  const [user] = await db.select().from('users').where('name = :name').exec({ name: user.name });
  await db.update().table('users').set('name = :name').where('id = :id').exec({ name: 'demo2', id: user.id });
  await db.delete().from('users').where('id = :id').exec({ id: user.id });
}

async function customQuery() {
  await db.exec('SELECT VERSION()');
}

async function transaction() {
  const transaction = await db.beginTransaction();

  const [user] = await transaction.select().forUpdate().from('users').where('id = :id').exec({ id });
  await transaction.update().table('users').set('name = :newName').where('name = :oldName').exec({ newName: 'demo', oldName: user.name });

  await transaction.commit();
}
```

## API

###### `new Database([options])`
- `options` - [mysql pool options](https://github.com/mysqljs/mysql#pool-options)
Creates connection pool using [mysql2](https://github.com/sidorares/node-mysql2). Options are passed directly to `mysql.createPool`. Pool instance available under `db.connection`.
Returns `db` instance.

###### `db.exec(query[, bindings])`
- `query` - sql query string
- `bindings` - either an object with parameters as keys when using named placeholders (`:param`), or an array when using `?`.
When using named placeholders or no bindings at all, query will be executed via `mysql2.execute()`, which will create and reuse prepared statement when possible.

###### `db.select()`
###### `db.update()`
###### `db.insert()`
###### `db.delete()`
Returns corresponding [squel query builder](https://hiddentao.com/squel/) instances extended with `.exec([bindings])`, which will execute built query with passed bindings, just like `db.exec()`.
`db.select()` is extended with `.forUpdate()` method

###### `db.beginTransaction()`
Returns `transaction` instance, which inherits interface from `db` with two additional methods.

###### `transaction.commit()`
Commits transaction and returns underlying connection to pool.

###### `transaction.rollback()`
Rollbacks transaction and returns underlying connection to pool.
