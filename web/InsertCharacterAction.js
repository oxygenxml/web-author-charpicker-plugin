/**
 * JGit implementation for SyncGitApiBase.
 * @constructor
 */
function InsertFromMenuAction (editor) {
  sync.actions.Action.call(this, {
    description: tr(msgs.INSERT_SPECIAL_CHARACTERS_),
    displayName: 'insert from menu'
  });
  this.editor_ = editor;
  this.maxRecentChars_ = maxRecentChars;

  this.timeoutFunction_ = null;

  this.pluginResourcesFolder_ = 'char-picker';
}
goog.inherits(InsertFromMenuAction, sync.actions.Action);

InsertFromMenuAction.prototype.isEnabled = function () {
  return !sync.util.isInReadOnlyContent.apply(this.editor_.getSelectionManager().getSelection()) &&
    !this.editor_.getReadOnlyState().readOnly;
};

InsertFromMenuAction.prototype.actionPerformed = function (callback) {
  var csmenu = this.csmenu_;
  if (csmenu.isOrWasRecentlyVisible()) {
    csmenu.hide();
  } else {
    csmenu.showRecentGrid();
  }
  callback && callback();
};

InsertFromMenuAction.prototype.insertCharacters_ = function (characters) {
  var actionsExecutor = this.editor_.getEditingSupport().actionsExecutor;
  var actionsManager = this.editor_.getActionsManager();

  actionsExecutor.executeAction(new sync.actions.Action({
    execute: () => {
      return new Promise(resolve => {
        actionsManager.invokeOperation(
          'ro.sync.ecss.extensions.commons.operations.InsertOrReplaceTextOperation',
          {text: characters},
          function () {
            addNewRecentCharacters([characters]);
            resolve(characters);
          }
        );
      });
    }
  }));
};

InsertFromMenuAction.prototype.init = function () {
  window.charsToBeInserted = [];
  this.csmenu_ = new RecentCharactersGrid(this.displayDialog_.bind(this), this.insertCharacters_.bind(this));
};

/**
 * Create the charpicker dialog.
 * @private
 */
InsertFromMenuAction.prototype.createCharPickerDialog_ = function () {
  var cD = goog.dom.createDom;
  this.nameInput_ = getNameInput();
  this.foundByNameList_ = cD('div', { id: 'foundByNameList', tabIndex: 0, role: 'grid' });
  var charPickerAdvanced = cD('div', { id: 'charpicker-advanced' });
  var contentShownClass = 'charp-show';

  var tabContainer = cD('div', {style: 'display: flex; flex-direction: column; flex-grow: 1; min-height: 0;'},
    cD('div', {id: 'charp-tabbar', className: 'goog-tab-bar goog-tab-bar-top' },
      cD('div', {className: 'goog-tab goog-tab-selected', 'data-target-id': 'charpicker-search-by-name'},
        tr(msgs.BY_NAME_)),
      cD('div', { className: 'goog-tab', 'data-target-id': 'charpicker-advanced'},
        cD('span', {title: tr(msgs.BY_CATEGORIES_OR_HEX_CODE_)}, tr(msgs.BY_CATEGORIES_)))
    ),
    cD('div', {id: 'charp-tabbar-content'},
      cD('div', { id: 'charpicker-search-by-name', className: contentShownClass },
        cD('div', { style: 'line-height: 1.2em; height: 57px; flex-shrink: 0;' },
          cD('label', { for: 'searchName', style: 'white-space: nowrap' }, tr(msgs.NAME_OF_CHARACTER_)),
          this.nameInput_
        ),
        this.foundByNameList_,
        cD('div', { id: 'previewCharacterDetails'})
      ),
      charPickerAdvanced
    )
  );

  this.charPickerIframe_ = cD('iframe', {
    id: 'charpickeriframe',
    src:  this.getIframeUrl_()
  });

  var dialog = this.getDialog();
  var dialogElement_ = dialog.getElement();
  dialogElement_.id = 'charPicker';
  goog.dom.appendChild(dialogElement_, tabContainer);

  var tabBar = new goog.ui.TabBar();
  tabBar.decorate(document.querySelector('#charp-tabbar'));

  goog.events.listen(tabBar, goog.ui.Component.EventType.SELECT,
    function(e) {
      var tabSelected = e.target.getElement();
      var showContentId = goog.dom.dataset.get(tabSelected, 'targetId');
      if (showContentId) {
        var contentElement = goog.dom.getElement(showContentId);
        var toHide = document.querySelectorAll('.' + contentShownClass);
        for (var i = 0; i < toHide.length; i++) {
          goog.dom.classlist.remove(toHide[i], contentShownClass);
        }
        goog.dom.classlist.add(contentElement, contentShownClass);
      }
  });

  dialogElement_.parentElement.classList.add("dialogContainer");

  var gEvents = goog.events.EventType;
  goog.events.listen(this.foundByNameList_, [ gEvents.MOUSEOVER, gEvents.CLICK ], updateCharPreview);
  goog.events.listen(this.nameInput_, gEvents.KEYDOWN, goog.bind(this.findCharOnEnter_, this));
  goog.events.listen(this.nameInput_, gEvents.INPUT, goog.bind(this.findCharAfterInput_, this));

  charPickerAdvanced.appendChild(this.charPickerIframe_);



  var readOnlyInput = getReadOnlyInput();
  var removeLastCharButton = getRemoveLastCharButton();
  var div = cD('div', { 'id': 'selectedCharsWrapper' },
    cD('label', { style:'display: inline-block; margin-right:10px;', for: readOnlyInputId }, tr(msgs.SELECTED_CHARACTERS_)),
    cD('span', {style: 'display: inline-flex; white-space: nowrap;'},
      readOnlyInput,
      removeLastCharButton)
  );

  goog.dom.appendChild(dialog.getElement(), div);

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
      this.insertCharacters_(stringifiedText);
    }
  }
};

/**
 * Display the dialog.
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

/**
 * Refresh the dialog.
 * @private
 */
InsertFromMenuAction.prototype.refreshCharPickerDialog_ = function () {
  var lastCharacterSearchItemName = 'lastCharacterSearch';
  // if dialog has been populated already just reset the textboxes
  this.readOnlyInput_.value = '';
  var dialogElement_ = this.dialog_.getElement();
  var searchbox = dialogElement_.querySelector('#searchName');
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
    var warningElement = dialogElement_.querySelector('.smallSpin');
    if (warningElement) {
      this.foundByNameList_ && this.foundByNameList_.removeChild(warningElement);
    }
  }

  var iframeContent = (this.charPickerIframe_.contentWindow || this.charPickerIframe_.contentDocument);
  if (iframeContent.document) {
    iframeContent = iframeContent.document;
    iframeContent.querySelector('.goog-char-picker-input-box').value = '';
  } else {
    console.warn('Failed to get iframe contents.');
  }
};

/**
 * Callback when the search by name results come.
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
      localStorage.setItem(lastCharacterSearchItemName, this.nameInput_.value);
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

/**
 * Find character by name handling.
 * @private
 */
goog.require('goog.net.XhrIo');
InsertFromMenuAction.prototype.findCharByName_ = function () {
  var name = this.nameInput_.value;
  // clear placeholder if set, last search is no longer relevant.
  var searchBox = this.dialog_.getElement().querySelector('#searchName');
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

/**
 * Creates a the dialog if not already created and returns it.
 */
InsertFromMenuAction.prototype.getDialog = function() {
  if(!this.dialog_) {
    this.dialog_ = workspace.createDialog();
    this.dialog_.setTitle(tr(msgs.INSERT_SPECIAL_CHARACTERS_));
    this.dialog_.setPreferredSize(420, 600);
    this.dialog_.setResizable(true);
  }

  return this.dialog_;
};

/** @override */
InsertFromMenuAction.prototype.dispose = function() {
  this.dialog_ && this.dialog_.dispose();
  this.csmenu_ && this.csmenu_.dispose();
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
  var iframeUrl = '../plugin-resources/' + this.pluginResourcesFolder_ + '/charpicker.html';
  var removeCategories = sync.options.PluginsOptions.getClientOption('charp.remove_categories');
  if (removeCategories) {
    iframeUrl += '?remove-categories=' + encodeURIComponent(removeCategories);
  }
  return iframeUrl;
};

InsertFromMenuAction.prototype.getLargeIcon = function () {
  return sync.util.computeHdpiIcon('../plugin-resources/' + this.pluginResourcesFolder_ + '/InsertFromCharactersMap24.png');
};
