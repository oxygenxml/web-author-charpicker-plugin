package com.oxygenxml.charpicker;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
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

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;
import ro.sync.ecss.extensions.api.webapp.plugin.ServletPluginExtension;
import ro.sync.ecss.extensions.api.webapp.plugin.servlet.ServletException;
import ro.sync.ecss.extensions.api.webapp.plugin.servlet.http.Cookie;
import ro.sync.ecss.extensions.api.webapp.plugin.servlet.http.HttpServletRequest;
import ro.sync.ecss.extensions.api.webapp.plugin.servlet.http.HttpServletResponse;

@Slf4j
public class SpecialCharServlet extends ServletPluginExtension {
	
	private static final int MAX_RESULTS = 500;

	private static final int SCORE_FULL_MATCH = 300;
	private static final int SCORE_PARTIAL_MATCH = 150;

	// Translated names contain non-ASCII letters, so word boundaries and case folding must be Unicode-aware.
	private static final int PATTERN_FLAGS = Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE | Pattern.UNICODE_CHARACTER_CLASS;

	private static final ObjectMapper objectMapper = new ObjectMapper();
	
	private Map<String, Map<String, String>> charsMap = new HashMap<>(); 
	
	private static final List<String> supportedLanguages = Arrays.asList("en", "fr", "de", "ja", "nl", "zh");
	

	
	@Override
	public void init() throws ServletException {
	  for (String lang : supportedLanguages) {
	    try (InputStream charsInputStream = this.getClass().getClassLoader().getResourceAsStream(lang + "_unicodechars.properties")) {
	      if (charsInputStream != null) {
	        charsMap.put(lang, loadChars(charsInputStream));
	      }
	    } catch (IOException e) {
	      log.error("Could not load the special character file for language {}", lang, e);
	    }
	  }
	}

	static Map<String, String> loadChars(InputStream charsInputStream) throws IOException {
	  Properties props = new Properties();
	  props.load(new InputStreamReader(charsInputStream, StandardCharsets.UTF_8));
	  return propsAsMap(props);
	}
	
	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		String query = req.getParameter("q");
		resp.setContentType("application/json");
		Map<String, String> charResult = new LinkedHashMap<>();
		if(query != null && !query.isEmpty()) {
			charResult = findCharByNameWithCookieLang(query, getCookieLanguage(req.getCookies()));
		}
		objectMapper.writeValue(resp.getOutputStream(), toSearchResults(charResult));
	}

  /**
   * A search result, as sent to the browser.
   */
  static final class SearchResult {
    public final String code;
    public final String name;

    SearchResult(String code, String name) {
      this.code = code;
      this.name = name;
    }
  }

  /**
   * The results are sent as a list because a JSON object loses the relevance order in the browser:
   * JavaScript enumerates all-digit codes such as "10300" first, as array indices.
   * @param charResult The results, best match first.
   * @return The results in the same order.
   */
  static List<SearchResult> toSearchResults(Map<String, String> charResult) {
    List<SearchResult> results = new ArrayList<>(charResult.size());
    for (Entry<String, String> entry : charResult.entrySet()) {
      results.add(new SearchResult(entry.getKey(), entry.getValue()));
    }
    return results;
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
    // Skip when the cookie language is already English to avoid scoring the same list twice.
    // Removing the English character list is a way to force translated results only.
    if (!"en".equals(cookieLanguage)) {
      Map<String, String> englishChars = charsMap.get("en");
      if (englishChars != null) {
        charResult = fillUpWithEnglish(charResult, findCharByName(query, englishChars));
      }
    }

    return charResult;
  }

  /**
   * Translated matches come first, as the more specific ones, and English matches fill up to the result
   * limit. Each search is capped on its own, so the merge has to be capped again.
   */
  static Map<String, String> fillUpWithEnglish(Map<String, String> translatedResults, Map<String, String> englishResults) {
    Map<String, String> results = new LinkedHashMap<>(translatedResults);
    for (Entry<String, String> english : englishResults.entrySet()) {
      if (results.size() >= MAX_RESULTS) {
        break;
      }
      results.putIfAbsent(english.getKey(), english.getValue());
    }
    return results;
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
          if (supportedLanguages.contains(cookieLanguage)) {
            prefix = cookieLanguage;
          } else if (cookieLanguage != null && cookieLanguage.length() >= 2) {
            String cookieLanguagePrefix = cookieLanguage.substring(0, 2);
            if (supportedLanguages.contains(cookieLanguagePrefix)) {
              prefix = cookieLanguagePrefix;
            }
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
  public Map<String, String> findCharByName(String query, Map<String, String> chars) {
		// Remove extra spaces.
		query = query.replaceAll("\\s+", " ");
		// Remove special characters.
		query = query.replaceAll("[+.^:,*{}\\(\\)\\[\\]]", "");
		// Trim after the removal, which can expose leading whitespace (e.g. "( euro"). An empty word would match every name.
		query = query.trim();
		if (query.isEmpty()) {
			return new LinkedHashMap<>();
		}

		String[] queryWords = query.split("\\s+");
		int maxScore = queryWords.length * SCORE_FULL_MATCH;
		
		int relevanceThreshold = getRelevanceThreshold(queryWords.length);
		Map<String, String> matches = new LinkedHashMap<>();
		
		Map<Integer, Set<Map.Entry<String, String>>> charactersByScore = getCharactersByScore(queryWords, chars);
		for(int score = maxScore; score >= relevanceThreshold; score--){
			if(charactersByScore.get(score) != null) {
				for(Entry<String, String> entry : charactersByScore.get(score)) {
					matches.put(entry.getKey(), entry.getValue());
					if(matches.size() >= MAX_RESULTS){
						return matches;
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
    return queryWordsLength * SCORE_FULL_MATCH/2 - 50;
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
					score += SCORE_FULL_MATCH;
					// Remove full matches when searching for other query words.
					charDescription = matcher.replaceAll("");
				} else {
				  matcher = partialPatterns.get(i).matcher(charDescription);
				  if(matcher.find()){
				    score += SCORE_PARTIAL_MATCH;
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
	
	/**
	 * Codes must be the five uppercase hex digits of the English file, as the README states. A code spelled
	 * differently would make the same character come out twice in a search, and one the browser cannot parse
	 * would break the result list, so such entries are rejected and reported to be fixed.
	 */
	static Map<String, String> propsAsMap(Properties props) {
		Map<String, String> map = new HashMap<>();
		List<String> rejected = new ArrayList<>();
		for (Map.Entry<Object, Object> entry: props.entrySet()) {
			String code = (String) entry.getKey();
			if (isCanonicalCode(code)) {
				map.put(code, (String) entry.getValue());
			} else {
				rejected.add(code + "=" + entry.getValue());
			}
		}
		if (!rejected.isEmpty()) {
			log.error("Ignoring {} entries of a character name file because the code is not 5 uppercase hex digits, e.g. {}",
					rejected.size(), rejected.subList(0, Math.min(5, rejected.size())));
		}
		return Collections.unmodifiableMap(map);
	}

	private static boolean isCanonicalCode(String key) {
		if (key.length() != 5) {
			return false;
		}
		for (int i = 0; i < key.length(); i++) {
			char c = key.charAt(i);
			if ((c < '0' || c > '9') && (c < 'A' || c > 'F')) {
				return false;
			}
		}
		return true;
	}
	
	private ArrayList<Pattern> getFullPatterns(String[] queryWords) {
		ArrayList<Pattern> fullPatterns = new ArrayList<>();
		
		for(int i = 0; i < queryWords.length; i++) {
			Pattern pattern = Pattern.compile("\\b" + Pattern.quote(queryWords[i]) + "\\b", PATTERN_FLAGS);
			fullPatterns.add(pattern);
		}
		
		return fullPatterns;
	}
	
	private ArrayList<Pattern> getPartialPatterns(String[] queryWords) {
		ArrayList<Pattern> partialPatterns = new ArrayList<>();
		
		for(int i = 0; i < queryWords.length; i++) {
			Pattern pattern = Pattern.compile("\\b" + Pattern.quote(queryWords[i]) + "\\p{L}+\\b", PATTERN_FLAGS);
			partialPatterns.add(pattern);
		}
		
		return partialPatterns;
	}
	
	@Override
	public String getPath() {
		return "charpicker-plugin";
	}
	
	public Map<String, String> getChars(String lang) {
		return charsMap.get(lang);
	}
	
	public void setChars(String lang, Map<String, String> chars) {
		charsMap.put(lang, chars);
	}
}
