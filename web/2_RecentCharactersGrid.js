var RecentCharactersGrid = function (displayDialog, insertCharactersFn) {
  goog.ui.PopupMenu.call(this);

  this.actLikeDropdown_();
  this.addMoreSymbolsButton_(displayDialog);

  this.render();
  goog.dom.setProperties(this.getElement(), {'id': 'pickermenu'});

  // add the characters grid before the "more symbols..." button
  this.insertCharacters_ = insertCharactersFn;
  this.addGridContainer_();
};
goog.inherits(RecentCharactersGrid, goog.ui.PopupMenu);

RecentCharactersGrid.prototype.addMoreSymbolsButton_ = function (displayDialog) {
  var moreSymbols = new goog.ui.MenuItem(tr(msgs.MORE_SYMBOLS_) + '...');
  this.addChild(moreSymbols, true);
  moreSymbols.setId('moreSymbolsButton');
  goog.events.listen(moreSymbols, goog.ui.Component.EventType.ACTION, displayDialog);
};

RecentCharactersGrid.prototype.actLikeDropdown_ = function () {
  // Add classes so charpicker button gets the same styles as other dropdowns from the toolbar.
  var toolbarButton = this.charPickerToolbarButton_;
  if (!toolbarButton) {
    toolbarButton = document.querySelector('[name=' + insertSpecialCharActionId + ']');
    this.charPickerToolbarButton_ = toolbarButton;
  }
  var gComponentEvent = goog.ui.Component.EventType;
  goog.events.listen(this, [gComponentEvent.SHOW, gComponentEvent.HIDE], e => {
    var className = 'goog-toolbar-menu-button-open';
    if (e.type === gComponentEvent.SHOW) {
      toolbarButton.classList.add(className);
    } else {
      toolbarButton.classList.remove(className);
    }
  });

  this.setToggleMode(true);
};

/**
 * overwrite the handleBlur function to prevent the popup from closing after inserting a character
 * @override
 */
RecentCharactersGrid.prototype.handleBlur = goog.nullFunction;

RecentCharactersGrid.prototype.addGridContainer_ = function () {
  var parentElement = this.getElement();
  var moreSymbolsButton = parentElement.firstChild;

  this.recentCharactersGrid_ = goog.dom.createDom('div', {
    className: 'goog-char-picker-grid recentCharactersGrid',
    id: 'simplePickerGrid'
  });
  goog.events.listen(this.recentCharactersGrid_, goog.events.EventType.CLICK, this.quickInsertCharFromGrid_.bind(this));
  parentElement.insertBefore(this.recentCharactersGrid_, moreSymbolsButton);
};

RecentCharactersGrid.prototype.showRecentGrid = function () {
  var characters = getRecentChars();
  this.displayRecentCharacters_(characters);
  this.showAtElement(
    this.charPickerToolbarButton_,
    goog.positioning.Corner.BOTTOM_START);
};

/**
 * Render the recent characters grid.
 * @param {Array<String>} characters The characters to display in the grid.
 * @private
 */
RecentCharactersGrid.prototype.displayRecentCharacters_ = function (characters) {
  /* remove all recent characters to add the new ones again */
  goog.dom.removeChildren(this.recentCharactersGrid_);

  /* Add the characters to the container */
  for (var character of characters) {
    this.recentCharactersGrid_.appendChild(
      goog.dom.createDom(
        'div', { className: 'goog-inline-block goog-flat-button char-select-button', tabIndex: 0 },
        character)
    );
  }
};

/**
 * Insert a special character from the quick insert grid.
 * @param {goog.events.EventType.CLICK} e The click event.
 * @private
 */
RecentCharactersGrid.prototype.quickInsertCharFromGrid_ = function (e) {
  if (goog.dom.classlist.contains(e.target, 'goog-flat-button')) {
    this.insertCharacters_([e.target.textContent]);
  }
};