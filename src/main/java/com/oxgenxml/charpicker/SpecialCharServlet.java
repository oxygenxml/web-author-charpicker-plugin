package com.oxgenxml.charpicker;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Properties;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.IOUtils;
import org.codehaus.jackson.map.ObjectMapper;

import com.google.common.base.Charsets;
import com.google.common.collect.BiMap;
import com.google.common.collect.HashBiMap;

import ro.sync.ecss.extensions.api.webapp.plugin.WebappServletPluginExtension;

public class SpecialCharServlet extends WebappServletPluginExtension {
	
	private int maxIterations = 1000;

	@Override
	public void init() throws ServletException {
	}
	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		String query = req.getParameter("q");
		
		InputStream charsInputStream = this.getClass().getClassLoader().getResourceAsStream("/builtin/unicodeCharacters.properties");
		Properties chars = new Properties();
		chars.load(charsInputStream);
		Map<Object, Object> charResult = findCharByName(query, chars);
		new ObjectMapper().writeValue(resp.getOutputStream(), charResult);
	}
	
	@Override
	public void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		String query = req.getParameter("q");
		InputStream charsInputStream = this.getClass().getClassLoader().getResourceAsStream("/builtin/unicodeCharacters.properties");
		Properties chars = new Properties();
		chars.load(charsInputStream);
		Map<Object, Object> charResult = findCharByName(query, chars);
		new ObjectMapper().writeValue(resp.getOutputStream(), charResult);
	}

	private Map<Object, Object> findCharByName(String query, Properties chars) {
		
		Map<Object, Object> matches = new HashMap<Object, Object>();
		Map<Object, Object> descriptionToCharCode = new HashMap<Object, Object>(chars);
		int iterations = 0;
		
		// try to find characters whose name contains the query as a separate word
		for (Map.Entry<Object, Object> entry : descriptionToCharCode.entrySet()) {
		    String value = (String) entry.getValue();
		    Pattern pattern = Pattern.compile("\\b" + query + "\\b", Pattern.CASE_INSENSITIVE);
		    Matcher matcher = pattern.matcher(value);
		    if(matcher.find()){
		    	matches.put(entry.getKey(), entry.getValue());
		    	iterations++;
		    	if(iterations >= maxIterations)
		    		break;
		    }
		}
		// if none found with separate query word, search for query as beginning of word
		if(matches.size() == 0){
			for (Map.Entry<Object, Object> entry : descriptionToCharCode.entrySet()) {
			    String value = (String) entry.getValue();
			    Pattern pattern = Pattern.compile("\\b" + query + "[a-zA-Z]*", Pattern.CASE_INSENSITIVE);
			    Matcher matcher = pattern.matcher(value);
			    if(matcher.find()){
			    	matches.put(entry.getKey(), entry.getValue());
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
