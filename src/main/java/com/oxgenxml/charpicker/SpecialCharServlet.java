package com.oxgenxml.charpicker;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Properties;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.codehaus.jackson.map.ObjectMapper;


import org.apache.log4j.Logger;
import ro.sync.ecss.extensions.api.webapp.plugin.WebappServletPluginExtension;

public class SpecialCharServlet extends WebappServletPluginExtension {
	
	private static int maxResults = 500;
	
	private Properties chars;
	
	private static final Logger logger = Logger.getLogger(SpecialCharServlet.class.getName());

	
	@Override
	public void init() throws ServletException {
		InputStream charsInputStream = this.getClass().getClassLoader().getResourceAsStream("builtin/unicodeCharacters.properties");
		setChars(new Properties());
		try {
			getChars().load(charsInputStream);
		} catch (IOException e) {
			logger.error("could not load the special character file");
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
			charResult = findCharByName(query, getChars());
			new ObjectMapper().writeValue(resp.getOutputStream(), charResult);
		}
	}
	
	public Map<String, String> findCharByName(String query, Properties chars) {
		// Remove extra spaces.
		query = query.replaceAll("\\s+", " ");
		
		// Remove special characters.
		query = query.replaceAll("[+.^:,*{}\\(\\)\\[\\]]", "");
		
		
		String[] queryWords = query.split("\\s+");
		int scoreFullMatch = 3;
		int scorePartialMatch = 1;
		int maxScore = queryWords.length * scoreFullMatch;
		
		// Score equivalent to over half of query words matching fully.
		int relevanceThreshold = queryWords.length * scoreFullMatch/2;
		
		Map<String, String> charsFromProperties = propsAsMap(chars);
		Map<String, String> matches = new LinkedHashMap<>();
		
		Map<Integer, Set<Map.Entry<String, String>>> charactersByScore = new HashMap<>();

		
		ArrayList<Pattern> fullPatterns = getFullPatterns(queryWords);
		ArrayList<Pattern> partialPatterns = getPartialPatterns(queryWords);
		
		for(Map.Entry<String, String> entry : charsFromProperties.entrySet()) {
			String charDescription = entry.getValue();
			
			int score = 0;
			
			for(int i = 0; i< queryWords.length; i++){
				Matcher matcher = fullPatterns.get(i).matcher(charDescription);
				if(matcher.find()){
					score += scoreFullMatch;
				}
				matcher = partialPatterns.get(i).matcher(charDescription);
				if(matcher.find()){
					score += scorePartialMatch;
				}
			}			
			
			// Score equivalent to partial matches for all or full matches for half of query parameters.
			if(score >= relevanceThreshold) {
				Set<Entry<String, String>> charsWithCurrentScore = charactersByScore.get(score);
				if(charsWithCurrentScore == null) {
					charsWithCurrentScore = new HashSet<>();
					charactersByScore.put(score, charsWithCurrentScore);
				}
				charsWithCurrentScore.add(entry);
			}
		}
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
	
	public Properties getChars() {
		return chars;
	}
	
	public void setChars(Properties chars) {
		this.chars = chars;
	}
}
