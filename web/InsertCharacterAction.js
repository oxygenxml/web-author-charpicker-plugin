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

  this.tabSelectedClass_ = 'charp-show';

  this.lastCharacterSearchItemName_ = 'lastCharacterSearch';
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

/**
 * @param {Array.<string>} characters
 * @private
 */
InsertFromMenuAction.prototype.insertCharacters_ = function (characters) {
  var actionsExecutor = this.editor_.getEditingSupport().actionsExecutor;
  var actionsManager = this.editor_.getActionsManager();

  actionsExecutor.executeAction(new sync.actions.Action({
    execute: () => {
      return new Promise(resolve => {
        actionsManager.invokeOperation(
          'ro.sync.ecss.extensions.commons.operations.InsertOrReplaceTextOperation',
          {text: characters.join('')},
          function () {
            addNewRecentCharacters(characters.splice(0).reverse());
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

  var tabContainer = cD('div', {style: 'display: flex; flex-direction: column; flex-grow: 1; min-height: 0;'},
    cD('div', {id: 'charp-tabbar', className: 'goog-tab-bar goog-tab-bar-top' },
      cD('div', {className: 'goog-tab goog-tab-selected', 'data-target-id': 'charpicker-search-by-name'},
        tr(msgs.BY_NAME_)),
      cD('div', { className: 'goog-tab', 'data-target-id': 'charpicker-advanced'},
        cD('span', {title: tr(msgs.BY_CATEGORIES_OR_HEX_CODE_)}, tr(msgs.BY_CATEGORIES_)))
    ),
    cD('div', {id: 'charp-tabbar-content'},
      cD('div', { id: 'charpicker-search-by-name', className: this.tabSelectedClass_ },
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

  goog.events.listen(tabBar, goog.ui.Component.EventType.SELECT, goog.bind(this.selectTab_, this));

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
    for(var char of charsToBeInserted){
      readOnlyInput.value += char;
    }
  });
  this.readOnlyInput_ = readOnlyInput;
};

/**
 * @param {goog.events.Event} e The tab select event.
 * @private
 */
InsertFromMenuAction.prototype.selectTab_ = function(e) {
  var tabSelected = e.target.getElement();
  var showContentId = goog.dom.dataset.get(tabSelected, 'targetId');
  if (showContentId) {
    var contentElement = goog.dom.getElement(showContentId);
    var previouslySelectedTabs = document.querySelectorAll('.' + this.tabSelectedClass_);
    for (var tab of previouslySelectedTabs) {
      goog.dom.classlist.remove(tab, this.tabSelectedClass_);
    }
    goog.dom.classlist.add(contentElement, this.tabSelectedClass_);
  }
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
      this.insertCharacters_(dialogInsertChars);
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
  // if dialog has been populated already just reset the textboxes
  this.readOnlyInput_.value = '';
  this.setLastSearchAsPlaceholder_();
  this.removeWarningFromLastSearch_();
  this.resetHexInput_();
};

/**
 * @private
 */
InsertFromMenuAction.prototype.setLastSearchAsPlaceholder_ = function () {
  var dialogElement = this.dialog_.getElement();
  var searchbox = dialogElement.querySelector('#searchName');
  searchbox.value = '';
  var lastCharacterSearch = getFromLocalStorage(this.lastCharacterSearchItemName_);
  if(lastCharacterSearch !== null){
    searchbox.setAttribute("placeholder", lastCharacterSearch);
  }
};

/**
 * @private
 */
InsertFromMenuAction.prototype.removeWarningFromLastSearch_ = function () {
  // Warning was shown for the last search so remove it.
  var warningElement = this.dialog_.getElement().querySelector('.smallSpin');
  if (warningElement) {
    goog.dom.removeNode(warningElement);
  }
};

/**
 * Reset value in the hex input box (in "by categories" view)
 * @private
 */
InsertFromMenuAction.prototype.resetHexInput_ = function () {
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
      localStorage.removeItem(this.lastCharacterSearchItemName_);
    } catch (e) {
      console.warn(e);
    }
  } else {
    this.refreshSymbols_(obj);
    try {
      localStorage.setItem(this.lastCharacterSearchItemName_, this.nameInput_.value);
    } catch (e) {
      console.warn(e);
    }
  }
};

/**
 * Add symbol elements to the "find by name" results container.
 * @param {object} obj The object containing symbol results for the find by name query.
 */
InsertFromMenuAction.prototype.refreshSymbols_ = function (obj) {
  goog.dom.removeChildren(this.foundByNameList_);
  for (var code in obj) {
    if (obj.hasOwnProperty(code)) {
      this.renderSymbolCard_(this.foundByNameList_, code, obj[code]);
    }
  }
};

/**
 * @param {HTMLElement} container
 * @param {string} code
 * @param {string} charName
 * @return {Element}
 * @private
 */
InsertFromMenuAction.prototype.renderSymbolCard_ = function (container, code, charName) {
  container.appendChild(goog.dom.createDom('div', {
      className: 'characterListSymbol',
      'data-symbol-name': this.capitalizeWords_(charName),
      'data-symbol-hexcode': code
    },
    String.fromCharCode(parseInt(code, 16))
  ));
};

/**
 * Capitalize the words in the character description.
 * @param {string} text The original character description.
 * @returns {string} Character description with capitalized words.
 */
InsertFromMenuAction.prototype.capitalizeWords_ = function (text) {
  var splitText = text.toLowerCase().split(' ');
  var splitTextCapitalized = [];
  for(var part of splitText) {
    splitTextCapitalized.push(part.substr(0, 1).toUpperCase() + part.substring(1));
  }
  return splitTextCapitalized.join(' ');
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
