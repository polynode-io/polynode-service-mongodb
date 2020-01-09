/*
 * polynode-service-mongodb
 *
 * Released under MIT license. Copyright 2019 Jorge Duarte Rodriguez <info@malagadev.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
 * to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies
 * or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
 * FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 * $Id$
 *
 * @flow
 * @format
 *
 */

const mongoose = require('mongoose');
require('mongoose-schema-jsonschema')(mongoose);

type DBUri = string;
type DBOptions = {
  keepAlive: boolean,
  useNewUrlParser: boolean,
  useUnifiedTopology: boolean,
};

const runAllActions = (onConnectActions, depsContainer) =>
  onConnectActions.forEach(action => action(depsContainer));

class Database {
  conn: any; // @todo: use proper type from Mongoose
  config: {
    uri: String,
    options: DBOptions,
  };

  onConnectActions: Array<() => void>;
  constructor(deps: {
    log: Function,
    config: { uri: DBUri, options: null | DBOptions },
    onConnect?: Function,
  }) {
    console.log('*********** in service mongodb');
    this.config = deps.config;
    this.log = deps.log;
    this.onConnectActions = deps.onConnect ? [deps.onConnect] : [];

    this.log.debug('*** Connecting to DB... Config is: ', this.config);

    mongoose
      .createConnection(this.config.uri, this.config.options)
      .then(conn => {
        this.log.info('*** DB Connection established.');
        this.conn = conn;
        runAllActions(this.onConnectActions, deps);
      })
      .catch(err => {
        if (this.isMongoError(err)) {
          this.log.fatal('***  DB ERROR: Cant connect to database.', err);
        } else {
          this.log.fatal(
            '*** ERROR: Unknown error trying to connect to the DB. Probably one of the onConnectActions failed (it means one of your routes is not properly working)',
            err
          );
        }

        throw err;
      });
  }

  isMongoError = (err: Error) => err.name.substring(0, 5) === 'Mongo';

  getConnection = () => this.conn;

  async disconnect() {
    return this.conn.disconnect();
  }
}

module.exports = Database;
