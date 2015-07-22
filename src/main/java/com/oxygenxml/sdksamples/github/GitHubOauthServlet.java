package com.oxygenxml.sdksamples.github;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Properties;
import java.util.UUID;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.log4j.Logger;

import ro.sync.ecss.extensions.api.webapp.plugin.WebappServletPluginExtension;

/**
 * Servlet used to for the GitHub OAuth flow. 
 */
public class GitHubOauthServlet extends WebappServletPluginExtension{
  
  /** 
   * The Github clientId
   */
  private String clientId = null;
  /**
   * The Github clientSecret
   */
  private String clientSecret = null;
  
  @Override
  public String getPath() {
    return "github-oauth";
  }
  
  private Logger logger = Logger.getLogger(GitHubOauthServlet.class.getName());
  
  @Override
  public void init() throws ServletException {
    Properties properties = new Properties();
    InputStream configFileStream = getServletConfig().getServletContext().getResourceAsStream("/WEB-INF/github-plugin.properties");
    
    if (configFileStream != null) {
      try {
        properties.load(configFileStream);
        
        clientId = properties.getProperty("client_id");
        clientSecret = properties.getProperty("client_secret");
      } catch (IOException e) {
        logger.warn("Could not read the github-plugin.properties file. OAuth authentication disabled.");
      }
    } else {
      logger.warn("Config file github-plugin.properties is missing from WEB-INF. OAuth authentication disabled.");
    }
  }
  
  @Override
  public void doGet(HttpServletRequest httpRequest, HttpServletResponse httpResponse) throws ServletException, IOException {
    String requestPath = httpRequest.getPathInfo();
    
    // If the clinetId is null the OAuth flow is not available
    if (clientId == null || clientSecret == null) {
      httpResponse.sendError(HttpServletResponse.SC_NOT_FOUND);
      return;
    }
    
    // http://hostname/oxygen-webapp/plugins-dispatcher/github-oauth/callback
    if (requestPath.matches(".*?\\/callback\\/?")) {
      try {
        handleGithubCallbackRequest(httpRequest, httpResponse);
      } catch (IOException e) {
        logger.error(e.getMessage());
      }
    }
  }
  
  /**
   * Handles the OAuth authentication flow
   * 
   * Small description of the OAuth authentication flow:
   * 
   * 1. The client makes a POST request at /github_credentials 
   *    He receives a <code>client_id</code> and <code>state</code> which will be sent to github to start the oauth flow
   * 
   * 2. The client is redirected to /callback with the <code>state</code> sent back and a <code>code</code> variable
   *    We send a POST request to github sending the <code>code</code> in exchange for an <code>access_token</code>
   *    We redirect the client back to the original location
   *    
   * 3. The client makes a POST request at /github_credentials
   *    This time we have an <code>access_token</code> to send so we send it
   */
  @Override
  public void doPost(HttpServletRequest httpRequest, HttpServletResponse httpResponse)
      throws ServletException, IOException {

    // If the clinetId is null the OAuth flow is not available
    if (clientId == null || clientSecret == null) {
      httpResponse.sendError(HttpServletResponse.SC_NOT_FOUND);
      return;
    }
    
    String requestPath = httpRequest.getPathInfo();
    
    if (requestPath.matches(".*?\\/github_credentials\\/?")) {
      try {
        handleGithubCredentialsRequest(httpRequest, httpResponse);
      } catch (IOException e) {
        logger.error(e.getMessage());
      }
    } else if (requestPath.matches(".*?\\/github_reset_access\\/?")) {
      try {
        handleGithubClearAccessRequest(httpRequest, httpResponse);
      } catch (IOException e) {
        logger.error(e.getMessage());
      }
    } else if (requestPath.matches(".*?\\/github_sync_token\\/?")) {
      try {
        handleGithubSyncTokenRequest(httpRequest, httpResponse);
      } catch (IOException e) {
        logger.error(e.getMessage());
      }
    } else {
      // The requested resource does not exist
      httpResponse.sendError(HttpServletResponse.SC_NOT_FOUND);
    }
  }
  
  /**
   * Saves the token received from the client
   * 
   * @param httpRequest The HTTP request object
   * @param httpResponse The HTTP response object
   * @throws IOException
   */
  private void handleGithubSyncTokenRequest(HttpServletRequest httpRequest,
      HttpServletResponse httpResponse) throws IOException {

    HttpSession session = httpRequest.getSession();
    HashMap<String, Object> requestBody = GithubUtil.parseJSON(httpRequest.getInputStream());
    
    String accessToken = (String) requestBody.get("accessToken");
    
    if (accessToken != null) {
      session.setAttribute("token", accessToken);
      GithubUrlStreamHandler.accessTokens.put(session.getId(), accessToken);
    }
    
    httpResponse.sendError(HttpServletResponse.SC_OK);
  }

  /**
   * Clears the access token from the session
   * (This method will be called when a 401 code is returned after calling a github action in the client)
   * 
   * @param httpRequest The HTTP request object
   * @param httpResponse The HTTP response object
   * @throws IOException
   */
  private void handleGithubClearAccessRequest(HttpServletRequest httpRequest, HttpServletResponse httpResponse) throws IOException {
    HttpSession session = httpRequest.getSession();
    session.removeAttribute("accessToken");
    
    httpResponse.sendError(HttpServletResponse.SC_OK);
  }

  /**
   * Handles the github credentials request.
   *
   * @param httpRequest The HTTP request object
   * @param httpResponse The HTTP response object
   * @throws IOException
   */
  private void handleGithubCredentialsRequest(HttpServletRequest httpRequest, HttpServletResponse httpResponse) throws IOException {
    httpResponse.addHeader("Content-Type", "application/json");
    HttpSession session = httpRequest.getSession();
    
    if (sendErrorIfAvailable(session, httpResponse)) {
      return;
    }
    if (sendAccessTokenIfAvailable(session, httpResponse)) {
      return;
    }
    sendClientId(session, httpRequest, httpResponse);
  }
  
  /**
   * Sends the error to the client
   * 
   * @param session The HTTP session
   * @param httpResponse The HTTP response object
   * @return True if the error is available and has been sent, false otherwise
   * @throws IOException
   */
  private boolean sendErrorIfAvailable(HttpSession session, HttpServletResponse httpResponse) throws IOException {
    String error = (String) session.getAttribute("error"); 
    
    if (error != null) {
      httpResponse.getWriter().write("{\"error\":\"" + error + "\"}");
      httpResponse.flushBuffer();
      return true;
    } else {
      return false;
    }
  }
  
  /**
   * Sends the Github access_token to the client
   * 
   * #param session The HTTP session 
   * @param httpResponse The HTTP response object
   * @return True if the access_token is available and has been sent, false otherwise
   * @throws IOException
   */
  private boolean sendAccessTokenIfAvailable(HttpSession session, HttpServletResponse httpResponse) throws IOException {
    String accessToken = (String) session.getAttribute("accessToken");
    String state = (String) session.getAttribute("state");

    if (accessToken != null) {
      GithubUrlStreamHandler.accessTokens.put(session.getId(), accessToken);
      
      httpResponse.getWriter().write("{\"state\":\"" + state + "\",\"client_id\":\"" + clientId + "\",\"access_token\":\"" + accessToken + "\"}");
      httpResponse.flushBuffer();
      return true;
    } else {
      return false;
    }
  }
  
  /**
   * Returns the Github client_id to the client
   * 
   * @param session The current HTTP session
   * @param httpRequest The HTTP request object
   * @param httpResponse The HTTP request object
   * @throws IOException 
   */
  private void sendClientId(HttpSession session, HttpServletRequest httpRequest, HttpServletResponse httpResponse) throws IOException {
    HashMap<String, Object> requestBody = GithubUtil.parseJSON(httpRequest.getInputStream());

    // The redirectTo (representing a URL) attribute will be needed when we want to redirect back to the application 
    String redirectTo = null;
    try {
      redirectTo = (String) requestBody.get("redirectTo");
      session.setAttribute("redirectTo", redirectTo);
    } catch (NullPointerException e) {
      httpResponse.sendError(HttpServletResponse.SC_BAD_REQUEST, "The property redirectTo is required");
      return;
    }
    
    // The state attribute will be sent to github and then returned back
    // We will have to check if the one received back from github is the same
    String state = UUID.randomUUID().toString();
    session.setAttribute("state", state);

    if (clientId == null) {
      logger.error("Missing github configuration parameter <clientId>. Make sure the 'github-plugin.properties' file is available");
      httpResponse.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
    } else {
      try {
        logger.debug("SENDING CLIENT_ID");
        httpResponse.getWriter().write("{\"client_id\":\"" + clientId + "\",\"state\":\"" + state + "\"}");
        httpResponse.flushBuffer();
      } catch (IOException e) {
        logger.error(e.getMessage());
        httpResponse.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
      }
    }
  }
  
  /**
   * Gets the access token from github and returns it to the client
   * 
   * @param httpRequest The HTTP request object
   * @param httpResponse The HTTP response object
   * @throws IOException
   */
  private void handleGithubCallbackRequest(HttpServletRequest httpRequest, HttpServletResponse httpResponse) throws IOException {
    HttpSession session = httpRequest.getSession();
    session.removeAttribute("error");
    
    HashMap<String, String> urlParams = parseQueryString(httpRequest.getQueryString());
    
    String githubCode = urlParams.get("code");
    String githubState = urlParams.get("state");
    
    String githubError = urlParams.get("error");
    String githubErrorDescription = urlParams.get("error_description");
    String githubErrorUri = urlParams.get("error_uri");
    
    logger.debug("githubCode:" + githubCode);
    logger.debug("githubState: " + githubState);    
    
    String state = (String) session.getAttribute("state");
    String redirectTo = (String) session.getAttribute("redirectTo");
    
    logger.debug("state: " + state);
    logger.debug("redirectTo: " + redirectTo);
    
    if (githubError != null && githubErrorDescription != null && githubErrorUri != null) {
      logger.error("GithubError: " + githubError);
      logger.error("GithubErrorDescripion: " + githubErrorDescription);
      logger.error("GithubErrorUri: " + githubErrorUri);

      session.setAttribute("error", githubError);
      httpResponse.sendRedirect(redirectTo);
      return;
    }

    if (githubState == null || githubCode == null) {
      logger.warn("Third Party.");
      httpResponse.sendError(HttpServletResponse.SC_FORBIDDEN, "Hi, you must have come here by mistake!");
      return;
    }
    
    // If the github state is different from our saved state, this request
    // has been created by a third party so we stop the flow.
    if (!githubState.equals(state) || redirectTo == null) {
      logger.warn("Third Party!");
      httpResponse.sendError(HttpServletResponse.SC_FORBIDDEN, "Hi, you must have come here by mistake!");
    } else {
      try {
        logger.debug("getting github access token");
        String accessToken = getAccessTokenFromGithub(githubCode);
        logger.debug("got github access token, saving it..");
        session.setAttribute("accessToken", accessToken);
        httpResponse.sendRedirect(redirectTo);
      } catch (IOException e) {
        logger.error(e.getMessage());
        session.setAttribute("error", "Internal Server Error (#HGCR)");
        httpResponse.sendRedirect(redirectTo);
      }
    }
  }
  
  /**
   * Returns a hashmap of the url query params
   * 
   * @param queryString The url query string to parse "key=value&key=value"
   * @return A hashmap of the url query params
   */
  private HashMap<String, String> parseQueryString(String queryString) {
    HashMap<String, String> urlParams = new HashMap<String, String>();
    
    if (queryString != null) {
      String[] params = queryString.split("&");
      
      for (String param : params) {
        String[] paramArr = param.split("=");
        
        String name = null;
        String value = "";
        
        try {
          name = paramArr[0];
          value = paramArr[1];
        } finally {
          if (name != null) {
            urlParams.put(name, value);
          }
        }
      }
    }
    
    return urlParams;
  }

  /**
   * Return an access token
   * 
   * @param code The code given in exchange for the access token
   * @return The access token
   * @throws IOException
   */
  private String getAccessTokenFromGithub(String code) throws IOException {
    URL githubAccessTokenUrl = new URL("https://github.com/login/oauth/access_token");
    HttpURLConnection conn = (HttpURLConnection) githubAccessTokenUrl.openConnection();
    
    logger.debug("Opened git access token conn");

    conn.setDoOutput(true);
    conn.setRequestMethod("POST");
    conn.setRequestProperty("Accept", "application/json");
    conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");

    String requestBody = "client_id=" + clientId + 
                  "&client_secret=" + clientSecret + 
                  "&code=" + code;

    OutputStreamWriter writer = new OutputStreamWriter(conn.getOutputStream());
    writer.write(requestBody);
    
    writer.close();
    
    HashMap<String, Object> tokenInfo = GithubUtil.parseJSON(conn.getInputStream());
    return (String) tokenInfo.get("access_token");
  }
}
