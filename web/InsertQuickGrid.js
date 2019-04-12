/**
 * Insert character from grid on click.
 * @param editor The editor.
 * @param {goog.events.EventType.CLICK} e The click event.
 */
function quickInsertCharFromGrid (editor, e) {
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

/**
 * After new characters have been inserted, add them to the recent characters grid.
 * Make sure recent characters are the expected length.
 * Trim if longer, fill with defaults if shorter.
 * @param {Array<String>} newCharacters The characters which were inserted.
 */
function addNewRecentCharacters(newCharacters) {
  var characters = newCharacters.concat(getRecentChars());
  goog.array.removeDuplicates(characters);
  if (characters.length < maxRecentChars) {
    characters = characters.concat(defaultRecentCharacters);
  }
  characters = characters.slice(0, maxRecentChars);
  setRecentChars(characters);
}

/**
 * Render the recent characters grid.
 * @param {Array<String>} characters The characters to display in the grid.
 */
function displayRecentCharacters(characters) {
  /* selector for targeting the recent characters container */
  var container = document.querySelector('.recentCharactersGrid');
  var i;

  /* remove all recent characters to add the new ones again */
  goog.dom.removeChildren(container);

  /* Add the characters to the container */
  for (i = 0; i < characters.length; i++) {
    container.appendChild(
      goog.dom.createDom(
        'div', { className: 'goog-inline-block goog-flat-button char-select-button', tabIndex: 0 },
        characters[i])
    );
  }
}
