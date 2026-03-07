// Script to analyze JSX div tag balance in MedicalControl.jsx
const fs = require('fs');
const filePath = 'src/components/MedicalControl.jsx';
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

// Track div balance through the file
let balance = 0;
let minBalance = 0;
let minLine = 0;
const issues = [];

// We'll look at the return statement starting from line 640
let inReturn = false;
let returnStartLine = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip lines inside template literals (backtick strings)
    // Simple heuristic: skip lines between backtick-only lines

    // Count opening <div tags (but not </div)
    const openDivs = (line.match(/<div[\s>]/g) || []).length;
    // Count closing </div> tags
    const closeDivs = (line.match(/<\/div\s*>/g) || []).length;

    if (openDivs > 0 || closeDivs > 0) {
        const prevBalance = balance;
        balance += openDivs - closeDivs;

        if (balance < 0) {
            issues.push(`Line ${lineNum}: EXCESS CLOSE - balance went to ${balance} (opens: ${openDivs}, closes: ${closeDivs})`);
        }

        if (balance < minBalance) {
            minBalance = balance;
            minLine = lineNum;
        }
    }
}

console.log('=== DIV TAG ANALYSIS ===');
console.log(`Final balance: ${balance} (should be 0)`);
console.log(`Minimum balance: ${minBalance} at line ${minLine}`);
console.log(`\nIssues found: ${issues.length}`);
issues.forEach(i => console.log(i));

// Now do a more detailed analysis of the return block (line 640 onward)
console.log('\n=== DETAILED RETURN BLOCK ANALYSIS ===');
balance = 0;
let inTemplateLiteral = false;

for (let i = 639; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();

    // Track template literals (backtick strings)
    const backtickCount = (line.match(/`/g) || []).length;
    if (backtickCount % 2 !== 0) {
        inTemplateLiteral = !inTemplateLiteral;
    }

    if (inTemplateLiteral) continue;

    // Stop at the closing of MedicalControl function
    if (lineNum > 2850) break;

    const openDivs = (line.match(/<div[\s>]/g) || []).length;
    const closeDivs = (line.match(/<\/div\s*>/g) || []).length;

    if (openDivs > 0 || closeDivs > 0) {
        balance += openDivs - closeDivs;
        if (openDivs > closeDivs) {
            console.log(`Line ${lineNum}: +${openDivs - closeDivs} (balance: ${balance}) | ${trimmed.substring(0, 100)}`);
        } else if (closeDivs > openDivs) {
            console.log(`Line ${lineNum}: -${closeDivs - openDivs} (balance: ${balance}) | ${trimmed.substring(0, 100)}`);
        } else {
            // Self-balanced line (e.g. <div>...</div>)
            console.log(`Line ${lineNum}:  0 (balance: ${balance}) | ${trimmed.substring(0, 100)}`);
        }
    }
}

console.log(`\nFinal return block balance: ${balance}`);
