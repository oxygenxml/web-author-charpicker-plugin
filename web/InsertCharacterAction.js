/**
 * JGit implementation for SyncGitApiBase.
 * @constructor
 */
function InsertFromMenuAction (editor) {
  sync.actions.AbstractAction.call(this);
  this.editor_ = editor;
  this.maxRecentChars_ = maxRecentChars;
  this.dialog_ = workspace.createDialog();
  this.dialog_.setTitle(tr(msgs.INSERT_SPECIAL_CHARACTERS_));

  this.timeoutFunction_ = null;
}
goog.inherits(InsertFromMenuAction, sync.actions.AbstractAction);

InsertFromMenuAction.prototype.isEnabled = function () {
  return !sync.util.isInReadOnlyContent.apply(this.editor_.getSelectionManager().getSelection()) &&
    !this.editor_.getReadOnlyState().readOnly;
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

InsertFromMenuAction.prototype.createCharPickerDialog_ = function () {
  var cD = goog.dom.createDom;
  this.nameInput_ = getNameInput();
  this.foundByNameList_ = cD('div', { id: 'foundByNameList'});
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
            this.nameInput_
          ),
          this.foundByNameList_,
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
    src:  this.getIframeUrl_()
  });
  this.dialogElement_ = this.dialog_.getElement();
  this.dialogElement_.id = 'charPicker';
  goog.dom.appendChild(this.dialogElement_, tabContainer);

  this.dialogElement_.parentElement.classList.add("dialogContainer");

  var gEvents = goog.events.EventType;
  goog.events.listen(this.foundByNameList_, [ gEvents.MOUSEOVER, gEvents.CLICK ], updateCharPreview);
  goog.events.listen(this.nameInput_, gEvents.KEYDOWN, goog.bind(this.findCharOnEnter_, this));
  goog.events.listen(this.nameInput_, gEvents.INPUT, goog.bind(this.findCharAfterInput_, this));

  charPickerAdvanced.appendChild(this.charPickerIframe_);



  var readOnlyInput = getReadOnlyInput();
  var removeLastCharButton = getRemoveLastCharButton();
  var div = cD('div', { 'id': 'selectedCharsWrapper' },
    cD('span', '', tr(msgs.SELECTED_CHARACTERS_)),
    readOnlyInput,
    removeLastCharButton
  );

  goog.dom.appendChild(this.dialog_.getElement(), div);

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

/**
 * Insert characters from the dialog.
 * @param key The dialog button which was pressed.
 * @private
 */
InsertFromMenuAction.prototype.charPickerDialogOnSelect_ = function (key) {
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
        if (recentInsertChars.length < this.maxRecentChars_ && recentInsertChars.indexOf(character) === -1) {
          recentInsertChars.push(character);
        }
      }

      this.editor_.getActionsManager().invokeOperation(
        'ro.sync.ecss.extensions.commons.operations.InsertOrReplaceTextOperation', {
          text: stringifiedText
        },
        function () {
          addNewRecentCharacters(recentInsertChars);
        });
    }
  }
};

/**
 * Display the dialog.
 * @private
 */
InsertFromMenuAction.prototype.displayDialog_ = function () {
  window.charsToBeInserted = [];
  // if dialog has not been opened yet, load it
  if(document.getElementById('charpickeriframe') === null) {
    this.createCharPickerDialog_();
  } else {
    this.refreshCharPickerDialog_();
  }
  this.dialog_.onSelect(goog.bind(this.charPickerDialogOnSelect_, this));
  this.dialog_.show();
};

InsertFromMenuAction.prototype.refreshCharPickerDialog_ = function () {
  var lastCharacterSearchItemName = 'lastCharacterSearch';
  // if dialog has been populated already just reset the textboxes
  this.readOnlyInput_.value = '';
  this.dialogElement_ = this.dialog_.getElement();
  var searchbox = this.dialogElement_.querySelector('#searchName');
  searchbox.value = '';
  var lastCharacterSearchItemNameLs;
  try {
    lastCharacterSearchItemNameLs = localStorage.getItem(lastCharacterSearchItemName)
  } catch (e) {
    console.warn(e);
  }
  if(lastCharacterSearchItemNameLs !== null){
    try {
      searchbox.setAttribute("placeholder", localStorage.getItem(lastCharacterSearchItemName) );
    } catch (e) {
      console.warn(e);
    }
  } else {
    // Warning was shown for the last search so remove it.
    var warningElement = this.dialogElement_.querySelector('.smallSpin');
    if (warningElement) {
      this.foundByNameList_ && this.foundByNameList_.removeChild(warningElement);
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

/**
 *
 * @param charSearchSpinner
 * @param absPosChild
 * @param e
 * @private
 */
InsertFromMenuAction.prototype.afterSearchByName_ = function(charSearchSpinner, absPosChild, e) {
  var obj = e.target.getResponseJson();
  var emptyObject = JSON.stringify(obj) === '{}';
  charSearchSpinner.hide();
  if (emptyObject) {
    absPosChild.textContent = tr(msgs.NO_RESULTS_FOUND_);
    try {
      localStorage.removeItem(lastCharacterSearchItemName);
    } catch (e) {
      console.warn(e);
    }
  } else {
    goog.dom.removeChildren(this.foundByNameList_);
    this.appendSymbols_(obj, this.foundByNameList_);
    try {
      localStorage.setItem(lastCharacterSearchItemName, name);
    } catch (e) {
      console.warn(e);
    }
  }
};

/**
 * Add symbol elements to the "find by name" results container.
 * @param obj The object containing symbol results for the find by name query.
 * @param {Element} element The results container element.
 */
InsertFromMenuAction.prototype.appendSymbols_ = function (obj, element) {
  for (var code in obj) {
    var foundByNameItem = goog.dom.createDom(
      'div',
      {
        className: 'characterListSymbol',
        'data-symbol-name': capitalizeWords(obj[code]),
        'data-symbol-hexcode': code
      });
    var decimalCode = parseInt(code, 16);
    foundByNameItem.textContent = String.fromCharCode(decimalCode);
    element.appendChild(foundByNameItem);
  }
};

goog.require('goog.net.XhrIo');
InsertFromMenuAction.prototype.findCharByName_ = function () {
  var name = this.nameInput_.value;
  // clear placeholder if set, last search is no longer relevant.
  var searchBox = this.dialogElement_.querySelector('#searchName');
  searchBox.removeAttribute('placeholder');
  // clear boxes to get ready for results
  goog.dom.removeChildren(this.foundByNameList_);
  goog.dom.removeChildren(document.getElementById("previewCharacterDetails"));

  if(name.length !== 0) {
    var absPosChild = goog.dom.createDom('div', {
      className: 'smallSpin',
      style: 'text-align:center; width: 100%; left: 0;'
    });
    this.foundByNameList_.appendChild(absPosChild);
    var charSearchSpinner = new sync.view.Spinner(absPosChild, 1, 'iframeSpinner');
    charSearchSpinner.show();

    var url = "../plugins-dispatcher/charpicker-plugin?q=" + encodeURIComponent(name);
    goog.net.XhrIo.send(url, goog.bind(this.afterSearchByName_, this, charSearchSpinner, absPosChild), "GET");
  }
};

// Execute query immediately when user presses enter in the input, prevent dialog from closing.
InsertFromMenuAction.prototype.findCharOnEnter_ = function (e) {
  if(e.keyCode === 13) {
    e.preventDefault();
    clearTimeout(this.timeoutFunction_);
    this.findCharByName_();
  }
};

// Execute query after delay on input.
InsertFromMenuAction.prototype.findCharAfterInput_ = function () {
  clearTimeout(this.timeoutFunction_);
  this.timeoutFunction_ = setTimeout(goog.bind(this.findCharByName_, this), 500);
};

/**
 * Get the url for the charpicker iframe.
 * @returns {string} The charpicker iframe URL.
 */
InsertFromMenuAction.prototype.getIframeUrl_ = function () {
  var iframeUrl = '../plugin-resources/' + pluginResourcesFolder + '/charpicker.html';
  var removeCategories = sync.options.PluginsOptions.getClientOption('charp.remove_categories');
  if (removeCategories) {
    iframeUrl += '?remove-categories=' + encodeURIComponent(removeCategories);
  }
  return iframeUrl;
};

InsertFromMenuAction.prototype.getDisplayName = function () {
  return 'insert from menu';
};

InsertFromMenuAction.prototype.getLargeIcon = function () {
  var pluginResourcesFolder = 'char-picker';
  return sync.util.computeHdpiIcon('../plugin-resources/' + pluginResourcesFolder + '/InsertFromCharactersMap24.png');
};

function quickInsertCharFromGrid (e) {
  var target = e.target;
  if (goog.dom.classlist.contains(target, 'goog-flat-button')) {
    var quickInsertChar = target.textContent;
    editor.getActionsManager().invokeOperation(
      'ro.sync.ecss.extensions.commons.operations.InsertOrReplaceTextOperation', {
        text: quickInsertChar
      },
      function () {
        addNewRecentCharacters([quickInsertChar]);
      })
  }
}
