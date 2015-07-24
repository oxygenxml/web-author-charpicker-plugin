(function(){
  /**
   *
   * @constructor
   */
  var GitHubErrorReporter = function() {
    this.errDialog = null;
  };

  /**
   * Shows an error dialog.
   * @param {string} title The title of the dialog.
   * @param {string} bodyHtml The HTML content of the dialog.
   */
  GitHubErrorReporter.prototype.showError = function(title, bodyHtml) {
    var dialog = this.getErrorDialog();
    dialog.setTitle(title);
    dialog.getElement().innerHTML = bodyHtml;
    dialog.show();
  };

  /**
   * Create and return the commit error dialog.
   *
   * @return {sync.api.Dialog} The error message dialog.
   */
  GitHubErrorReporter.prototype.getErrorDialog = function() {
    if (!this.errDialog) {
      this.errDialog = workspace.createDialog();
      this.errDialog.setButtonConfiguration(sync.api.Dialog.ButtonConfiguration.OK);
    }
    return this.errDialog;
  };

  var errorReporter = new GitHubErrorReporter();

  /**
   * The Log out action for Github
   *
   * @constructor
   */
  function LogOutAction () {}
  goog.inherits(LogOutAction, sync.actions.AbstractAction);

  /** @override */
  LogOutAction.prototype.renderLargeIcon = function() {
    return null;
  };

  /** @override */
  LogOutAction.prototype.renderSmallIcon = function() {
    return null;
  };

  /**
   * Constructs and returns the log-out confirmation dialog.
   *
   * @return {sync.api.Dialog} The dialog used to confirm teh log-out action.
   */
  LogOutAction.prototype.getDialog = function() {
    if (!this.dialog) {
      this.dialog = workspace.createDialog();
      this.dialog.setTitle('Log out');
      this.dialog.setButtonConfiguration(sync.api.Dialog.ButtonConfiguration.YES_NO);

      var dialogHtml = '<div>';
      dialogHtml += '<div>Are you sure you want to log-out? All the changes made to the opened file will be lost.</div>';
      dialogHtml += '</div>';

      this.dialog.getElement().innerHTML = dialogHtml;
    }
    return this.dialog;
  };

  /**
   * Called when the Logout button is clicked
   *
   * @override
   */
  LogOutAction.prototype.actionPerformed = function() {
    this.dialog = this.getDialog();

    this.dialog.onSelect(goog.bind(function (actionName) {
      if (actionName == 'yes') {
        clearGithubCredentials();
        window.location.reload();
      }

    }, this));

    this.showDialog();
  };

  /** @override */
  LogOutAction.prototype.getDisplayName = function() {
    return "Logout";
  };

  /** @override */
  LogOutAction.prototype.getDescription = function() {
    return "Github Logout";
  };

  /**
   * Shows the logout dialog.
   */
  LogOutAction.prototype.showDialog = function() {
    this.dialog.show();
  };

  /**
   * The commit action for GitHub.
   *
   * @param {sync.api.Editor} editor The editor on which this action applies.
   * @param {object} github The GitHub repo access object.
   * @param {object} fileLocation An object describind the location of the opened file.
   *
   * @constructor
   */
  var CommitAction = function(editor, github, fileLocation) {
    this.editor = editor;

    this.github = github;
    this.repo = github.getRepo(fileLocation.user, fileLocation.repo);
    this.branch = fileLocation.branch;
    this.filePath = fileLocation.filePath;

    this.dialog = null;
    this.iconWrapper = null;

    this.status = 'none';
    this.githubToolbarButton = null;
    this.statusTimeout = null;
  };
  goog.inherits(CommitAction, sync.actions.AbstractAction);

  /**
   * Gets the content of the file asynchronously.
   *
   * @param {function(string)} cb The callback that will receive the file content.
   */
  CommitAction.prototype.getContent = function(cb) {
    this.editor.getXmlContent(cb);
  };

  /**
   * Sets the toolbarButton
   * @param {Element} toolbarButton The github toolbar button
   */
  CommitAction.prototype.setGithubToolbarButton = function (toolbarButton) {
    this.githubToolbarButton = toolbarButton;
  };

  /** @override */
  CommitAction.prototype.renderLargeIcon = function() {
    this.iconWrapper = goog.dom.createDom('div', 'github-icon-wrapper',
      goog.dom.createDom('div', 'github-icon-octocat-large'));
    return this.iconWrapper;
  };

  /** @override */
  CommitAction.prototype.renderSmallIcon = function() {
    this.iconWrapper = goog.dom.createDom('div', 'github-icon-wrapper',
        goog.dom.createDom('div', 'github-icon-octocat-small'));
    return this.iconWrapper;
  };


  /** @override */
  CommitAction.prototype.getDisplayName = function() {
    return "Commit on GitHub";
  };

    /** @override */
  CommitAction.prototype.getDescription = function() {
    return "Commit on GitHub";
  };

  /**
   * Shows the dialog.
   */
  CommitAction.prototype.showDialog = function() {
    this.dialog.show();
  };


  /**
   * Constructs and returns the dialog.
   *
   * @return {sync.api.Dialog} The dialog used to collect commit info.
   */
  CommitAction.prototype.getDialog = function() {
    if (!this.dialog) {
      this.dialog = workspace.createDialog();
      this.dialog.setTitle('Commit on GitHub');

      var dialogHtml = '<div class="github-commit-dialog">';
      dialogHtml += '<div><label>Commit Message: <textarea class="github-input" name="message"></textarea></label></div>';
      dialogHtml += '<div><label>Commit on branch:<input class="github-input" name="branch" type="text" value="' + this.branch + '"/></label></div>';
      dialogHtml += '</div>';
      var el = this.dialog.getElement();
      el.innerHTML = dialogHtml;
    }
    return this.dialog;
  };


  /**
   * Tries to commit if all the details needed for a commit were gathered.
   *
   * @param {object} ctx The context of this commit.
   * @param {function(object,object=)} cb Called after the commit was attempted with the
   * error and/or success values.
   */
  CommitAction.prototype.tryCommit = function(ctx, cb) {
    if (ctx.branchExists && ctx.hasOwnProperty('content')) {
      this.repo.write(this.branch, this.filePath, ctx.content, ctx.message, function(err) {
        cb(err);
      });
    }
  };

  /**
   * Perform the actual commit.
   *
   * @param {function(object,object=)} cb Callback after the commit is performed.
   * @param {object} ctx The context of the commit.
   */
  CommitAction.prototype.performCommit = function(ctx, cb) {
    this.setStatus('loading');

    // Obtain the content of the current file.
    this.getContent(goog.bind(function(err, content) {
      ctx.content = content;
      this.tryCommit(ctx, cb);
    }, this));

    // Create the branch if it does not exist.
    if (ctx.branch && ctx.branch !== this.branch) {
      ctx.branchExists = false;
      this.createBranch_(ctx, cb);
    } else {
      ctx.branchExists = true;
    }
  };

  /**
   * Creates a new branch
   * @param {object} ctx The context of the commit
   * @param {function()} cb The method to callon result
   * @private
   */
  CommitAction.prototype.createBranch_ = function (ctx, cb) {
    // Callback after the branch was created.
    var branchCreated = goog.bind(function(err) {
      if (!err) {
        this.branch = ctx.branch;
        ctx.branchExists = true;
        this.tryCommit(ctx, cb);
      } else{
        ctx.branchExists = false;
        cb(err);
      }
    }, this);

    this.repo.branch(this.branch, ctx.branch, goog.bind(function(err) {
      err = this.getBranchingError_(err);
      if (err && err.error === 404) {
        // Maybe this was a commit ref instead of a branch ref. Let's try.
        this.repo.createRef({
          "ref": "refs/heads/" + ctx.branch,
          "sha": this.branch
        }, goog.bind(function(err) {
          err = this.getBranchingError_(err);
          branchCreated(err);
        }, this));
      } else {
        branchCreated(err);
      }
    }, this));
  };

  /**
   * Function that returns the error object that occurred during branch creation.
   * @param {object<{err: number, request: object}>} err
   * @returns {object} The error object or null
   * @private
   */
  CommitAction.prototype.getBranchingError_ = function(err) {
    if (err) {
      if (err.error === 422 && err.request.responseText.indexOf("Reference already exists") !== -1) {
        // The branch already exists, so we can commit on it.
        err = null;
      }
    }
    return err;
  };

  /**
   * Handles the dialog result.
   *
   * @param {function()} cb Callback after the commit is performed.
   * @param {string} key The result of the dialog.
   */
  CommitAction.prototype.detailsProvided = function(cb, key) {
    var ctx = null;
    if (key == 'ok') {
      var el = this.getDialog().getElement();
      ctx = {
        message: el.querySelector('[name="message"]').value,
        branch: el.querySelector('[name="branch"]').value
      };
      // save ctx it for the fork and commit button
      this.ctx = ctx;

      this.performCommit(ctx, cb)
    }
    return ctx;
  };

  /**
   * Callback when the commit is finished, successfully or not.
   *
   * @param {function} cb The callback.
   * @param {object} err The error descriptor, if there was an error.
   */
  CommitAction.prototype.commitFinalized = function(cb, err) {
    if (!err) {
      this.editor.setDirty(false);
      this.setStatus('success');
      this.statusTimeout = setTimeout(
        goog.bind(this.setStatus, this, 'none'), 3200);
      errorReporter.showError('Commit status', '<span id="github-commit-success-indicator">Commit successful!</span>');
    } else {
      this.setStatus('none');

      var commitNotAllowed = false;
      var msg = 'Commit failed!';

      if (err.error == 401) {
        msg = 'Not authorized';

        // Clear the github credentials to make sure the login dialog is shown when the page is refreshed
        clearGithubCredentials();
      } else if (err.error == 404) {
        // Not allowed to commit, or the repository does not exist.
        commitNotAllowed = true;
        msg = ForkAndCommitButton.getHtml('No commit access.', 'Fork and commit?');
      } else if (err.error == 422) {
        msg = JSON.parse(err.request.responseText).message;
      } else if (err.error === 409) {
        msg = 'Conflict: ' + JSON.parse(err.request.responseText).message;
      }
      errorReporter.showError('Commit Error', msg);

      if (commitNotAllowed) {
        ForkAndCommitButton.onClick(goog.bind(function () {
          this.repo.fork(goog.bind(function (_, result) {
            var repoName = result.name;
            var owner = result.owner.login;
            var forkedRepo = this.github.getRepo(owner, repoName);

            if (this.ctx && this.ctx.branchExists) {
              commitToBranch.call(this);
            } else {
              forkedRepo.branch(this.branch, this.ctx.branch, goog.bind(function(err) {
                err = this.getBranchingError_(err);
                if (err && err.error === 404) {
                  // Maybe this was a commit ref instead of a branch ref. Let's try.
                  forkedRepo.createRef({
                    "ref": "refs/heads/" + ctx.branch,
                    "sha": this.branch
                  }, goog.bind(function(err) {
                    err = this.getBranchingError_(err);
                    commitToBranch.call(this, err);
                  }, this));
                } else {
                  commitToBranch.call(this);
                }
              }, this));
            }

            function commitToBranch(err) {
              if (err) {
                errorReporter.showError('Commit status', 'Could not commit to fork!');
              }

              forkedRepo.write(this.ctx.branch, this.filePath, this.ctx.content, this.ctx.message, function(err) {
                var msg = 'Commit to fork successful!';
                if (err.error = 404) {
                  msg = "Repository not found"
                } else {
                  msg = 'Error';
                }
                errorReporter.showError('Commit status', msg);
              });
            }
          }, this));

          errorReporter.errDialog.hide();
          ForkAndCommitButton.removeListener();
        }, this));
      }
    }
    cb();
  };


  /**
   * Set the status of the GitHub icon.
   *
   * @param {string} status The new status.
   */
  CommitAction.prototype.setStatus = function(status) {
    clearTimeout(this.statusTimeout);

    if (status != 'none') {
      this.githubToolbarButton.innerHTML = '';
    } else {
      this.githubToolbarButton.innerHTML = 'Github';
    }

    goog.dom.classlist.remove(this.githubToolbarButton, this.status);
    goog.dom.classlist.add(this.githubToolbarButton, status);
    this.status = status;
  };

  /**
   * @override
   */
  CommitAction.prototype.actionPerformed = function(cb) {
    if (this.status != 'loading') {
      this.setStatus('none');
      var dialog = this.getDialog();
      var commitFinalizedCallback = goog.bind(this.commitFinalized, this, cb);
      dialog.onSelect(goog.bind(this.detailsProvided, this, commitFinalizedCallback));
      this.showDialog();
    } else {
      cb();
    }
  };

  /** @override */
  CommitAction.prototype.getDescription = function() {
    return "Commit on GitHub";
  };

  /**
   * Holds helper methods for creating and setting a listener for a button
   * @type {{getHtml: Function, onClick: Function}}
   */
  var ForkAndCommitButton = {
    /**
     * Returns the html required to render the message and button
     * @param {string} message The message to be displayed
     * @param {string} buttonText The button text to be displayed
     * @returns {string} The html required to render the message and button
     */
    getHtml: function (message, buttonText) {
      return '<div class="github-forkandcommit-content">' + message +
          '<br /><button id="github-fork-and-commit-button" class="github-fork-button" type="submit">' + buttonText + '</button>' +
          '</div>';
    },
    /**
     * Sets the on click listener for the button
     * @param {Function} callback The method to call on click
     */
    onClick: function (callback) {
      var forkAndCommitButton = document.getElementById('github-fork-and-commit-button');
      if (forkAndCommitButton) {
        goog.events.listen(forkAndCommitButton, 'click', callback);
      }
    },
    /**
     * Removes the listeners set on the button
     */
    removeListener: function () {
      var forkAndCommitButton = document.getElementById('github-fork-and-commit-button');
      if (forkAndCommitButton) {
        goog.events.removeAll(forkAndCommitButton);
      }
    }
  };

  /**
   * Loads the github-specific CSS.
   */
  function loadCss() {
    var url = "../plugin-resources/github-static/github.css";
    if (document.createStyleSheet) {
      document.createStyleSheet(url);
    } else {
      var link = goog.dom.createDom('link', {
        href: url,
        rel: "stylesheet",
        type: "text/css"
      });
      goog.dom.appendChild(document.head, link);
    }
  }

  /**
   * The object that handles GitHub logins.
   *
   * @constructor
   */
  var GitHubLoginManager = function() {
    this.loginDialog = null;
    this.errorMessage = null;
  };

  /**
   * Sets the error message variable
   * @param {String} message The error message
   */
  GitHubLoginManager.prototype.setErrorMessage = function (message) {
    this.errorMessage = message;
  };

  /**
   * Creates the login dialog.
   */
  GitHubLoginManager.prototype.getLoginDialog = function() {
    if (!this.loginDialog || this.errorMessage) {
      this.loginDialog = workspace.createDialog();
      this.loginDialog.setButtonConfiguration(sync.api.Dialog.ButtonConfiguration.OK);

      var dialogHtml = '<div class="github-login-dialog">';

      if (this.errorMessage) {
        dialogHtml += '<div class="github-login-dialog-error">' + this.errorMessage + '</div>';
      }

      dialogHtml += '<div><label class="github-input">User Name: <input name="user" type="text"></label></div>';
      dialogHtml += '<div><label class="github-input">Password: <input name="pass" type="password"></label></div>';

      if (this.oauthProps && this.oauthProps.oauthUrl) {
        dialogHtml += '<div class="github-login-center-aligned">or</div>';
        dialogHtml += '<a href="' + this.oauthProps.oauthUrl + '" id="github-oauth-button"><span class="github-icon-octocat-large"></span><span class="github-oauth-text">Login with Github</span></a>';
      }

      this.loginDialog.getElement().innerHTML = dialogHtml;
      this.loginDialog.setTitle("GitHub Login");
    }
    return this.loginDialog;
  };

  /**
   * Sets the oauth properties required to build the github authenticate url
   *
   * @param {String=} clientId The Github client_id property
   * @param {String=} state The Github state property
   */
  GitHubLoginManager.prototype.setOauthProps = function (clientId, state) {
    var scopes = 'public_repo,repo';
    if (clientId && state) {
      this.oauthProps = {
        clientId: clientId,
        oauthUrl: 'https://github.com/login/oauth/authorize?client_id=' + clientId + '&state=' + state + '&scope=' + scopes
      }
    } else {
      this.oauthProps = {};
    }
  };

  /**
   * Creates a github access object form the user and password or auth token.
   */
  GitHubLoginManager.prototype.createGitHub = function() {
    var githubCredentials = localStorage.getItem('github.credentials');
    return githubCredentials && new Github(JSON.parse(githubCredentials));
  };

  /**
   * Reset the credentials.
   */
  GitHubLoginManager.prototype.resetCredentials = function() {
    localStorage.removeItem('github.credentials');
  };

  /**
   * Returns the github access object asynchronously.
   *
   * @param {Function} cb The method to call when we have the github instance
   */
  GitHubLoginManager.prototype.getCredentials = function(cb) {
    var github = this.createGitHub();
    if (github) {
      cb(github);
      return;
    }

    var dialog = this.getLoginDialog();
    dialog.onSelect(goog.bind(function() {
      var user = dialog.getElement().querySelector('[name="user"]').value;
      var pass = dialog.getElement().querySelector('[name="pass"]').value;
      localStorage.setItem('github.credentials', JSON.stringify({
        username: user,
        password: pass,
        auth: "basic"
      }));
      cb(this.createGitHub());
    }, this));

    dialog.show();

    // Reset the error message to null, it will be set again if needed
    this.setErrorMessage(null);
  };

  // Make sure we accept any kind of URLs.
  goog.events.listen(workspace, sync.api.Workspace.EventType.BEFORE_EDITOR_LOADED, function(e) {

    var url = e.options.url;
    var editor = e.editor;
    if (!isGitHubUrl(url)) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();

    // load the css by now because we will show a styled "Login with Github" button
    loadCss();

    var loadingOptions = e.options;
    loadingOptions.url = normalizeGitHubUrl(url);
    var fileLocation = getFileLocation(loadingOptions.url);

    // Remove the localStorage info if they are empty values (username == '') To make sure the login dialog is displayed
    var localStorageCredentials = JSON.parse(localStorage.getItem('github.credentials'));
    if (localStorageCredentials && (localStorageCredentials.username == '' || localStorageCredentials.password == '')) {
      localStorage.removeItem('github.credentials');
    }

    // Send the access token to the server to synchronize
    if (localStorageCredentials && localStorageCredentials.token) {
      syncTokenWithServer(localStorageCredentials.token);
    }

    var loginManager = new GitHubLoginManager();
    var github = loginManager.createGitHub();

    if (github) {
      loadDocument(github);
    } else {
      getGithubClientIdOrToken(goog.bind(function (err, credentials) {
        if (err) {
          // Clear the oauth props so we won't show the login with github button (The github oauth flow is not available)
          loginManager.setOauthProps(null);
          loginManager.resetCredentials();

          loginManager.getCredentials(loadDocument);
        } else {
          // Got the access token, we can load the document
          if (credentials.error) {
            errorReporter.showError('Github Error', 'Error description: "Github Oauth Flow: ' + credentials.error + '"<br />Please contact <a href="mailto:support@oxygenxml.com">support@oxygenxml.com</a>');
          } else if (credentials.accessToken) {
            localStorage.setItem('github.credentials', JSON.stringify({
              token: credentials.accessToken,
              auth: "oauth"
            }));

            loginManager.setOauthProps(credentials.clientId, credentials.state);
            loadDocument(loginManager.createGitHub());
          } else {
            // Login with user and pass
            loginManager.setOauthProps(credentials.clientId, credentials.state);
            loginManager.getCredentials(loadDocument);
          }
        }
      }, this));
    }

    /**
     * Loads the document
     *
     * @param {Object} github The github api object
     */
    function loadDocument(github) {
      var repo = github.getRepo(fileLocation.user, fileLocation.repo);
      // Read the content using the GitHub API.
      repo.read(fileLocation.branch, fileLocation.filePath, goog.bind(function(err, content) {
        if (err) {
          if (err.error == 401) {
            loginManager.setErrorMessage('Wrong username or password');
          } else if (err == 'not found') {
            loginManager.setErrorMessage('The requested file was not found');
          }

          // Try to authenticate again.
          loginManager.resetCredentials();
          loginManager.getCredentials(loadDocument);
          return;
        }

        // Load the retrieved content in the editor.
        loadingOptions.content = content;
        editor.load(loadingOptions);

        goog.events.listenOnce(editor, sync.api.Editor.EventTypes.ACTIONS_LOADED, function(e) {
          var githubToolbarButton = goog.dom.createDom('div', {
            id: 'github-toolbar-button'
          }, 'Github');

          var commitAction = new CommitAction(editor, github, fileLocation);
          commitAction.setGithubToolbarButton(githubToolbarButton);

          // Add the github commit and logout actions to the main toolbar
          var commitActionId = installCommitAction(editor, commitAction);
          var logOutActionId = installLogoutAction(editor, new LogOutAction());

          addToolbarToBuiltinToolbar(e.actionsConfiguration, {
            type: "list",
            iconDom: githubToolbarButton,
            name: "GitHub",
            children: [
              {id: commitActionId, type: "action"},
              {id: logOutActionId, type: "action"}
            ]
          });
        });
      }, this));
    }
  }, true);

  /**
   * Sends the token to the server to synchronize
   * @param {String} accessToken The Github access token
   */
  function syncTokenWithServer(accessToken) {
    var xhrRequest = new XMLHttpRequest();
    xhrRequest.open('POST', '../plugins-dispatcher/github-oauth/github_sync_token/', true);
    xhrRequest.send(JSON.stringify({accessToken: accessToken}));
  }

  /**
   * Gets the github access token or client_id
   *
   * @param {function(err: Object, credentials: {accessToken: String, clientId: String, state: String, error: String})} callback The method to call on result
   */
  function getGithubClientIdOrToken(callback) {
    var xhrRequest = new XMLHttpRequest();

    xhrRequest.open('POST', '../plugins-dispatcher/github-oauth/github_credentials/', true);

    xhrRequest.onreadystatechange = function () {
      if (xhrRequest.readyState == 4 && xhrRequest.status == 200) {
        var response = JSON.parse(xhrRequest.responseText);

        callback(null, {
          accessToken: response.access_token,
          clientId: response.client_id,
          state: response.state,
          error: response.error
        });
      } else if (xhrRequest.readyState == 4) {
        callback({message: "OAuth client_id or access_token are nota available"}, null);
      }
    };

    // Send the current url. It will be needed to redirect back to this page
    xhrRequest.send(JSON.stringify({redirectTo: window.location.href}));
  }

  /**
   * Clears the github credentials from the client and from the server
    */
  function clearGithubCredentials() {
    localStorage.removeItem('github.credentials');

    var xhrRequest = new XMLHttpRequest();
    xhrRequest.open('POST', '../plugins-dispatcher/github-oauth/github_reset_access/', true);
    xhrRequest.send();
  }

  /**
   * Returns an object representing the file location
   * @param {string} url The url of the file.
   * @returns {object} The file location descriptor
   */
  function getFileLocation(url) {
    // Retrieve the repo details.
    var parser = document.createElement('a');
    parser.href = url.replace(/^[^:]*:/, 'http:');
    var pathSplit = parser.pathname.split("/");

    // In some browsers, the pathname starts with a "/".
    if (pathSplit[0] === "") {
      pathSplit = pathSplit.slice(1);
    }

    return {
      user: pathSplit[0],
      repo: pathSplit[1],
      branch: pathSplit[2],
      filePath: pathSplit.slice(3).join("/")
    };
  }

  /**
   * Adds a toolbar to the builtin toolbar
   *
   * @param {object} actionsConfig Configuration object
   * @param {object} toolbarToAdd The description of the toolbar to add
   */
  function addToolbarToBuiltinToolbar(actionsConfig, toolbarToAdd) {
    var builtinToolbar = null;
    if (actionsConfig.toolbars) {
      for (var i = 0; i < actionsConfig.toolbars.length; i++) {
        var toolbar = actionsConfig.toolbars[i];
        if (toolbar.name == "Builtin") {
          builtinToolbar = toolbar;
          break;
        }
      }
    }

    if (builtinToolbar) {
      builtinToolbar.children.push(toolbarToAdd);
    }
  }

  /**
   * Installs the Commit action in the toolbar.
   *
   * @param {sync.api.Editor} editor The editor
   * @param {sync.actions.AbstractAction} commitAction The commit-to-github action.
   * @returns {string}
   */
  function installCommitAction(editor, commitAction) {
    // Disable the Ctrl+S shortcut.
    var noopAction = new sync.actions.NoopAction('M1 S');
    editor.getActionsManager().registerAction('DoNothing', noopAction);

    // Remove the save action from the toolbar
    editor.getActionsManager().unregisterAction('Author/Save');

    var actionId = 'Github/Commit';
    editor.getActionsManager().registerAction(actionId, commitAction);

    return actionId;
  }

  /**
   * Installs the logout acion in the toolnar
   * @param {sync.api.Editor} editor The editor
   * @param {sync.actions.AbstractAction} logoutAction The logout action
   * @returns {string}
   */
  function installLogoutAction(editor, logoutAction) {
    var actionId = 'Github/Logout';

    editor.getActionsManager().registerAction(actionId, logoutAction);
    return actionId;
  }

  /**
   * Changes to github url to a "github protocol" url
   * @param {string} url The URL
   * @returns {string} The normalized URL.
   */
  function normalizeGitHubUrl(url) {
    return url.replace("https", "github")
        .replace("http", "github")
        .replace("blob/", "")
        .replace("www.github.com", "getFileContent")
        .replace("github.com", "getFileContent")
        .replace("raw.githubusercontent.com", "getFileContent");
  }

  /**
   * Checks whether the url points to a github resource
   * @param {string} url The URL to check
   * @returns {boolean} true if the url points to a github resource
   */
  function isGitHubUrl(url) {
    return url.indexOf('github.com') != -1 || url.indexOf('raw.githubusercontent.com') != -1;
  }
}());
