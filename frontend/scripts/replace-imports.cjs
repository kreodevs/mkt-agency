#!/usr/bin/env node
/**
 * Reemplaza imports de PrimeReact directo por Kreo UI en todas las páginas
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pagesDir = path.resolve(__dirname, '../pages');
const rootDir = path.resolve(__dirname, '../../src');

// Mapeo: primereact/x → @/components/ui (con nombre de export)
const MAPPING = {
  'primereact/card': { import: 'Card', from: '@/components/ui' },
  'primereact/button': { import: 'Button', from: '@/components/ui' },
  'primereact/inputtext': { import: 'InputText', from: '@/components/ui' },
  'primereact/password': { import: 'Password', from: '@/components/ui' },
  'primereact/inputtextarea': { import: 'Textarea', from: '@/components/ui' },
  'primereact/dropdown': { import: 'Dropdown', from: '@/components/ui' },
  'primereact/dialog': { import: 'Dialog', from: '@/components/ui' },
  'primereact/chip': { import: 'Badge', from: '@/components/ui' },
  'primereact/tag': { import: 'Badge', from: '@/components/ui' },
  'primereact/toast': { import: 'Toast', from: '@/components/ui' },
  'primereact/tabview': { import: 'TabView', from: '@/components/ui' },
  'primereact/message': { import: 'Alert', from: '@/components/ui' },
  'primereact/inputswitch': { import: 'Switch', from: '@/components/ui' },
  'primereact/progressbar': { import: 'Progress', from: '@/components/ui' },
  'primereact/tooltip': { import: 'Tooltip', from: '@/components/ui' },
  'primereact/confirmdialog': { import: 'AlertDialog', from: '@/components/ui' },
  'primereact/panel': null, // se maneja aparte
  'primereact/inputnumber': null, // se maneja aparte
  'primereact/datatable': null, // se maneja aparte con columns prop
  'primereact/column': null, // incluido en DataTable
};

// Procesa archivos .tsx y .ts
const processFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  for (const [primePkg, target] of Object.entries(MAPPING)) {
    if (!target) continue;
    
    const regex = new RegExp(`import\\s+\\{([^}]+)\\}\\s+from\\s+'${primePkg}'`, 'g');
    let match;
    while ((match = regex.exec(content)) !== null) {
      const importedNames = match[1].split(',').map(s => s.trim());
      
      // Si ya existe un import de @/components/ui, agregar a ese
      const existingImport = content.match(new RegExp(`import\\s+\\{[^}]*\\}\\s+from\\s+'@/components/ui'`));
      if (existingImport) {
        // Agregar el nombre al import existente si no está
        const importNames = existingImport[0];
        if (!importNames.includes(target.import)) {
          const newImport = importNames.replace(/\}$/, `, ${target.import} }`);
          content = content.replace(existingImport[0], newImport);
        }
      } else {
        // Crear nuevo import
        const newLine = `import { ${target.import} } from '${target.from}';\n`;
        content = newLine + content;
      }
      
      // Remover el import original
      content = content.replace(match[0] + '\n', '');
      content = content.replace(match[0], '');
      
      // Si el import tenía alias (como useAuthStore as useAuth), no remover
      modified = true;
      console.log(`  ✓ ${path.relative(rootDir, filePath)}: ${primePkg} → ${target.import}`);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
  return modified;
};

// Walk directories
const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      try {
        processFile(fullPath);
      } catch (e) {
        console.error(`  ✗ Error en ${fullPath}: ${e.message}`);
      }
    }
  }
};

console.log('🧹 Reemplazando imports PrimeReact → Kreo UI...');
walk(pagesDir);

// También procesar layouts y componentes que importen PrimeReact
walk(path.resolve(rootDir, 'layouts'));

console.log('✅ Done');
