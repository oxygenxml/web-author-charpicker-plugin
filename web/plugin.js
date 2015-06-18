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
    parser.href = url;
    var pathSplit = parser.pathname.split("/");
    this.user = pathSplit[1];
    this.repo = pathSplit[2];
    this.branch = pathSplit[4];
    this.filePath = pathSplit.slice(5).join("/");
    console.log(pathSplit, this);
    this.dialog = null;
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
      fileName: fileName,
      $callback: function(code, req, content) {
        cb(content);
      }
    });
  };

  /** @override */
  CommitAction.prototype.getLargeIcon = function(opt_dpi) {
    // TODO: Make it use the GitHub icon.
    return 'images/gui/Save24_light' + (opt_dpi == 2 ? '@2x' : '') + '.png';
  };

  /** @override */
  CommitAction.prototype.getDescription = function() {
    return "Commit on GitHub";
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
      var dialogHtml = '<div><label>User Name: <input style="width:100%" name="user" type="text"></label></div>';
      dialogHtml += '<div><label>Password: <input style="width:100%" name="pass" type="password"></label></div>';
      dialogHtml += '<div><label>Commit Message: <textarea style="width:100%" name="message"></textarea></label></div>';
      dialogHtml += '<div><label>Create new branch (optional):<input style="width:100%" name="branch" type="text"></label></div>';
      this.dialog.getElement().innerHTML = dialogHtml;
    }
    return this.dialog;
  };


  /**
   * Tries to commit if all the details needed for a commit were gathered.
   *
   * @param {Github} github The github access object.
   * @param {object} ctx The context of this commit.
   * @param {function} cb Called after the commit was attempted.
   */
  CommitAction.prototype.tryCommit = function(github, ctx, cb) {
    if (ctx.branchExists && ctx.hasOwnProperty('sha') && ctx.hasOwnProperty('content')) {
      github.request("PUT", '/repos/' + this.user + '/' + this.repo + '/contents/' + encodeURIComponent(this.filePath), {
        message: ctx.message,
        content: btoa(ctx.content),
        branch: ctx.branch,
        sha: ctx.sha
      }, cb);
    }
  };

  /**
   * Perform the actual commit.
   *
   * @param {function()} cb Callback after the commit is performed.
   * @param {object} ctx The context of the commit.
   */
  CommitAction.prototype.performCommit = function(ctx, cb) {
    var github = new Github({
      username: ctx.username,
      password: ctx.password,
      auth: "basic"
    });
    var repo = github.getRepo(this.user, this.repo);

    // Obtain the SHA of the current file.
    repo.getSha(this.branch, encodeURIComponent(this.filePath), goog.bind(function(err, sha) {
      ctx.sha = sha;
      this.tryCommit(github, ctx, cb);
    }, this));

    // Obtain the content of the current file.
    this.getContent(goog.bind(function(content) {
      ctx.content = content;
      this.tryCommit(github, ctx, cb);
    }, this));

    // Create the branch if it does not exist.
    if (ctx.branch != this.branch) {
      repo.branch(this.branch, ctx.branch, goog.bind(function() {
        ctx.branchExists = true;
        this.tryCommit(github, ctx, cb);
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
   * @override
   */
  CommitAction.prototype.actionPerformed = function(cb) {
    var dialog = this.getDialog();
    dialog.onSelect(goog.bind(this.detailsProvided, this, cb));
    dialog.show();
  };

  /** @override */
  CommitAction.prototype.getDescription = function() {
    return "Commit on GitHub";
  };

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
