package com.oxygenxml.charpicker;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Properties;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.codehaus.jackson.map.ObjectMapper;

import ro.sync.ecss.extensions.api.webapp.plugin.WebappServletPluginExtension;

public class SpecialCharServlet extends WebappServletPluginExtension {
	
	private static int maxResults = 500;
	
	private static int scoreFullMatch = 300;
	private static int scorePartialMatch = 150;
	
	private Map<String, Properties> charsMap = new HashMap<>(); 
	
	private static final Logger logger = Logger.getLogger(SpecialCharServlet.class.getName());
	
	private static final List<String> supportedLanguages = Arrays.asList("en", "fr", "de", "ja", "nl");
	

	
	@Override
	public void init() throws ServletException {
	  for (String lang : supportedLanguages) {
	    InputStream charsInputStream = this.getClass().getClassLoader().getResourceAsStream(lang + "_unicodechars.properties");
	    if (charsInputStream != null) {
	      Properties newProps = new Properties();
	      try {
	        newProps.load(charsInputStream);
	      } catch (IOException e) {
	        logger.error("could not load the special character file");
	      }
	      
	      charsMap.put(lang, newProps);
	    }
	  }		
	}
	
	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		String query = req.getParameter("q");
		Map<String, String> charResult = new LinkedHashMap<>();
		if(query.length() == 0) {
			new ObjectMapper().writeValue(resp.getOutputStream(), charResult);
		}
		else {
		  charResult = findCharByNameWithCookieLang(query, getCookieLanguage(req.getCookies()));
			new ObjectMapper().writeValue(resp.getOutputStream(), charResult);
		}
	}


  /**
   * Get results considering language from cookie if set.
   * Cookie language will be used only if the corresponding props file is present.
   * 
   * @param query The query string used to search for characters.
   * @param cookieLanguage The language to show results for. English results will complete the results.
   * @return The map of character codes to descriptions found.
   */
  Map<String, String> findCharByNameWithCookieLang(String query, String cookieLanguage) {
    Map<String, String> charResult = new LinkedHashMap<>();
    if (cookieLanguage != null && charsMap.get(cookieLanguage) != null) {
      charResult = findCharByName(query, charsMap.get(cookieLanguage));
    }

    // Translated props files might be incomplete so fill up with results from English.
    // Removing the English character list is a way to force translated results only.
    Properties englishChars = charsMap.get("en");
    if (englishChars != null) {
      Map<String, String> englishResults = findCharByName(query, englishChars);
      // Overwrite the general English results with more specific translated results if available.
      englishResults.putAll(charResult);
      charResult = englishResults;
    }  
    
    return charResult;
  }
	
  /**
   * Get the user interface language from the cookie.
   * @param cookies The request cookies.
   * @return The user interface language.
   */
	protected static String getCookieLanguage(Cookie[] cookies) {
	  String prefix = null;
    if (cookies != null && cookies.length != 0) {      
      for (Cookie cookie : cookies) {
        if ("oxy_lang".equals(cookie.getName())) {
          String cookieLanguage = cookie.getValue();
          String cookieLanguagePrefix = cookieLanguage.substring(0, 2);

          if (supportedLanguages.indexOf(cookieLanguage) != -1) {
            prefix = cookieLanguage;
          } else if (supportedLanguages.indexOf(cookieLanguagePrefix) != -1) {
            prefix = cookieLanguagePrefix;
          }
        }
      }
    }
    return prefix;
  }

	/**
	 * Find character by name or part of name.
	 * @param query The user input query.
	 * @param chars The list of characters to search in.
	 * @return The list of characters that match the query.
	 */
  public Map<String, String> findCharByName(String query, Properties chars) {
		// Remove extra spaces.
		query = query.replaceAll("\\s+", " ");
		// Remove special characters.
		query = query.replaceAll("[+.^:,*{}\\(\\)\\[\\]]", "");
		
		String[] queryWords = query.split("\\s+");
		int maxScore = queryWords.length * scoreFullMatch;
		
		int relevanceThreshold = getRelevanceThreshold(queryWords.length);
		Map<String, String> charsFromProperties = propsAsMap(chars);
		Map<String, String> matches = new LinkedHashMap<>();
		
		Map<Integer, Set<Map.Entry<String, String>>> charactersByScore = getCharactersByScore(queryWords, charsFromProperties);
		int results = 0;
		for(int score = maxScore; score >= relevanceThreshold; score--){
			if(charactersByScore.get(score) != null) {
				for(Entry<String, String> entry : charactersByScore.get(score)) {				
					matches.put(entry.getKey(), entry.getValue());
					results++;
					if(results >= maxResults){
		    			break;
	    		}
				}
			}
		}		
		return matches;
	}
  
  /**
   * Score equivalent to over half of query words matching fully.
   * @param queryWordsLength Number of query words.
   * @return The relevance threshold score.
   */
  private int getRelevanceThreshold (int queryWordsLength) {
    return queryWordsLength * scoreFullMatch/2 - 50;
  }

  /**
   * Get character results ordered by relevance.
   * @param queryWords The query words.
   * @param charsFromProperties The list of available characters.
   * @return A subset of characters which pass a relevance threshold. 
   */
  Map<Integer, Set<Entry<String, String>>> getCharactersByScore(String[] queryWords, Map<String, String> charsFromProperties) {
    Map<Integer, Set<Map.Entry<String, String>>> charactersByScore = new HashMap<>();
    
    ArrayList<Pattern> fullPatterns = getFullPatterns(queryWords);
    ArrayList<Pattern> partialPatterns = getPartialPatterns(queryWords);
    
    int relevanceThreshold = getRelevanceThreshold(queryWords.length);
    
    for(Map.Entry<String, String> entry : charsFromProperties.entrySet()) {
			String charDescription = entry.getValue();
			int score = 0;
			
			for(int i = 0; i< queryWords.length; i++){
				Matcher matcher = fullPatterns.get(i).matcher(charDescription);
				if(matcher.find()){
					score += scoreFullMatch;
					// Remove full matches when searching for other query words.
					charDescription = matcher.replaceAll("");
				} else {
				  matcher = partialPatterns.get(i).matcher(charDescription);
				  if(matcher.find()){
				    score += scorePartialMatch;
				  }
				}
			}			
			
			// Same score results with shorter description should be shown before longer ones.
			score -= entry.getValue().length();

			// Score equivalent to partial matches for all or full matches for half of query parameters.
			if(score >= relevanceThreshold) {				
				charactersByScore
          .computeIfAbsent(score, s -> new HashSet<>())
          .add(entry);
			}
		}
    return charactersByScore;
  }
	
	private Map<String, String> propsAsMap(Properties props) {
		Map<String, String> map = new LinkedHashMap<>();
		for (Map.Entry<Object, Object> entry: props.entrySet()) {
			map.put((String)entry.getKey(), (String)entry.getValue());
		}
		
		return map;
	}
	
	private ArrayList<Pattern> getFullPatterns(String[] queryWords) {
		ArrayList<Pattern> fullPatterns = new ArrayList<>();
		
		for(int i = 0; i < queryWords.length; i++) {
			Pattern pattern = Pattern.compile("\\b" + queryWords[i] + "\\b", Pattern.CASE_INSENSITIVE);
			fullPatterns.add(pattern);
		}
		
		return fullPatterns;
	}
	
	private ArrayList<Pattern> getPartialPatterns(String[] queryWords) {
		ArrayList<Pattern> partialPatterns = new ArrayList<>();
		
		for(int i = 0; i < queryWords.length; i++) {
			Pattern pattern = Pattern.compile("\\b" + queryWords[i] + "[a-zA-Z]+\\b", Pattern.CASE_INSENSITIVE);
			partialPatterns.add(pattern);
		}
		
		return partialPatterns;
	}
	
	@Override
	public String getPath() {
		return "charpicker-plugin";
	}
	
	public Properties getChars(String lang) {
		return charsMap.get(lang);
	}
	
	public void setChars(String lang, Properties chars) {
		charsMap.put(lang, chars);
	}
}
