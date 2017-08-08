// Create a redis client to use for caching comment action data.
const {createClientFactory} = require('./redis');
const client = createClientFactory();
const debug = require('debug')('talk:services:popular');

const ActionModel = require('../models/action');
const CommentModel = require('../models/comment');

// POPULAR_INCR_SCRIPT is the lua script for implementing score updating
// in redis.
const POPULAR_INCR_SCRIPT = `
if redis.call('ZCARD', KEYS[1]) ~= 0 then
  return redis.call('ZINCRBY', KEYS[1], ARGV[1], KEYS[2])
end
`;

// setScores will set an array of scores onto a sorted list.
async function setScores(key, scores) {
  return new Promise((resolve, reject) => {
    if (!scores || scores.length <= 0) {
      return resolve();
    }

    let args = scores.reduce((args, {item_id, count}) => {

      // Push the arguments into the array.
      args.push(count);
      args.push(item_id);

      return args;
    }, []);

    debug(`EXECUTE: ZADD ${key} ${args.join(' ')}`);

    client()
      .zadd(key, ...args, (err) => {
        if (err) {
          return reject(err);
        }

        return resolve();
      });
  });
}

// getScores will return keys with their matching counts if it 
// is cached, otherwise null will be returned.
async function getScores(key, limit, offset) {
  return new Promise((resolve, reject) => {
    debug(`EXECUTE: ZREVRANGEBYSCORE ${key} +inf -inf WITHSCORES LIMIT ${offset} ${limit}`);
    client()
      .zrevrangebyscore(key, '+inf', '-inf', 'WITHSCORES', 'LIMIT', offset, limit, (err, replies) => {
        if (err) {
          return reject(err);
        }

        // If there are no replies, then return an empty array if we are
        // loading an offset.
        if (replies.length <= 0 && offset > 0) {
          return resolve([]);
        }

        // If there are no replies, then return null.
        if (!replies || replies.length <= 0) {
          return resolve(null);
        }

        // Itterate over the pairs of replies to parse the scores.
        const scores = [];
        for (let i = 0; i < replies.length; i += 2) {
          scores.push({
            item_id: replies[i],
            count: replies[i + 1],
          });
        }

        return resolve(scores);
      });
  });
}

// keyFunc will format a string for the popular key in redis for the sorted list.
function keyFunc(category, item_type, item_id) {
  return `popular.${category.toLowerCase()}.${item_type.toLowerCase()}[${item_id}]`;
}

async function computeScores(asset_id, action_type) {

  // We'll need to get all the comment id's for the asset so we can query
  // for their actions.
  const assetCommentIDs = (await CommentModel.find({
    asset_id
  }).select('id')).map(({id}) => id);

  // The scores weren't found, we should populate them.
  let scores = await ActionModel.aggregate([

    // Filter down the result set.
    {$match: {

      // Only get the actions for the comments from this asset.
      item_id: {
        $in: assetCommentIDs,
      },

      // Only get the actions that are the specified action type.
      action_type,

      // We are only interested in top level comments.
      parent_id: null,
    }},

    // Group the resulting data.
    {$group: {

      // Group by the item_id.
      _id: '$item_id',

      // And count up the number of actions.
      count: {
        $sum: 1
      },
    }},

    // Remap some of the fields.
    {$project: {

      // Suppress the _id field.
      _id: false,

      // Remap the field for the item_id out of the _id.
      item_id: '$_id',

      // Include the grouping count.
      count: '$count',
    }},

    // Sort these responses with the count.
    {$sort: {
      count: -1,
    }},
  ]);

  return scores;
}

// incrementScoreBy is a function that is generated when we call init.
let incrementScoreBy;

// init will ensure that the lua scripts are loaded.
module.exports.init = async () => {

  // Load the POPULAR_INCR_SCRIPT and DECR_SCRIPT into Redis.
  incrementScoreBy = await client().generateScriptFunction('POPULAR_INCR_SCRIPT', POPULAR_INCR_SCRIPT, 2);
};

// incrementCommentAction will increment a given value in redis for
// the score related to an action being added on a comment.
module.exports.incrementCommentAction = (asset_id, action_type, comment_id) => {
  return incrementScoreBy(keyFunc(action_type, 'ASSETS', asset_id), comment_id, 1);
};

// decrementCommentAction will increment a given value in redis for
// the score related to an action being deleted on a comment.
module.exports.decrementCommentAction = (asset_id, action_type, comment_id) => {
  return incrementScoreBy(keyFunc(action_type, 'ASSETS', asset_id), comment_id, -1);
};

// getByActionType will find the most popular comment id's given a popularity
// lookup related to the actions completed on a given comment.
module.exports.getByActionType = async (asset_id, action_type, limit, offset) => {
  const key = keyFunc(action_type, 'ASSETS', asset_id);

  // Get the scores.
  let scores = await getScores(key, limit, offset);
  if (!scores && offset === 0) {

    // Compute the scores from the database.
    scores = await computeScores(asset_id, action_type);

    // Set the scores in the cache on the next tick of the process.
    process.nextTick(async () => {

      // Now that we have the scores, we should set it in Redis, super lazily so
      // we don't waste the client's time.
      try {
        await setScores(key, scores);
      } catch (err) {
        console.error(err);
      }

    });
    
    // Only return what we asked for in terms of the array contents.
    return scores.slice(offset, offset + limit);
  }

  // Return the scores now that we've either returned them from the cache or
  // computed them and refreshed the cache.
  return scores;
};
