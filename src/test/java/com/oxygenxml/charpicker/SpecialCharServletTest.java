package com.oxygenxml.charpicker;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Properties;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.servlet.ServletException;

import org.junit.Test;

import com.google.common.collect.ImmutableMap;

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
		assertEquals(4, result.size());
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
	
	
  /**
   * <p><b>Description:</b> Test score computation for different query strings.</p>
   * <p><b>Bug ID:</b> WA-2911</p>
   *
   * @author cristi_talau
   *
   * @throws Exception
   */
  @Test
  public void testScores() throws Exception {
    SpecialCharServlet specialCharServlet = new SpecialCharServlet();
    String description1 = "Latin Capital Letter A With Acute (000C1)";
    String description2 = "Latin Small Letter S With Acute And Dot Above (01E65)";
    ImmutableMap<String, String> charsFromProperties = ImmutableMap.of(
        "1", description1,
        "2", description2);

    Map<Integer, Set<Entry<String, String>>> charactersByScore =
        specialCharServlet.getCharactersByScore(new String[]{"a", "acute"}, charsFromProperties);
    Map<String, Integer> scoresForChars = getScoresForChars(charactersByScore);
    // The first char has score 6 - two full matches
    assertEquals(600 - description1.length(), scoresForChars.get("1").intValue());

    // The second char has score 4 - full match and partial match
    assertEquals(450 - description2.length(), scoresForChars.get("2").intValue());

    description1 = "Circled Katakana ro";
    charsFromProperties = ImmutableMap.of("1", description1);

    charactersByScore =
        specialCharServlet.getCharactersByScore(new String[]{"circled", "Katakana", "ka"}, charsFromProperties);
    scoresForChars = getScoresForChars(charactersByScore);

    // The first char has score 6 - two full matches
    assertEquals(600 - description1.length(), scoresForChars.get("1").intValue());
  }
  
  /**
   * <p><b>Description:</b> Test score computation for results with different description lengths.</p>
   * <p><b>Bug ID:</b> WA-2911, WA-1742</p>
   *
   * @author andrei_popa
   *
   * @throws Exception
   */
  @Test
  public void testScoresWithLength() throws Exception {
    SpecialCharServlet specialCharServlet = new SpecialCharServlet();
    String description1 = "Latin Capital Letter A With Acute (000C1)";
    String description2 = "Latin Capital Letter A With Acute But Longer (01E65)";
    String description3 = "A Acute (01E67)";
    ImmutableMap<String, String> charsFromProperties = ImmutableMap.of(
        "1", description1,
        "2", description2,
        "3", description3
    );

    Map<Integer, Set<Entry<String, String>>> charactersByScore =
        specialCharServlet.getCharactersByScore(new String[]{"a", "acute"}, charsFromProperties);
    Map<String, Integer> scoresForChars = getScoresForChars(charactersByScore);
    
    // If query match scores are equal, sort depending on description length - shorter is better.
    assertTrue(scoresForChars.get("3").intValue() > scoresForChars.get("1").intValue());
    assertTrue(scoresForChars.get("1").intValue() > scoresForChars.get("2").intValue());
  }


  /**
   * Get the scores for the chars.
   * 
   * @param charactersByScore Characters by score.
   * 
   * @return Scores by char.
   */
  public Map<String, Integer> getScoresForChars(Map<Integer, Set<Entry<String, String>>> charactersByScore) {
    Map<String, Integer> charScores = new HashMap<>();
    for (Map.Entry<Integer, Set<Entry<String, String>>> entry: charactersByScore.entrySet()) {
      Set<Entry<String, String>> chars = entry.getValue();
      for (Entry<String, String> character : chars) {
        charScores.put(character.getKey(), entry.getKey());
      }
    }
    return charScores;
  }
}
