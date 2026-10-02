<?xml version="1.0" encoding="UTF-8"?>
<!-- Appends the hand-written third-party-components-character-data.xml to the generated third-party-components.xml. -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" encoding="UTF-8" indent="no"/>

  <xsl:template match="/third-party">
    <third-party>
      <xsl:copy-of select="component"/>
      <xsl:copy-of select="document('../third-party-components-character-data.xml')/third-party/component"/>
    </third-party>
  </xsl:template>
</xsl:stylesheet>
