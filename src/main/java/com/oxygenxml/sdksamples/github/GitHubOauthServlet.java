package com.oxygenxml.sdksamples.github;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.UUID;

import javax.servlet.RequestDispatcher;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.http.HttpRequest;
import org.apache.http.HttpResponse;
import org.apache.log4j.Logger;
import org.codehaus.jackson.JsonFactory;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.type.TypeReference;

import ro.sync.ecss.extensions.api.webapp.plugin.WebappServletPluginExtension;

/**
 * Servlet used to for the GitHub OAuth flow. 
 */
public class GitHubOauthServlet extends WebappServletPluginExtension{
  
  /** 
   * The github clientId
   */
  private String clientId;
  /**
   * The github clientSecret
   */
  private String clientSecret;
  
  @Override
  public String getPath() {
    return "github-oauth";
  }
  
  private Logger logger;
  
  @Override
  public void init() throws ServletException {
    // TODO: remove the hard-coding, get the values from a config file
    clientId = "f3358377e8233e7ed68f";
    clientSecret = "29d6dcf8020e3a0d3449ce94a1537a23b9b75ad5";
    
    logger = Logger.getLogger("GithubOauthServlet");
  }
  
  @Override
  public void doGet(HttpServletRequest httpRequest, HttpServletResponse httpResponse) throws ServletException, IOException {
    String requestPath = httpRequest.getPathInfo();
    
    if (requestPath.matches(".*?\\/callback\\/?")) {
      // http://localhost:8081/oxygen-webapp/plugins-dispatcher/github-oauth/callback
      try {
        handleGithubCallbackRequest(httpRequest, httpResponse);
      } catch (IOException e) {
        System.out.println(e.getMessage());
        e.printStackTrace();
      }
    }
  }
  
  /**
   * Handles the OAuth authentication flow
   */
  @Override
  public void doPost(HttpServletRequest httpRequest, HttpServletResponse httpResponse)
      throws ServletException, IOException {

    httpResponse.addHeader("Content-Type", "application/json");
    String requestPath = httpRequest.getPathInfo();
    
    if (requestPath.matches(".*?\\/github_credentials\\/?")) {
      try {
        handleGithubCredentialsRequest(httpRequest, httpResponse);
      } catch (IOException e) {
        System.out.println(e.getMessage());
        e.printStackTrace();
      }
    } else {
      httpResponse.sendError(HttpServletResponse.SC_NOT_FOUND);
    }
  }
  
  private final static String DIVIDER = "_r_t_ll_t_r_";
  
  /**
   * Sends the client_id to the client
   * 
   * @param httpResponse The HTTP response object
   * @throws IOException
   */
  private void handleGithubCredentialsRequest(HttpServletRequest httpRequest, HttpServletResponse httpResponse) throws IOException {

    HttpSession session = httpRequest.getSession();
    if (sendAccessTokenIfAvailable(session, httpResponse)) {
      return;
    }
    
    HashMap<String, Object> requestBody = parseJSON(httpRequest.getInputStream());

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

    if (redirectTo == null || state == null || clientId == null) {
      httpResponse.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
    } else {
      try {
        System.out.println("SENDING CLIENT_ID: " + clientId + " " + state);
        httpResponse.getWriter().write("{\"client_id\":\"" + clientId + "\",\"state\":\"" + state + "\"}");
      } catch (IOException e) {
        httpResponse.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
      }
    }
    httpResponse.flushBuffer();
  }
  
  /**
   * Sends the Github access_token to the client
   * 
   * @param httpResponse The HTTP response object
   * @throws IOException
   */
  private boolean sendAccessTokenIfAvailable(HttpSession session, HttpServletResponse httpResponse) throws IOException {
    String accessToken = (String) session.getAttribute("accessToken");

    if (accessToken != null) {
      httpResponse.getWriter().write("{\"access_token\":\"" + accessToken + "\"}");
      httpResponse.flushBuffer();
      return true;
    } else {
      return false;
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
    System.out.println("Handling github callback request.");

    HashMap<String, String> urlParams = parseQueryString(httpRequest.getQueryString());
    
    String githubCode = urlParams.get("code");
    String githubState = urlParams.get("state");
    
    System.out.println("githubCode:" + githubCode);
    System.out.println("githubState: " + githubState);    
    
    HttpSession session = httpRequest.getSession();
    System.out.println("Got the session");
    
    String state = (String) session.getAttribute("state");
    String redirectTo = (String) session.getAttribute("redirectTo");
    
    System.out.println("state: " + state);
    System.out.println("redirectTo: " + redirectTo);
    
    // If the github state is different from our saved state, this request
    // has been created by a third party so we stop it.
    if (!githubState.equals(state) || redirectTo == null) {
      System.out.println("unauthorized");
      session.setAttribute("error", "{\"code\":403,\"message\":\"Unauthorized\"}");
    } else {
      try {
        if (githubCode != null) {
          System.out.println("getting github access token");
          String accessToken = getAccessTokenFromGithub(githubCode);
          System.out.println("got github access token, saving it..");
          session.setAttribute("accessToken", accessToken);
          
          session.removeAttribute("error");
        }
      } catch (IOException e) {
        session.setAttribute("error", "{\"code\":500,\"message\":\"" + e.getMessage() + "\"}");
      }
    }
    
    httpResponse.sendRedirect(redirectTo);
  }
  
  /**
   * Returns a hashmap of the url query params
   * 
   * @param queryString
   * @return A hashmap of the url query params
   */
  private HashMap<String, String> parseQueryString(String queryString) {
    HashMap<String, String> urlParams = new HashMap<String, String>();
    
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
    
    return urlParams;
  }
  
  /**
   * Gets the access token from github and returns it to the client
   * 
   * @param httpRequest The HTTP request object
   * @param httpResponse The HTTP response object
   * @throws IOException
   */
  private void handleGithubCallbackRequestBackup(HttpServletRequest httpRequest, HttpServletResponse httpResponse) throws IOException {
    
    System.out.println("Handling github callback request.");

    String query = httpRequest.getQueryString();
    System.out.println(query);
    
    httpResponse.sendRedirect("");
    
    
    HashMap<String, Object> requestBody = parseJSON(httpRequest.getInputStream());

    String githubCode = (String) requestBody.get("code");
    String githubState = ((String) requestBody.get("state")).split(DIVIDER)[0];

    System.out.println("githubCode:" + githubCode);
    System.out.println("githubState: " + githubState);
    
    HttpSession session = httpRequest.getSession();

    System.out.println("Got the session");
    
    String sessionState = (String) session.getAttribute("sessionState");
    System.out.println("sessionState: "+ sessionState);
    
    String state = ((String) session.getAttribute("sessionState")).split(DIVIDER)[0];
    String redirectTo = (String) session.getAttribute("redirectTo");
    
    System.out.println("stete: " + state);
    System.out.println("redirectTo: " + redirectTo);
    
    // If the github state is different from our saved state, this request
    // has been created by a third party so we stop it.
    if (!githubState.equals(state) || redirectTo == null) {
      System.out.println("unauthorized");
      httpResponse.sendError(HttpServletResponse.SC_UNAUTHORIZED);
      return;
    }
    
    try {
      if (githubCode != null) {
        System.out.println("getting github access token");
        String accessToken = getAccessTokenFromGithub(githubCode);
        System.out.println("got github access token, sending it..");
        httpResponse.getWriter().write("{\"access_token\":\"" + accessToken + "\", \"redirect_to\":\"" + redirectTo + "\"}");
      } else {
        System.out.println("badrequest missing gihub code");
        httpResponse.sendError(HttpServletResponse.SC_BAD_REQUEST, "Bad request, missing github code");
      }
    } catch (IOException e) {
      httpResponse.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
    }
    httpResponse.flushBuffer();
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
    
    System.out.println("Opened git access token conn");

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
    
    HashMap<String, Object> tokenInfo = parseJSON(conn.getInputStream());
    writer.close();
    return (String) tokenInfo.get("access_token");
  }
  
  /**
   * Parses a JSON string
   * 
   * @param requestInputStream
   * @returns A map of information needed for the github oauth flow
   */
  private HashMap<String, Object> parseJSON(InputStream requestInputStream) {
    ObjectMapper mapper = new ObjectMapper(new JsonFactory());
    TypeReference<HashMap<String, Object>> typeRef = new TypeReference<HashMap<String, Object>>() {};
    
    HashMap<String, Object> githubInfo = null;
    try {
      githubInfo = mapper.readValue(requestInputStream, typeRef);
    } catch (Exception e) {
      return null;
    }
    
    return githubInfo;
  }
}
