const redis = require('../helpers/redis');
const cache = require('../../services/cache');
const popular = require('../../services/popular');

beforeEach(() => Promise.all([redis.clearDB(), cache.init(), popular.init()]));
