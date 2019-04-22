/**
 * Local storage usable status.
 * @type {boolean}
 */
var localStorageUsable = typeof (Storage) !== 'undefined';
/**
 * Quickly change urls that have the plugin name hardcoded.
 * @type {string}
 */
var pluginResourcesFolder = 'char-picker';

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
 * Name of localStorage item for last character search.
 * @type {string}
 */
var lastCharacterSearchItemName = 'lastCharacterSearch';

/**
 * Default recently used characters.
 * @type {string[]}
 */
var defaultRecentCharacters = ["\u20ac", "\u00a3", "\u00a5", "\u00a2", "\u00a9", "\u00ae", "\u2122", "\u03b1", "\u03b2", "\u03c0", "\u03bc",
  "\u03a3", "\u03a9", "\u2264", "\u2265", "\u2260", "\u221e", "\u00b1", "\u00f7", "\u00d7", "\u21d2"];

/**
 * The id of the readonly input used to preview the special characters that are about to be inserted.
 * @type {string}
 */
var readOnlyInputId = 'special_characters';