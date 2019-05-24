(function () {
  goog.events.listen(workspace, sync.api.Workspace.EventType.BEFORE_EDITOR_LOADED, function (e) {
    var editor = e.editor;

    var insertFromMenu = new InsertFromMenuAction(editor);
    editor.getActionsManager().registerAction(insertSpecialCharActionId, insertFromMenu);

    var addActionOnce = 0;
    addToFrameworkToolbar(editor);

    function addToFrameworkToolbar(editor) {
      goog.events.listen(editor, sync.api.Editor.EventTypes.ACTIONS_LOADED, function (e) {
        var actionsConfigToolbars = e.actionsConfiguration.toolbars;

        var frameworkToolbar = null;
        if (actionsConfigToolbars) {
          for (var i = 0; i < actionsConfigToolbars.length; i++) {
            var toolbar = actionsConfigToolbars[i];
            if (toolbar.name !== "Review" && toolbar.name !== "Builtin") {
              frameworkToolbar = toolbar;
            }
          }
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
      });
    }
  });
})();
