(function () {
  goog.events.listen(workspace, sync.api.Workspace.EventType.BEFORE_EDITOR_LOADED, function (e) {
    var editor = e.editor;
    var insertSpecialCharActionId = 'insertfrommenu';

    var defaultRecentCharacters = ["\u20ac", "\u00a3", "\u00a5", "\u00a2", "\u00a9", "\u00ae", "\u2122", "\u03b1", "\u03b2", "\u03c0", "\u03bc",
      "\u03a3", "\u03a9", "\u2264", "\u2265", "\u2260", "\u221e", "\u00b1", "\u00f7", "\u00d7", "\u21d2"];

    var maxRecentChars = 21;

    var typingPause = 500;
    var timeoutfunction;

    var translations = {
      "BY_NAME_": {
        "en_US":"By name",
        "de_DE":"Nach Namen",
        "fr_FR":"Par nom",
        "ja_JP":"名前による",
        "nl_NL":"Op naam"
      },
      "BY_CATEGORIES_": {
        "en_US":"By categories",
        "de_DE":"Nach Kategorien",
        "fr_FR":"Par catégories",
        "ja_JP":"カテゴリによる",
        "nl_NL":"Op categorie"
      },
      "BY_CATEGORIES_OR_HEX_CODE_": {
        "en_US":"By categories or hex code",
        "de_DE":"Nach Kategorien oder Hex-Codes",
        "fr_FR":"Par catégories ou code hexadécimal",
        "ja_JP":"分類項目または16進数コードによる",
        "nl_NL":"Op categorie of hexadecimale code"
      },
      "NAME_OF_CHARACTER_": {
        "en_US":"Name of character to search for:",
        "de_DE":"Name des Zeichens, nach dem gesucht werden soll:",
        "fr_FR":"Nom du caractère à rechercher:",
        "ja_JP":"検索するための文字の名前：",
        "nl_NL":"Naam van teken waarnaar u wilt zoeken:"
      },
      "MORE_SYMBOLS_": {
        "en_US":"More symbols",
        "de_DE":"Mehr Symbole",
        "fr_FR":"Plus de symboles",
        "ja_JP":"さらに多くのシンボル",
        "nl_NL":"Meer symbolen"
      },
      "INSERT_SPECIAL_CHARACTERS_": {
        "en_US":"Insert special characters",
        "de_DE":"Sonderzeichen einfügen",
        "fr_FR":"Insérer des caractère spéciaux",
        "ja_JP":"特殊文字を挿入する",
        "nl_NL":"Speciale tekens invoegen"
      },
      "SELECTED_CHARACTERS_": {
        "en_US":"Selected characters:",
        "de_DE":"Ausgewählte Zeichen:",
        "fr_FR":"Caractères sélectionnés:",
        "ja_JP":"選択された文字：",
        "nl_NL":"Geselecteerde tekens:"
      },
      "REMOVE_LAST_CHARACTER_": {
        "en_US":"Remove last character",
        "de_DE":"Letztes Zeichen entfernen",
        "fr_FR":"Supprimer le dernier caractère",
        "ja_JP":"最後の文字を削除する",
        "nl_NL":"Laatste teken verwijderen"
      }
    };
    sync.Translation.addTranslations(translations);

    var cD = goog.dom.createDom;
    var gClassList = goog.dom.classlist;
    var gEvents = goog.events.EventType;

    //quickly change urls that have the plugin name hardcoded
    var pluginResourcesFolder = 'char-picker';

    var localStorageUsable = typeof (Storage) !== 'undefined';

    var recentCharsItemName = 'recentlyUsedCharacters';
    var lastCharacterSearchItemName = 'lastCharacterSearch';

    // Add the new characters to the list of recent characters.
    var setRecentChars = function (characters) {
      if (localStorageUsable) {
        localStorage.setItem(recentCharsItemName, JSON.stringify(characters));
      }
    };

    var displayRecentCharacters = function (characters) {
      /* selector for targeting the recent characters container */
      var container = document.querySelector('.recentCharactersGrid');
      var i;

      /* remove all recent characters to add the new ones again */
      goog.dom.removeChildren(container);

      /* Add the characters to the container */
      for (i = 0; i < characters.length; i++) {
        container.appendChild(
          cD(
            'div', ['goog-inline-block', 'goog-flat-button', 'char-select-button'],
            characters[i])
        );
      }
    };

    var getRecentChars = function () {
      var recentChars = [];
      if (localStorageUsable) {
        var itemFromStorage = localStorage.getItem(recentCharsItemName);
        if (itemFromStorage) {
          recentChars = JSON.parse(itemFromStorage);
        }
      }
      return recentChars;
    };

    /**
     * After new characters have been inserted, add them to the recent characters grid.
     * Make sure recent characters are the expected length.
     * Trim if longer, fill with defaults if shorter.
     * @param newCharacters The characters which were inserted.
     */
    var addNewRecentCharacters = function (newCharacters) {
      var characters = newCharacters.concat(getRecentChars());
      goog.array.removeDuplicates(characters);
      if (characters.length < maxRecentChars) {
        characters = characters.concat(defaultRecentCharacters);
      }
      characters = characters.slice(0, maxRecentChars - 1);
      setRecentChars(characters);
    };

    // Capitalize the words in the character description.
    var capitalizeWords = function(text) {
      var splitText = text.toLowerCase().split(' ');
      for(var i = 0; i < splitText.length; i++) {
        splitText[i] = splitText[i].substr(0,1).toUpperCase() + splitText[i].substring(1);
      }
      return splitText.join(' ');
    };

    var updateCharPreview = function (e) {
      var target = e.target;
      var symbol = target.textContent;
      var symbolCode = target.getAttribute('data-symbol-hexcode');
      var symbolName = target.getAttribute('data-symbol-name');

      var previewCharacterDetails = document.getElementById('previewCharacterDetails');

      goog.dom.removeChildren(previewCharacterDetails);
      goog.dom.append(previewCharacterDetails,
        cD('div', {id: 'previewSymbol'}, symbol),
        cD('div', { id: 'previewSymbolName' },
          symbolName,
          cD('span',
            { style: 'white-space: nowrap; vertical-align: top' },
            ' (' + symbolCode + ')')));
    };

    var updateCharPreviewHover = function (e) {
      if(gClassList.contains(e.target, 'characterListSymbol')){
        updateCharPreview(e);
      }
    };

    var updateCharPreviewClick = function (e) {
      if(gClassList.contains(e.target, 'characterListSymbol')){
        updateCharPreview(e);
        var symbol = e.target.textContent;
        charsToBeInserted.push(symbol);
        document.getElementById('special_characters').value += symbol;
      }
    };

    var findCharByName = function () {};

    // Execute query immediately when user presses enter in the input, prevent dialog from closing.
    var findCharOnEnter = function(e){
      if(e.keyCode === 13) {
        e.preventDefault();
        clearTimeout(timeoutfunction);
        findCharByName();
      }
    };

    // Execute query after delay on input.
    var findCharAfterInput = function() {
      clearTimeout(timeoutfunction);
      timeoutfunction = setTimeout(findCharByName, typingPause);
    };


    var insertCharactersFromDialog = null;

    /**
     * Refresh the char picker dialog - reset inputs.
     */
    var InsertFromMenuAction = function (editor) {
      this.editor = editor;
      this.dialog = workspace.createDialog();
      this.dialog.setTitle(tr(msgs.INSERT_SPECIAL_CHARACTERS_));
      this.dialog.onSelect(goog.bind(function (key) {
        // DIALOG INSERT GRID
        if (key === 'ok') {
          var dialogInsertChars = window.charsToBeInserted;
          if (dialogInsertChars) {
            var stringifiedText = '';
            var recentInsertChars = [];
            // Go in reverse order to also extract recently used characters.
            for(var i = dialogInsertChars.length - 1; i >= 0; i--){
              var character = dialogInsertChars[i];
              stringifiedText = character + stringifiedText;
              if (recentInsertChars.length < maxRecentChars && recentInsertChars.indexOf(character) === -1) {
                recentInsertChars.push(character);
              }
            }

            editor.getActionsManager().invokeOperation(
              'ro.sync.ecss.extensions.commons.operations.InsertOrReplaceFragmentOperation', {
                fragment: stringifiedText
              },
              function () {
                addNewRecentCharacters(recentInsertChars);
              });
          }
        }
      }, this));
    };

    InsertFromMenuAction.prototype = new sync.actions.AbstractAction('');
    InsertFromMenuAction.prototype.getDisplayName = function () {
      return 'insert from menu';
    };

    InsertFromMenuAction.prototype.getLargeIcon = function () {
      return sync.util.computeHdpiIcon('../plugin-resources/' + pluginResourcesFolder + '/InsertFromCharactersMap24.png');
    };

    InsertFromMenuAction.prototype.displayDialog = function () {
      window.charsToBeInserted = [];
      // if dialog has not been opened yet, load it
      if(document.getElementById('charpickeriframe') === null) {
        this.createCharPickerDialog_();
      } else {
        this.refreshCharPickerDialog_();
      }
      this.dialog.show();
    };

    InsertFromMenuAction.prototype.createCharPickerDialog_ = function () {
      var cD = goog.dom.createDom;
      var nameInput = cD(
        'input',
        {
          id: 'searchName',
          className: 'charpicker-input',
          type: 'text',
          name: 'searchName'
        });
      var foundByNameList = cD('div', { id: 'foundByNameList'});
      var charPickerAdvanced = cD('div', { id: 'charpicker-advanced' });

      var tabContainer = cD(
        'div', 'tabsContainer',
        cD('ul', '',
          cD('li', '',
            cD('input', {
              id: 'tabsContainer-0-0',
              type: 'radio',
              name: 'tabsContainer-0',
              checked: 'checked'
            }),
            cD('label', { for: 'tabsContainer-0-0' }, tr(msgs.BY_NAME_)),
            cD('div', { id: 'charpicker-search-by-name' },
              cD('div', { style: 'line-height: 1.2em; height: 57px;' },
                tr(msgs.NAME_OF_CHARACTER_),
                cD('br'),
                nameInput
              ),
              foundByNameList,
              cD('div', { id: 'previewCharacterDetails'})
            )
          ),
          cD('li', '',
            cD('input', { id: 'tabsContainer-0-1', type: 'radio', name: 'tabsContainer-0' }),
            cD('label', { for: 'tabsContainer-0-1' },
              cD('span', 'low-width-hide', tr(msgs.BY_CATEGORIES_OR_HEX_CODE_)),
              cD('span', 'big-width-hide', tr(msgs.BY_CATEGORIES_))
            ),
            charPickerAdvanced
          )
        )
      );

      this.charPickerIframe_ = cD('iframe', {
        id: 'charpickeriframe',
        src: '../plugin-resources/' + pluginResourcesFolder + '/charpicker.html'
      });
      var dialogElement = this.dialog.getElement();
      dialogElement.id = 'charPicker';
      goog.dom.appendChild(dialogElement, tabContainer);

      dialogElement.parentElement.classList.add("dialogContainer");

      goog.events.listen(foundByNameList, gEvents.MOUSEOVER, updateCharPreviewHover);
      goog.events.listen(foundByNameList, gEvents.CLICK, updateCharPreviewClick);

      goog.require('goog.net.XhrIo');
      findCharByName = function() {
        var name = nameInput.value;
        // clear boxes to get ready for results
        goog.dom.removeChildren(foundByNameList);
        goog.dom.removeChildren(document.getElementById("previewCharacterDetails"));

        if(name.length !== 0) {
          var absPosChild = cD('div', {
            className: 'smallSpin',
            style: 'text-align:center; width: 100%; left: 0;'
          });
          foundByNameList.appendChild(absPosChild);
          var charSearchSpinner = new sync.view.Spinner(absPosChild, 1, 'iframeSpinner');
          charSearchSpinner.show();

          var url = "../plugins-dispatcher/charpicker-plugin?q=" + encodeURIComponent(name);
          goog.net.XhrIo.send(url, function(e){
            var obj = e.target.getResponseJson();

            var emptyObject = true;
            for (var code in obj) {
              if (obj.hasOwnProperty(code)) {
                emptyObject = false;

                var foundByNameItem = goog.dom.createDom(
                  'div',
                  {
                    className: 'characterListSymbol',
                    'data-symbol-name': capitalizeWords(obj[code]),
                    'data-symbol-hexcode': code
                  });
                var decimalCode = parseInt(code, 16);
                foundByNameItem.textContent = String.fromCharCode(decimalCode);
                foundByNameList.appendChild(foundByNameItem);
              }
            }
            charSearchSpinner.hide();
            if (emptyObject) {
              absPosChild.textContent = tr(msgs.NO_RESULTS_FOUND_);
              localStorage.removeItem(lastCharacterSearchItemName);
            } else {
              foundByNameList.removeChild(absPosChild);
              localStorage.setItem(lastCharacterSearchItemName, name);
            }
          }, "GET");
        }
      };

      goog.events.listen(nameInput, gEvents.KEYDOWN, findCharOnEnter);
      goog.events.listen(nameInput, gEvents.INPUT, findCharAfterInput);

      charPickerAdvanced.appendChild(this.charPickerIframe_);

      var readOnlyInput = cD(
        'input',
        {
          id: 'special_characters',
          className: 'charpicker-input',
          type: 'text',
          name: 'charsToBeInserted'
        }
      );
      readOnlyInput.setAttribute('readonly', 'true');
      readOnlyInput.setAttribute('onFocus', 'this.setSelectionRange(0, this.value.length)');

      var removeLastCharButton = cD('button',
        {
          id: 'removeLastChar',
          className: 'goog-button goog-char-picker-okbutton',
          title: tr(msgs.REMOVE_LAST_CHARACTER_),
          value: ''
        }
      );

      var div = cD(
        'div', { 'id': 'selectedCharsWrapper' },
        cD('span', '', tr(msgs.SELECTED_CHARACTERS_)),
        readOnlyInput,
        removeLastCharButton
      );

      goog.dom.appendChild(this.dialog.getElement(), div);

      readOnlyInput.scrollTop = readOnlyInput.scrollHeight;
      goog.events.listen(removeLastCharButton, gEvents.CLICK, function(){
        readOnlyInput.value = '';
        charsToBeInserted.pop();
        for(var i = 0; i < charsToBeInserted.length; i++){
          readOnlyInput.value += charsToBeInserted[i];
        }
      });
      this.readOnlyInput_ = readOnlyInput;
    };

    InsertFromMenuAction.prototype.refreshCharPickerDialog_ = function () {
      console.log(this.dialog);
      console.log('onselect tho', this.dialog.onSelect);

      // if dialog has been populated already just reset the textboxes
      this.readOnlyInput_.value = '';
      var dialogElement = this.dialog.getElement();
      var searchbox = dialogElement.querySelector('#searchName');
      searchbox.value = '';
      if(localStorage.getItem(lastCharacterSearchItemName) !== null){
        searchbox.setAttribute("placeholder", localStorage.getItem(lastCharacterSearchItemName) );
      } else {
        // Warning was shown for the last search so remove it.
        var warningElement = dialogElement.querySelector('.smallSpin');
        if (warningElement) {
          document.getElementById('foundByNameList').removeChild(warningElement);
        }
      }

      var iframeContent = (this.charPickerIframe_.contentWindow || this.charPickerIframe_.contentDocument);
      if (iframeContent.document) {
        iframeContent = iframeContent.document;
        iframeContent.querySelector('.goog-char-picker-input-box').value = '';
      }
      else {
        console.warn('Failed to get iframe contents.');
      }
    };

    InsertFromMenuAction.prototype.init = function () {
      window.charsToBeInserted = [];

      var csmenu = new goog.ui.PopupMenu();

      //overwrite the handleBlur function to prevent the popup from closing after inserting a character
      csmenu.handleBlur = function () {};

      var moreSymbols = new goog.ui.MenuItem(tr(msgs.MORE_SYMBOLS_) + '...');
      csmenu.addChild(moreSymbols, true);
      moreSymbols.setId('moreSymbolsButton');

      var gComponentEvent = goog.ui.Component.EventType;
      goog.events.listen(moreSymbols, gComponentEvent.ACTION, goog.bind(this.displayDialog, this));

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

      var quickInsertCharFromGrid = function (e) {
        var target = e.target;
        if (gClassList.contains(target, 'goog-flat-button')) {
          var quickInsertChar = target.textContent;
          editor.getActionsManager().invokeOperation(
            'ro.sync.ecss.extensions.commons.operations.InsertOrReplaceFragmentOperation', {
              fragment: quickInsertChar
            },
            function () {
              addNewRecentCharacters([quickInsertChar]);
            })
        }
      };
      // QUICK INSERT GRID
      goog.events.listen(document.querySelector('.goog-char-picker-grid'), gEvents.CLICK, quickInsertCharFromGrid);

      // Initialize quick insert grid with default characters.
      var characters = getRecentChars();
      if (characters.length === 0) {
        setRecentChars(defaultRecentCharacters);
      }
    };


    InsertFromMenuAction.prototype.actionPerformed = function () {
      var csmenu = this.csmenu_;
      if (csmenu.isOrWasRecentlyVisible()) {
        csmenu.hide();
      } else {
        var characters = getRecentChars();
        displayRecentCharacters(characters);
        csmenu.showAtElement(
          this.charPickerToolbarButton_,
          goog.positioning.Corner.BOTTOM_START);
      }
    };

    InsertFromMenuAction.prototype.isEnabled = function () {
      return !sync.util.isInReadOnlyContent.apply(editor.getSelectionManager().getSelection()) &&
        !this.editor.getReadOnlyState().readOnly;
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
  })
})();
