package com.oxygenxml.charpicker;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;
import ro.sync.ecss.extensions.api.webapp.access.WebappPluginWorkspace;
import ro.sync.ecss.extensions.api.webapp.plugin.PluginConfigExtension;
import ro.sync.exml.workspace.api.PluginResourceBundle;
import ro.sync.exml.workspace.api.PluginWorkspaceProvider;

@Slf4j
public class ConfigurationPage extends PluginConfigExtension {

  static final String REMOVE_CATEGORIES = "charp.remove_categories";
  static final String DEFAULT_CHARACTERS = "charp.recently.used.characters";

  private static final ObjectMapper objectMapper = new ObjectMapper();
  
  @Override
  public String getPath() {
    return "char-picker-config";
  }

  @Override
  public String getOptionsForm() {
    List<String> defaultCategories = new ArrayList<>();
    PluginResourceBundle rb = ((WebappPluginWorkspace) PluginWorkspaceProvider.getPluginWorkspace()).getResourceBundle();
    
    CategoryNames.initialCategories.forEach(category -> defaultCategories.add(CategoryNames.getOriginalFromTagName(category)));
    return "<div style=\"font-family: robotolight, Arial, Helvetica, sans-serif;\">"
          + "<div>" + rb.getMessage(TranslationTags.INITIAL_CATEGORIES) + ":"
            + "<div style=\"padding: 5px 10px; color: #969696; margin-bottom: 15px; border: 1px solid lightgray; border-radius: 4px; max-height: 150px; overflow-y: auto;\">" 
          + String.join(",<br/>", defaultCategories) + "</div>"        
          + "</div>"
          + "<label style=\"display: block;\">" 
            + rb.getMessage(TranslationTags.REMOVE_CATEGORIES) + ":"
            + "<input style=\"display: block; width: 100%; margin-top: 5px;\" name=\"" + REMOVE_CATEGORIES + "\" id=\"remove_categories\" value=\"" + escapeHtmlAttribute(getOption(REMOVE_CATEGORIES, "")) + "\">"
            + "<div style=\"padding: 5px 10px 15px 10px; color: #969696;\">" + rb.getMessage(TranslationTags.REMOVE_ALL_CATEGORIES) + "</div>"
          + "</label>"
          + "<label style=\"display: block; margin-top:15px;\">" + rb.getMessage(TranslationTags.DEFAULT_CHARACTERS) + ":"
            + "<input style=\"display: block; width: 100%; margin-top: 5px;\" name=\"" + DEFAULT_CHARACTERS + "\" id=\"default_characters\" value=\"" + escapeHtmlAttribute(getOption(DEFAULT_CHARACTERS, "")) + "\">"
          + "</label>"
        + "</div>";
  }

  @Override
  public String getOptionsJson() {
    String defaultCharactersValue = getOption(DEFAULT_CHARACTERS, "");
    List<Integer> defaultCharactersCodes = new ArrayList<>();
    defaultCharactersValue.codePoints().forEach(defaultCharactersCodes::add);

    Map<String, String> options = new LinkedHashMap<>();
    options.put(REMOVE_CATEGORIES, getOption(REMOVE_CATEGORIES, ""));
    try {
      // The client expects the default characters option as a string containing a JSON array of code points.
      options.put(DEFAULT_CHARACTERS, objectMapper.writeValueAsString(defaultCharactersCodes));
      return objectMapper.writeValueAsString(options);
    } catch (JsonProcessingException e) {
      log.error("Could not serialize the charpicker options", e);
      return "{}";
    }
  }

  private static String escapeHtmlAttribute(String value) {
    return value
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;");
  }
}
