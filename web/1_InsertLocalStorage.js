/**
 * Update the recently used characters list with the characters set by the user.
 * @param {Array<String>} defaultRecentCharacters The default character list.
 * @param {Array<String>} userSelectedDefaults The default character list set by the user.
 */
function updateRecentlyUsedCharacters(defaultRecentCharacters, userSelectedDefaults) {
  var currentRecentChars = getRecentChars();
  goog.array.equals(defaultRecentCharacters, currentRecentChars);
  if (currentRecentChars.length === 0 || goog.array.equals(defaultRecentCharacters, currentRecentChars)) {
    // Recent characters are in their default order, just push new defaults in front.
    addNewRecentCharacters(userSelectedDefaults.concat(defaultRecentCharacters));
  } else {
    // Keep any characters that were used, add new defaults, keep some of the old defaults as padding if needed.
    // The order will be: recently used > new defaults > old defaults.
    var usedChars = [];
    var i;
    for (i = 0; i < currentRecentChars.length; i++) {
      var currentChar = currentRecentChars[i];
      // If character was not in the default characters set, it is definitely used.
      var currentCharIndexInDefaults = defaultRecentCharacters.indexOf(currentChar);
      if (currentCharIndexInDefaults === -1) {
        usedChars.push(currentChar);
        // In case all used characters are new, all should be kept - do nothing.
      } else {
        var j = i + 1;
        var nextChar = currentRecentChars[j];
        if (nextChar) {
          var possibleUsedCharacters = [currentChar];
          var gotToEnd = false;
          var defaultOrderKept;
          var nextCharIndexInDefaults;
          do {
            nextCharIndexInDefaults = defaultRecentCharacters.indexOf(nextChar);
            defaultOrderKept = currentCharIndexInDefaults + 1 === nextCharIndexInDefaults;
            possibleUsedCharacters.push(nextChar);
            j++;
            if (j >= currentRecentChars.length) {
              gotToEnd = true;
              break;
            }
            currentChar = nextChar;
            currentCharIndexInDefaults = defaultRecentCharacters.indexOf(currentChar);
            nextChar = currentRecentChars[j];
          } while (!gotToEnd && defaultOrderKept && nextCharIndexInDefaults !== -1);
          // If the order was broken, then the chars were used.
          if (!gotToEnd) {
            usedChars = goog.array.concat(usedChars, possibleUsedCharacters);
            defaultRecentCharacters = goog.array.filter(defaultRecentCharacters, function (c) { return possibleUsedCharacters.indexOf(c) === -1 })
          } else {
            // If the order was kept the same until the end, the final characters were all from defaults, they can be replaced.
            // Order will be recently used > new defaults > old defaults.
            defaultRecentCharacters = userSelectedDefaults.concat(defaultRecentCharacters);
            defaultRecentCharacters = usedChars.concat(defaultRecentCharacters);
            addNewRecentCharacters(defaultRecentCharacters);
            break;
          }
        }
      }
    }
  }
}

/**
 * Get the default recent characters set by the user, if any were set.
 * @returns {Array} The array of default recent characters set by the user.
 */
function getUserSelectedDefaults () {
  var userSelectedDefaults = [];
  try {
    userSelectedDefaults = JSON.parse(sync.options.PluginsOptions.getClientOption('charp.recently.used.characters'));
    if (goog.isArray(userSelectedDefaults)) {
      var userSelectedDefaultsTemp = [];
      goog.array.forEach(userSelectedDefaults, function (e) {
        userSelectedDefaultsTemp.push(String.fromCharCode(e));
      });
      userSelectedDefaults = userSelectedDefaultsTemp;
    }
  } catch (e) {
    console.error('Failed to parse default recently used characters', e);
  }
  return userSelectedDefaults;
}

/**
 * Add the new characters to the list of recent characters.
 * @param {Array<String>} characters The characters to set as recent characters.
 */
function setRecentChars(characters) {
  if (localStorageUsable) {
    try {
      localStorage.setItem(recentCharsItemName, JSON.stringify(characters));
    } catch (e) {
      console.warn(e);
    }
  }
}

/**
 * Get recent characters from localStorage.
 * @returns {Array<String>} The list of recently used characters.
 */
function getRecentChars() {
  var recentChars = [];
  if (localStorageUsable) {
    try {
      var itemFromStorage = localStorage.getItem(/*newR*/recentCharsItemName);
      if (itemFromStorage) {
        recentChars = JSON.parse(itemFromStorage);
      }
    } catch (e) {
      console.warn(e);
    }
  }
  return recentChars;
}
