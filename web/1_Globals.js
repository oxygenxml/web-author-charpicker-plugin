
/**
 * The action id.
 * @type {string}
 */
var insertSpecialCharActionId = 'insertfrommenu';

/**
 * Max recent characters shown in the quick insert grid.
 * @type {number}
 */
var maxRecentChars = 21;

/**
 * Name of localStorage items which kept recently used characters.
 * @type {string}
 * @deprecated
 */
var recentCharsItemName = 'recentlyUsedCharacters';

/**
 * Name of localStorage item which only keeps characters which were used.
 * @type {string}
 */
var usedCharsItemName = 'usedCharacters';

/**
 * Name of localStorage item which only keeps characters titles which were used.
 * @type {string}
 */
var usedCharsItemTitles = 'usedCharactersTitles';

/**
 * Default recently used characters.
 * @type {string[]}
 */
var defaultRecentCharacters = ["\u20ac", "\u00a3", "\u00a5", "\u00a2", "\u00a9", "\u00ae", "\u2122",
  "\u03b1", "\u03b2", "\u03c0", "\u03bc", "\u03a3", "\u03a9", "\u2264", "\u2265", "\u2260", "\u221e",
  "\u00b1", "\u00f7", "\u00d7", "\u21d2"];

/**
 * Names of the default recently used characters, from en_unicodechars.properties.
 * @type {Object.<string, string>}
 */
var defaultRecentCharacterNames = {
  "\u20ac": "Euro Sign",
  "\u00a3": "Pound Sign",
  "\u00a5": "Yen Sign",
  "\u00a2": "Cent Sign",
  "\u00a9": "Copyright Sign",
  "\u00ae": "Registered Sign",
  "\u2122": "Trade Mark Sign",
  "\u03b1": "Greek Small Letter Alpha",
  "\u03b2": "Greek Small Letter Beta",
  "\u03c0": "Greek Small Letter Pi",
  "\u03bc": "Greek Small Letter Mu",
  "\u03a3": "Greek Capital Letter Sigma",
  "\u03a9": "Greek Capital Letter Omega",
  "\u2264": "Less-than Or Equal To",
  "\u2265": "Greater-than Or Equal To",
  "\u2260": "Not Equal To",
  "\u221e": "Infinity",
  "\u00b1": "Plus-minus Sign",
  "\u00f7": "Division Sign",
  "\u00d7": "Multiplication Sign",
  "\u21d2": "Rightwards Double Arrow"
};

/**
 * The id of the readonly input used to preview the special characters that are about to be inserted.
 * @type {string}
 */
var readOnlyInputId = 'special_characters';