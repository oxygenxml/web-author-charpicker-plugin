(function () {
  goog.events.listen(workspace, sync.api.Workspace.EventType.BEFORE_EDITOR_LOADED, function (e) {
    var editor = e.editor;

    var insertFromMenu = new InsertFromMenuAction(editor);
    editor.getActionsManager().registerAction(insertSpecialCharActionId, insertFromMenu);

    var addActionOnce = 0;
    addToFrameworkToolbar(editor);

    function toolbarContainsCharpicker (toolbar) {
      return toolbar && toolbar.children.find(element => element.id === insertSpecialCharActionId);
    }

    function isFrameworkActionsLoaded(e) {
      var toolbars = e.actionsConfiguration.toolbars;
      return toolbars && !toolbars.find(toolbar => toolbar.name === "Review" || toolbar.name === "Builtin");
    }

    function addToFrameworkToolbar(editor) {
      goog.events.listen(editor, sync.api.Editor.EventTypes.ACTIONS_LOADED, function (e) {
        if (editor.getEditorType() === sync.api.Editor.EditorTypes.AUTHOR && isFrameworkActionsLoaded(e)) {
          var frameworkToolbar = e.actionsConfiguration.toolbars[0];
          if(toolbarContainsCharpicker(frameworkToolbar)) {
            // Action may already be added when changing editors without reload (if there's a custom toolbar)
            addActionOnce++;
          }
          // adds the action only once, on the first toolbar that is not Review or Builtin
          if (frameworkToolbar && addActionOnce === 0) {
            addActionOnce++;
            frameworkToolbar.children.push({
              id: insertSpecialCharActionId,
              type: "action"
            });
            setTimeout(function () {
              insertFromMenu.init();
            }, 0);
          }
        }
      });
    }
  });
})();
