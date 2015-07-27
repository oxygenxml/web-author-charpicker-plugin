package com.oxygenxml.sdksamples.github;

import org.codehaus.jackson.annotate.JsonIgnoreProperties;
import org.codehaus.jackson.annotate.JsonProperty;

/**
 * Class used when parsing the github api results
 * 
 * @author gabriel_titerlea
 *
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class GithubApiResult {
  // File contents related
  @JsonProperty("content")
  public String content;

  @JsonProperty("name")
  public String name;
  
  @JsonProperty("type")
  public String type;
}