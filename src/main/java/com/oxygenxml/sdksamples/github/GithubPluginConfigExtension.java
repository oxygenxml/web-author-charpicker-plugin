package com.oxygenxml.sdksamples.github;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import ro.sync.ecss.extensions.api.webapp.plugin.PluginConfigExtension;

/**
 * Plugin extension used to handle the configuration of this plugin.
 * Setting the client_id and client_secret.
 * 
 * @author gabriel_titerlea
 */
public class GithubPluginConfigExtension extends PluginConfigExtension {

  /**
   * The name of the client id options property
   */
  private final String CLIENT_ID = "client_id";
  
  /**
   * The name of the client secret options property
   */
  private final String CLIENT_SECRET = "client_secret";
  
  @Override
  public void init() throws ServletException {
    super.init();
 
    Map<String, String> defaultOptions = new HashMap<String, String>();
    defaultOptions.put(CLIENT_ID, GitHubOauthServlet.clientId);
    defaultOptions.put(CLIENT_SECRET, GitHubOauthServlet.clientSecret);
    setDefaultOptions(defaultOptions);
    
    // If the options are set by the user in the admin page they will be returned from getOption.
    // And we will overwrite the ones already set from the github-plugin.properties file.
    setOption(CLIENT_ID, getOption(CLIENT_ID, GitHubOauthServlet.clientId));
    setOption(CLIENT_SECRET, getOption(CLIENT_SECRET, GitHubOauthServlet.clientSecret));
    
    try {
      saveOptions();
    } catch (IOException e) {}
  }
  
  @Override
  public String getPath() {
    return "github-config";
  }
  
  /**
   * Overriding to make sure the GithubOauthServlet properties are updated as well.
   */
  @Override
  public void doDelete(HttpServletRequest req, HttpServletResponse resp)
      throws ServletException, IOException {
    super.doDelete(req, resp);
    GitHubOauthServlet.clientId = getDefaultOptions().get(CLIENT_ID);
    GitHubOauthServlet.clientSecret = getDefaultOptions().get(CLIENT_SECRET);
  }
  
  /**
   * Overriding to make sure that the client_id and client_secret are updated in the GithubOauthServlet as well
   */
  @Override
  protected void setOption(String key, String value) {
    super.setOption(key, value);

    if (CLIENT_ID.equals(key)) {
      GitHubOauthServlet.clientId = value;
    }
    
    if (CLIENT_SECRET.equals(key)) {
      GitHubOauthServlet.clientSecret = value;
    }
  }
  
  /**
   * @see ro.sync.ecss.extensions.api.webapp.plugin.PluginConfigExtension#getOptionsForm.
   * @return @return The options form representing an html form with associated javascript/css which handles the saving of the new options.
   */
  @Override
  public String getOptionsForm() {
    return "<div style='font-family:robotolight, Arial, Helvetica, sans-serif;font-size:0.85em;font-weight: lighter'>"
            + "<form style='text-align:left;line-height: 1.7em;'>"
              + "<label style='margin-bottom:6px;display:block;overflow:hidden'>"
                + "client_id: "
                + "<input name='client_id' type='text' style='float:right' value='" + GitHubOauthServlet.clientId + "'/>"
              + "</label>"
              + "<label style='margin-bottom:6px;display:block;overflow:hidden'>"
                + "client_secret:"
                + "<input name='client_secret' type='text' style='float:right' value='" + GitHubOauthServlet.clientSecret +"'/>"
              + "</label>"
            + "</form>"
            
            + "<div style='background-color: lightyellow;border: 1px solid #dadab4;padding:0 5px 0 5px'>"
              + "<p>The github plugin requires a client_id and client_secret to use OAuth authentication.</p>"
              + "<p>To obtain a client_id and client_secret go to your github <a target='_blank' href='https://github.com/settings/developers'>developer applications page</a> and register a new application.</p>"
              + "<p>The Authorization callback URL must be set to: {webapp-context}/plugins-dispatcher/github-oauth/callback. example:<br/><span style='text-decoration:underline'>http://domain/oxygen-webapp/plugins-dispatcher/github-oauth/callback</p>"
            + "</div>"
          + "</div>"
          
          // Load the logic for this config page
          + "<script src='../plugin-resources/github-static/github-config.js'></script>";
  }
  
  /**
   * @see ro.sync.ecss.extensions.api.webapp.plugin.PluginConfigExtension#getOptionsJson.
   * @return A JSON representation of the current options.
   */
  @Override
  public String getOptionsJson() {
    return "{\"client_id\":\"" + GitHubOauthServlet.clientId + "\",\"client_secret\":\"" + GitHubOauthServlet.clientSecret + "\"}";
  }
}
