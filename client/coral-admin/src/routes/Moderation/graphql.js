import update from 'immutability-helper';
import * as notification from 'coral-admin/src/services/notification';

const limit = 10;

const ascending = (a, b) => {
  const dateA = new Date(a.created_at);
  const dateB = new Date(b.created_at);
  if (dateA < dateB) { return -1; }
  if (dateA > dateB) { return 1; }
  return 0;
};

const descending = (a, b) => -ascending(a, b);

function queueHasComment(root, queue, id) {
  return root[queue].nodes.find((c) => c.id === id);
}

function removeCommentFromQueue(root, queue, id) {
  if (!queueHasComment(root, queue, id)) {
    return root;
  }
  return update(root, {
    [`${queue}Count`]: {$set: root[`${queue}Count`] - 1},
    [queue]: {
      nodes: {$apply: (nodes) => nodes.filter((c) => c.id !== id)},
    },
  });
}

function shouldCommentBeAdded(root, queue, comment, sort) {
  if (root[`${queue}Count`] < limit) {

    // Adding all comments until first limit has reached.
    return true;
  }
  const cursor = new Date(root[queue].endCursor);
  return sort === 'CHRONOLOGICAL'
    ? new Date(comment.created_at) <= cursor
    : new Date(comment.created_at) >= cursor;
}

function addCommentToQueue(root, queue, comment, sort) {
  if (queueHasComment(root, queue, comment.id)) {
    return root;
  }

  const sortAlgo = sort === 'CHRONOLOGICAL' ? ascending : descending;
  const changes = {
    [`${queue}Count`]: {$set: root[`${queue}Count`] + 1},
  };

  if (shouldCommentBeAdded(root, queue, comment, sort)) {
    const nodes = root[queue].nodes.concat(comment).sort(sortAlgo);
    changes[queue] = {
      nodes: {$set: nodes},
      startCursor: {$set: nodes[0].created_at},
      endCursor: {$set: nodes[nodes.length - 1].created_at},
    };
  }

  return update(root, changes);
}

/**
 * getCommentQueues determines in which queues a comment should be placed.
 */
function getCommentQueues(comment, queueConfig) {
  const queues = [];
  Object.keys(queueConfig).forEach((key) => {
    const {action_type, statuses, tags} = queueConfig[key];
    let addToQueues = false;
    if (statuses && statuses.indexOf(comment.status) >= 0) {
      addToQueues = true;
    }
    if (tags && comment.tags && comment.tags.some((tagLink) => tags.indexOf(tagLink.tag.name) >= 0)) {
      addToQueues = true;
    }
    if (action_type && comment.actions && comment.actions.some((a) => a.__typename.toLowerCase() === `${action_type}action`)) {
      addToQueues = true;
    }
    if (addToQueues) {
      queues.push(key);
    }
  });
  return queues;
}

/**
 * Assimilate comment changes into current store.
 * @param  {Object} root               current state of the store
 * @param  {Object} comment            comment that was changed
 * @param  {string} sort               current sort order of the queues
 * @param  {Object} [notify]           show know notifications if set
 * @param  {string} notify.activeQueue current active queue
 * @param  {string} notify.text        notification text to show
 * @param  {bool}   notify.anyQueue    if true show the notification when the comment is shown
 *                                     in the current active queue besides the 'all' queue.
 * @param  {Object} queueConfig        queue configuration
 * @return {Object}                    next state of the store
 */
export function handleCommentChange(root, comment, sort, notify, queueConfig, activeQueue) {
  let next = root;

  const nextQueues = getCommentQueues(comment, queueConfig);

  let notificationShown = false;
  const showNotificationOnce = () => {
    if (notificationShown) {
      return;
    }
    notification.info(notify);
    notificationShown = true;
  };

  Object.keys(queueConfig).forEach((queue) => {
    if (nextQueues.indexOf(queue) >= 0) {
      if (!queueHasComment(next, queue, comment.id)) {
        next = addCommentToQueue(next, queue, comment, sort);
        if (notify && activeQueue === queue && shouldCommentBeAdded(next, queue, comment, sort)) {
          showNotificationOnce(comment);
        }
      }
    } else if(queueHasComment(next, queue, comment.id)){
      next = removeCommentFromQueue(next, queue, comment.id);
      if (notify && activeQueue === queue) {
        showNotificationOnce(comment);
      }
    }

    if (
      notify
      && queueHasComment(next, queue, comment.id)
      && activeQueue === queue
    ) {
      showNotificationOnce(comment);
    }
  });
  return next;
}
