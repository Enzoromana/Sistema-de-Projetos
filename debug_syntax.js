const fs = require('fs');

function checkBalance(filename) {
    const code = fs.readFileSync(filename, 'utf8');
    const stack = [];
    let inString = null; // ' " `
    let inComment = null; // // /*
    let escaped = false;

    for (let i = 0; i < code.length; i++) {
        const char = code[i];
        const nextChar = code[i + 1];

        // Handle escape
        if (escaped) {
            escaped = false;
            continue;
        }
        if (char === '\\' && inString) {
            escaped = true;
            continue;
        }

        // Handle Strings
        if (inString) {
            if (char === inString) {
                inString = null;
            }
            continue;
        }

        // Handle Comments
        if (inComment) {
            if (inComment === '//' && char === '\n') {
                inComment = null;
            } else if (inComment === '/*' && char === '*' && nextChar === '/') {
                inComment = null;
                i++;
            }
            continue;
        }

        // Start String/Comment
        if (char === '"' || char === "'" || char === '`') {
            inString = char;
            continue;
        }
        if (char === '/' && nextChar === '/') {
            inComment = '//';
            i++;
            continue;
        }
        if (char === '/' && nextChar === '*') {
            inComment = '/*';
            i++;
            continue;
        }

        // Handle Braces
        if ('{([<'.includes(char)) {
            // Special handling for < to avoid HTML/JSX tag comparison being interpreted as open brace
            // Naive JSX check: <Tag ... >
            // Ideally we iterate only { ( [
            if ('{(['.includes(char)) {
                stack.push({ char, index: i });
            }
        } else if ('})]'.includes(char)) {
            if (stack.length === 0) {
                console.log(`Error: Unexpected ${char} at character ${i} (approx line ${code.substring(0, i).split('\n').length})`);
                return;
            }
            const last = stack.pop();
            const expected = last.char === '{' ? '}' : last.char === '(' ? ')' : ']';
            if (char !== expected) {
                console.log(`Error: Mismatched ${char} at character ${i} (approx line ${code.substring(0, i).split('\n').length}). Expected ${expected} for ${last.char} at approx line ${code.substring(0, last.index).split('\n').length}`);
                return;
            }
        }
    }

    if (stack.length > 0) {
        const last = stack[stack.length - 1];
        console.log(`Error: Unclosed ${last.char} from character ${last.index} (approx line ${code.substring(0, last.index).split('\n').length})`);
    } else {
        console.log("No brace mismatches found.");
    }
}

checkBalance('src/components/MedicalControl.jsx');
