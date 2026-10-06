package com.oxygenxml.charpicker;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class CategoryNamesTest {

  @Test
  public void testCategoryNamesMatchTheCharPicker() {
    // The only category whose real name cannot be spelled in a translation tag.
    assertEquals("Format & Whitespace", CategoryNames.getCategoryName("utfc_Format_and_Whitespace"));
    assertEquals("Han - Other", CategoryNames.getCategoryName("utfc_Han_-_Other"));
    assertEquals("Han 11..17-Stroke Radicals", CategoryNames.getCategoryName("utfc_Han_11..17-Stroke_Radicals"));
  }
}
