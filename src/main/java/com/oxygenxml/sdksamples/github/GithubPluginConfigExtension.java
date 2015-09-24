package com.oxygenxml.sdksamples.github;

import java.io.IOException;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

// import ro.sync.ecss.extensions.OptionsStorageImpl;
import ro.sync.servlet.admin.PluginConfigExtension;

/**
 * Plugin extension used to handle the configuration of this plugin.
 * Setting the client_id and client_secret.
 * 
 * @author gabriel_titerlea
 */
public class GithubPluginConfigExtension extends PluginConfigExtension {

  public GithubPluginConfigExtension(String optionsForm,
      Map<String, String> defaultOptions) {
    super(optionsForm, defaultOptions);
  }

  @Override
  public String getPath() {
    return "github-config";
  }
  
  @Override
  public void doGet(HttpServletRequest req, HttpServletResponse resp)
      throws ServletException, IOException {
    String acceptHeader = req.getHeader("Accept");
    if ("text/html".equals(acceptHeader)) {
      serveConfigPage();
    } else if ("application/json".equals(acceptHeader)) {
      serveTheCurrentOptions();
    }
  }
  
  /**
   * Returns the html/css/js for the configuration page
   */
  private void serveConfigPage() {
    // TODO Auto-generated method stub
  }

  /**
   * Returns the current options in JSON format
   */
  private void serveTheCurrentOptions() {
    //OptionsStorageImpl optionsStorage = new OptionsStorageImpl();
    //optionsStorage.setOptionsDoctypePrefix("");
  }
  
  @Override
  public void doPut(HttpServletRequest req, HttpServletResponse resp)
      throws ServletException, IOException {
    super.doPut(req, resp);
  }
  
  @Override
  public void doDelete(HttpServletRequest req, HttpServletResponse resp)
      throws ServletException, IOException {
    super.doDelete(req, resp);
  }
}
