goog.provide('charpicker.Main');

goog.require('goog.i18n.CharPickerData');
goog.require('goog.i18n.uChar.LocalNameFetcher');
goog.require('goog.ui.CharPicker');

var removeCategory = function (charPickerData, categoryName) {
  var categoryIndex = charPickerData.categories.indexOf(categoryName);
  if (categoryIndex !== -1) {
    charPickerData.categories.splice(categoryIndex, 1);
    charPickerData.charList.splice(categoryIndex, 1);
    charPickerData.subcategories.splice(categoryIndex, 1);
  }
  return charPickerData;
};

var addCategory = function (charPickerData, categoryName, subcategories, charList, index) {
  if (!categoryName || !subcategories || !charList || charList.length === 0) {
    console.warn('Invalid character picker data.')
  }
  if (index || index === 0) {
    charPickerData.categories.splice(index, 0, categoryName);
    charPickerData.subcategories.splice(index, 0, subcategories);
    charPickerData.charList.splice(index, 0, charList);
  } else {
    charPickerData.categories.push(categoryName);
    charPickerData.subcategories.push(subcategories);
    charPickerData.charList.push(charList);
  }

  return charPickerData;
};

window["initCharPicker"] = function () {
  var cD = goog.dom.createDom;
  var insertBefore = goog.dom.insertSiblingBefore;

  var charPickerData = new goog.i18n.CharPickerData();
  // Remove one of the default categories.
  /*charPickerData = removeCategory(charPickerData, 'Emoji');*/

  // Add a custom category.
  /*var charList = [
    ["\u20ac", "\u00a3", "\u00a5", "\u00a2", "\u00a9", "\u00ae", "\u2122", "\u03b1", "\u03b2", "\u03c0", "\u03bc"],
    ["\u03a3", "\u03a9", "\u2264", "\u2265", "\u2260", "\u221e", "\u00b1", "\u00f7", "\u00d7", "\u21d2"]
  ];
  charPickerData = addCategory(charPickerData, 'custom', ['one', 'two'], charList, 5);*/
  
  var picker = new goog.ui.CharPicker(
    charPickerData,
    new goog.i18n.uChar.LocalNameFetcher());

  // Make it easier to add custom character categories.
  var decompressor = picker.decompressor_;
  var toCharList = decompressor.toCharList;
  decompressor.toCharList = function (str) {
    if (goog.isArray(str)) {
      // Already decompressed.
      return str;
    } else {
      return toCharList.call(decompressor, str);
    }
  };
  
  var el = document.getElementById('char-picker');
  picker.render(el);

  var parent = window.parent;
  parent["charsToBeInserted"] = [];
  var output = parent.document.getElementById('special_characters');

  // Action on selection
  var selectionAction = function () {
    var selectedChar = picker.getSelectedChar();
    output.value += selectedChar;
    parent["charsToBeInserted"].push(selectedChar);
  };

  var dropdowns = document.querySelectorAll(".goog-inline-block.goog-menu-button");
  var categoriesBar = cD("div", {id: "categories"},
    cD("div", { id: "label-categories" }, "Categories:"),
    cD("div", { id: 'dropdown-wrapper' }, dropdowns)
  );

  insertBefore(categoriesBar,
    document.getElementsByClassName("goog-char-picker")[0].firstChild);

  insertBefore(
    cD('span', { id: 'label-hexcode' }, "Hex code:"),
    document.querySelector(".goog-char-picker-uplus")
  );


  // Get selected locale from the char picker.
  goog.events.listen(picker, 'action', selectionAction);
};