/* Un-comment this file in charpicker.html to work with default charpickerdata translation. */
var getTagName = function (dirtyTagName) {
  var tagName = dirtyTagName.split(' ').join('_');
  tagName = tagName.replace('&', 'and');
  return tagName;
};

var makeXmlEntryWithEnglishMessage = function (tagName, message) {
  return '    <key value="' + tagName + '">\n' +
    '        <comment>Name of Unicode block (set of special characters).</comment>\n' +
    '        <val lang="en_US">' + message + '</val>\n' +
    '        <val lang="de_DE">' + message + '</val>\n' +
    '        <val lang="fr_FR">' + message + '</val>\n' +
    '        <val lang="ja_JP">' + message + '</val>\n' +
    '        <val lang="nl_NL">' + message + '</val>\n' +
    '    </key>\n'
};

var replaceLastComma = function (str) {
  var lastCommmaIndex = str.lastIndexOf(',');
  str = str.substr(0, lastCommmaIndex) + str.substr(lastCommmaIndex + 1);
  return str;
};

window.convertCharPickerData = function () {

  var charPickerData = new goog.i18n.CharPickerData();
  window.replaceLastComma = replaceLastComma;

  var writeJava = '';
  var categories_list = '';
  var subcategories_parent = 'List<List<String>> initialSubcategories = Arrays.asList(\n';
  var output = '';
  var skippedCategories = [];
  for (var category_index = 0; category_index<charPickerData.categories.length; category_index++) {
    if (charPickerData.categories[category_index].indexOf('Han') === -1) {
      var tt = getTagName('c_' + charPickerData.categories[category_index]);
      output += makeXmlEntryWithEnglishMessage(tt, charPickerData.categories[category_index]);
      categories_list += '"' + tt + '",\n';

      var listOfSubcategories = "";
      for (var subcat_index = 0; subcat_index < charPickerData.subcategories[category_index].length; subcat_index++) {
        var sc = getTagName('sc_' + charPickerData.categories[category_index] + '_' + charPickerData.subcategories[category_index][subcat_index]);
        output += makeXmlEntryWithEnglishMessage(sc, charPickerData.subcategories[category_index][subcat_index]);

        listOfSubcategories += '"' + sc + '",\n';
      }

      listOfSubcategories = replaceLastComma(listOfSubcategories);
      subcategories_parent += '  Arrays.asList(' + listOfSubcategories + '),\n'

    } else {
      skippedCategories.push(charPickerData.categories[category_index])
    }
  }
  console.log('categories xml: \n', output);
  if (skippedCategories.length > 0) {
    console.log('Skipped categories: ', skippedCategories);
  }
  subcategories_parent += '\n);\n';

  writeJava += 'List<String> initialCategories = Arrays.asList(\n' + replaceLastComma(categories_list) + '\n);\n';
  writeJava += subcategories_parent;
  console.log('Result', writeJava);
};