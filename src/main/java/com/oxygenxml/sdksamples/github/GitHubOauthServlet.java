package com.oxygenxml.sdksamples.github;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStreamWriter;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Properties;
import java.util.UUID;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.log4j.Logger;

import ro.sync.ecss.extensions.api.webapp.plugin.WebappServletPluginExtension;
import ro.sync.exml.workspace.api.PluginWorkspaceProvider;
import ro.sync.merge.MergeConflictResolutionMethods;
import ro.sync.merge.MergeResult;
import ro.sync.merge.MergeResult.ResultType;

/**
 * Servlet used to for the GitHub OAuth flow. 
 */
public class GitHubOauthServlet extends WebappServletPluginExtension{
  
  /**
   * The name of the http-header in which we'll show the commit result type.
   */
  private static final String MERGE_RESULT_HEADER = "OXY-Merge-Result";

  /**
   * Constant for the github oauth client id key
   */
  private static final String CLIENT_ID = "clientId";

  /**
   * Constant for the github oauth redirectTo key
   */
  private static final String REDIRECT_TO = "redirectTo";

  /**
   * Constant for the github oauth state key
   */
  private static final String STATE = "state";

  /**
   * Constant for the github oauth accessToken key
   */
  private static final String ACCESS_TOKEN = "accessToken";

  /**
   * Constant for the github oauth error key
   */
  private static final String ERROR = "error";
  
  /** 
   * The Github clientId
   */
  static String clientId = null;
  /**
   * The Github clientSecret
   */
  static String clientSecret = null;
  
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
        
        try {
          // We call addListener with reflection in case this servlet will run on a container with a servlet-api < 3.0
          ServletContext servletContext = getServletConfig().getServletContext();
          Method method = ServletContext.class.getMethod("addListener", java.lang.Class.class);
          method.setAccessible(true);
          method.invoke(servletContext, HttpSessionObserver.class);
        } catch (NoSuchMethodException e) {
        } catch (SecurityException e) {
        } catch (IllegalAccessException e) {
        } catch (IllegalArgumentException e) {
        } catch (InvocationTargetException e) {
        }
      } catch (IOException e) {
        logger.warn("Could not read the github-plugin.properties file. The user must set the client_id and client_secret from the admin page.");
      }
    } else {
      logger.warn("Config file github-plugin.properties is missing from WEB-INF. The user must set the client_id and client_secret from the admin page.");
    }
  }
  
  @Override
  public void doGet(HttpServletRequest httpRequest, HttpServletResponse httpResponse) throws ServletException, IOException {
    String requestPath = httpRequest.getPathInfo();
    
    // If the clinetId is null the OAuth flow is not available
    if ((clientId == null || clientSecret == null) || 
        (clientId != null && clientId.isEmpty() || clientSecret != null && clientSecret.isEmpty())) {
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
    if ((clientId == null || clientSecret == null) || 
        (clientId != null && clientId.isEmpty() || clientSecret != null && clientSecret.isEmpty())) {
      httpResponse.sendError(HttpServletResponse.SC_NOT_FOUND);
      return;
    }
    
    String requestPath = httpRequest.getPathInfo();
    
    try {
      if (requestPath.matches(".*?\\/github_credentials\\/?")) {
          handleGithubCredentialsRequest(httpRequest, httpResponse);
      } else if (requestPath.matches(".*?\\/github_reset_access\\/?")) {
          handleGithubClearAccessRequest(httpRequest, httpResponse);
      } else if (requestPath.matches(".*?\\/github_commit_merge\\/?")) {
          handleGithubMergeCommit(httpRequest, httpResponse);
      } else {
        // The requested resource does not exist
        httpResponse.sendError(HttpServletResponse.SC_NOT_FOUND);
      }
    } catch (IOException e) {
      logger.error(e.getMessage());
    }
  }
  
  /**
   * Returns a string representing the "threewaymerge" result of three strings sent from the client.
   * @param httpRequest The HTTP request object
   * @param httpResponse The HTTP response object
   * @throws IOException
   */
  private void handleGithubMergeCommit(HttpServletRequest httpRequest,
      HttpServletResponse httpResponse) throws IOException {
    // Getting the request body
    String requestBodyString = GithubUtil.inputStreamToString(httpRequest.getInputStream());
    HashMap<String, Object> requestBody = GithubUtil.parseJSON(requestBodyString);
    
    String ancestor = (String) requestBody.get("ancestor");
    String left = (String) requestBody.get("left");
    String right = (String) requestBody.get("right");
    
    if (ancestor != null && !ancestor.isEmpty() &&
        left != null && !left.isEmpty() &&
        right != null && !right.isEmpty()) {
      MergeResult mergeResult = PluginWorkspaceProvider.getPluginWorkspace()
          .getXMLUtilAccess()
          .threeWayAutoMerge(ancestor, left, right, MergeConflictResolutionMethods.USE_LEFT);
      
      String mergedString = mergeResult.getMergedString();
      
      ResultType resultType = mergeResult.getResultType();
      
      if (resultType == ResultType.CLEAN) {
        httpResponse.setHeader(MERGE_RESULT_HEADER, "CLEAN");
      } else if (resultType == ResultType.WITH_CONFLICTS) {
        httpResponse.setHeader(MERGE_RESULT_HEADER, "WITH_CONFLICTS");
      } else if (resultType == ResultType.FAILED) {
        httpResponse.setHeader(MERGE_RESULT_HEADER, "FAILED");
      }
      
      httpResponse.setCharacterEncoding("UTF-8");
      httpResponse.setStatus(HttpServletResponse.SC_OK);
      httpResponse.getWriter().write(mergedString);
      httpResponse.flushBuffer();
    } else {
      httpResponse.sendError(HttpServletResponse.SC_BAD_REQUEST);
    }
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
    session.removeAttribute(ACCESS_TOKEN);
    
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
    // Identifying the user making the request
    HttpSession session = httpRequest.getSession();
    
    // Getting the request body
    String requestBodyString = GithubUtil.inputStreamToString(httpRequest.getInputStream());
    HashMap<String, Object> requestBody = GithubUtil.parseJSON(requestBodyString);

    // Synchronize oauth credentials with the client
    String clientId = (String) requestBody.get(CLIENT_ID);
    String accessToken = (String) requestBody.get(ACCESS_TOKEN);
    String state = (String) requestBody.get(STATE);

    // Only if the client has the same client id, synchronize accessTokens
    if (GitHubOauthServlet.clientId != null) {
      if (GitHubOauthServlet.clientId.equals(clientId) &&
          accessToken != null && !accessToken.isEmpty() &&
          state != null && !state.isEmpty()) {
        session.setAttribute(ACCESS_TOKEN, accessToken);
        session.setAttribute(STATE, state);
      } else if (!GitHubOauthServlet.clientId.equals(clientId)) {
        resetOauthCredentials(session);
      }
    }
    
    // reset will be true if user wants to re-authenticate so we will reset everything to null to start the OAuth flow again
    Boolean reset = (Boolean) requestBody.get("reset");
    if (reset != null && reset == true) {
      resetOauthCredentials(session);
    }
    
    // Return the Error, Access Token or Client ID
    httpResponse.addHeader("Content-Type", "application/json");
    if (sendErrorIfAvailable(session, httpResponse)) {
      return;
    }
    if (sendAccessTokenIfAvailable(session, httpResponse)) {
      return;
    }
    sendClientId(session, requestBody, httpResponse);
  }

  /**
   * Removes OAuth flow related properties from the session so that a new oauth flow is triggered. Causing the user to relogin.
   * @param session The Http session which identifies a user.
   */
  private void resetOauthCredentials(HttpSession session) {
    session.removeAttribute(ERROR);
    session.removeAttribute(ACCESS_TOKEN);
    session.removeAttribute(STATE);
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
    String error = (String) session.getAttribute(ERROR); 
    
    if (error != null) {
      httpResponse.getWriter().write("{\"error\":\"" + error + "\"}");
      httpResponse.flushBuffer();
      
      // If we don't remove the error attribute now, the client could end up being blocked without being able to login until his/her session expires.
      session.removeAttribute(ERROR);
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
    String accessToken = (String) session.getAttribute(ACCESS_TOKEN);
    String state = (String) session.getAttribute(STATE);

    if (accessToken != null && tokenIsStillValid(accessToken)) {
      GitHubPlugin.accessTokens.put(session.getId(), accessToken);
        
      httpResponse.getWriter().write("{\"state\":\"" + state + "\",\"client_id\":\"" + clientId + "\",\"access_token\":\"" + accessToken + "\"}");
      httpResponse.flushBuffer();
      return true;
    } else {
      // If the accessToken is not null but not valid we will remove it so that we can get a new one
      GitHubPlugin.accessTokens.remove(session.getId());
      session.removeAttribute(ACCESS_TOKEN);
      
      return false;
    }
  }
  
  /**
   * Tests whether an access token is still valid.
   * 
   * @param accessToken The access token to test for validity
   * @return True if the access token is still valid. (If the user did not revoke access for our application)
   */
  private boolean tokenIsStillValid(String accessToken) {
    boolean tokenIsStillValid = true;
    try {
      // Send the client_id and client_secret as well because we want to use the 5000 requests quota not the free one
      URL apiUrl = new URL("https://api.github.com/user?client_id=" + clientId + "&client_secret=" + clientSecret);
      HttpURLConnection apiConnection = (HttpURLConnection) apiUrl.openConnection();
      apiConnection.setRequestProperty("Authorization", "token " + accessToken);
      int responseCode = apiConnection.getResponseCode();
      
      if (responseCode != 200) {
        tokenIsStillValid =  false;
      } 
    } catch (IOException e) {
      tokenIsStillValid = false;
    }
    
    return tokenIsStillValid;
  }

  /**
   * Returns the Github client_id to the client.
   * 
   * @param session The current HTTP session
   * @param requestBody A map of the JSON parsed request body
   * @param httpResponse The HTTP request object
   * @throws IOException 
   */
  private void sendClientId(HttpSession session, HashMap<String, Object> requestBody, HttpServletResponse httpResponse) throws IOException {
    // The redirectTo (representing a URL) attribute will be needed when we want to redirect back to the application 
    String redirectTo = null;
    try {
      redirectTo = (String) requestBody.get(REDIRECT_TO);
      session.setAttribute(REDIRECT_TO, redirectTo);
    } catch (NullPointerException e) {
      httpResponse.sendError(HttpServletResponse.SC_BAD_REQUEST, "The property redirectTo is required");
      return;
    }
    
    // The state attribute will be sent to github and then returned back
    // We will have to check if the one received back from github is the same
    String state = UUID.randomUUID().toString();
    session.setAttribute(STATE, state);
    
    if (clientId == null || clientSecret == null) {
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
    session.removeAttribute(ERROR);
    
    HashMap<String, String> urlParams = parseQueryString(httpRequest.getQueryString());
    
    String githubCode = urlParams.get("code");
    String githubState = urlParams.get(STATE);
    
    String githubError = urlParams.get(ERROR);
    String githubErrorDescription = urlParams.get("error_description");
    String githubErrorUri = urlParams.get("error_uri");
    
    logger.debug("githubCode:" + githubCode);
    logger.debug("githubState: " + githubState);    
    
    String state = (String) session.getAttribute(STATE);
    String redirectTo = (String) session.getAttribute(REDIRECT_TO);
    
    logger.debug("state: " + state);
    logger.debug("redirectTo: " + redirectTo);
    
    if (githubError != null && githubErrorDescription != null && githubErrorUri != null) {
      logger.error("GithubError: " + githubError);
      logger.error("GithubErrorDescripion: " + githubErrorDescription);
      logger.error("GithubErrorUri: " + githubErrorUri);

      session.setAttribute(ERROR, githubError);
      httpResponse.sendRedirect(redirectTo);
      return;
    }

    /**
     * I have 3 separate if statements because I want to give separate feedback to the user 
     * in case they may need to report some error.
     * This way we will have a better idea of where to look. 
     */
    
    if (githubState == null) {
      logger.warn("Third Party.");
      httpResponse.sendError(HttpServletResponse.SC_FORBIDDEN, "Wrong state.");
      return;
    }
    
    if (githubCode == null) {
      logger.warn("Third Party.");
      httpResponse.sendError(HttpServletResponse.SC_FORBIDDEN, "Wrong code.");
      return;
    }
    
    if (redirectTo == null) {
      logger.warn("Third Party.");
      httpResponse.sendError(HttpServletResponse.SC_FORBIDDEN, "Where do you want to go?");
      return;
    }
    
    // If the github state is different from our saved state, this request
    // has been created by a third party so we stop the flow.
    if (!githubState.equals(state)) {
      logger.warn("Third Party!");
      httpResponse.sendError(HttpServletResponse.SC_FORBIDDEN, "Hi, you must have come here by mistake!");
    } else {
      try {
        logger.debug("getting github access token");
        String accessToken = getAccessTokenFromGithub(githubCode);
        
        if (accessToken == null) {
          session.setAttribute(ERROR, "Internal Server Error (Github Plugin is not configured properly)");
          httpResponse.sendRedirect(redirectTo);
          return;
        }
        
        logger.debug("got github access token, saving it..");
        session.setAttribute(ACCESS_TOKEN, accessToken);
        httpResponse.sendRedirect(redirectTo);
      } catch (IOException e) {
        logger.error(e.getMessage());
        session.setAttribute(ERROR, "Internal Server Error (#HGCR)");
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
    
    String githubResponseBody = GithubUtil.inputStreamToString(conn.getInputStream());
    HashMap<String, Object> tokenInfo = GithubUtil.parseJSON(githubResponseBody);
    return (String) tokenInfo.get("access_token");
  }
}
