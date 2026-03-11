// bump-version.js
import fs from "fs";
import readline from "readline";
import chalk from "chalk";

const rl = readline.createInterface({
   input: process.stdin,
   output: process.stdout
});

const ask = (text) => new Promise((resolve) => rl.question(text, (answer) => resolve(answer.trim())));

const askYesNo = async (text) => {
   const response = await ask(chalk.cyan(text));
   return response.toLowerCase() === "y";
};

const bumpVersion = async () => {
   const packagePath = "./package.json";
   const versionsPath = "./versions.md";
   const envPath = "./.env";

   if (!fs.existsSync(packagePath)) {
      console.error(chalk.red("❌ No se encontró el archivo package.json"));
      process.exit(1);
   }

   const pkg = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
   const versionValue = pkg.version || "v0.0.0.0";
   const [version, stage] = versionValue.split(" ");
   let [major, minor, patch, build] = version.replace("v", "").split(".").map(Number);

   console.log(chalk.yellowBright(`\n📦 Versión actual: ${chalk.green(`v${major}.${minor}.${patch}.${build} ${stage || ""}`)}\n`));

   console.log(chalk.bold.cyan("\n📘 Niveles de versión disponibles:"));
   console.log(
      chalk.white(`
  🚀  MAJOR → Cambios grandes o incompatibles (ej. reestructuración, breaking changes)
  ✨  MINOR → Nuevas funciones o módulos (sin romper compatibilidad)
  🧩  PATCH → Correcciones menores o bugs
  🔧  BUILD → Pequeñas optimizaciones o despliegues internos
  `)
   );

   const bumpMajor = await askYesNo("¿Incrementar versión MAYOR (Major)? (y/n): ");
   let changeType = "Build";

   if (bumpMajor) {
      major++;
      minor = 0;
      patch = 0;
      build = 0;
      changeType = "Major";
   } else {
      const bumpMinor = await askYesNo("¿Incrementar versión MENOR (Minor)? (y/n): ");
      if (bumpMinor) {
         minor++;
         patch = 0;
         build = 0;
         changeType = "Minor";
      } else {
         const bumpPatch = await askYesNo("¿Incrementar versión PATCH (corrección menor)? (y/n): ");
         if (bumpPatch) {
            patch++;
            build = 0;
            changeType = "Patch";
         }
      }
   }

   build++;

   let stageLabel = stage || "";
   const setStage = await askYesNo("¿Cambiar estado (beta/rc/prod)? (y/n): ");
   if (setStage) {
      const newStage = await ask(chalk.magentaBright("Indica el estado (beta / rc / prod): "));
      if (["beta", "rc", "prod", "production"].includes(newStage.toLowerCase())) {
         stageLabel = newStage.toLowerCase() === "production" ? "prod" : newStage.toLowerCase();
      } else {
         console.log(chalk.red("⚠️ Estado no válido, se mantiene el anterior."));
      }
   }

   const newVersion = `v${major}.${minor}.${patch}.${build}`;
   const fullVersion = `${newVersion} ${stageLabel}`.trim();
   const envVersion = `${major}.${minor}.${patch}.${build}`; // Versión sin la 'v' para .env

   const author = await ask(chalk.cyan("👤 Autor del cambio: "));

   console.log(chalk.magentaBright("\n📝 Agrega los puntos principales (ENTER vacío para terminar cada sección):"));

   const categories = ["✨ Mejoras", "🐞 Correcciones", "🧩 Nuevas Funciones", "⚙️ Optimizaciones"];
   const changesByCategory = {};

   for (const category of categories) {
      console.log(chalk.blueBright(`\n${category}:`));
      const changes = [];
      while (true) {
         const item = await ask(chalk.gray("• "));
         if (!item) break;

         const hasSub = await askYesNo("¿Agregar subpuntos a este ítem? (y/n): ");
         if (hasSub) {
            const sublist = [];
            while (true) {
               const sub = await ask(chalk.gray("   ↳ "));
               if (!sub) break;
               sublist.push(sub);
            }
            changes.push({ text: item, subitems: sublist });
         } else {
            changes.push({ text: item, subitems: [] });
         }
      }
      changesByCategory[category] = changes;
   }

   const date = new Date().toLocaleString("es-MX", {
      dateStyle: "long",
      timeStyle: "short"
   });

   const emojiType = changeType === "Major" ? "🚀" : changeType === "Minor" ? "✨" : changeType === "Patch" ? "🧩" : "🔧";

   const stageEmoji = stageLabel === "beta" ? "🧪 Beta" : stageLabel === "rc" ? "🧱 RC" : "🏁 Producción";

   const headerColor = stageLabel === "beta" ? chalk.hex("#FFA500") : stageLabel === "rc" ? chalk.hex("#00BFFF") : chalk.hex("#32CD32");

   // Actualizar package.json
   pkg.version = fullVersion;
   fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));

   // Actualizar archivo .env
   if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, "utf-8");

      // Buscar y reemplazar VITE_APP_VERSION
      if (envContent.includes("VITE_APP_VERSION=")) {
         envContent = envContent.replace(/VITE_APP_VERSION=.*/, `VITE_APP_VERSION=${envVersion}`);
      } else {
         // Si no existe, agregarlo al final
         envContent += `\nVITE_APP_VERSION=${envVersion}\n`;
      }

      fs.writeFileSync(envPath, envContent);
      console.log(chalk.green(`✅ Variable VITE_APP_VERSION actualizada a ${envVersion} en .env`));
   } else {
      // Crear archivo .env si no existe
      fs.writeFileSync(envPath, `VITE_APP_VERSION=${envVersion}\n`);
      console.log(chalk.green(`✅ Archivo .env creado con VITE_APP_VERSION=${envVersion}`));
   }

   // Actualizar versions.md
   if (!fs.existsSync(versionsPath)) {
      fs.writeFileSync(versionsPath, `# 🧾 Registro de Versiones\n\n> Documenta los cambios del sistema con detalle.\n\n---\n\n`);
   }

   let changeSections = "";
   for (const [cat, arr] of Object.entries(changesByCategory)) {
      if (arr.length === 0) continue;
      const list = arr.map((c) => `- ${c.text}${c.subitems.length ? "\n" + c.subitems.map((s) => `   - ${s}`).join("\n") : ""}`).join("\n");
      changeSections += `**${cat}**\n${list}\n\n`;
   }

   const newEntry = `
## ${emojiType} **${newVersion}** · *${stageEmoji}*
📅 **Fecha:** ${date}  
👤 **Autor:** ${author}  
🧭 **Tipo:** ${changeType}

${changeSections || "_Sin cambios registrados._"}

---

`;

   const versionsFile = fs.readFileSync(versionsPath, "utf-8");
   const entries = versionsFile.split(/^## /m).filter(Boolean);
   const updated = `# 🧾 Registro de Versiones\n\n> Documenta los cambios del sistema con detalle.\n\n---\n\n${newEntry}${entries
      .map((e) => "## " + e.trim())
      .join("\n")}`;

   const sorted = updated
      .split(/^## /m)
      .filter((v) => v.trim() && !v.startsWith("#"))
      .sort((a, b) => {
         const vA = a.match(/v(\d+)\.(\d+)\.(\d+)\.(\d+)/);
         const vB = b.match(/v(\d+)\.(\d+)\.(\d+)\.(\d+)/);
         if (!vA || !vB) return 0;
         for (let i = 1; i <= 4; i++) {
            const diff = Number(vB[i]) - Number(vA[i]);
            if (diff !== 0) return diff;
         }
         return 0;
      })
      .map((v) => "## " + v.trim())
      .join("\n\n");

   fs.writeFileSync(versionsPath, `# 🧾 Registro de Versiones\n\n> Documenta los cambios del sistema con detalle.\n\n---\n\n${sorted}`);

   console.log(headerColor(`\n✅ Versión actualizada a ${newVersion} (${stageLabel.toUpperCase()})`));
   console.log(chalk.blueBright("🗒️ Cambios registrados y organizados en versions.md\n"));
   console.log(chalk.blueBright("🔧 Variable de entorno VITE_APP_VERSION actualizada en .env\n"));

   rl.close();
};

bumpVersion();
