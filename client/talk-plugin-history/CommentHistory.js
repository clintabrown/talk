import React, {PropTypes} from 'react';
import Comment from './Comment';
import styles from './CommentHistory.css';
import LoadMore from './LoadMore';
import {forEachError} from 'plugin-api/beta/client/utils';

class CommentHistory extends React.Component {
  state = {
    loadingState: '',
  };

  loadMore = () => {
    this.setState({loadingState: 'loading'});
    this.props.loadMore()
      .then(() => {
        this.setState({loadingState: 'success'});
      })
      .catch((error) => {
        this.setState({loadingState: 'error'});
        forEachError(error, ({msg}) => {this.props.addNotification('error', msg);});
      });
  }

  render() {
    const {link, comments} = this.props;
    return (
      <div className={`${styles.header} commentHistory`}>
        <div className="commentHistory__list">
          {comments.nodes.map((comment, i) => {
            return <Comment
              key={i}
              comment={comment}
              link={link}
              asset={comment.asset} />;
          })}
        </div>
        {comments.hasNextPage &&
          <LoadMore
            loadMore={this.loadMore}
            loadingState={this.state.loadingState}
          />
        }
      </div>
    );
  }
}

CommentHistory.propTypes = {
  comments: PropTypes.object.isRequired
};

export default CommentHistory;
