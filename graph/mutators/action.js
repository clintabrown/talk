const ActionModel = require('../../models/action');
const ActionsService = require('../../services/actions');
const UsersService = require('../../services/users');
const Popular = require('../../services/popular');
const errors = require('../../errors');
const {CREATE_ACTION, DELETE_ACTION} = require('../../perms/constants');

/**
 * Creates an action on a item. If the item is a user flag, sets the user's status to
 * pending.
 * @param  {Object} user        the user performing the request
 * @param  {String} item_id     id of the item to add the action to
 * @param  {String} item_type   type of the item
 * @param  {String} action_type type of the action
 * @return {Promise}            resolves to the action created
 */
const createAction = async ({user = {}, pubsub, loaders: {Comments}}, {item_id, item_type, action_type, group_id, metadata = {}}) => {

  let comment;
  if (item_type === 'COMMENTS') {
    comment = await Comments.get.load(item_id);
    if (!comment) {
      throw new Error('Comment not found');
    }

    if (action_type === 'FLAG') {
      pubsub.publish('commentFlagged', comment);
    }
  }

  let action = await ActionsService.insertUserAction({
    item_id,
    item_type,
    user_id: user.id,
    group_id,
    action_type,
    metadata
  });

  if (item_type === 'COMMENTS') {
    await Popular.incrementCommentAction(comment.asset_id, action_type, item_id);
  }

  if (item_type === 'USERS' && action_type === 'FLAG') {

    // Set the user as pending if it was a user flag.
    await UsersService.setStatus(item_id, 'PENDING');
  }

  return action;
};

/**
 * Deletes an action based on the user id if the user owns that action.
 * @param  {Object} user the user performing the request
 * @param  {String} id   the id of the action to delete
 * @return {Promise}     resolves to the deleted action, or null if not found.
 */
const deleteAction = async ({user, loaders: {Comments}}, {id}) => {
  const action = await ActionModel.findOneAndRemove({
    id,
    user_id: user.id
  });

  if (action.item_type === 'COMMENTS') {
    let comment = await Comments.get.load(action.item_id);
    if (comment) {
      await Popular.decrementCommentAction(comment.asset_id, action.action_type, comment.id);
    }
  }

  return action;
};

module.exports = (context) => {
  if (context.user && context.user.can(CREATE_ACTION, DELETE_ACTION)) {
    return {
      Action: {
        create: (action) => createAction(context, action),
        delete: (action) => deleteAction(context, action)
      }
    };
  }

  return {
    Action: {
      create: () => Promise.reject(errors.ErrNotAuthorized),
      delete: () => Promise.reject(errors.ErrNotAuthorized)
    }
  };
};
