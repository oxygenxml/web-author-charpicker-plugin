/**
 * Get the read-only input used to preview characters to be inserted.
 * @returns {Element} The characters preview input element.
 */
function getReadOnlyInput() {
  var readOnlyInput = goog.dom.createDom('input', {
    id: readOnlyInputId,
    className: 'charpicker-input',
    type: 'text',
    name: 'charsToBeInserted'
  });
  readOnlyInput.setAttribute('readonly', 'true');
  readOnlyInput.setAttribute('onFocus', 'this.setSelectionRange(0, this.value.length)');
  return readOnlyInput;
}

/**
 * Get the button which removes the last character from the "to be inserted" list.
 * @returns {Element} The remove last character button element.
 */
function getRemoveLastCharButton() {
  return goog.dom.createDom('button', {
    id: 'removeLastChar',
    className: 'goog-button goog-char-picker-okbutton',
    title: tr(msgs.REMOVE_LAST_CHARACTER_),
    value: ''
  })
}

/**
 * Get the input used to search for characters by name.
 * @returns {Element} The search by name input element.
 */
function getNameInput() {
  return goog.dom.createDom('input', {
      id: 'searchName',
      className: 'charpicker-input',
      type: 'text',
      name: 'searchName'
    })
}

/**
 * Display details about the currently hovered symbol.
 * @param e
 */
function updateCharPreviewInternal(e) {
  var target = e.target;
  var symbol = target.textContent;
  var symbolCode = target.getAttribute('data-symbol-hexcode');
  var symbolName = target.getAttribute('data-symbol-name');

  var previewCharacterDetails = document.getElementById('previewCharacterDetails');

  goog.dom.removeChildren(previewCharacterDetails);
  goog.dom.append(previewCharacterDetails,
    goog.dom.createDom('div', {id: 'previewSymbol'}, symbol),
    goog.dom.createDom('div', { id: 'previewSymbolName' },
      symbolName,
      goog.dom.createDom('span',
        { style: 'white-space: nowrap; vertical-align: top' },
        ' (' + symbolCode + ')')));
}

/**
 * Update character details, also add it to to be inserted if clicked.
 * @param {goog.events.EventType.CLICK | goog.events.EventType.MOUSEOVER} e
 */
function updateCharPreview(e) {
  if(goog.dom.classlist.contains(e.target, 'characterListSymbol')) {
    updateCharPreviewInternal(e);
    // If update triggered with a click, also add the character to be inserted.
    if (e.type === goog.events.EventType.CLICK) {
      var symbol = e.target.textContent;
      charsToBeInserted.push(symbol);
      var insertedCharactersInput = document.getElementById(readOnlyInputId);
      insertedCharactersInput.value += symbol;
      insertedCharactersInput.focus();    
    }
  }
}
