const fs = require('fs');
const path = require('path');

const files = [
    'src/StudentHealthCard.jsx',
    'src/StudentHealthRecord.jsx',
    'src/SavedHealthRecordForm.jsx',
    'src/EditableIdentityCard.jsx',
    'src/WeeklyHealthUpdate.jsx'
];

files.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');

    // Fix the broken arrow functions
    content = content.replace(/\(e\) = autoComplete="off" >/g, '(e) =>');

    // Now let's do a TRULY safe autocomplete injection.
    // We search for types of tags, but only inject if we see a space followed by /> or > 
    // AND it doesn't already have it.

    // Pattern to look for: type="text" or name="..." or id="..."
    // that doesn't have autoComplete, and is inside an input/select/textarea

    // We will do it line by line for simplicity if the tag is on one line
    const lines = content.split('\n');
    const fixedLines = lines.map(line => {
        if ((line.includes('<input') || line.includes('<select') || line.includes('<textarea')) &&
            !line.toLowerCase().includes('autocomplete=') &&
            !line.toLowerCase().includes('type="file"') &&
            !line.toLowerCase().includes('type="radio"') &&
            !line.toLowerCase().includes('type="checkbox"')) {

            if (line.includes('/>')) {
                return line.replace('/>', 'autoComplete="off" />');
            } else if (line.includes('>') && !line.includes('=>')) {
                return line.replace('>', 'autoComplete="off">');
            }
        }
        return line;
    });

    fs.writeFileSync(filePath, fixedLines.join('\n'));
});
