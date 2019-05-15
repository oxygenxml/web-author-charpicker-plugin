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

  var removeCategoriesOption = getURLParameter('remove-categories');
  var categoriesToRemove = decodeURIComponent(removeCategoriesOption).split(',');

  var charPickerData = new goog.i18n.CharPickerData();

  // -------- Remove categories ---------------
  goog.array.forEach(categoriesToRemove, function (category) {
    removeCategory(charPickerData, category.trim());
  });

  // -------- Translate category names --------
  if (window['charpickerCategories']) {
    var customCategories = JSON.parse(window['charpickerCategories']);
    translateCategories(charPickerData, customCategories);
  }

  var picker = new goog.ui.CharPicker(
    charPickerData,
    new goog.i18n.uChar.LocalNameFetcher());

  // Make it easier to add custom character categories.
  var decompressor = null;
  for (var prop in picker) {
    if (picker[prop] instanceof goog.i18n.CharListDecompressor) {
      decompressor = picker[prop];
      break;
    }
  }
  if (decompressor) {
    var toCharList = decompressor.toCharList;
    decompressor.toCharList = function (str) {
      if (goog.isArray(str)) {
        // Already decompressed.
        return str;
      } else {
        return toCharList.call(decompressor, str);
      }
    };
  }

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

  // Get the UI messages ready.
  if (window['msgs']) {
    window['msgs'] = JSON.parse(window['msgs']);
  }
  var categoriesLabel = getTranslatedLabel('Categories', 'Categories:');
  var hexCodeLabel = getTranslatedLabel('Hex_code', 'Hex code:');

  var dropdowns = document.querySelectorAll(".goog-inline-block.goog-menu-button");
  var categoriesBar = cD("div", {id: "categories"},
    cD("div", { id: "label-categories" }, categoriesLabel),
    cD("div", { id: 'dropdown-wrapper' }, dropdowns)
  );

  insertBefore(categoriesBar, document.getElementsByClassName("goog-char-picker")[0].firstChild);

  // Make sure these inline elements will only wrap together.
  var uplus = document.querySelector(".goog-char-picker-uplus");
  var input = document.querySelector('.goog-char-picker-input-box');
  var okButton = document.querySelector('.goog-char-picker-okbutton');

  insertBefore(
    cD('span', { id: 'label-hexcode' }, hexCodeLabel),
    uplus
  );

  var noWrapContainer = cD('span', { id: 'nowrap-inlines' });
  insertBefore(
    noWrapContainer,
    uplus
  );

  goog.dom.append(noWrapContainer,
    uplus,
    input,
    okButton
  );



  // Get selected locale from the char picker.
  goog.events.listen(picker, 'action', selectionAction);
};

/**
 * Replace default category names with translated names.
 * @param charPickerData The default charpicker data object.
 * @param customCategories Object containing translated category/subcategory names, received from the server.
 */
function translateCategories(charPickerData, customCategories) {
  for (var category in customCategories) {
    var originalName = category.split('|')[0];
    var translatedName = category.split('|')[1];

    var decoded = decodeTagName(originalName);
    var categoryFoundIndex = charPickerData.categories.indexOf(decoded);
    // Give Format & Whitespace another chance.
    if (decoded === 'Format and Whitespace') {
      categoryFoundIndex = charPickerData.categories.indexOf('Format & Whitespace');
    }
    if (categoryFoundIndex !== -1) {
      charPickerData.categories[categoryFoundIndex] = translatedName;

      // Translate the subcategories.
      for (var subcategoryIndex = 0; subcategoryIndex < customCategories[category].length; subcategoryIndex++) {
        var subcategoryString = customCategories[category][subcategoryIndex];
        originalName = subcategoryString.split('|')[0];
        translatedName = subcategoryString.split('|')[1];

        var decodedSubcat = decodeTagName(originalName);
        // Remove category name from it.
        decodedSubcat = decodedSubcat.slice(decodedSubcat.indexOf(decoded) + decoded.length + 1);

        var subcatFoundIndex = charPickerData.subcategories[categoryFoundIndex].indexOf(decodedSubcat);
        if (subcatFoundIndex !== -1) {
          charPickerData.subcategories[categoryFoundIndex][subcatFoundIndex] = translatedName;
        }
      }
    }
  }
}

function getURLParameter(name) {
  var urlParams = window.location.search.substring(1).split('&');
  var paramValue = null;
  for(var i = 0; i < urlParams.length; i++) {
    var fullParam = urlParams[i].split('=');
    var param = {
      name: fullParam[0],
      value: fullParam[1]
    };
    if(param.name === name) {
      paramValue = param.value;
      break;
    }
  }
  return paramValue;
}

function decodeTagName(tagName) {
  var decoded = tagName.split('_');
  decoded = decoded.slice(1);
  decoded = decoded.join(' ');
  return decoded;
}

function getTranslatedLabel(tagName, defaultValue) {
  var translatedMessageFromServer = defaultValue;
  var msgs = window['msgs'];
  if (msgs && msgs[tagName]) {
    translatedMessageFromServer = msgs[tagName] + ':';
  }
  return translatedMessageFromServer;
}
