const redis = require('redis');
const crypto = require('crypto');
const debug = require('debug')('talk:services:redis');
const {
  REDIS_URL
} = require('../config');

const connectionOptions = {
  url: REDIS_URL,
  retry_strategy: function(options) {
    if (options.error && options.error.code === 'ECONNREFUSED') {

      // End reconnecting on a specific error and flush all commands with a individual error
      return new Error('The server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {

      // End reconnecting after a specific timeout and flush all commands with a individual error
      return new Error('Retry time exhausted');
    }

    if (options.times_connected > 10) {

      // End reconnecting with built in error
      return undefined;
    }

    // reconnect after
    return Math.max(options.attempt * 100, 3000);
  }
};

// Load the script into redis and track the script hash that we will use to exec
// increments on.
function loadScript(name, script) {
  return new Promise((resolve, reject) => {

    let shasum = crypto.createHash('sha1');
    shasum.update(script);

    let hash = shasum.digest('hex');

    this.script('EXISTS', hash, (err, [exists]) => {
      if (err) {
        return reject(err);
      }

      if (exists) {
        debug(`already loaded ${name} as SHA[${hash}], not loading again`);

        return resolve(hash);
      }

      debug(`${name} not loaded as SHA[${hash}], loading`);

      this.script('load', script, (err, hash) => {
        if (err) {
          return reject(err);
        }

        debug(`loaded ${name} as SHA[${hash}]`);

        resolve(hash);
      });
    });
  });
}

async function scriptFunction(hash, numberKeys) {
  return (...args) => new Promise((resolve, reject) => {
    this.evalsha(hash, numberKeys, ...args, (err, ...replies) => {
      if (err) {
        return reject(err);
      }

      return resolve(...replies);
    });
  });
}

async function generateScriptFunction(name, script, numberKeys) {
  let hash = await loadScript.bind(this)(name, script);
  return scriptFunction.bind(this)(hash, numberKeys);
}

const createClient = () => {
  let client = redis.createClient(connectionOptions);

  client.ping((err) => {
    if (err) {
      console.error('Can\'t ping the redis server!');

      throw err;
    }

    debug('connection established');
  });

  client.loadScript = loadScript.bind(client);
  client.generateScriptFunction = generateScriptFunction.bind(client);
  client.scriptFunction = scriptFunction.bind(client);

  return client;
};

module.exports = {
  connectionOptions,
  createClient,
  generateScriptFunction,
  loadScript,
  scriptFunction,
  createClientFactory: () => {
    let client = null;

    return () => {
      if (client) {
        return client;
      }

      client = createClient();

      return client;
    };
  }
};
