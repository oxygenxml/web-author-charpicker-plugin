(function(){
  // TODO: use a dialog for user & pass
  // TODO: deduce the project name and filename from the url.
  var userName = 'ctalau-oxygen';
  var pass = 'oxygen17';
  var project = 'flowers';
  var github = new Github({
    username: userName,
    password: pass,
    auth: "basic"
  });
  var repo = github.getRepo(userName, project);
  var fileName = 'chrysanthemum.dita';
  var path = encodeURI('topics/flowers/' + fileName);


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
    this.branched = false;
    this.newbranch = 'master' + Date.now();
  };
  goog.inherits(CommitAction, sync.actions.AbstractAction);

  /**
   * Gets the content of the file asynchronously.
   * @param cb
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
   * @override
   */
  CommitAction.prototype.actionPerformed = function(cb) {
    var self = this;
    var thecontent = null;
    var thesha = null;
    var shafound = false;

    function commit() {
      if (shafound && self.branched && thecontent != null) {
        var message = "Commited by oXygen XML WebApp.";
        github.request("PUT", '/repos/' + userName + '/' + project + '/contents/' + path, {
          message: message,
          content: btoa(thecontent),
          branch: self.newbranch,
          sha: thesha
        }, cb);
      }
    }
    function getCurrentSha() {
      repo.getSha(self.newbranch, path, function(err, sha) {
        thesha = sha;
        shafound = true;
        commit();
      });

    }

    if (!self.branched) {
      repo.branch('master', this.newbranch, function() {
        self.branched = true;
        getCurrentSha();
      });
    } else {
      getCurrentSha();
    }

    this.getContent(function(content) {
      thecontent = content;
      commit();
    });
  };

  /** @override */
  CommitAction.prototype.getDescription = function() {
    return "Commit";
  };


  // Make sure we accept any kind of URLs.
  goog.events.listen(workspace, sync.api.Workspace.EventType.BEFORE_EDITOR_LOADED, function(e) {
    var url = e.options.url;

    if (url.indexOf('github.com') != -1 || url.indexOf('raw.githubusercontent.com') != -1) {
      // It is a GitHub URL.
      e.options.url = url.replace("blob/", "").replace("github.com", "raw.githubusercontent.com");

      goog.events.listen(e.editor, sync.api.Editor.EventTypes.ACTIONS_LOADED, function() {
        // Disable the Ctrl+S shortcut.
        var noopAction = new sync.actions.NoopAction('M1 S');
        editor.getActionsManager().registerAction('DoNothing', noopAction);
        // Replace the save action with a Commit action.
        editor.getActionsManager().registerAction('Author/Save',
          new CommitAction(editor, url));
      });
    }
  });
}());



