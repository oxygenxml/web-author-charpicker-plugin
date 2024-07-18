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
    console.warn('Invalid character picker data.');
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
      for (var customSubCategory of customCategories[category]) {
        originalName = customSubCategory.split('|')[0];
        translatedName = customSubCategory.split('|')[1];
        
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
  for(var urlParam of urlParams) {
    var fullParam = urlParam.split('=');
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
