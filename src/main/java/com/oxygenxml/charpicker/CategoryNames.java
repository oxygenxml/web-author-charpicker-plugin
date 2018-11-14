package com.oxygenxml.charpicker;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.codehaus.jackson.map.ObjectMapper;

import ro.sync.ecss.extensions.api.webapp.access.WebappPluginWorkspace;
import ro.sync.ecss.extensions.api.webapp.plugin.WebappServletPluginExtension;
import ro.sync.exml.workspace.api.PluginResourceBundle;
import ro.sync.exml.workspace.api.PluginWorkspaceProvider;

/**
 * Servlet which handles translation of category/subcategory names and UI messages. 
 * 
 * @author andrei_popa
 */
public class CategoryNames extends WebappServletPluginExtension {

  @Override
  public String getPath() {
    return "get-category-names";
  }

  @Override
  public void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
    String cookieLanguage = SpecialCharServlet.getCookieLanguage(req.getCookies());
    if (cookieLanguage != null && !cookieLanguage.contains("en")) {
      resp.getOutputStream()
        .write((getTranslatedCategories() + getUITranslation()).getBytes(StandardCharsets.UTF_8));
    }
  }
  
  /**
   * Get the subcategory name from a tag.
   * @param tagName The tag name.
   * @param categoryName The original category name (decoded).
   * @return The original subcategory name.
   */
  private static String getOriginalFromTagName(String tagName, String categoryName) {
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
  static String getOriginalFromTagName(String tagName) {
    return getOriginalFromTagName(tagName, null);
  }
  
  /**
   * The charpicker iframe does not get UI messages translated through Web Author's system,
   * so get them from the server side.  
   * 
   * @return String containing the translations for UI messages to be shown in the charpicker iframe.
   * @throws IOException
   */
  private String getUITranslation() throws IOException {
    PluginResourceBundle rb = ((WebappPluginWorkspace) PluginWorkspaceProvider.getPluginWorkspace()).getResourceBundle();
    StringBuilder sb = new StringBuilder(); 
    Map<String, String> otherMessages = new HashMap<>();
    otherMessages.put(TranslationTags.CATEGORIES, rb.getMessage(TranslationTags.CATEGORIES));
    otherMessages.put(TranslationTags.HEX_CODE, rb.getMessage(TranslationTags.HEX_CODE));
    String otherMessagesAsString = new ObjectMapper().writeValueAsString(otherMessages);
    sb.append("window.msgs='").append(otherMessagesAsString).append("';");
    return sb.toString();
  }
  
  /**
   * Get translated messages for UI components for the charpicker iframe.
   * @return String object containing translated messages. 
   * @throws IOException
   */
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
          translatedSubcategories.add(currentSubcategory + "|" + translatedSubcat);
        }
      }
      
      String translatedCategory = rb.getMessage(currentCategory);
      // If neither category name nor any subcategory was translated, there's no point to send it.
      if (originalCategory!= null && 
          (!originalCategory.equals(translatedCategory) || !translatedSubcategories.isEmpty())) {
        categories.put(currentCategory + "|" + translatedCategory, translatedSubcategories);
      }
    }
    String categoriesAsString = new ObjectMapper().writeValueAsString(categories);

    StringBuilder sb = new StringBuilder();
    sb.append("window.charpickerCategories='").append(categoriesAsString).append("';");
    return sb.toString();
  }

  static List<String> initialCategories = Arrays.asList("utfc_Symbol", "utfc_Emoji", "utfc_Punctuation", "utfc_Number",
      "utfc_Format_and_Whitespace", "utfc_Modifier", "utfc_Latin", "utfc_Other_European_Scripts", "utfc_American_Scripts",
      "utfc_African_Scripts", "utfc_Middle_Eastern_Scripts", "utfc_South_Asian_Scripts", "utfc_Southeast_Asian_Scripts",
      "utfc_Other_East_Asian_Scripts"

  );
  List<List<String>> initialSubcategories = Arrays.asList(
      Arrays.asList("utfsc_Symbol_Arrows", "utfsc_Symbol_Braille", "utfsc_Symbol_Control_Pictures", "utfsc_Symbol_Currency",
          "utfsc_Symbol_Emoticons", "utfsc_Symbol_Game_Pieces", "utfsc_Symbol_Gender_and_Genealogical",
          "utfsc_Symbol_Geometric_Shapes", "utfsc_Symbol_Keyboard_and_UI", "utfsc_Symbol_Latin_1_Supplement", "utfsc_Symbol_Math",
          "utfsc_Symbol_Math_Alphanumeric", "utfsc_Symbol_Miscellaneous", "utfsc_Symbol_Musical", "utfsc_Symbol_Stars/Asterisks",
          "utfsc_Symbol_Subscript", "utfsc_Symbol_Superscript", "utfsc_Symbol_Technical", "utfsc_Symbol_Transport_And_Map",
          "utfsc_Symbol_Weather_and_Astrological", "utfsc_Symbol_Yijing_/_Tai_Xuan_Jing", "utfsc_Symbol_Historic",
          "utfsc_Symbol_Compatibility"),
      Arrays.asList("utfsc_Emoji_People_and_Emotions", "utfsc_Emoji_Animals,_Plants_and_Food", "utfsc_Emoji_Objects",
          "utfsc_Emoji_Sports,_Celebrations_and_Activities", "utfsc_Emoji_Transport,_Maps_and_Signage",
          "utfsc_Emoji_Weather,_Scenes_and_Zodiac_signs", "utfsc_Emoji_Enclosed", "utfsc_Emoji_Marks", "utfsc_Emoji_Symbols"),
      Arrays.asList("utfsc_Punctuation_ASCII_Based", "utfsc_Punctuation_Dash/Connector", "utfsc_Punctuation_Other",
          "utfsc_Punctuation_Paired", "utfsc_Punctuation_Historic", "utfsc_Punctuation_Compatibility"),
      Arrays.asList("utfsc_Number_Decimal", "utfsc_Number_Enclosed/Dotted", "utfsc_Number_Fractions/Related", "utfsc_Number_Other",
          "utfsc_Number_Historic", "utfsc_Number_Compatibility"),
      Arrays.asList("utfsc_Format_and_Whitespace_Format", "utfsc_Format_and_Whitespace_Variation_Selector",
          "utfsc_Format_and_Whitespace_Whitespace", "utfsc_Format_and_Whitespace_Historic",
          "utfsc_Format_and_Whitespace_Compatibility"),
      Arrays.asList("utfsc_Modifier_Enclosing", "utfsc_Modifier_Nonspacing", "utfsc_Modifier_Spacing", "utfsc_Modifier_Historic",
          "utfsc_Modifier_Compatibility"),
      Arrays.asList("utfsc_Latin_Common", "utfsc_Latin_Enclosed", "utfsc_Latin_Flipped/Mirrored", "utfsc_Latin_Other",
          "utfsc_Latin_Phonetics_(IPA)", "utfsc_Latin_Phonetics_(X-IPA)", "utfsc_Latin_Historic", "utfsc_Latin_Compatibility"),
      Arrays.asList("utfsc_Other_European_Scripts_Armenian", "utfsc_Other_European_Scripts_Cyrillic",
          "utfsc_Other_European_Scripts_Georgian", "utfsc_Other_European_Scripts_Greek",
          "utfsc_Other_European_Scripts_Historic_-_Cypriot", "utfsc_Other_European_Scripts_Historic_-_Cyrillic",
          "utfsc_Other_European_Scripts_Historic_-_Georgian", "utfsc_Other_European_Scripts_Historic_-_Glagolitic",
          "utfsc_Other_European_Scripts_Historic_-_Gothic", "utfsc_Other_European_Scripts_Historic_-_Greek",
          "utfsc_Other_European_Scripts_Historic_-_Linear_B", "utfsc_Other_European_Scripts_Historic_-_Ogham",
          "utfsc_Other_European_Scripts_Historic_-_Old_Italic", "utfsc_Other_European_Scripts_Historic_-_Runic",
          "utfsc_Other_European_Scripts_Historic_-_Shavian", "utfsc_Other_European_Scripts_Compatibility_-_Armenian",
          "utfsc_Other_European_Scripts_Compatibility_-_Greek"),
      Arrays.asList("utfsc_American_Scripts_Canadian_Aboriginal", "utfsc_American_Scripts_Cherokee",
          "utfsc_American_Scripts_Historic_-_Deseret"),
      Arrays.asList("utfsc_African_Scripts_Egyptian_Hieroglyphs", "utfsc_African_Scripts_Ethiopic",
          "utfsc_African_Scripts_Meroitic_Cursive", "utfsc_African_Scripts_Meroitic_Hieroglyphs", "utfsc_African_Scripts_Nko",
          "utfsc_African_Scripts_Tifinagh", "utfsc_African_Scripts_Vai", "utfsc_African_Scripts_Historic_-_Bamum",
          "utfsc_African_Scripts_Historic_-_Coptic", "utfsc_African_Scripts_Historic_-_Nko",
          "utfsc_African_Scripts_Historic_-_Osmanya"),
      Arrays.asList("utfsc_Middle_Eastern_Scripts_Arabic", "utfsc_Middle_Eastern_Scripts_Hebrew",
          "utfsc_Middle_Eastern_Scripts_Imperial_Aramaic", "utfsc_Middle_Eastern_Scripts_Inscriptional_Pahlavi",
          "utfsc_Middle_Eastern_Scripts_Inscriptional_Parthian", "utfsc_Middle_Eastern_Scripts_Mandaic",
          "utfsc_Middle_Eastern_Scripts_Old_South_Arabian", "utfsc_Middle_Eastern_Scripts_Samaritan",
          "utfsc_Middle_Eastern_Scripts_Syriac", "utfsc_Middle_Eastern_Scripts_Historic_-_Arabic",
          "utfsc_Middle_Eastern_Scripts_Historic_-_Avestan", "utfsc_Middle_Eastern_Scripts_Historic_-_Carian",
          "utfsc_Middle_Eastern_Scripts_Historic_-_Cuneiform", "utfsc_Middle_Eastern_Scripts_Historic_-_Hebrew",
          "utfsc_Middle_Eastern_Scripts_Historic_-_Lycian", "utfsc_Middle_Eastern_Scripts_Historic_-_Lydian",
          "utfsc_Middle_Eastern_Scripts_Historic_-_Old_Persian", "utfsc_Middle_Eastern_Scripts_Historic_-_Phoenician",
          "utfsc_Middle_Eastern_Scripts_Historic_-_Syriac", "utfsc_Middle_Eastern_Scripts_Historic_-_Ugaritic",
          "utfsc_Middle_Eastern_Scripts_Compatibility_-_Arabic", "utfsc_Middle_Eastern_Scripts_Compatibility_-_Hebrew"),
      Arrays.asList("utfsc_South_Asian_Scripts_Bengali", "utfsc_South_Asian_Scripts_Chakma",
          "utfsc_South_Asian_Scripts_Devanagari", "utfsc_South_Asian_Scripts_Gujarati", "utfsc_South_Asian_Scripts_Gurmukhi",
          "utfsc_South_Asian_Scripts_Kannada", "utfsc_South_Asian_Scripts_Lepcha", "utfsc_South_Asian_Scripts_Limbu",
          "utfsc_South_Asian_Scripts_Malayalam", "utfsc_South_Asian_Scripts_Meetei_Mayek", "utfsc_South_Asian_Scripts_Ol_Chiki",
          "utfsc_South_Asian_Scripts_Oriya", "utfsc_South_Asian_Scripts_Saurashtra", "utfsc_South_Asian_Scripts_Sinhala",
          "utfsc_South_Asian_Scripts_Sora_Sompeng", "utfsc_South_Asian_Scripts_Tamil", "utfsc_South_Asian_Scripts_Telugu",
          "utfsc_South_Asian_Scripts_Thaana", "utfsc_South_Asian_Scripts_Tibetan", "utfsc_South_Asian_Scripts_Historic",
          "utfsc_South_Asian_Scripts_Historic_-_Brahmi", "utfsc_South_Asian_Scripts_Historic_-_Kaithi",
          "utfsc_South_Asian_Scripts_Historic_-_Kannada", "utfsc_South_Asian_Scripts_Historic_-_Kharoshthi",
          "utfsc_South_Asian_Scripts_Historic_-_Sharada", "utfsc_South_Asian_Scripts_Historic_-_Syloti_Nagri",
          "utfsc_South_Asian_Scripts_Historic_-_Takri", "utfsc_South_Asian_Scripts_Compatibility_-_Bengali",
          "utfsc_South_Asian_Scripts_Compatibility_-_Devanagari", "utfsc_South_Asian_Scripts_Compatibility_-_Gurmukhi",
          "utfsc_South_Asian_Scripts_Compatibility_-_Oriya", "utfsc_South_Asian_Scripts_Compatibility_-_Tibetan"),
      Arrays.asList("utfsc_Southeast_Asian_Scripts_Balinese", "utfsc_Southeast_Asian_Scripts_Batak",
          "utfsc_Southeast_Asian_Scripts_Cham", "utfsc_Southeast_Asian_Scripts_Javanese",
          "utfsc_Southeast_Asian_Scripts_Kayah_Li", "utfsc_Southeast_Asian_Scripts_Khmer", "utfsc_Southeast_Asian_Scripts_Lao",
          "utfsc_Southeast_Asian_Scripts_Myanmar", "utfsc_Southeast_Asian_Scripts_New_Tai_Lue",
          "utfsc_Southeast_Asian_Scripts_Tai_Le", "utfsc_Southeast_Asian_Scripts_Tai_Tham",
          "utfsc_Southeast_Asian_Scripts_Tai_Viet", "utfsc_Southeast_Asian_Scripts_Thai",
          "utfsc_Southeast_Asian_Scripts_Historic_-_Buginese", "utfsc_Southeast_Asian_Scripts_Historic_-_Buhid",
          "utfsc_Southeast_Asian_Scripts_Historic_-_Hanunoo", "utfsc_Southeast_Asian_Scripts_Historic_-_Khmer",
          "utfsc_Southeast_Asian_Scripts_Historic_-_Rejang", "utfsc_Southeast_Asian_Scripts_Historic_-_Sundanese",
          "utfsc_Southeast_Asian_Scripts_Historic_-_Tagalog", "utfsc_Southeast_Asian_Scripts_Historic_-_Tagbanwa"),
      Arrays.asList("utfsc_Other_East_Asian_Scripts_Bopomofo", "utfsc_Other_East_Asian_Scripts_Hiragana",
          "utfsc_Other_East_Asian_Scripts_Katakana", "utfsc_Other_East_Asian_Scripts_Lisu",
          "utfsc_Other_East_Asian_Scripts_Miao", "utfsc_Other_East_Asian_Scripts_Mongolian",
          "utfsc_Other_East_Asian_Scripts_Old_Turkic", "utfsc_Other_East_Asian_Scripts_Phags_Pa",
          "utfsc_Other_East_Asian_Scripts_Yi", "utfsc_Other_East_Asian_Scripts_Historic_-_Phags_Pa",
          "utfsc_Other_East_Asian_Scripts_Compatibility_-_Bopomofo",
          "utfsc_Other_East_Asian_Scripts_Compatibility_-_Hiragana",
          "utfsc_Other_East_Asian_Scripts_Compatibility_-_Katakana",
          "utfsc_Other_East_Asian_Scripts_Compatibility_-_Phags_Pa", "utfsc_Other_East_Asian_Scripts_Compatibility_-_Yi")
  );
}
