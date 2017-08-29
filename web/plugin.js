(function () {
  goog.events.listen(workspace, sync.api.Workspace.EventType.BEFORE_EDITOR_LOADED, function (e) {

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

    //quickly change urls that have the plugin name hardcoded
    var pluginResourcesFolder = 'char-picker';

    var localStorageUsable = function () { return typeof (Storage) !== 'undefined'; };
    var storedRecentChars = function () { return localStorage.getItem("recentlyUsedCharacters"); };
    var capitalizeWords = function(text) {
      var splitText = text.toLowerCase().split(' ');
      for(var i = 0; i < splitText.length; i++) {
        splitText[i] = splitText[i].substr(0,1).toUpperCase() + splitText[i].substring(1);
      }
      return splitText.join(' ');
    };
    var displayRecentCharacters = function () {
      var defaultRecentCharacters = ["\u20ac", "\u00a3", "\u00a5", "\u00a2", "\u00a9", "\u00ae", "\u2122", "\u03b1", "\u03b2", "\u03c0", "\u03bc",
        "\u03a3", "\u03a9", "\u2264", "\u2265", "\u2260", "\u221e", "\u00b1", "\u00f7", "\u00d7", "\u21d2"];
      /* selector for targeting the recent characters container */
      var container = document.querySelector('.recentCharactersGrid');
      var i;

      /* remove all recent characters to add the new ones again */
      goog.dom.removeChildren(container);

      var characters = [];
      if (localStorageUsable()) {
        if (storedRecentChars()) {
          characters = JSON.parse(localStorage.getItem("recentlyUsedCharacters"));
        }
      }

      /* adjust the character array so it is the desired length.
       Fill it up with default recent characters if needed.  */
      var maxChars = 21;
      if (characters.length < maxChars) {
        characters = characters.concat(defaultRecentCharacters);
        goog.array.removeDuplicates(characters);
        characters = characters.slice(0, maxChars);
        localStorage.setItem("recentlyUsedCharacters", JSON.stringify(characters));
      } else if (characters.length > maxChars) {
        characters = characters.slice(0, maxChars);
        localStorage.setItem("recentlyUsedCharacters", JSON.stringify(characters));
      }
      /* add the characters to the container */
      for (i = 0; i < characters.length; i++) {
        container.appendChild(
          cD(
            'div', ['goog-inline-block', 'goog-flat-button', 'char-select-button'],
            characters[i])
        );
      }
    };
    var updateCharPreview = function(e) {
      var target = e.target;
      var symbol = target.textContent;
      var symbolCode = target.getAttribute('data-symbol-hexcode');
      var symbolName = target.getAttribute('data-symbol-name');

      var previewCharacterDetails = document.getElementById('previewCharacterDetails');

      previewCharacterDetails.innerHTML = '';
      goog.dom.append(previewCharacterDetails,
        cD('div', {id: 'previewSymbol'}, symbol),
        cD('div', { id: 'previewSymbolName' },
          symbolName,
          cD('span',
            { style: 'white-space: nowrap; vertical-align: top' },
            ' (' + symbolCode + ')')));
    };

    var InsertFromMenuAction = function (editor) {
      this.editor = editor;
      this.dialog = workspace.createDialog();
      this.dialog.setTitle(tr(msgs.INSERT_SPECIAL_CHARACTERS_));
    };
    InsertFromMenuAction.prototype = new sync.actions.AbstractAction('');
    InsertFromMenuAction.prototype.getDisplayName = function () {
      return 'insert from menu';
    };

    InsertFromMenuAction.prototype.getLargeIcon = function () {
      return sync.util.computeHdpiIcon('../plugin-resources/' + pluginResourcesFolder + '/InsertFromCharactersMap24.png');
    };

    InsertFromMenuAction.prototype.displayDialog = function () {

      // Resize the dialog when the window resizes (keep it usable on smaller devices after the keyboard pops up).
      var resizeListenerKey = goog.events.listen(window, goog.events.EventType.RESIZE, goog.bind(function () {
        this.dialog.setPreferredSize(420, 550);
      }, this));

      goog.events.listenOnce(this.dialog.dialog, goog.ui.Dialog.EventType.AFTER_HIDE, function () {
        goog.events.unlistenByKey(resizeListenerKey);
      });

      window.charsToBeInserted = [];
      // if dialog has not been opened yet, load it
      if(document.getElementById('charpickeriframe') === null) {
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
              cD('div', { id: 'charpicker-advanced' })
            )
          )
        );

        var charPickerIframe = cD('iframe', {
          id: 'charpickeriframe',
          src: '../plugin-resources/' + pluginResourcesFolder + '/charpicker.html'
        });
        this.dialog.getElement().id = 'charPicker';
        goog.dom.appendChild(this.dialog.getElement(), tabContainer);

        this.dialog.getElement().parentElement.classList.add("dialogContainer");

        goog.events.listen(foundByNameList, goog.events.EventType.MOUSEOVER,
          function (e){
            if(goog.dom.classlist.contains(e.target, 'characterListSymbol')){
              updateCharPreview(e);
            }
          }
        );
        goog.events.listen(foundByNameList, goog.events.EventType.CLICK,
          function (e){
            if(goog.dom.classlist.contains(e.target, 'characterListSymbol')){
              updateCharPreview(e);
              var symbol = e.target.textContent;
              charsToBeInserted.push(symbol);
              document.getElementById('special_characters').value += symbol;
            }
          }
        );

        goog.require('goog.net.XhrIo');
        var findCharByName = function() {
          var name = nameInput.value;
          // clear boxes to get ready for results
          foundByNameList.innerHTML = '';

          document.getElementById("previewCharacterDetails").innerHTML = '';

          if(name.length !== 0) {
            var absPosChild = cD('div', 'smallSpin');
            foundByNameList.appendChild(absPosChild);
            absPosChild.setAttribute('style', 'text-align:center; width: 100%; left: 0;');
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
                absPosChild.textContent = 'No results found'; // todo: translate
                localStorage.removeItem("lastCharacterSearch");
              } else {
                foundByNameList.removeChild(absPosChild);
                localStorage.setItem("lastCharacterSearch", name);
              }
            }, "GET");
          }
        };


        // execute query automatically after user stops typing
        var typingPause = 500;
        var timeoutfunction;

        // execute query immediately when user presses enter in the input, prevent dialog closing
        goog.events.listen(nameInput, goog.events.EventType.KEYDOWN, function(e){
          if(e.keyCode === 13) {
            e.preventDefault();
            clearTimeout(timeoutfunction);
            findCharByName();
          }
        });

        // execute query after delay on input
        goog.events.listen(nameInput, goog.events.EventType.INPUT, function() {
          clearTimeout(timeoutfunction);
          timeoutfunction = setTimeout(findCharByName, typingPause);
        });

        document.getElementById('charpicker-advanced').appendChild(charPickerIframe);

        var readOnlyInput = cD(
          'input',
          {
            id: 'special_characters',
            class: 'charpicker-input',
            type: 'text',
            name: 'charsToBeInserted'
          }
        );
        readOnlyInput.setAttribute('readonly', true);
        readOnlyInput.setAttribute('onFocus', 'this.setSelectionRange(0, this.value.length)');

        var div = cD(
          'div', { 'id': 'selectedCharsWrapper' },
          cD('span', '', tr(msgs.SELECTED_CHARACTERS_)),
          readOnlyInput,
          cD('button',
            {
              id: 'removeLastChar',
              class: 'goog-button goog-char-picker-okbutton',
              title: tr(msgs.REMOVE_LAST_CHARACTER_),
              value: ''
            }
          )
        );

        goog.dom.appendChild(this.dialog.getElement(), div);

        var textarea = document.getElementById('special_characters');
        textarea.scrollTop = textarea.scrollHeight;
        goog.events.listen(this.dialog.getElement().querySelector('#removeLastChar'), goog.events.EventType.CLICK, function(){
          var preview = document.getElementById('special_characters');
          preview.value = '';
          charsToBeInserted.pop();
          for(var i = 0; i < charsToBeInserted.length; i++){
            preview.value += charsToBeInserted[i];
          }
        });

      }
      // if dialog has been populated already just reset the textboxes
      else {
        this.dialog.getElement().querySelector('#special_characters').value = '';
        var searchbox = this.dialog.getElement().querySelector('#searchName');
        searchbox.value = '';
        if(localStorage.getItem("lastCharacterSearch") !== null){
          searchbox.setAttribute("placeholder", localStorage.getItem("lastCharacterSearch") );
        } else {
          // Warning was shown for the last search so remove it.
          var warningElement = this.dialog.getElement().querySelector('.smallSpin');
          if (warningElement) {
            document.getElementById('foundByNameList').removeChild(warningElement);
          }
        }
        var iframe = this.dialog.getElement().querySelector('#charpickeriframe');
        var iframeContent = (iframe.contentWindow || iframe.contentDocument);
        if (iframeContent.document) {
          iframeContent = iframeContent.document;
          iframeContent.querySelector('.goog-char-picker-input-box').value = '';
        }
        else {
          console.log('failed to get iframe contents');
        }
      }


      this.dialog.onSelect(function (key) {
        // DIALOG INSERT GRID
        if (key === 'ok') {
          var dialogInsertChars = charsToBeInserted;
          if (dialogInsertChars) {
            var stringifiedText = '';
            for(i = 0; i < dialogInsertChars.length; i++){
              stringifiedText += dialogInsertChars[i];
            }
            editor.getActionsManager().invokeOperation(
              'ro.sync.ecss.extensions.commons.operations.InsertOrReplaceFragmentOperation', {
                fragment: stringifiedText
              },
              function () {
                if (localStorageUsable()) {
                  /* if using the localStorage is possible, add the text to the START of the array - queue system */
                  if (storedRecentChars()) {
                    var characters = JSON.parse(localStorage.getItem("recentlyUsedCharacters"));
                    characters = (dialogInsertChars.reverse()).concat(characters);
                    goog.array.removeDuplicates(characters);
                    localStorage.setItem("recentlyUsedCharacters", JSON.stringify(characters));
                    displayRecentCharacters();
                  } else {
                    characters = dialogInsertChars;
                    localStorage.setItem("recentlyUsedCharacters", JSON.stringify(characters));
                    displayRecentCharacters();
                  }
                }
              })
          }
        }
      });

      this.dialog.show();
    };

    InsertFromMenuAction.prototype.init = function () {
      window.charsToBeInserted = [];

      this.csmenu = new goog.ui.PopupMenu();

      //overwrite the handleBlur function to prevent the popup from closing after inserting a character
      this.csmenu.handleBlur = function () {
      };

      var moreSymbols = new goog.ui.MenuItem(tr(msgs.MORE_SYMBOLS_) + '...');
      this.csmenu.addChild(moreSymbols, true);
      moreSymbols.setId('moreSymbolsButton');

      goog.events.listen(moreSymbols, goog.ui.Component.EventType.ACTION, goog.bind(this.displayDialog, this));

      // Add classes so charpicker button gets the same styles as other dropdowns from the toolbar.
      if (!this.charPickerToolbarButton_) {
        this.charPickerToolbarButton_ = document.querySelector('[name=insertfrommenu]');
      }
      goog.events.listen(this.csmenu, goog.ui.Component.EventType.HIDE, goog.bind(function () {
        goog.dom.classlist.remove(this.charPickerToolbarButton_, 'goog-toolbar-menu-button-open');
      }, this));
      goog.events.listen(this.csmenu, goog.ui.Component.EventType.SHOW, goog.bind(function () {
        goog.dom.classlist.add(this.charPickerToolbarButton_, 'goog-toolbar-menu-button-open');
      }, this));

      this.csmenu.render();
      goog.dom.setProperties(this.csmenu.getElement(), {'id': 'pickermenu'});

      // add the characters grid before the "more symbols..." button
      var parentElement = this.csmenu.getElement();
      var theFirstChild = parentElement.firstChild;
      var newElement = cD('div', {
        className: 'goog-char-picker-grid recentCharactersGrid',
        id: 'simplePickerGrid'
      });
      parentElement.insertBefore(newElement, theFirstChild);

      this.csmenu.setToggleMode(true);

      // QUICK INSERT GRID
      goog.events.listen(document.querySelector('.goog-char-picker-grid'),
        goog.events.EventType.CLICK,
        function (e) {
          if (goog.dom.classlist.contains(e.target, 'goog-flat-button')) {
            editor.getActionsManager().invokeOperation(
              'ro.sync.ecss.extensions.commons.operations.InsertOrReplaceFragmentOperation', {
                fragment: e.target.textContent
              },
              function () {
                var quickInsertChar = e.target.textContent;
                if (localStorageUsable()) {
                  /* if using the localStorage is possible, add the character to the START of the array - queue system */
                  if (storedRecentChars()) {
                    var characters = JSON.parse(localStorage.getItem("recentlyUsedCharacters"));
                    characters.unshift(quickInsertChar);
                    goog.array.removeDuplicates(characters);
                    localStorage.setItem("recentlyUsedCharacters", JSON.stringify(characters));

                  } else {
                    characters = [];
                    characters.unshift(quickInsertChar);
                    localStorage.setItem("recentlyUsedCharacters", JSON.stringify(characters));
                  }
                }
              })
          }
        });
    };


    InsertFromMenuAction.prototype.actionPerformed = function () {
      if (this.csmenu.isOrWasRecentlyVisible()) {
        this.csmenu.hide();
      } else {
        displayRecentCharacters();
        this.csmenu.showAtElement(
          this.charPickerToolbarButton_,
          goog.positioning.Corner.BOTTOM_START);
      }
    };

    InsertFromMenuAction.prototype.isEnabled = function () {
      return !this.editor.getReadOnlyState().readOnly;
    };

    var editor = e.editor;

    var insertFromMenu = new InsertFromMenuAction(editor);
    editor.getActionsManager().registerAction('insertfrommenu', insertFromMenu);

    var addActionOnce = 0;
    addToFrameworkToolbar(editor);

    function addToFrameworkToolbar(editor) {
      goog.events.listen(editor, sync.api.Editor.EventTypes.ACTIONS_LOADED, function (e) {
        var actionsConfig = e.actionsConfiguration;

        var frameworkToolbar = null;
        if (actionsConfig.toolbars) {
          for (var i = 0; i < actionsConfig.toolbars.length; i++) {
            var toolbar = actionsConfig.toolbars[i];
            if (toolbar.name !== "Review" && toolbar.name !== "Builtin") {
              frameworkToolbar = toolbar;
            }
          }
        }
        // adds the action only once, on the first toolbar that is not Review or Builtin
        if (frameworkToolbar && addActionOnce === 0) {
          addActionOnce++;
          frameworkToolbar.children.push({
            id: 'insertfrommenu',
            type: "action"
          });
          setTimeout(function () {
            insertFromMenu.init();
            document.querySelector("[name='insertfrommenu']")
              .setAttribute("title", tr(msgs.INSERT_SPECIAL_CHARACTERS_));
          }, 0);
        }
      });
    }
    sync.util.loadCSSFile("../plugin-resources/" + pluginResourcesFolder + "/css/plugin.css");
  })
})();