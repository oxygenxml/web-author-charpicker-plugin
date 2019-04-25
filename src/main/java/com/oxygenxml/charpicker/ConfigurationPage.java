package com.oxygenxml.charpicker;

import java.util.ArrayList;
import java.util.List;

import ro.sync.ecss.extensions.api.webapp.access.WebappPluginWorkspace;
import ro.sync.ecss.extensions.api.webapp.plugin.PluginConfigExtension;
import ro.sync.exml.workspace.api.PluginResourceBundle;
import ro.sync.exml.workspace.api.PluginWorkspaceProvider;

public class ConfigurationPage extends PluginConfigExtension {

  static final String REMOVE_CATEGORIES = "charp.remove_categories";
  static final String DEFAULT_CHARACTERS = "charp.recently.used.characters";
  
  @Override
  public String getPath() {
    return "char-picker-config";
  }

  @Override
  public String getOptionsForm() {
    List<String> defaultCategories = new ArrayList<String>();
    PluginResourceBundle rb = ((WebappPluginWorkspace) PluginWorkspaceProvider.getPluginWorkspace()).getResourceBundle();
    
    CategoryNames.initialCategories.forEach(category -> defaultCategories.add(CategoryNames.getOriginalFromTagName(category)));
    return "<div style=\"font-family: robotolight, Arial, Helvetica, sans-serif;\">"
          + "<div>" + rb.getMessage(TranslationTags.INITIAL_CATEGORIES) 
            + "<div style=\"padding: 5px 10px 15px 10px; color: #969696;\">" + String.join(", ", defaultCategories) + ".</div>"        
          + "</div>"
          + "<label style=\"display: block;\">" 
            + rb.getMessage(TranslationTags.REMOVE_CATEGORIES) + ":"
            + "<input style=\"display: block; width: 100%; margin-top: 5px;\" name=" + REMOVE_CATEGORIES + " id=\"remove_categories\" value=\"" + getOption(REMOVE_CATEGORIES, "") + "\">"
          + "</label>"
          + "<label style=\"display: block; margin-top:15px;\">" + rb.getMessage(TranslationTags.DEFAULT_CHARACTERS) + ":"
            + "<input style=\"display: block; width: 100%; margin-top: 5px;\" name=" + DEFAULT_CHARACTERS + " id=\"default_characters\" value=\"" + getOption(DEFAULT_CHARACTERS, "") + "\">"
          + "</label>"
        + "</div>";
  }

  @Override
  public String getOptionsJson() {
    
    String defaultCharactersValue = getOption(DEFAULT_CHARACTERS, "");
    int[] defaultCharacters = defaultCharactersValue.codePoints().toArray();
    List<Object> defaultCharactersCodes = new ArrayList<>();
    for (int i = 0; i < defaultCharacters.length; i++) {
      defaultCharactersCodes.add((int) defaultCharacters[i]);
    }
    return "{\"" + REMOVE_CATEGORIES + "\": \"" + getOption(REMOVE_CATEGORIES, "") + "\", \"" 
        + DEFAULT_CHARACTERS + "\": \"" + defaultCharactersCodes + "\"}";
  }
}
