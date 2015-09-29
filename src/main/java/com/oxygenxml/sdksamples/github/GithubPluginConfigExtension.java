package com.oxygenxml.sdksamples.github;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import ro.sync.servlet.admin.PluginConfigExtension;

import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;

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
  
  /**
   * Sets the options form which will be sent to the client and the default options
   */
  public GithubPluginConfigExtension() {
    this.setOptionsForm(
        "<form>"
      +   "<p>Hello test!!</p>"
      + "</form>"
    );
  }
  
  @Override
  public void init() throws ServletException {
    super.init();
 
    Map<String, String> defaultOptions = new HashMap<String, String>();
    defaultOptions.put(CLIENT_ID, GitHubOauthServlet.clientId);
    defaultOptions.put(CLIENT_SECRET, GitHubOauthServlet.clientId);
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
   * Sets an option and makes sure that the client_id and client_secret is updated in the GithubOauthServlet as well
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
  
  @Override
  public void doGet(HttpServletRequest req, HttpServletResponse resp)
      throws ServletException, IOException {
    String acceptHeader = req.getHeader("Accept");
    if ("text/html".equals(acceptHeader)) {
      serveConfigPage(resp);
    } else if ("application/json".equals(acceptHeader)) {
      serveTheCurrentOptions(resp);
    }
  }
  
  /**
   * Returns the html/css/js for the configuration page.
   * @throws IOException 
   */
  private void serveConfigPage(HttpServletResponse resp) throws IOException {
    @SuppressWarnings("unused")
    String clientId = getOption(CLIENT_ID, GitHubOauthServlet.clientId);
    @SuppressWarnings("unused")
    String clientSecret = getOption(CLIENT_SECRET, GitHubOauthServlet.clientId);
    
    resp.setStatus(HttpServletResponse.SC_OK);
    // I should build the options form here, to have the current clientId and clientSecret
    resp.getWriter().write(getOptionsForm());
    resp.getWriter().flush();
  }

  /**
   * Returns the current options in JSON format.
   * @throws IOException 
   */
  private void serveTheCurrentOptions(HttpServletResponse resp) throws IOException {
    resp.setStatus(HttpServletResponse.SC_OK);
    resp.getWriter().write("{\"client_id\":\"" + GitHubOauthServlet.clientId + 
        "\",\"client_secret\":\"" + GitHubOauthServlet.clientSecret + "\"}");
    resp.getWriter().flush();
  }
  
  @SuppressWarnings("unchecked")
  @Override
  public void doPut(HttpServletRequest req, HttpServletResponse resp)
      throws ServletException, IOException {
    String line = null;
    StringBuffer sb = new StringBuffer();
    BufferedReader reader = req.getReader();

    while ((line = reader.readLine()) != null) {
      sb.append(line);
    }
    
    Map<String, String> optionsMap;
    try {
      optionsMap = new Gson().fromJson(sb.toString(), Map.class);      
    } catch (JsonSyntaxException e) {
      resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
      return;
    }
    
    String clientId = optionsMap.get(CLIENT_ID);
    String clientSecret = optionsMap.get(CLIENT_SECRET);
    
    // If the client wants to delete the client_id and client_secret it should
    // send an empty string for each property
    if (clientId != null && clientSecret != null) {
      setOption(CLIENT_ID, clientId);
      setOption(CLIENT_SECRET, clientSecret);  
      saveOptions();
      resp.setStatus(HttpServletResponse.SC_OK);
    } else {
      resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
    }
  }
  
  @Override
  public void doDelete(HttpServletRequest req, HttpServletResponse resp)
      throws ServletException, IOException {
    GitHubOauthServlet.clientId = getDefaultOptions().get("client_id");
    GitHubOauthServlet.clientSecret = getDefaultOptions().get("client_secret");
    
    // Call super method to delete the options on the file system as well and respond to the client.
    super.doDelete(req, resp);
  }
}
