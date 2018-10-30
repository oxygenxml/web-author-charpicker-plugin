package com.oxygenxml.charpicker;

import java.util.ArrayList;
import java.util.List;

import ro.sync.ecss.extensions.api.webapp.access.WebappPluginWorkspace;
import ro.sync.ecss.extensions.api.webapp.plugin.PluginConfigExtension;
import ro.sync.exml.workspace.api.PluginResourceBundle;
import ro.sync.exml.workspace.api.PluginWorkspaceProvider;

public class ConfigurationPage extends PluginConfigExtension {

  static final String REMOVE_CATEGORIES = "charp.remove_categories";
  
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
          + "<label>" + rb.getMessage(TranslationTags.REMOVE_CATEGORIES) + ":"
            + "<input style=\"display: block; width: 100%; margin-top: 5px;\" name=" + REMOVE_CATEGORIES + " id=\"remove_categories\" value=\"" + getOption(REMOVE_CATEGORIES, "") + "\">"
          + "</label>"
        + "</div>";
  }

  @Override
  public String getOptionsJson() {
    return "{\"" + REMOVE_CATEGORIES + "\": \"" + getOption(REMOVE_CATEGORIES, "") + "\"}";
  }
}
