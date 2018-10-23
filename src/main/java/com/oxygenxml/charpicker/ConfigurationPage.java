package com.oxygenxml.charpicker;

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
    sb.append("<div>"
          + "<label>Remove categories:"
            + "<input name=" + REMOVE_CATEGORIES + " id=\"remove_categories\" value=\"" + getOption(REMOVE_CATEGORIES, "") + "\">"
          + "</label>"
        + "</div>");
    return sb.toString();
  }

  @Override
  public String getOptionsJson() {
    return "{\"" + REMOVE_CATEGORIES + "\": \"" + getOption(REMOVE_CATEGORIES, "") + "\"}";
  }
}
