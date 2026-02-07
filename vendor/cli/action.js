import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_PATH = path.join(__dirname, "..", "..", "app", "src");


const GENERATOR_CONFIG = {
    service: {
        folder: "services", 
        suffix: "Service",
        template: (className) => `import { Service } from "./service.js";\n\nexport class ${className}Service extends Service {\n \n}`
    },
    controller: {
        folder: "controllers",
        suffix: "Controller",
        template: (className) => `import { Controller } from "./controller.js"; \n\n export class ${className}Controller extends Controller {\n    constructor(private service: any) {}\n}`
    }
};

// Helper: Capitalize first letter
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

async function exec() {
    try {
        const [,, type, name] = process.argv;

        // Basic Validation
        if (!type || !name) {
            throw new Error("Missing arguments");
        }

        const config = GENERATOR_CONFIG[type];
        if (!config) {
            throw new Error(`Invalid type: "${type}". Allowed types: ${Object.keys(GENERATOR_CONFIG).join(", ")}`);
        }

        const className = capitalize(name);
        const fileName = `${name.toLowerCase()}_${type}.ts`;
        const targetFolder = path.join(ROOT_PATH, config.folder);
        const targetPath = path.join(targetFolder, fileName);

        
        console.log(`Generating ${className}${config.suffix}...`);

        await mkdir(targetFolder, { recursive: true });
        
    
        await writeFile(targetPath, config.template(className).trim(), { flag: 'wx', encoding: 'utf-8' })
            .catch(err => {
                if (err.code === 'EEXIST') throw new Error(`File already exists: ${fileName}`);
                throw err;
            });

        console.log(`${config.suffix} Created: ${targetPath}`);

    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

exec();