const fs = require('fs');
const path = require('path');

const files = [
    'src/StudentHealthCard.jsx',
    'src/StudentHealthRecord.jsx',
    'src/SavedHealthRecordForm.jsx',
    'src/EditableIdentityCard.jsx'
];

files.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');

    // Fix the broken arrow functions first
    content = content.replace(/\(e\) = autoComplete="off">/g, '(e) =>');

    // Now correctly add autoComplete="off" to input/select/textarea
    // We should parse the tag until the FIRST > that is NOT inside a curly brace or string
    // But since these are JSX files, we can just look for the tag and append the attribute

    // Better strategy: find all <input, <select, <textarea
    // and if they don't have autoComplete, insert it before the closing > or />
    // while ignoring the > inside {}

    // Let's use a simpler replacement for known tags
    const inputRegex = /<(input|select|textarea)([^>]*?)(\/?>)/gi;

    content = content.replace(inputRegex, (match, tag, body, close) => {
        // Skip if it's a closing tag or already has autocomplete or is specific types
        if (match.startsWith('</') ||
            match.toLowerCase().includes('autocomplete=') ||
            body.toLowerCase().includes('type="file"') ||
            body.toLowerCase().includes('type="radio"') ||
            body.toLowerCase().includes('type="checkbox"') ||
            !body.includes('id=') && !body.includes('name=')) {
            return match;
        }

        // Clean up any previously broken insertions
        let cleanBody = body.replace(/autoComplete="off"/g, '').trim();

        return `<${tag} ${cleanBody} autoComplete="off" ${close}`;
    });

    // Final cleanup of double spaces or double autoCompletes
    content = content.replace(/autoComplete="off"\s+autoComplete="off"/g, 'autoComplete="off"');
    content = content.replace(/\s+/g, ' ').replace(/>\s+</g, '>\n<'); // This might be too aggressive for formatting, let's be careful

    fs.writeFileSync(filePath, content);
    console.log(`Processed ${file}`);
});
