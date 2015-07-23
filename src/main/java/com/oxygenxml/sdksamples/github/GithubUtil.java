package com.oxygenxml.sdksamples.github;

import java.io.InputStream;
import java.util.HashMap;

import org.codehaus.jackson.JsonFactory;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.type.TypeReference;

public class GithubUtil {
  /**
   * Parses a JSON string
   * 
   * @param inputStream The inputStream to parse
   * @returns A map of information needed for the github oauth flow
   */
  public static HashMap<String, Object> parseJSON(InputStream inputStream) {
    ObjectMapper mapper = new ObjectMapper(new JsonFactory());
    TypeReference<HashMap<String, Object>> typeRef = new TypeReference<HashMap<String, Object>>() {};
    
    HashMap<String, Object> githubInfo = null;
    try {
      githubInfo = mapper.readValue(inputStream, typeRef);
    } catch (Exception e) {
      return null;
    }
    
    return githubInfo;
  }
} 