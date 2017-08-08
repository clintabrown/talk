const expect = require('chai').expect;
const {graphql} = require('graphql');

const schema = require('../../../../graph/schema');
const Context = require('../../../../graph/context');
const UsersService = require('../../../../services/users');
const SettingsService = require('../../../../services/settings');
const Asset = require('../../../../models/asset');
const CommentsService = require('../../../../services/comments');

describe('graph.queries.asset', () => {
  let asset, users;
  beforeEach(async () => {
    await SettingsService.init();
    asset = await Asset.create({id: '1', url: 'https://example.com'});
    users = await UsersService.createLocalUsers([
      {
        email: 'usernameA@example.com',
        password: 'password',
        username: 'usernameA'
      },
      {
        email: 'usernameB@example.com',
        password: 'password',
        username: 'usernameB'
      },
      {
        email: 'usernameC@example.com',
        password: 'password',
        username: 'usernameC'
      }
    ]);
  });

  it('can get comments edge', async () => {
    const context = new Context({user: users[0]});

    await CommentsService.publicCreate([1, 2].map(() => ({
      author_id: users[0].id,
      asset_id: asset.id,
      body: `hello there! ${String(Math.random()).slice(2)}`,
    })));

    const assetCommentsQuery = `
      query assetCommentsQuery($id: ID!) {
        asset(id: $id) {
          comments(limit: 10) {
            nodes {
              id
              body
              created_at
            }
            startCursor
            endCursor
            hasNextPage
          }
        }
      }
    `;
    const res = await graphql(schema, assetCommentsQuery, {}, context, {id: asset.id});
    expect(res.erros).is.empty;
    const {nodes, startCursor, endCursor, hasNextPage} = res.data.asset.comments;
    expect(nodes.length).to.equal(2);
    expect(startCursor).to.equal(nodes[0].created_at);
    expect(endCursor).to.equal(nodes[1].created_at);
    expect(hasNextPage).to.be.false;
  });

});
