import fs from 'fs';
import { INITIAL_EMPLOYEES } from './src/data/initialEmployees.js'; // Import your existing data

// 1. Read and parse the CSV data
// In a real script, you'd read the file. For this example, we'll represent the parsed data.
const csvData = `Name,Email
Adam,adam.jones@fortis.co
Elliott,elliott.wright@fortis.co
Marae,marae.hankins@fortis.co
Rania,rania.alghuleh@fortis.co
Hudson,hudson.tankersley@fortis.co
Katy,katy.ahner@fortis.co
SydMo,sydney.morgan@fortis.co
Sheridan,sheridan.swathwood@fortis.co
SydPo,sydney.powell@fortis.co
Shelby,shelby.lyles@fortisriders.co
Heather,heather.bolt@fortis.co
Brian Adie,brian.adie@fortis.co
Larry,larry.stofer@fortis.co
Paul,paul.edwards@fortis.co
Jacob,jacob.jones@fortis.co
Antje,antje.martin@fortis.co
Kyle,kyle.knierim@fortis.co
Will Colones,will.colones@fortis.co`;

const emailMap = new Map();
const rows = csvData.trim().split('\n').slice(1); // Skip header row

for (const row of rows) {
  const [name, email] = row.split(',');
  if (name && email) {
    emailMap.set(name.trim(), email.trim());
  }
}

// 2. Iterate over the initial employees and add the email property
const updatedEmployees = { ...INITIAL_EMPLOYEES };

for (const employeeName in updatedEmployees) {
  if (emailMap.has(employeeName)) {
    updatedEmployees[employeeName].email = emailMap.get(employeeName);
  } else {
    console.warn(`--> WARNING: No email found for ${employeeName}`);
  }
}

// 3. Format the output to be a valid JavaScript file content
// This will create a string that you can save as your new initialEmployees.js
const fileContent = `// src/data/initialEmployees.js
// This file was automatically generated on ${new Date().toISOString()}
export const INITIAL_EMPLOYEES = ${JSON.stringify(updatedEmployees, null, 2)};
`;

// 4. Write the new content to the file (or print to console)
// This will overwrite the original file.
// For safety, you might want to write to a new file first, e.g., 'initialEmployees_updated.js'
fs.writeFileSync('./src/data/initialEmployees.js', fileContent, 'utf8');

console.log("✅ Successfully updated 'initialEmployees.js' with email addresses.");
console.log("Please review the updated file.");

