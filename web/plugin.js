(function () {
  var insertSpecialCharActionId = 'insertfrommenu';


  // Update the recently used characters list with the characters set by the user.
  var userSelectedDefaults = getUserSelectedDefaults();
  if (userSelectedDefaults.length) {
    updateRecentlyUsedCharacters(defaultRecentCharacters, userSelectedDefaults);
  }

  var cD = goog.dom.createDom;
  var gClassList = goog.dom.classlist;

  goog.events.listen(workspace, sync.api.Workspace.EventType.BEFORE_EDITOR_LOADED, function (e) {
    var editor = e.editor;

    InsertFromMenuAction.prototype.init = function () {
      window.charsToBeInserted = [];

      var csmenu = new goog.ui.PopupMenu();

      //overwrite the handleBlur function to prevent the popup from closing after inserting a character
      csmenu.handleBlur = function () {};

      var moreSymbols = new goog.ui.MenuItem(tr(msgs.MORE_SYMBOLS_) + '...');
      csmenu.addChild(moreSymbols, true);
      moreSymbols.setId('moreSymbolsButton');

      var gComponentEvent = goog.ui.Component.EventType;
      goog.events.listen(moreSymbols, gComponentEvent.ACTION, goog.bind(this.displayDialog_, this));

      // Add classes so charpicker button gets the same styles as other dropdowns from the toolbar.
      var toolbarButton = this.charPickerToolbarButton_;
      if (!toolbarButton) {
        toolbarButton = document.querySelector('[name=' + insertSpecialCharActionId + ']');
        this.charPickerToolbarButton_ = toolbarButton;
      }
      goog.events.listen(csmenu, gComponentEvent.HIDE, goog.bind(function () {
        gClassList.remove(toolbarButton, 'goog-toolbar-menu-button-open');
      }, this));
      goog.events.listen(csmenu, gComponentEvent.SHOW, goog.bind(function () {
        gClassList.add(toolbarButton, 'goog-toolbar-menu-button-open');
      }, this));

      csmenu.render();
      var parentElement = csmenu.getElement();
      goog.dom.setProperties(parentElement, {'id': 'pickermenu'});

      // add the characters grid before the "more symbols..." button
      var theFirstChild = parentElement.firstChild;
      var newElement = cD('div', {
        className: 'goog-char-picker-grid recentCharactersGrid',
        id: 'simplePickerGrid'
      });
      parentElement.insertBefore(newElement, theFirstChild);

      csmenu.setToggleMode(true);
      this.csmenu_ = csmenu; // save for later.

      // QUICK INSERT GRID
      goog.events.listen(document.querySelector('.goog-char-picker-grid'), goog.events.EventType.CLICK, goog.bind(quickInsertCharFromGrid, this, editor));

      // Initialize quick insert grid with default characters.
      var characters = getRecentChars();
      if (characters.length === 0) {
        setRecentChars(defaultRecentCharacters);
      }
    };


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
            var insertSpecialCharButton = document.querySelector("[name='" + insertSpecialCharActionId + "']");
            if (insertSpecialCharButton) {
              insertSpecialCharButton.setAttribute("title", tr(msgs.INSERT_SPECIAL_CHARACTERS_));
            }
          }, 0);
        }
      });
    }
    sync.util.loadCSSFile("../plugin-resources/" + pluginResourcesFolder + "/css/plugin.css");
  });
})();
