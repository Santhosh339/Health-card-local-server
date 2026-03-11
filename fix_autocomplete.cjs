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

    // Match <input> or <select> or <textarea> that doesn't have autoComplete or autocomplete
    // We look for tags ending with /> or > and insert autoComplete="off" before the end
    // But only if it has a name or id (likely a form field)

    // Regex to find inputs/selects/textareas that have an id or name but no autocomplete
    const tagRegex = /<(input|select|textarea)([^>]*?)(id|name)=("[^"]*"|'[^']*')([^>]*?)\/?>/gi;

    content = content.replace(tagRegex, (match, tag, before, attr, value, after) => {
        if (match.toLowerCase().includes('autocomplete=') || match.toLowerCase().includes('type="file"') || match.toLowerCase().includes('type="radio"') || match.toLowerCase().includes('type="checkbox"')) {
            return match;
        }

        // Add autoComplete="off" before the end of the tag
        if (match.endsWith('/>')) {
            return `<${tag}${before}${attr}=${value}${after} autoComplete="off" />`;
        } else {
            return `<${tag}${before}${attr}=${value}${after} autoComplete="off">`;
        }
    });

    fs.writeFileSync(filePath, content);
    console.log(`Processed ${file}`);
});
