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
  LogOutAction.prototype.actionPerformed = function(cb) {
    this.dialog = this.getDialog();

    this.dialog.onSelect(goog.bind(function (actionName, e) {
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

    this.repo = github.getRepo(fileLocation.user, fileLocation.repo);
    this.branch = fileLocation.branch;
    this.filePath = fileLocation.filePath;

    this.dialog = null;
    this.iconWrapper = null;

    this.status = 'none';
    this.statusElement = null;
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

  /** @override */
  CommitAction.prototype.renderLargeIcon = function() {
    this.statusElement = goog.dom.createDom('div', ['github-status', 'github-status-none']);
    this.iconWrapper = goog.dom.createDom('div', 'github-icon-wrapper',
      goog.dom.createDom('div', 'github-icon-octocat-large'),
      this.statusElement);
    return this.iconWrapper;
  };

  /** @override */
  CommitAction.prototype.renderSmallIcon = function() {
    this.statusElement = goog.dom.createDom('div', ['github-status', 'github-status-none']);
    this.iconWrapper = goog.dom.createDom('div', 'github-icon-wrapper',
        goog.dom.createDom('div', 'github-icon-octocat-small'),
        this.statusElement);
    return this.iconWrapper;
  };


  /** @override */
  CommitAction.prototype.getDisplayName = function() {
    return "Commit on Github";
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
      dialogHtml += '<div><label>Create new branch (optional):<input class="github-input" name="branch" type="text"></label></div>';
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
      this.repo.branch(this.branch, ctx.branch, goog.bind(function(err) {
        var ok = !err;
        if (err && err.error === 422 && err.request.responseText.indexOf("Reference already exists") !== -1) {
          // The branch already exists, so we can commit on it.
          ok = true;
        }
        if (ok) {
          this.branch = ctx.branch;
          ctx.branchExists = true;
          this.tryCommit(ctx, cb);
        } else {
          cb(err);
        }
      }, this));
    } else {
      ctx.branchExists = true;
    }
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
        goog.bind(this.setStatus, this, 'none'), 4000);
      errorReporter.showError('Commit status', 'Commit successful!');
    } else {
      this.setStatus('none');
      var msg = 'Commit failed!';
      if (err.error == 401) {
        msg = 'Not authorized';

        // Clear the github credentials to make sure the login dialog is shown when the page is refreshed
        clearGithubCredentials();
      } else if (err.error == 404) {
        // Not allowed to commit, or the repository does not exist.
        msg = 'Commit not allowed';
      } else if (err.error == 422) {
        msg = JSON.parse(err.request.responseText).message;
      } else if (err.error === 409) {
        msg = 'Conflict: ' + JSON.parse(err.request.responseText).message;
      }
      errorReporter.showError('Commit Error', msg);
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
    goog.dom.classlist.remove(this.statusElement, 'github-status-' + this.status);
    goog.dom.classlist.add(this.statusElement, 'github-status-' + status);
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
   * Loads the github-specific CSS.
   */
  function loadCss() {
    var url = "../plugins-dispatcher/github-resources/web/static/github.css";
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
  };

  /**
   * Creates the login dialog.
   */
  GitHubLoginManager.prototype.getLoginDialog = function() {
    if (!this.loginDialog) {
      this.loginDialog = workspace.createDialog();
      this.loginDialog.setButtonConfiguration(sync.api.Dialog.ButtonConfiguration.OK);

      var dialogHtml = '<div class="github-login-dialog">';
      dialogHtml += '<div class="error"></div>';
      dialogHtml += '<div><label class="github-input">User Name: <input name="user" type="text"></label></div>';
      dialogHtml += '<div><label class="github-input">Password: <input name="pass" type="password"></label></div>';

      if (this.oauthProps.oauthUrl) {
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
    // To commit changes we need the scope 'public_repo'
    var scopes = 'public_repo';
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
  };

  // Make sure we accept any kind of URLs.
  goog.events.listen(workspace, sync.api.Workspace.EventType.BEFORE_EDITOR_LOADED, function(e) {

    var url = e.options.url;
    var editor = e.editor;
    if (!isGitHubUrl(url)) {
      return;
    }

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

    var loginManager = new GitHubLoginManager();
    var github = loginManager.createGitHub();

    if (github) {
      loadDocument(github);
    } else {
      getGithubClientIdOrToken(goog.bind(function (err, credentials) {
        if (err) {
          console.log('OAuth not available. ' + err.message);
          // Clear the oauth props so we won't show the login with github button (The github oauth flow servlet is not available)
          loginManager.setOauthProps(null);
          loginManager.resetCredentials();

          loginManager.getCredentials(loadDocument);
        } else {
          // Got the access token, we can load the document
          if (credentials.accessToken) {
            localStorage.setItem('github.credentials', JSON.stringify({
              token: credentials.accessToken,
              auth: "oauth"
            }));
            loadDocument(loginManager.createGitHub());
          } else if (credentials.error) {
            errorReporter.showError('Github Error', 'Error description: "Github Oauth Flow: ' + credentials.error + '"<br />Please contact <a href="mailto:support@oxygenxml.com">support@oxygenxml.com</a>');
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
     * @param {Object} github
     */
    function loadDocument(github) {
      var repo = github.getRepo(fileLocation.user, fileLocation.repo);
      // Read the content using the GitHub API.
      repo.read(fileLocation.branch, fileLocation.filePath, goog.bind(function(err, content) {
        if (err) {
          // Try to authenticate again.
          loginManager.resetCredentials();
          loginManager.getCredentials(loadDocument);
          return;
        }

        // Load the retrieved content in the editor.
        loadingOptions.content = content;
        editor.load(loadingOptions);

        goog.events.listenOnce(editor, sync.api.Editor.EventTypes.ACTIONS_LOADED, function(e) {
          // Add the github commit and logout actions to the main toolbar
          var commitActionId = installCommitAction(editor, new CommitAction(editor, github, fileLocation));
          var logOutActionId = installLogoutAction(editor, new LogOutAction());

          addToolbarToBuiltinToolbar(e.actionsConfiguration, {
            type: "list",
            name: "GitHub",
            children: [
              {id: commitActionId, type: "action"},
              {id: logOutActionId, type: "action"}
            ]
          });
        });
      }, this));
    }
  });

  /**
   * Gets the github access token or client_id
   *
   * @param {function(err: Object, credentials: {accessToken: String, clientId: String, state: String, error: String})} callback The method to call on result
   */
  function getGithubClientIdOrToken(callback) { //here
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
        console.log('Error retrieving github credentials', xhrRequest.responseText);
        callback({message: xhrRequest.responseText}, null);
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
    return {
      user: pathSplit[1],
      repo: pathSplit[2],
      branch: pathSplit[3],
      filePath: pathSplit.slice(4).join("/")
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
   * Normalize the github URL to point to the raw content.
   * @param {string} url The URL
   * @returns {string} The normalized URL.
   */
  function normalizeGitHubUrl(url) {
    return url.replace("blob/", "").replace("github.com", "raw.githubusercontent.com");
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
