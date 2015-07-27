package com.oxygenxml.sdksamples.github;

import java.io.IOException;
import java.io.InputStream;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.apache.commons.io.IOUtils;
import org.codehaus.jackson.JsonFactory;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.type.TypeReference;

public class GithubUtil {
  /**
   * Parses a JSON string
   * 
   * @param githubJson The Github json result to parse
   */
  public static GithubApiResult parseGithubResult(String githubJson) {
    ObjectMapper mapper = new ObjectMapper(new JsonFactory());
    TypeReference<GithubApiResult> typeRef = new TypeReference<GithubApiResult>() {};
    
    GithubApiResult githubResult = null;
    try {
      githubResult = mapper.readValue(githubJson, typeRef);
    } catch (Exception e) {}
    
    return githubResult;
  }
  
  /**
   * Parses a JSON string which is a list
   * 
   * @param githubJson The Github json to parse
   */
  public static List<GithubApiResult> parseGithubListResult(String githubJson) {
    ObjectMapper mapper = new ObjectMapper(new JsonFactory());
    TypeReference<ArrayList<GithubApiResult>> typeRef = new TypeReference<ArrayList<GithubApiResult>>() {};
    
    ArrayList<GithubApiResult> githubResult = null;
    try {
      githubResult = mapper.readValue(githubJson, typeRef);
    } catch (Exception e) {}
    
    return githubResult;
  }
  
  /**
   * Transforms an InputStrea to a String
   * @param inputStream The inputStream to transform
   * @return A String representation of the inputStream
   */
  public static String inputStreamToString(InputStream inputStream) {
    try {
      StringWriter writer = new StringWriter();
      IOUtils.copy(inputStream, writer, "UTF-8");
      return writer.toString();
    } catch (IOException e) {
      return null;
    }
  }
  
  /**
   * Parses a JSON string
   * 
   * @param json The inputStream to parse
   * @returns A map of information needed for the github oauth flow
   */
  public static HashMap<String, Object> parseJSON(String json) {
    ObjectMapper mapper = new ObjectMapper(new JsonFactory());
    TypeReference<HashMap<String, Object>> typeRef = new TypeReference<HashMap<String, Object>>() {};
    
    HashMap<String, Object> githubInfo = null;
    try {
      githubInfo = mapper.readValue(json, typeRef);
    } catch (Exception e) {
      return null;
    }
    
    return githubInfo;
  }
} 
