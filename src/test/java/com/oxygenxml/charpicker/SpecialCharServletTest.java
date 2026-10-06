package com.oxygenxml.charpicker;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Properties;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.collect.ImmutableMap;

public class SpecialCharServletTest {
  
	public Map<String, String> getChars(String prefix) {
		Properties chars = new Properties();
		// The English file is identical to the main resource, so load it from the classpath
		// instead of keeping a duplicate under test/.
		try (InputStream charsInputStream = "en".equals(prefix)
				? getClass().getClassLoader().getResourceAsStream(prefix + "_unicodechars.properties")
				: new FileInputStream("test/" + prefix + "_unicodechars.properties")) {
			chars.load(new InputStreamReader(charsInputStream, StandardCharsets.UTF_8));
		} catch (IOException ex) {
			ex.printStackTrace();
		}
		return SpecialCharServlet.propsAsMap(chars);
	}

	@Test
	public void testFindCharByNameWithRegexMetacharacters() {
		SpecialCharServlet servlet = new SpecialCharServlet();
		// Queries with regex metacharacters should be treated literally instead of throwing
		// or matching everything.
		servlet.findCharByName("\\m", getChars("en"));
		assertEquals(0, servlet.findCharByName("a|zzzz", getChars("en")).size());
	}

	@Test
	public void testLeadingWhitespaceIsIgnored() {
		SpecialCharServlet servlet = new SpecialCharServlet();
		Map<String, String> chars = ImmutableMap.of("020AC", "Euro Sign", "00041", "Latin Capital Letter A");

		assertEquals(ImmutableMap.of("020AC", "Euro Sign"), servlet.findCharByName(" euro", chars));
		assertEquals(ImmutableMap.of("020AC", "Euro Sign"), servlet.findCharByName("( euro", chars));
	}

	@Test
	public void testQueryWithoutWordsFindsNothing() {
		SpecialCharServlet servlet = new SpecialCharServlet();
		Map<String, String> chars = ImmutableMap.of("020AC", "Euro Sign");

		assertTrue(servlet.findCharByName("   ", chars).isEmpty());
		assertTrue(servlet.findCharByName("()", chars).isEmpty());
	}

  @Test
  public void testSearchResultsKeepTheRelevanceOrder() throws IOException {
    // As a JSON object, the browser would enumerate the all-digit "10300" before "000E1".
    Map<String, String> charResult = new LinkedHashMap<>();
    charResult.put("000E1", "Latin Small Letter A With Acute");
    charResult.put("10300", "Old Italic Letter A");

    String json = new ObjectMapper().writeValueAsString(SpecialCharServlet.toSearchResults(charResult));
    assertEquals("[{\"code\":\"000E1\",\"name\":\"Latin Small Letter A With Acute\"},"
        + "{\"code\":\"10300\",\"name\":\"Old Italic Letter A\"}]", json);
  }

	@Test
	public void testGetChars() {
		SpecialCharServlet asd = new SpecialCharServlet();
		
		Map<String, String> result = asd.findCharByName("ywi", getChars("en"));
		assertEquals(4, result.size());
		assertEquals("Canadian Syllabics Ywi", result.get("01531"));
		assertEquals("Canadian Syllabics West-cree Ywi", result.get("01532"));
		assertEquals("Canadian Syllabics Ywii", result.get("01533"));
		assertEquals("Canadian Syllabics West-cree Ywii", result.get("01534"));
	}
	
	@Test
  public void testFindCharByNameScore () {
    /* Make sure circled katakana ka has a bigger score than other circled katakana letters. */
    String query = "circled katakana ka";
    
    SpecialCharServlet asd = new SpecialCharServlet();    
    Map<String, String> charactersFound = asd.findCharByName(query, getChars("en"));
    assertEquals(50, charactersFound.size());
    Entry<String, String> entry = charactersFound.entrySet().iterator().next();
    assertEquals("032D5", entry.getKey());
    assertEquals(query, entry.getValue().toLowerCase());
  }
	
	@Test
	public void testFindCharByNameInFirstChars () {
		
		String query = "e";
		int limit = 10;
		
		SpecialCharServlet asd = new SpecialCharServlet();		
		Map<String, String> charactersFound = asd.findCharByName(query, getChars("en"));
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
    String expectedCodeFallback = "0A2E2";
    
    SpecialCharServlet asd = new SpecialCharServlet();    
    asd.setChars("en", getChars("en"));
    asd.setChars("fr", getChars("fr"));
    asd.setChars("de", getChars("de"));
    
    // Since updating dataset, "ew" also matches four other letters, so the CJK radical is no longer the only hit.
    Map<String, String> charactersFound = asd.findCharByNameWithCookieLang(query, "en");
    assertEquals(5, charactersFound.size());
    assertEquals("Cjk Radical Ewe", charactersFound.get(ewCode));

    // Check German. The translated name replaces the English one for the same code, so the count stays.
    charactersFound = asd.findCharByNameWithCookieLang(query, "de");
    assertEquals(5, charactersFound.size());
    assertEquals("German description for ew", charactersFound.get(ewCode));
    // Check fallback to English.
    charactersFound = asd.findCharByNameWithCookieLang("zzu", "de");
    assertEquals(6, charactersFound.size());
    assertEquals("Yi Syllable Zzux", charactersFound.get(expectedCodeFallback));

    // Check French.
    charactersFound = asd.findCharByNameWithCookieLang(query, "fr");
    assertEquals(5, charactersFound.size());
    assertEquals("French description for ew", charactersFound.get(ewCode));
    // Check fallback to English.
    charactersFound = asd.findCharByNameWithCookieLang("zzu", "fr");
    assertEquals(6, charactersFound.size());
    assertEquals("Yi Syllable Zzux", charactersFound.get(expectedCodeFallback));

    // Check Japanese, there is no file for Japanese, you won't believe what happens next!
    charactersFound = asd.findCharByNameWithCookieLang(query, "ja");
    assertEquals(5, charactersFound.size());
    assertEquals("Cjk Radical Ewe", charactersFound.get(ewCode));
    // Check fallback to English.
    charactersFound = asd.findCharByNameWithCookieLang("zzu", "ja");
    assertEquals(6, charactersFound.size());
    assertEquals("Yi Syllable Zzux", charactersFound.get(expectedCodeFallback));
  }

  @Test
  public void testEnglishResultsFillUpToTheLimit() {
    Map<String, String> englishResults = new LinkedHashMap<>();
    for (int i = 0; i < 600; i++) {
      englishResults.put(String.format("%05X", i), "English " + i);
    }
    Map<String, String> translatedResults = ImmutableMap.of("FFFFF", "Translated", "00001", "Translated 1");

    Map<String, String> results = SpecialCharServlet.fillUpWithEnglish(translatedResults, englishResults);

    assertEquals(500, results.size());
    // Translated matches first, then the English ones in their order, up to the limit.
    assertEquals(Arrays.asList("FFFFF", "00001", "00000", "00002"), new ArrayList<>(results.keySet()).subList(0, 4));
    // This one is a duplicate, keep the translated one.
    assertEquals("Translated 1", results.get("00001"));
    // Test the boundary - last English character present and first English character cut off.
    assertTrue(results.containsKey("001F2"));
    assertFalse(results.containsKey("001F3"));
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


  @Test
  public void testScoresWithNonAsciiLetters() {
    SpecialCharServlet specialCharServlet = new SpecialCharServlet();
    String description = "Lateinischer Großbuchstabe A mit Trema über Linie";
    ImmutableMap<String, String> charsFromProperties = ImmutableMap.of("1", description);

    // A full match that only succeeds with Unicode case folding, plus a partial match on a word with "ß".
    Map<String, Integer> scoresForChars = getScoresForChars(
        specialCharServlet.getCharactersByScore(new String[]{"ÜBER", "groß"}, charsFromProperties));

    assertEquals(450 - description.length(), scoresForChars.get("1").intValue());
  }

  @Test
  public void testCharsAreLoadedAsUtf8() throws Exception {
    String properties = "00041=Lateinischer Großbuchstabe A\n030A2=カタカナ ア";

    Map<String, String> chars = SpecialCharServlet.loadChars(
        new ByteArrayInputStream(properties.getBytes(StandardCharsets.UTF_8)));

    assertEquals("Lateinischer Großbuchstabe A", chars.get("00041"));
    assertEquals("カタカナ ア", chars.get("030A2"));
  }

  @Test
  public void testOnlyCanonicalCodesAreLoaded() {
    Properties props = new Properties();
    props.setProperty("1F601", "Canonical code");
    props.setProperty("e1", "Short lowercase code");
    props.setProperty("1f600", "Lowercase code");
    props.setProperty("U+00E9", "Not a hex code");
    props.setProperty("110000", "Six digits");

    assertEquals(ImmutableMap.of("1F601", "Canonical code"), SpecialCharServlet.propsAsMap(props));
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
