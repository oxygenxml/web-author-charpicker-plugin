(function(){
  /**
   * The commit action for GitHub.
   *
   * @param {sync.api.Editor} editor The editor on which this action applies.
   * @param {string} url The url of the github file that is edited.
   *
   * @constructor
   */
  var CommitAction = function(editor, url) {
    this.editor = editor;

    // Retrieve the repo details.
    var parser = document.createElement('a');
    parser.href = url.replace(/^[^:]*:/, 'http:');
    var pathSplit = parser.pathname.split("/");
    this.user = pathSplit[1];
    this.repo = pathSplit[2];
    this.branch = pathSplit[4];
    this.filePath = pathSplit.slice(5).join("/");

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
    // TODO: create some api out of this.
    RESTDocumentManager.downloadXMLContent({
      id: this.editor.docId,
      fileName: 'file.xml',
      $callback: function(code, req, content) {
        cb(content);
      }
    });
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
      dialogHtml += '<div><label>User Name: <input class="github-input" name="user" type="text"></label></div>';
      dialogHtml += '<div><label>Password: <input class="github-input" name="pass" type="password"></label></div>';
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
   * @param {object} repo The github access object.
   * @param {object} ctx The context of this commit.
   * @param {function(object,object=)} cb Called after the commit was attempted with the
   * error and/or success values.
   */
  CommitAction.prototype.tryCommit = function(repo, ctx, cb) {
    console.log('try commit');
    if (ctx.branchExists && ctx.hasOwnProperty('content')) {
      repo.write(this.branch, this.filePath, ctx.content, ctx.message, function(err) {
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

    var github = new Github({
      username: ctx.username,
      password: ctx.password,
      auth: "basic"
    });
    var repo = github.getRepo(this.user, this.repo);

    // Obtain the content of the current file.
    this.getContent(goog.bind(function(content) {
      ctx.content = content;
      this.tryCommit(repo, ctx, cb);
    }, this));

    // Create the branch if it does not exist.
    if (ctx.branch && ctx.branch !== this.branch) {
      repo.branch(this.branch, ctx.branch, goog.bind(function(err) {
        var ok = !err;
        if (err && err.error === 422 && err.request.responseText.indexOf("Reference already exists") !== -1) {
          // The branch already exists, so we can commit on it.
          ok = true;
        }
        if (ok) {
          this.branch = ctx.branch;
          ctx.branchExists = true;
          this.tryCommit(repo, ctx, cb);
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
        username: el.querySelector('[name="user"]').value,
        password: el.querySelector('[name="pass"]').value,
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
      }
      var dialog = this.getCommitErrorDialog();
      dialog.getElement().textContent = msg;
      dialog.show();
    }
    cb();
  };

  /**
   * Create and return the commit error dialog.
   *
   * @return {sync.api.Dialog} The error message dialog.
   */
  CommitAction.prototype.getCommitErrorDialog = function() {
    if (!this.errDialog) {
      this.errDialog = workspace.createDialog();
      this.errDialog.setTitle('Commit Error');
      this.errDialog.setButtonConfiguration(sync.api.Dialog.ButtonConfiguration.OK);
    }
    return this.errDialog;
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
    var link = goog.dom.createDom('link', {
      href: "../plugins-dispatcher/github-resources/web/static/github.css",
      rel: "stylesheet"
    });
    goog.dom.appendChild(document.head, link);
  }

  // Make sure we accept any kind of URLs.
  goog.events.listen(workspace, sync.api.Workspace.EventType.BEFORE_EDITOR_LOADED, function(e) {
    var url = e.options.url;
    var editor = e.editor;

    if (url.indexOf('github.com') != -1 || url.indexOf('raw.githubusercontent.com') != -1) {
      // It is a GitHub URL.
      e.options.url = url.replace("blob/", "").replace("github.com", "raw.githubusercontent.com");

      var actionCreated = false;
      goog.events.listen(editor, sync.api.Editor.EventTypes.ACTIONS_LOADED, function() {
        if (!actionCreated) {
          loadCss();
          actionCreated = true;
          // Disable the Ctrl+S shortcut.
          var noopAction = new sync.actions.NoopAction('M1 S');
          editor.getActionsManager().registerAction('DoNothing', noopAction);
          // Replace the save action with a Commit action.
          editor.getActionsManager().registerAction('Author/Save',
            new CommitAction(editor, url));
        }
      });
    }
  });
}());
