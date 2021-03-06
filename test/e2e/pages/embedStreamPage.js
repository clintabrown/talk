const embedStreamCommands = {
  url: function () {
    return this
      .api.launchUrl;
  },
  ready() {
    return this
      .waitForElementVisible('body', 4000)
      .waitForElementVisible('#coralStreamEmbed > iframe')
      .api.frame('coralStreamEmbed_iframe');
  },
  signUp(user) {
    return this
      .waitForElementVisible('@signInButton', 2000)
      .click('@signInButton')
      .waitForElementVisible('@signInDialog')
      .waitForElementVisible('@registerButton')
      .click('@registerButton')
      .setValue('@signInDialogEmail', user.email)
      .setValue('@signInDialogPassword', user.pass)
      .setValue('@signUpDialogConfirmPassword', user.pass)
      .setValue('@signUpDialogUsername', user.username)
      .waitForElementVisible('@signUpButton')
      .click('@signUpButton')
      .waitForElementVisible('@signInViewTrigger')
      .click('@signInViewTrigger')
      .waitForElementVisible('@logInButton')
      .click('@logInButton')
      .waitForElementVisible('@logoutButton', 5000);
  },
  login(user) {
    return this
      .waitForElementVisible('@signInButton', 2000)
      .click('@signInButton')
      .waitForElementVisible('@signInDialog')
      .waitForElementVisible('@signInDialogEmail')
      .waitForElementVisible('@signInDialogPassword')
      .setValue('@signInDialogEmail', user.email)
      .setValue('@signInDialogPassword', user.pass)
      .waitForElementVisible('@logInButton')
      .click('@logInButton')
      .waitForElementVisible('@logoutButton', 5000);
  },
  logout() {
    return this
      .waitForElementVisible('@logoutButton', 5000)
      .click('@logoutButton')
      .waitForElementVisible('@signInButton', 5000);
  },
  postComment(comment = 'Test Comment') {
    return this
      .waitForElementVisible('@commentBox', 2000)
      .setValue('@commentBox', comment)
      .click('@postButton');
  },
  likeComment() {
    return this
      .waitForElementVisible('@likeButton')
      .click('@likeButton');
  },
  flagComment() {
    return this
      .waitForElementVisible('@flagButton')
      .click('@flagButton');
  },
  flagUsername() {
    return this
      .waitForElementVisible('@flagButton')
      .click('@flagButton');
  },
  getPermalink(fn) {
    return this
      .waitForElementVisible('@permalinkButton')
      .click('@permalinkButton')
      .waitForElementVisible('@permalinkPopUp')
      .getValue('@permalinkInput', (result) => fn(result.value));
  }
};

module.exports = {
  commands: [embedStreamCommands],
  elements: {
    signInButton: {
      selector: '#coralSignInButton'
    },
    signInDialog:{
      selector: '#signInDialog'
    },
    signInDialogEmail: {
      selector: '#signInDialog #email'
    },
    signInDialogPassword: {
      selector: '#signInDialog #password'
    },
    signUpDialogConfirmPassword: {
      selector: '#signInDialog #confirmPassword'
    },
    signUpDialogUsername: {
      selector: '#signInDialog #username'
    },
    logInButton: {
      selector: '#coralLogInButton'
    },
    signUpButton: {
      selector: '#coralSignUpButton'
    },
    signInViewTrigger: {
      selector: '#coralSignInViewTrigger'
    },
    logoutButton: {
      selector: '#coralStream #logout'
    },
    commentBox: {
      selector: '.talk-plugin-commentbox-textarea'
    },
    postButton: {
      selector: '#commentBox .talk-plugin-commentbox-button'
    },
    likeButton: {
      selector: '.embed__stream .comment .talk-plugin-likes-container .talk-plugin-likes-button'
    },
    likeText: {
      selector: '.embed__stream .comment .talk-plugin-likes-container .talk-plugin-likes-button .talk-plugin-likes-button-text'
    },
    likesCount: {
      selector: '.embed__stream .comment .talk-plugin-likes-container .talk-plugin-likes-button .talk-plugin-likes-like-count'
    },
    flagButton: {
      selector: '.embed__stream .comment .talk-plugin-flags-container .talk-plugin-flags-button'
    },
    flagPopUp: {
      selector: '.embed__stream .comment .talk-plugin-flags-popup'
    },
    flagCommentOption: {
      selector: '.embed__stream .comment .talk-plugin-flags-popup .talk-plugin-flags-popup-radio-label[for="COMMENTS"]'
    },
    flagUsernameOption: {
      selector: '.embed__stream .comment .talk-plugin-flags-popup .talk-plugin-flags-popup-radio-label[for="USERS"]'
    },
    flagOtherOption: {
      selector: '.embed__stream .comment .talk-plugin-flags-popup .talk-plugin-flags-popup-radio-label[for="other"]'
    },
    flagHeaderMessage: {
      selector: '.embed__stream .comment .talk-plugin-flags-popup .talk-plugin-flags-popup-header'
    },
    flagButtonText: {
      selector: '.embed__stream .comment .talk-plugin-flags-button-text'
    },
    flagDoneButton: {
      selector: '.embed__stream .comment .talk-plugin-flags-popup .talk-plugin-flags-popup-button'
    },
    permalinkButton: {
      selector: '.embed__stream .comment .talk-plugin-permalinks-button'
    },
    permalinkPopUp: {
      selector: '.embed__stream .comment .talk-plugin-permalinks-popover.active'
    },
    permalinkInput: {
      selector: '.embed__stream .comment .talk-plugin-permalinks-popover.active input'
    },
    registerButton: {
      selector: '#signInDialog #coralRegister'
    }
  }
};
