(function(){
  /**
   *
   * @constructor
   */
  var GitHubErrorReporter = function() {
    this.errDialog = null;
  };

  var COMMIT_STATUS_TITLE = 'Commit status';

  /**
   * Shows an error dialog.
   * @param {string} title The title of the dialog.
   * @param {string} bodyHtml The HTML content of the dialog.
   * @param {string|object[]} buttonConfiguration The button configuration
   */
  GitHubErrorReporter.prototype.showError = function(title, bodyHtml, buttonConfiguration) {
    var dialog = this.getErrorDialog(buttonConfiguration);
    dialog.setTitle(title);
    dialog.getElement().innerHTML = bodyHtml;
    dialog.show();
  };

  /**
   * Hides the error dialog
   */
  GitHubErrorReporter.prototype.hide = function () {
    this.errDialog.hide();
  };

  /**
   * Create and return the commit error dialog.
   *
   * @param {Object} buttonConfiguration The button configuration
   * @return {sync.api.Dialog} The error message dialog.
   */
  GitHubErrorReporter.prototype.getErrorDialog = function(buttonConfiguration) {
    if (!this.errDialog) {
      this.errDialog = workspace.createDialog();
    }
    this.errDialog.setButtonConfiguration(buttonConfiguration);
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
    }

    // Update the innerHTML every time because it depends on this.branch which might change
    this.dialog.setTitle('Commit on GitHub');

    var dialogHtml = '<div class="github-commit-dialog">';
    dialogHtml += '<div><label>Commit Message: <textarea class="github-input" name="message" autofocus="autofocus"></textarea></label></div>';
    dialogHtml += '<div><label>Commit on branch:<input class="github-input" name="branch" type="text" value="' + this.branch + '"/></label></div>';
    dialogHtml += '</div>';
    var el = this.dialog.getElement();
    el.innerHTML = dialogHtml;

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
    var self = this;
    if (ctx.branchExists && ctx.hasOwnProperty('content')) {

      // If this is a new branch or the document branch
      if (!ctx.branchAlreadyExists) {
        this.getLatestSha_(ctx.branch, self.repo, function (err, latestSha) {
          if (err) {return cb(err);}
          if (latestSha === documentSha) {
            self.repo.commitToHead(ctx.branch, self.filePath, ctx.content, ctx.message, function(err, commit) {
              if (!err) {
                // Have committed, we save the document sha and head for the next commits
                // The document is now on the committed branch
                documentSha = commit.sha;
                self.branch = commit.branch;
              }
              cb(err);
            });
          } else {
            self.startCommit_(self.repo, ctx, cb);
          }
        });
      } else {
        // Committing on a different branch is an action which the user has to confirm
        // Getting the head so we can show the user a diff, so he can make an informed decision
        self.startCommit_(self.repo, ctx, cb);
      }
    }
  };

  /**
   * Starts a commit defined by the given context
   * @param {Github.Repository} repo The repo to commit on
   * @param {{branch: string, message: string, content: string}} ctx The commit context
   * @param {function} cb The method to call on result
   * @private
   */
  CommitAction.prototype.startCommit_ = function (repo, ctx, cb) {
    var self = this;
    repo.getHead(ctx.branch, function (err, head) {
      if (err) {return cb(err);}
      repo.createCommit(ctx.branch, self.filePath, ctx.content, ctx.message, function (err, commit) {
        repo.compare(head.sha, commit.sha, function (err, diff) {
          if (err) {return cb(err);}
          cb({error: 409, message: 'The file you want to commit has been edited since you opened it.', diff: diff, commit: commit});
        });
      });
    });
  };

  /**
   * Finalizes a commit (updates the document to the new head of the given commit)
   * @param {Github.Repository} repo The repository on which this commit was pushed
   * @param {string} branch The branch this commit was on
   * @param {object} err The commit error
   * @param {{sha: string, head: object, branch: string}} commitResult The commitResult
   * @private
   */
  CommitAction.prototype.finalizeCommit_ = function (repo, branch, err, commitResult) {
    var self = this;
    if (!err) {
      // Have committed, we save the document sha and head for the next commits
      // The document is now on the commited branch
      documentSha = commitResult.sha;
      this.branch = branch;
      this.repo = repo;

      Github.apiRequest('GET', commitResult.head.url, null, function (err, response) {
        var msg;
        if (err) {
          msg = 'Commit successful on branch ' + branch;
        } else {
          msg = 'Commit successful on branch <a target="_blank" href="' + response.html_url + '">' + branch + '</a>';
        }
        self.setStatus('success');
        errorReporter.showError('Commit result', msg, sync.api.Dialog.ButtonConfiguration.OK);
      });
    } else {
      this.setStatus('none');
      errorReporter.showError(COMMIT_STATUS_TITLE, 'Commit failed', sync.api.Dialog.ButtonConfiguration.OK);
    }
  };

  /**
   * Gets the latest sha for the current file
   * @param {string} branch The branch on which we'll make the request
   * @param {Github.Repository} repo The repository on which to check
   * @param {function} cb The method to call on result
   * @private
   */
  CommitAction.prototype.getLatestSha_ = function (branch, repo, cb) {
    repo.getContents(branch, this.filePath, function (err, file) {
      if (err) {return cb(err);}
      cb(null, file.sha)
    });
  };

  /**
   * Perform the actual commit.
   *
   * @param {function(object,object=)} cb Callback after the commit is performed.
   * @param {object} ctx The context of the commit.
   */
  CommitAction.prototype.performCommit = function(ctx, cb) {
    var self = this;
    this.setStatus('loading');

    // Obtain the content of the current file.
    this.getContent(goog.bind(function(err, content) {
      ctx.content = content;
      this.tryCommit(ctx, cb);
    }, this));

    // Create the branch if it does not exist.
    if (ctx.branch && ctx.branch !== this.branch) {
      ctx.branchExists = false;
      this.createBranch_(self.repo, ctx, function (err) {
        if (!err) {
          self.branch = ctx.branch;
          ctx.branchExists = true;
          self.tryCommit(ctx, cb);
        } else{
          ctx.branchExists = false;
          cb(err);
        }
      });
    } else {
      ctx.branchExists = true;
    }
  };

  /**
   * Creates a new branch
   * @param {Github.Repository} repo The repository on which to create a new branch
   * @param {object} ctx The context of the commit
   * @param {function(object)} cb The method to call on result
   * @private
   */
  CommitAction.prototype.createBranch_ = function (repo, ctx, cb) {
    repo.branch(this.branch, ctx.branch, goog.bind(function(err) {
      err = this.getBranchingError_(err, ctx);
      if (err && err.error === 404) {
        // Maybe this was a commit ref instead of a branch ref. Let's try.
        repo.createRef({
          "ref": "refs/heads/" + ctx.branch,
          "sha": this.branch
        }, goog.bind(function(err) {
          err = this.getBranchingError_(err, ctx);
          cb(err);
        }, this));
      } else {
        cb(err);
      }
    }, this));
  };

  /**
   * Function that returns the error object that occurred during branch creation.
   * @param {object<{err: number, request: object}>} err
   * @param {object} ctx The context of the commit
   * @returns {object} The error object or null
   * @private
   */
  CommitAction.prototype.getBranchingError_ = function(err, ctx) {
    if (err) {
      if (err.error === 422 && err.request.responseText.indexOf("Reference already exists") !== -1) {
        // The branch already exists, so we can commit on it.
        err = null;
        ctx.branchAlreadyExists = true;
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
      var el = this.dialog.getElement();
      ctx = {
        message: el.querySelector('[name="message"]').value,
        branch: el.querySelector('[name="branch"]').value
      };

      // A branch must be provided!
      if (!ctx.branch) {
        ctx.branch = this.branch;
      }

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
      errorReporter.showError(COMMIT_STATUS_TITLE, '<span id="github-commit-success-indicator">Commit successful!</span>', sync.api.Dialog.ButtonConfiguration.OK);
    } else {
      this.handleErrors(err);
    }
    cb();
  };

  /**
   * Final destination for errors
   * @param {object} err The error to handle
   * @param {Github.Repository} repo The repository on which the error occured
   */
  CommitAction.prototype.handleErrors = function (err, repo) {
    this.setStatus('none');

    var msg = 'Commit failed!';

    if (err.error == 404) {
      // Not allowed to commit, or the repository does not exist.
      msg = "You do not have rights to commit in the current repository. <br/>Do you want to commit on your own copy of this repository?";

      errorReporter.showError('Commit Error', msg, sync.api.Dialog.ButtonConfiguration.YES_NO);

      var self = this;
      errorReporter.errDialog.dialog.listenOnce(goog.ui.Dialog.EventType.SELECT, function (e) {
        self.forkAndCommit(e);
      });
      return;
    } else if (err.error == 409) {
      var commitDialog =
          '<div id="gh-commit-diag-content">' +
            '<div>The commit may have conflicts. Click <a target="_blank" href = "' + err.diff.permalink_url + '">here</a> to see the changes. Afterwards, pick one of the following:</div>' +
            '<div id="createFork" class="gh-commit-diag-choice gh-default-choice">' +
              '<span class="gh-commit-diag-icon gh-commit-fresh"></span>' +
              '<div class="gh-commit-diag-title">Commit on a fresh branch</div>' +
              '<div class="gh-commit-diag-descripion">Create a branch containing your version of the document. Later on, you can merge back the branch, after you solve the conflicts.</div>' +
            '</div>' +
            '<div id="commitAnyway" class="gh-commit-diag-choice">' +
              '<span class="gh-commit-diag-icon gh-commit-overwrite"></span>' +
              '<div class="gh-commit-diag-title">Commit anyway</div>' +
              '<div class="gh-commit-diag-descripion">If the changes are not in conflict or if you want to overwrite the changes, you can commit anyway.</div>' +
            '</div>' +
            '<div id="cancel" class="gh-commit-diag-choice">' +
              '<span class="gh-commit-diag-icon gh-commit-cancel"></span>' +
              '<div class="gh-commit-diag-title">Cancel</div>' +
              '<div class="gh-commit-diag-descripion">Cancel the current commit operation. Your changes won\'t be committed to the repository.</div>' +
            '</div>' +
          '</div>';

      errorReporter.showError(COMMIT_STATUS_TITLE, commitDialog);

      var choices = document.querySelectorAll('#gh-commit-diag-content > .gh-commit-diag-choice');
      for (var i = 0; i < choices.length; i++) {
        choices[i].addEventListener('click', goog.bind(this.handleCommitIsNotAFastForward, this, err.commit, choices[i].getAttribute('id'), repo));
      }

      return;
    } else if (err.error == 401) {
      msg = 'Not authorized';

      // Clear the github credentials to make sure the login dialog is shown when the page is refreshed
      clearGithubCredentials();
    } else if (err.error == 422) {
      var response = JSON.parse(err.request.responseText);
      msg = response.message;
    }

    errorReporter.showError('Commit Error', msg, sync.api.Dialog.ButtonConfiguration.OK);
  };

  /**
   * Handle the situation when a user commits to a repository and someone else has committed in the meantime as well
   * @param {{blobSha: string, sha: string, branch: string}} commit The commit which failed and the user can choose
   *        what to do with it
   * @param {string} elementId The id of the clicked element
   * @param {object} opt_repo The repo on which to commit
   * @param {goog.ui.Dialog.Event} event The triggering event
   */
  CommitAction.prototype.handleCommitIsNotAFastForward = function (commit, elementId, opt_repo, event) {
    var self = this;
    var repo = opt_repo ? opt_repo : self.repo;

    switch (elementId) {
    case 'createFork':
      errorReporter.hide();
      self.setStatus('loading');
      self.ctx.branch = 'oxygen-webapp-' + Date.now();
      self.createBranch_(repo, self.ctx, function (err) {
        if (!err) {
          repo.updateCommit(commit, self.ctx.branch, goog.bind(self.finalizeCommit_, self, repo, self.ctx.branch));
        } else {
          self.setStatus('none');
          errorReporter.showError(COMMIT_STATUS_TITLE, 'Could not create a new branch', sync.api.Dialog.ButtonConfiguration.OK);
        }
      });
      break;
    case 'commitAnyway':
      errorReporter.hide();
      self.setStatus('loading');
      repo.updateCommit(commit, self.branch, goog.bind(self.finalizeCommit_, self, repo, self.branch));
      break;
    case 'cancel':
      errorReporter.hide();
      break;
    }
  };

  /**
   * Called to fork the current github working repository and commit the working document to the fork
   * @param {goog.ui.Dialog.Event} event The triggering event
   */
  CommitAction.prototype.forkAndCommit = function (event) {
    var self = this;

    if (event.key == 'yes') {
      // Set to show the spinning loading
      self.setStatus('loading');

      self.repo.fork(function (_, result) {
        var repoName = result.name;
        var owner = result.owner.login;
        var forkedRepo = self.github.getRepo(owner, repoName);

        if (self.ctx && self.ctx.branchExists) {
          self.commitToForkedRepo_(forkedRepo, self.handleErrors);
        } else {
          forkedRepo.branch(self.branch, self.ctx.branch, function(err) {
            var message = 'Could not commit to fork!';
            var ok = true;

            err = self.getBranchingError_(err, self.ctx);
            if (err && err.error === 404) {
              // Maybe this was a commit ref instead of a branch ref. Let's try.
              forkedRepo.createRef({
                "ref": "refs/heads/" + ctx.branch,
                "sha": self.branch
              }, function(err) {
                err = self.getBranchingError_(err, self.ctx);
                if (err) {
                  self.setStatus('none');
                  errorReporter.showError(COMMIT_STATUS_TITLE, message, sync.api.Dialog.ButtonConfiguration.OK);
                } else {
                  self.commitToForkedRepo_(forkedRepo, self.handleErrors);
                }
              });
            } else if (err && err.error === 422) {
              message = 'Invalid branch name';
              ok = false;
            } else if (err) {
              ok = false;
            } else {
              self.commitToForkedRepo_(forkedRepo, self.handleErrors);
            }

            if (!ok) {
              self.setStatus('none');
              errorReporter.showError(COMMIT_STATUS_TITLE, message, sync.api.Dialog.ButtonConfiguration.OK);
            }
          });
        }
      });
    }
  };

  /**
   * Writes the current file to the chosen branch
   * @param {Github.Repository} repo The repo to write on
   * @private
   */
  CommitAction.prototype.commitToForkedRepo_ = function (repo) {
    var self = this;
    self.getLatestSha_(self.ctx.branch, repo, function (err, latestSha) {
      if (err) {return cb(err);}
      if (latestSha === documentSha) {
        repo.commitToHead(self.ctx.branch, self.filePath, self.ctx.content, self.ctx.message, function(err, commit) {
          var msg;
          if (err && err.error == 404) {
            self.setStatus('none');
            msg = "Repository not found"
          } else if (err) {
            self.setStatus('none');
            msg = 'Error';
          } else {
            documentSha = commit.sha;
            // Set our working branch to the new branch (The opened document is now on the new branch)
            self.branch = commit.branch;

            // The active repo is the forked repo
            self.repo = repo;

            Github.apiRequest('GET', commit.head.url, null, function (err, response) {
              var msg;
              if (err) {
                msg = 'Commit successful on branch ' + self.ctx.branch;
              } else {
                msg = 'Commit successful on branch <a target="_blank" href="' + response.html_url + '">' + self.ctx.branch + '</a>';
              }
              self.setStatus('success');
              errorReporter.showError('Commit result', msg, sync.api.Dialog.ButtonConfiguration.OK);
            });

            return;
          }

          errorReporter.showError(COMMIT_STATUS_TITLE, msg, sync.api.Dialog.ButtonConfiguration.OK);
        });
      } else {
        self.startCommit_(repo, self.ctx, function (err) {
          self.handleErrors(err, repo);
        });
      }
    });
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
      this.githubToolbarButton.innerHTML = 'GitHub';
    }

    goog.dom.classlist.remove(this.githubToolbarButton, this.status);
    goog.dom.classlist.add(this.githubToolbarButton, status);
    this.status = status;

    if (status == 'success') {
      this.statusTimeout = setTimeout(
          goog.bind(this.setStatus, this, 'none'), 3200);
    }
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
    if (!this.loginDialog) {
      this.loginDialog = workspace.createDialog();
      this.loginDialog.setButtonConfiguration(sync.api.Dialog.ButtonConfiguration.OK);

      var dialogHtml = '<div class="github-login-dialog">';

      dialogHtml += '<div class="github-login-dialog-error">' + this.errorMessage + '</div>';
      dialogHtml += '<div><label class="github-input">User Name: <input autofocus="autofocus" tabindex="0" name="user" type="text"></label></div>';
      dialogHtml += '<div><label class="github-input">Password: <input tabindex="0" name="pass" type="password"></label></div>';

      if (this.oauthProps && this.oauthProps.oauthUrl) {
        dialogHtml += '<div class="github-login-center-aligned">or</div>';
        dialogHtml += '<a href="' + this.oauthProps.oauthUrl + '" id="github-oauth-button"><span class="github-icon-octocat-large"></span><span class="github-oauth-text">Login with GitHub</span></a>';
      }

      this.loginDialog.getElement().innerHTML = dialogHtml;
      this.loginDialog.setTitle("GitHub Login");
    }

    var errorMessageElement = this.loginDialog.getElement().querySelector('.github-login-dialog-error');
    if (this.errorMessage) {
      errorMessageElement.innerHTML = this.errorMessage;
      errorMessageElement.style.display = 'block';
    } else {
      errorMessageElement.style.display = 'none';
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

  /**
   * The github sha of the opened document
   */
  var documentSha;

  /**
   * An object describing the location of the opened document (filePath, branch. user, repo)
   */
  var fileLocation;

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
    fileLocation = getFileLocation(loadingOptions.url);

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
            errorReporter.showError('GitHub Error', 'Error description: "GitHub Oauth Flow: ' + credentials.error + '"<br />Please contact <a href="mailto:support@oxygenxml.com">support@oxygenxml.com</a>', sync.api.Dialog.ButtonConfiguration.OK);
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
      repo.getContents(fileLocation.branch, fileLocation.filePath, goog.bind(function(err, file) {
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

        documentSha = file.sha;

        var fileContent = sync.util.decodeB64(file.content);

        workspace.setUrlChooser(new sync.api.FileBrowsingDialog({
          initialUrl: loadingOptions.url
        }));

        // Load the retrieved content in the editor.
        loadingOptions.content = fileContent;
        editor.load(loadingOptions);

        goog.events.listenOnce(editor, sync.api.Editor.EventTypes.ACTIONS_LOADED, function(e) {
          var githubToolbarButton = goog.dom.createDom('div', {
            id: 'github-toolbar-button'
          }, 'GitHub');

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
      filePath: pathSplit.slice(3).map(decodeURIComponent).join("/")
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
        .replace("/tree/", "/blob/")
        .replace("/blob/", "/")
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
