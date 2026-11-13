import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const errors: string[] = [];

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== "node_modules" && e.name !== ".next") return walk(full);
    return e.isFile() && /\.(ts|tsx)$/.test(e.name) ? [full] : [];
  });
}

function checkFile(file: string): void {
  const rel = path.relative(ROOT, file);
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n").length;

  if ((rel.startsWith("components/") || rel.includes("/components/")) && lines > 50) {
    errors.push(`${rel}: composant à ${lines} lignes (max 50)`);
  }
  if (rel.endsWith("page.tsx") && lines > 120) {
    errors.push(`${rel}: page à ${lines} lignes (max 120)`);
  }
  if (/:\s*any\b|\bas\s+any\b|@ts-ignore/.test(content)) {
    errors.push(`${rel}: utilisation interdite de any/@ts-ignore`);
  }
  if (/console\.log\(/.test(content)) {
    errors.push(`${rel}: console.log interdit`);
  }
  if (/\.mock(?:-data)?["']/.test(content) && !rel.endsWith(".service.ts") && !rel.endsWith(".mock.ts") && !rel.includes("index.ts")) {
    errors.push(`${rel}: import direct d'un fichier mock hors sélecteur`);
  }
  if ((rel.startsWith("components/") || rel.includes("/components/")) && /@\/features\/[^/]+\/services\//.test(content)) {
    errors.push(`${rel}: composant important un service directement`);
  }
  const crossFeature = content.match(/@\/features\/([^/"']+)\/(?!index)/g);
  if (crossFeature && rel.startsWith("features/")) {
    const selfFeature = rel.split("/")[1];
    for (const imp of crossFeature) {
      const target = imp.split("/")[2];
      if (target && target !== selfFeature) {
        errors.push(`${rel}: import inter-feature hors index.ts (${imp})`);
      }
    }
  }
}

for (const folder of ["app", "components", "features", "lib"]) {
  for (const file of walk(path.join(ROOT, folder))) {
    checkFile(file);
  }
}

const featuresDir = path.join(ROOT, "features");
if (fs.existsSync(featuresDir)) {
  for (const dir of fs.readdirSync(featuresDir)) {
    if (!fs.existsSync(path.join(featuresDir, dir, "README.md"))) {
      errors.push(`features/${dir}: README.md manquant`);
    }
  }
}

if (errors.length > 0) {
  console.error("Échec des conventions :\n" + errors.map((e) => `- ${e}`).join("\n"));
  process.exit(1);
}
process.stdout.write("Toutes les conventions sont respectées.\n");
