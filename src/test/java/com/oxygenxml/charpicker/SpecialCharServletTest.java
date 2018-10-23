package com.oxygenxml.charpicker;

//import static org.mockito.Mockito.*;
import static org.junit.Assert.assertTrue;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Properties;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.servlet.ServletException;

import org.junit.Test;

import com.oxygenxml.charpicker.SpecialCharServlet;

public class SpecialCharServletTest {
	
	public Properties getChars() {
		Properties chars = new Properties();
		InputStream charsInputStream = null;
		try{
			charsInputStream = new FileInputStream("resources/unicodechars.properties");
			chars.load(charsInputStream);
		} catch (IOException ex) {
			ex.printStackTrace();
		} finally {
			if(charsInputStream != null) {
				try {
					charsInputStream.close();
				} catch (IOException e) {
					e.printStackTrace();
				}				
			}
		}
		return chars;
	}

	@Test
	public void testGetChars() throws FileNotFoundException, ServletException {
		SpecialCharServlet asd = new SpecialCharServlet();
		
		Map<String, String> result = asd.findCharByName("ywi", getChars());
		assertTrue(result.size() == 4);
	}
	
	@Test
	public void testFindCharByNameInFirstChars () {
		
		String query = "e";
		int limit = 10;
		
		SpecialCharServlet asd = new SpecialCharServlet();		
		Map<String, String> charactersFound = new LinkedHashMap<String, String>();
		
		charactersFound = asd.findCharByName(query, getChars());
		Pattern pattern = Pattern.compile("\\b" + query + "\\b", Pattern.CASE_INSENSITIVE);
    	
		int iterations = 0;
		for(Entry<String, String> entry : charactersFound.entrySet()) {
			Matcher matcher = pattern.matcher(entry.getValue());
			if(matcher.find()){
				break;
			}
			iterations++;
			if(iterations >= limit) {
				break;
			}
		}
		assertTrue(iterations < limit);		
	}
}
