package com.oxgenxml.charpicker;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.codehaus.jackson.map.ObjectMapper;

import ro.sync.ecss.extensions.api.webapp.plugin.WebappServletPluginExtension;

public class SpecialCharServlet extends WebappServletPluginExtension {
	
	private int maxIterations = 1000;
	
	private Properties chars;

	@Override
	public void init() throws ServletException {
		InputStream charsInputStream = this.getClass().getClassLoader().getResourceAsStream("/builtin/unicodeCharacters.properties");
		chars = new Properties();
		try {
			chars.load(charsInputStream);
		} catch (IOException e) {
			// log something...
		}
	}
	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		String query = req.getParameter("q");
		Map<String, String> charResult = findCharByName(query, chars);
		new ObjectMapper().writeValue(resp.getOutputStream(), charResult);
	}
	
	private Map<String, String> findCharByName(String query, Properties chars) {
		Map<String, String> matches = new HashMap<String, String>();
		Map<Object, Object> descriptionToCharCode = new HashMap<Object, Object>(chars);
		int iterations = 0;
		
		Pattern pattern = Pattern.compile("\\b" + query + "\\b", Pattern.CASE_INSENSITIVE);
		
		// try to find characters whose name contains the query as a separate word
		for (Map.Entry<Object, Object> entry : descriptionToCharCode.entrySet()) {
		    String value = (String) entry.getValue();
		    Matcher matcher = pattern.matcher(value);
		    if(matcher.find()){
		    	matches.put((String)entry.getKey(), (String)entry.getValue());
		    	iterations++;
		    	if(iterations >= maxIterations)
		    		break;
		    }
		}

		pattern = Pattern.compile("\\b" + query + "[a-zA-Z]*", Pattern.CASE_INSENSITIVE);
		
		// if none found with separate query word, search for query as beginning of word
		if(matches.size() == 0){
			for (Map.Entry<Object, Object> entry : descriptionToCharCode.entrySet()) {
			    String value = (String) entry.getValue();
			    Matcher matcher = pattern.matcher(value);
			    if(matcher.find()){
			    	matches.put((String)entry.getKey(), (String)entry.getValue());
			    	iterations++;
			    	if(iterations >= maxIterations)
			    		break;
			    }
			}
		}
		return matches;
	}
	
	@Override
	public String getPath() {
		return "charpicker-plugin";
	}
}
