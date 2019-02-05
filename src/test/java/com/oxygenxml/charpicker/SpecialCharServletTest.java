package com.oxygenxml.charpicker;

import static org.junit.Assert.assertEquals;
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

public class SpecialCharServletTest {
  
	public Properties getChars(String prefix) {
		Properties chars = new Properties();
		InputStream charsInputStream = null;
		try{
			charsInputStream = new FileInputStream("test/" + prefix + "_unicodechars.properties");
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
		
		Map<String, String> result = asd.findCharByName("ywi", getChars("en"));
		assertTrue(result.size() == 4);
	}
	
	@Test
  public void testFindCharByNameScore () {
    /* Make sure circled katakana ka has a bigger score than other circled katakana letters. */
    String query = "circled katakana ka";
    
    SpecialCharServlet asd = new SpecialCharServlet();    
    Map<String, String> charactersFound = new LinkedHashMap<String, String>();
    
    charactersFound = asd.findCharByName(query, getChars("en"));
    assertEquals(50, charactersFound.size());
    Entry<String, String> entry = charactersFound.entrySet().iterator().next();
    assertEquals(query, entry.getValue().toLowerCase());
  }
	
	@Test
	public void testFindCharByNameInFirstChars () {
		
		String query = "e";
		int limit = 10;
		
		SpecialCharServlet asd = new SpecialCharServlet();		
		Map<String, String> charactersFound = new LinkedHashMap<String, String>();
		
		charactersFound = asd.findCharByName(query, getChars("en"));
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
	
	@Test
  public void testFindCharByNameTranslated() {
    
    String query = "ew";
    String ewCode = "02EB8";
    String expectedCode = "[02EB8]";
    
    String expectedCodeFallback = "0A2E2";
    
    SpecialCharServlet asd = new SpecialCharServlet();    
    asd.setChars("en", getChars("en"));
    asd.setChars("fr", getChars("fr"));
    asd.setChars("de", getChars("de"));
    
    Map<String, String> charactersFound = new LinkedHashMap<String, String>();
    
    // Check English.
    charactersFound = asd.findCharByNameWithCookieLang(query, "en");
    assertEquals(1, charactersFound.size());
    assertEquals(expectedCode, charactersFound.keySet().toString());
    assertEquals("Cjk Radical Ewe", charactersFound.get(ewCode).toString());
    
    // Check German.
    charactersFound = asd.findCharByNameWithCookieLang(query, "de");
    assertEquals(1, charactersFound.size());
    assertEquals(expectedCode, charactersFound.keySet().toString());
    assertEquals("German description for ew", charactersFound.get(ewCode).toString());
    // Check fallback to English.
    charactersFound = asd.findCharByNameWithCookieLang("zzu", "de");
    assertEquals(6, charactersFound.size());
    assertTrue(charactersFound.keySet().contains(expectedCodeFallback));
    assertEquals("Yi Syllable Zzux", charactersFound.get(expectedCodeFallback).toString());
    
    // Check French.
    charactersFound = asd.findCharByNameWithCookieLang(query, "fr");
    assertEquals(1, charactersFound.size());
    assertEquals(expectedCode, charactersFound.keySet().toString());
    assertEquals("French description for ew", charactersFound.get(ewCode).toString());
    // Check fallback to English.
    charactersFound = asd.findCharByNameWithCookieLang("zzu", "fr");
    assertEquals(6, charactersFound.size());
    assertTrue(charactersFound.keySet().contains(expectedCodeFallback));
    assertEquals("Yi Syllable Zzux", charactersFound.get(expectedCodeFallback).toString());
    
    // Check Japanese, there is no file for Japanese, you won't believe what happens next!
    charactersFound = asd.findCharByNameWithCookieLang(query, "ja");
    assertEquals(1, charactersFound.size());
    assertEquals(expectedCode, charactersFound.keySet().toString());
    assertEquals("Cjk Radical Ewe", charactersFound.get(ewCode).toString());
    // Check fallback to English.
    charactersFound = asd.findCharByNameWithCookieLang("zzu", "ja");
    assertEquals(6, charactersFound.size());
    assertTrue(charactersFound.keySet().contains(expectedCodeFallback));
    assertEquals("Yi Syllable Zzux", charactersFound.get(expectedCodeFallback).toString());
  }
}
