package com.oxygenxml.charpicker;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.codehaus.jackson.JsonGenerationException;
import org.codehaus.jackson.map.JsonMappingException;
import org.codehaus.jackson.map.ObjectMapper;

import ro.sync.ecss.extensions.api.webapp.access.WebappPluginWorkspace;
import ro.sync.ecss.extensions.api.webapp.plugin.WebappServletPluginExtension;
import ro.sync.exml.workspace.api.PluginResourceBundle;
import ro.sync.exml.workspace.api.PluginWorkspaceProvider;

public class CategoryNames extends WebappServletPluginExtension {

  @Override
  public String getPath() {
    return "get-category-names";
  }

  @Override
  public void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
    String cookieLanguage = SpecialCharServlet.getCookieLanguage(req.getCookies());
    if (cookieLanguage != null && !cookieLanguage.contains("en")) {
      resp.getOutputStream().write(getTranslatedCategories().getBytes());
    }
  }
  
  /**
   * Get the subcategory name from a tag.
   * @param tagName The tag name.
   * @param categoryName The original category name (decoded).
   * @return The original subcategory name.
   */
  private String getOriginalFromTagName(String tagName, String categoryName) {
    String original = "";
    String[] pieces = tagName.split("_");
    // Cut out the prefix and category pieces, assume they are here correctly.
    int categoryPiecesLength = categoryName != null ? categoryName.split(" ").length : 0;
    pieces = Arrays.copyOfRange(pieces, categoryPiecesLength + 1, pieces.length);
    original = String.join(" ", pieces);
    return original;
  }
  
  /**
   * Get the category name from a tag.
   * @param tagName The tag name.
   * @return The original category name.
   */
  private String getOriginalFromTagName(String tagName) {
    return getOriginalFromTagName(tagName, null);
  }
  
  private String getTranslatedCategories() throws IOException {
    Map<String, List<String>> categories = new LinkedHashMap<>();
    // Translate category names only if needed.
    PluginResourceBundle rb = ((WebappPluginWorkspace) PluginWorkspaceProvider.getPluginWorkspace()).getResourceBundle();
    
    // Keep the original name by writing in the format: tag|translated_message.
    for (int i = 0; i < initialCategories.size(); i++) {
      String currentCategory = initialCategories.get(i);
      String originalCategory = getOriginalFromTagName(currentCategory);
      
      
      List<String> translatedSubcategories = new ArrayList<>();
      for (int j = 0; j < initialSubcategories.get(i).size(); j++) {
        String currentSubcategory = initialSubcategories.get(i).get(j);
        
        String translatedSubcat = rb.getMessage(currentSubcategory);
        String originalSubcat = getOriginalFromTagName(currentSubcategory, originalCategory);
        // If translations are incomplete, add only translated pieces.
        if (!translatedSubcat.equals(originalSubcat)) {
          translatedSubcategories.add(j, currentSubcategory + "|" + translatedSubcat);
        }
      }
      
      String translatedCategory = rb.getMessage(currentCategory);
      // If neither category name nor any subcategory was translated, there's no point to send it.
      if (!originalCategory.equals(translatedCategory) || !translatedSubcategories.isEmpty()) {
        categories.put(currentCategory + "|" + translatedCategory, translatedSubcategories);
      }
    }
    String categoriesAsString = new ObjectMapper().writeValueAsString(categories);

    StringBuilder sb = new StringBuilder();
    sb.append("window.charpickerCategories='").append(categoriesAsString).append("';");
    return sb.toString();
  }

  List<String> initialCategories = Arrays.asList("c_Symbol", "c_Emoji", "c_Punctuation", "c_Number",
      "c_Format_and_Whitespace", "c_Modifier", "c_Latin", "c_Other_European_Scripts", "c_American_Scripts",
      "c_African_Scripts", "c_Middle_Eastern_Scripts", "c_South_Asian_Scripts", "c_Southeast_Asian_Scripts",
      "c_Other_East_Asian_Scripts"

  );
  List<List<String>> initialSubcategories = Arrays.asList(
      Arrays.asList("sc_Symbol_Arrows", "sc_Symbol_Braille", "sc_Symbol_Control_Pictures", "sc_Symbol_Currency",
          "sc_Symbol_Emoticons", "sc_Symbol_Game_Pieces", "sc_Symbol_Gender_and_Genealogical",
          "sc_Symbol_Geometric_Shapes", "sc_Symbol_Keyboard_and_UI", "sc_Symbol_Latin_1_Supplement", "sc_Symbol_Math",
          "sc_Symbol_Math_Alphanumeric", "sc_Symbol_Miscellaneous", "sc_Symbol_Musical", "sc_Symbol_Stars/Asterisks",
          "sc_Symbol_Subscript", "sc_Symbol_Superscript", "sc_Symbol_Technical", "sc_Symbol_Transport_And_Map",
          "sc_Symbol_Weather_and_Astrological", "sc_Symbol_Yijing_/_Tai_Xuan_Jing", "sc_Symbol_Historic",
          "sc_Symbol_Compatibility"),
      Arrays.asList("sc_Emoji_People_and_Emotions", "sc_Emoji_Animals,_Plants_and_Food", "sc_Emoji_Objects",
          "sc_Emoji_Sports,_Celebrations_and_Activities", "sc_Emoji_Transport,_Maps_and_Signage",
          "sc_Emoji_Weather,_Scenes_and_Zodiac_signs", "sc_Emoji_Enclosed", "sc_Emoji_Marks", "sc_Emoji_Symbols"),
      Arrays.asList("sc_Punctuation_ASCII_Based", "sc_Punctuation_Dash/Connector", "sc_Punctuation_Other",
          "sc_Punctuation_Paired", "sc_Punctuation_Historic", "sc_Punctuation_Compatibility"),
      Arrays.asList("sc_Number_Decimal", "sc_Number_Enclosed/Dotted", "sc_Number_Fractions/Related", "sc_Number_Other",
          "sc_Number_Historic", "sc_Number_Compatibility"),
      Arrays.asList("sc_Format_and_Whitespace_Format", "sc_Format_and_Whitespace_Variation_Selector",
          "sc_Format_and_Whitespace_Whitespace", "sc_Format_and_Whitespace_Historic",
          "sc_Format_and_Whitespace_Compatibility"),
      Arrays.asList("sc_Modifier_Enclosing", "sc_Modifier_Nonspacing", "sc_Modifier_Spacing", "sc_Modifier_Historic",
          "sc_Modifier_Compatibility"),
      Arrays.asList("sc_Latin_Common", "sc_Latin_Enclosed", "sc_Latin_Flipped/Mirrored", "sc_Latin_Other",
          "sc_Latin_Phonetics_(IPA)", "sc_Latin_Phonetics_(X-IPA)", "sc_Latin_Historic", "sc_Latin_Compatibility"),
      Arrays.asList("sc_Other_European_Scripts_Armenian", "sc_Other_European_Scripts_Cyrillic",
          "sc_Other_European_Scripts_Georgian", "sc_Other_European_Scripts_Greek",
          "sc_Other_European_Scripts_Historic_-_Cypriot", "sc_Other_European_Scripts_Historic_-_Cyrillic",
          "sc_Other_European_Scripts_Historic_-_Georgian", "sc_Other_European_Scripts_Historic_-_Glagolitic",
          "sc_Other_European_Scripts_Historic_-_Gothic", "sc_Other_European_Scripts_Historic_-_Greek",
          "sc_Other_European_Scripts_Historic_-_Linear_B", "sc_Other_European_Scripts_Historic_-_Ogham",
          "sc_Other_European_Scripts_Historic_-_Old_Italic", "sc_Other_European_Scripts_Historic_-_Runic",
          "sc_Other_European_Scripts_Historic_-_Shavian", "sc_Other_European_Scripts_Compatibility_-_Armenian",
          "sc_Other_European_Scripts_Compatibility_-_Greek"),
      Arrays.asList("sc_American_Scripts_Canadian_Aboriginal", "sc_American_Scripts_Cherokee",
          "sc_American_Scripts_Historic_-_Deseret"),
      Arrays.asList("sc_African_Scripts_Egyptian_Hieroglyphs", "sc_African_Scripts_Ethiopic",
          "sc_African_Scripts_Meroitic_Cursive", "sc_African_Scripts_Meroitic_Hieroglyphs", "sc_African_Scripts_Nko",
          "sc_African_Scripts_Tifinagh", "sc_African_Scripts_Vai", "sc_African_Scripts_Historic_-_Bamum",
          "sc_African_Scripts_Historic_-_Coptic", "sc_African_Scripts_Historic_-_Nko",
          "sc_African_Scripts_Historic_-_Osmanya"),
      Arrays.asList("sc_Middle_Eastern_Scripts_Arabic", "sc_Middle_Eastern_Scripts_Hebrew",
          "sc_Middle_Eastern_Scripts_Imperial_Aramaic", "sc_Middle_Eastern_Scripts_Inscriptional_Pahlavi",
          "sc_Middle_Eastern_Scripts_Inscriptional_Parthian", "sc_Middle_Eastern_Scripts_Mandaic",
          "sc_Middle_Eastern_Scripts_Old_South_Arabian", "sc_Middle_Eastern_Scripts_Samaritan",
          "sc_Middle_Eastern_Scripts_Syriac", "sc_Middle_Eastern_Scripts_Historic_-_Arabic",
          "sc_Middle_Eastern_Scripts_Historic_-_Avestan", "sc_Middle_Eastern_Scripts_Historic_-_Carian",
          "sc_Middle_Eastern_Scripts_Historic_-_Cuneiform", "sc_Middle_Eastern_Scripts_Historic_-_Hebrew",
          "sc_Middle_Eastern_Scripts_Historic_-_Lycian", "sc_Middle_Eastern_Scripts_Historic_-_Lydian",
          "sc_Middle_Eastern_Scripts_Historic_-_Old_Persian", "sc_Middle_Eastern_Scripts_Historic_-_Phoenician",
          "sc_Middle_Eastern_Scripts_Historic_-_Syriac", "sc_Middle_Eastern_Scripts_Historic_-_Ugaritic",
          "sc_Middle_Eastern_Scripts_Compatibility_-_Arabic", "sc_Middle_Eastern_Scripts_Compatibility_-_Hebrew"),
      Arrays.asList("sc_South_Asian_Scripts_Bengali", "sc_South_Asian_Scripts_Chakma",
          "sc_South_Asian_Scripts_Devanagari", "sc_South_Asian_Scripts_Gujarati", "sc_South_Asian_Scripts_Gurmukhi",
          "sc_South_Asian_Scripts_Kannada", "sc_South_Asian_Scripts_Lepcha", "sc_South_Asian_Scripts_Limbu",
          "sc_South_Asian_Scripts_Malayalam", "sc_South_Asian_Scripts_Meetei_Mayek", "sc_South_Asian_Scripts_Ol_Chiki",
          "sc_South_Asian_Scripts_Oriya", "sc_South_Asian_Scripts_Saurashtra", "sc_South_Asian_Scripts_Sinhala",
          "sc_South_Asian_Scripts_Sora_Sompeng", "sc_South_Asian_Scripts_Tamil", "sc_South_Asian_Scripts_Telugu",
          "sc_South_Asian_Scripts_Thaana", "sc_South_Asian_Scripts_Tibetan", "sc_South_Asian_Scripts_Historic",
          "sc_South_Asian_Scripts_Historic_-_Brahmi", "sc_South_Asian_Scripts_Historic_-_Kaithi",
          "sc_South_Asian_Scripts_Historic_-_Kannada", "sc_South_Asian_Scripts_Historic_-_Kharoshthi",
          "sc_South_Asian_Scripts_Historic_-_Sharada", "sc_South_Asian_Scripts_Historic_-_Syloti_Nagri",
          "sc_South_Asian_Scripts_Historic_-_Takri", "sc_South_Asian_Scripts_Compatibility_-_Bengali",
          "sc_South_Asian_Scripts_Compatibility_-_Devanagari", "sc_South_Asian_Scripts_Compatibility_-_Gurmukhi",
          "sc_South_Asian_Scripts_Compatibility_-_Oriya", "sc_South_Asian_Scripts_Compatibility_-_Tibetan"),
      Arrays.asList("sc_Southeast_Asian_Scripts_Balinese", "sc_Southeast_Asian_Scripts_Batak",
          "sc_Southeast_Asian_Scripts_Cham", "sc_Southeast_Asian_Scripts_Javanese",
          "sc_Southeast_Asian_Scripts_Kayah_Li", "sc_Southeast_Asian_Scripts_Khmer", "sc_Southeast_Asian_Scripts_Lao",
          "sc_Southeast_Asian_Scripts_Myanmar", "sc_Southeast_Asian_Scripts_New_Tai_Lue",
          "sc_Southeast_Asian_Scripts_Tai_Le", "sc_Southeast_Asian_Scripts_Tai_Tham",
          "sc_Southeast_Asian_Scripts_Tai_Viet", "sc_Southeast_Asian_Scripts_Thai",
          "sc_Southeast_Asian_Scripts_Historic_-_Buginese", "sc_Southeast_Asian_Scripts_Historic_-_Buhid",
          "sc_Southeast_Asian_Scripts_Historic_-_Hanunoo", "sc_Southeast_Asian_Scripts_Historic_-_Khmer",
          "sc_Southeast_Asian_Scripts_Historic_-_Rejang", "sc_Southeast_Asian_Scripts_Historic_-_Sundanese",
          "sc_Southeast_Asian_Scripts_Historic_-_Tagalog", "sc_Southeast_Asian_Scripts_Historic_-_Tagbanwa"),
      Arrays.asList("sc_Other_East_Asian_Scripts_Bopomofo", "sc_Other_East_Asian_Scripts_Hiragana",
          "sc_Other_East_Asian_Scripts_Katakana", "sc_Other_East_Asian_Scripts_Lisu",
          "sc_Other_East_Asian_Scripts_Miao", "sc_Other_East_Asian_Scripts_Mongolian",
          "sc_Other_East_Asian_Scripts_Old_Turkic", "sc_Other_East_Asian_Scripts_Phags_Pa",
          "sc_Other_East_Asian_Scripts_Yi", "sc_Other_East_Asian_Scripts_Historic_-_Phags_Pa",
          "sc_Other_East_Asian_Scripts_Compatibility_-_Bopomofo",
          "sc_Other_East_Asian_Scripts_Compatibility_-_Hiragana",
          "sc_Other_East_Asian_Scripts_Compatibility_-_Katakana",
          "sc_Other_East_Asian_Scripts_Compatibility_-_Phags_Pa", "sc_Other_East_Asian_Scripts_Compatibility_-_Yi")

  );
}
