package com.oxygenxml.charpicker;

import java.util.ArrayList;
import java.util.List;

import ro.sync.ecss.extensions.api.webapp.plugin.PluginConfigExtension;

public class ConfigurationPage extends PluginConfigExtension {

  static final String REMOVE_CATEGORIES = "charp.remove_categories";
  
  @Override
  public String getPath() {
    return "char-picker-config";
  }

  @Override
  public String getOptionsForm() {
    StringBuilder sb = new StringBuilder(2000);
    List<String> defaultCategories = new ArrayList<String>();
        
    CategoryNames.initialCategories.forEach(category -> defaultCategories.add(CategoryNames.getOriginalFromTagName(category)));
    sb.append("<div class=\"roboto\">"
          + "<div>Default categories: " 
            + "<div style=\"padding: 5px 10px 15px 10px; color: #969696;\">" + String.join(", ", defaultCategories) + "</div>"        
          + "</div>"
          + "<label>Remove categories (comma separated):"
            + "<input style=\"display: block; width: 100%;\" name=" + REMOVE_CATEGORIES + " id=\"remove_categories\" value=\"" + getOption(REMOVE_CATEGORIES, "") + "\">"
          + "</label>"
        + "</div>");
    return sb.toString();
  }

  @Override
  public String getOptionsJson() {
    return "{\"" + REMOVE_CATEGORIES + "\": \"" + getOption(REMOVE_CATEGORIES, "") + "\"}";
  }
}
