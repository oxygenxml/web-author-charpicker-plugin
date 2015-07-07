(function(){
  /**
   *
   * @constructor
   */
  var GitHubErrorReporter = function() {
    this.errDialog = null;
  };

  GitHubErrorReporter.prototype.showError = function(title, bodyHtml) {
    var dialog = this.getErrorDialog();
    dialog.setTitle('Commit Error');
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
      goog.dom.createDom('div', 'github-icon-octocat'),
      this.statusElement);
    return this.iconWrapper;
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
      this.setStatus('success');
      this.statusTimeout = setTimeout(
        goog.bind(this.setStatus, this, 'none'), 4000);
    } else {
      this.setStatus('none');
      var msg = 'Commit failed!';
      if (err.error == 401) {
        msg = 'Invalid user name or password';
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
      dialogHtml += '<div><label>User Name: <input class="github-input" name="user" type="text"></label></div>';
      dialogHtml += '<div><label>Password: <input class="github-input" name="pass" type="password"></label></div>';
      this.loginDialog.getElement().innerHTML = dialogHtml;
      this.loginDialog.setTitle("GitHub Login");
    }
    return this.loginDialog;
  };

  /**
   * Creates a github access object form the user and password.
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
    var loadingOptions = e.options;
    loadingOptions.url = normalizeGitHubUrl(url);
    var fileLocation = getFileLocation(loadingOptions.url);
    e.preventDefault();

    var loginManager = new GitHubLoginManager();
    function loadDocument(github) {
      var repo = github.getRepo(fileLocation.user, fileLocation.repo);
      // Read the content using the GitHub API.
      repo.read(fileLocation.branch, fileLocation.filePath, function(err, content) {
        if (err) {
          // Try to authenticate again.
          loginManager.resetCredentials();
          loginManager.getCredentials(loadDocument);
          return;
        }
        // Load the retrieved content in the editor.
        loadingOptions.content = content;
        editor.load(loadingOptions);
        goog.events.listenOnce(editor, sync.api.Editor.EventTypes.ACTIONS_LOADED, function() {
          loadCss();
          installCommitAction(editor, new CommitAction(editor, github, fileLocation));
        });
      });
    }
    loginManager.getCredentials(loadDocument);
  });

  // Returns an object representing the file location.
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

  // Installs the Commit action in the toolbar.
  function installCommitAction(editor, commitAction) {
    // Disable the Ctrl+S shortcut.
    var noopAction = new sync.actions.NoopAction('M1 S');
    editor.getActionsManager().registerAction('DoNothing', noopAction);
    // Replace the save action with a Commit action.
    editor.getActionsManager().registerAction('Author/Save', commitAction);
  }

  // Normalize the github URL to point to the raw content.
  function normalizeGitHubUrl(url) {
    return url.replace("blob/", "").replace("github.com", "raw.githubusercontent.com");
  }

  // Checks whether the url points to a github resource.
  function isGitHubUrl(url) {
    return url.indexOf('github.com') != -1 || url.indexOf('raw.githubusercontent.com') != -1;
  }
}());
