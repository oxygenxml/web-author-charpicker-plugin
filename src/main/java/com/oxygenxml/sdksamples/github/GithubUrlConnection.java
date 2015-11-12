package com.oxygenxml.sdksamples.github;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.jboss.resteasy.util.Base64;

import ro.sync.ecss.extensions.api.webapp.WebappMessage;
import ro.sync.ecss.extensions.api.webapp.plugin.FilterURLConnection;
import ro.sync.ecss.extensions.api.webapp.plugin.UserActionRequiredException;
import ro.sync.net.protocol.FileBrowsingConnection;
import ro.sync.net.protocol.FolderEntryDescriptor;
import ro.sync.util.URLUtil;

/**
 * Used to handle requests for urls like: github://method/params.
 * 
 * @author gabriel_titerlea
 *
 */
public class GithubUrlConnection extends FilterURLConnection implements FileBrowsingConnection {

  /**
   * The path of the opened url.
   */
  private String urlPathPart;
  
  /**
   * The github OAuth access token.
   */
  String accessToken;
  
  /**
   * Constructor
   * @param delegateConnection The underlying url connection
   * @param accessToken The github access token
   */
  public GithubUrlConnection(URLConnection delegateConnection, String accessToken, String urlPathPart) {
    super(delegateConnection);
    if (accessToken != null) {
      this.accessToken = accessToken;
      delegateConnection.setRequestProperty("Authorization", "token " + accessToken);
    }
    this.urlPathPart = urlPathPart;
  }
  
  @Override
  public InputStream getInputStream() throws IOException {
    String githubJsonResult;
    try {
      // The response from github comes in a json like: // {"content":"BASE64ecnodedContent",otherProps}
      githubJsonResult = GithubUtil.inputStreamToString(delegateConnection.getInputStream());
    } catch (IOException e) {
      throw new IOException("404 Not Found for: " + urlPathPart);
    }
    HashMap<String, Object> result = GithubUtil.parseJSON(githubJsonResult);

    String base64Content = (String) result.get("content");
    byte[] decodedContent = Base64.decode(base64Content);

    return new ByteArrayInputStream(decodedContent);
  }
  
  @Override
  public OutputStream getOutputStream() throws IOException {
    return new ByteArrayOutputStream() {
      @Override
      public void close() throws IOException {
        try {
          // The github api requests the content of the files to be base64 encoded
          byte[] content = toByteArray();
          String encodedContent = Base64.encodeBytes(content);
          
          // The url of the delegateConnection happens to be exactly what the GitHub api for creating/updating a file requires.
          // It is built in GithubUrlStreamHandler.openConnectionInContext
          URL apiCallUrl = delegateConnection.getURL();

          // Making a GET request to see if the file exists already
          HttpURLConnection connToCheckIfFileExists = (HttpURLConnection) apiCallUrl.openConnection();
          connToCheckIfFileExists.setRequestProperty("Authorization", "token " + accessToken);
          connToCheckIfFileExists.setRequestMethod("GET");
          
          Integer responseCode = null;
          HashMap<String, Object> fileExistsResult = null;
          
          try {
            responseCode = connToCheckIfFileExists.getResponseCode();
            fileExistsResult = GithubUtil
                .parseJSON(GithubUtil.inputStreamToString(connToCheckIfFileExists
                        .getInputStream()));          
          } catch (IOException e) {
            String message = e.getMessage();
            if (message != null && message.startsWith("404 Not Found")) {
              // If the file does not exist urlConnectionToCheckIfFileExists.getResponseCode() throws an IOException
              responseCode = 404;
            } else {
              // If a different error occurred or if the exception was thrown by inputStreamToString we will set the responseCode to 500
              // This way the third if branch below will be triggered and an IOException thrown.
              responseCode = 500;
            }
          }

          // We need to send the branch as a property of the JSON request body
          // We can take it from the apiCallUrl. It's the ref query param
          String branch = null;
          String[] queryParams = apiCallUrl.getQuery().split("&");
          for (int i = 0; i < queryParams.length - 1; i++) {
            String[] propValue = queryParams[i].split("=");
            if (propValue.length == 2 && propValue[0].equals("ref")) {
              // We wil put the branch as a JSON property and we don't need to have it URL encoded there.
              branch = URLUtil.decodeURIComponent(propValue[1]);
              break;
            }
          }
          
          if (branch == null) {
            // This should never happen
            throw new IOException("Could not create or update file on GitHub, missing branch.");
          }
          
          String apiRequestBody;
          // If we didn't find the file we will create one
          if (responseCode == 404) {
            apiRequestBody = 
                "{"
                + "\"message\":\"Creating new file from template.\","
                + "\"content\":\"" + encodedContent + "\","
                + "\"branch\":\"" + branch + "\""
              + "}";
          } 
          // Otherwise we will update the existing file
          else if (fileExistsResult != null) {
            // To update a file the GitHub api requires the sha of the updated file.
            String sha = (String) fileExistsResult.get("sha");
            
            apiRequestBody = 
                "{"
                + "\"message\":\"Overwriting file.\","
                + "\"content\":\"" + encodedContent + "\","
                + "\"sha\":\"" + sha + "\","
                + "\"branch\":\"" + branch + "\""
              + "}";
          } else {
            throw new IOException("Could not create or update file on GitHub");
          }
          
          HttpURLConnection urlConnection = (HttpURLConnection) apiCallUrl.openConnection();
          urlConnection.setRequestProperty("Content-Type", "application/json");
          urlConnection.setRequestProperty("Authorization", "token " + accessToken);
          urlConnection.setRequestMethod("PUT");
          urlConnection.setDoOutput(true);
          
          OutputStream outputStream = urlConnection.getOutputStream();
          outputStream.write(apiRequestBody.getBytes());
          outputStream.flush();
          
          outputStream.close();
        } catch (IOException e) {
          filterClientSecret(e);
        } 
      }
    };
  }
  
  @Override
  public List<FolderEntryDescriptor> listFolder() throws IOException {
    List<FolderEntryDescriptor> filesList = new ArrayList<FolderEntryDescriptor>();
    try {
      String githubJsonResult = GithubUtil
          .inputStreamToString(delegateConnection.getInputStream());

      // If this is a Json array:
      // [{content:'content'},{content:'content'},{content:'content'}]
      if (githubJsonResult.charAt(0) == '[') {
        List<GithubApiResult> githubResults = GithubUtil
            .parseGithubListResult(githubJsonResult);

        for (GithubApiResult result : githubResults) {
          // Add a '/' when the file is a directory because this is how upstream
          // identifies directories
          String dirChar = "";
          if (result.type.equals("dir")) {
            dirChar = "/";
          }

          filesList.add(new FolderEntryDescriptor(URLUtil
              .encodeURIComponent(result.name) + dirChar));
        }
      } else {
        // The result is a file and its content is Base64 encoded in the content
        // property
        GithubApiResult githubResult = GithubUtil
            .parseGithubResult(githubJsonResult);

        byte[] decodedContent = Base64.decode(githubResult.content);
        filesList.add(new FolderEntryDescriptor(new String(decodedContent)));
      }
    } catch (IOException e) {
      if (e.getMessage().startsWith("401") || e.getMessage().startsWith("403 Forbidden")) {
        // if the user is not authorized
        throw new UserActionRequiredException(new WebappMessage(
            WebappMessage.MESSAGE_TYPE_CUSTOM, "Authentication required",
            "Authentication required", true));
      } else {
        filterClientSecret(e);
      }
    }
    return filesList;
  }
  
  /**
   * Filters out the client_secret from the message of an IOException.
   * @param e The exception from which to filter out.
   * @throws IOException Thrown again, but this time it does not contain any client_secret info.
   */
  private void filterClientSecret(IOException e) throws IOException {
    // We should never send the client_secret to the client. So if the error 
    // message contains a url with the client_secret we'll trim it out
    String message = e.getMessage();
    int indexOfClientSecret = message.indexOf("client_secret");
    if (indexOfClientSecret != -1) {
      throw new IOException(message.substring(0, indexOfClientSecret));
    } else {
      throw e;
    }
  }
}
