const fs = require('fs');
const file = 'src/components/SitRep.tsx';
let content = fs.readFileSync(file, 'utf8');

// replace the useEffect doing AI sitrep with local algorithmic sitrep
content = content.replace(
  /generateAISitRep\(articles\)\n\s*\.then\(\(res\) => {[\s\S]*?}\);\s*return \(\) => { isMounted = false; };\n\s*}, \[articles\]\);/,
  `// Use the local algorithmic generator by default to save API costs
    if (isMounted) {
      setSitrep(generateLocalSitRep(articles));
      setIsGeneratingSitrep(false);
    }
    return () => { isMounted = false; };
  }, [articles]);

  const handleGenerateAIBriefing = async () => {
    setIsGeneratingSitrep(true);
    try {
      const res = await generateAISitRep(articles);
      setSitrep(res);
    } catch (error) {
      console.error("Failed to generate SITREP:", error);
      setSitrep("COMMS ERROR: Failed to generate SITREP.");
    } finally {
      setIsGeneratingSitrep(false);
    }
  };`
);

content = content.replace(/import { type Article } from "\.\.\/services\/api";/, 'import { type Article, generateSitRep as generateLocalSitRep } from "../services/api";');

// update the UI to add the AI button
content = content.replace(
  /<div className="flex items-center gap-2">\n\s*\{activeTab === "briefing" \? \(\n\s*<FileText className="w-4 h-4 text-cyan-500" \/>/,
  `<div className="flex items-center gap-2">
            {activeTab === "briefing" ? (
              <FileText className="w-4 h-4 text-cyan-500" />`
);

// wait we need to add a button in the UI.
// it's easier to use multi_replace_file_content.
