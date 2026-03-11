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

    // Safer approach: find <input, <select, <textarea
    // But only ones that don't have autoComplete/autocomplete and aren't file/radio/checkbox
    // and aren't closing tags.

    // We'll iterate through the file and handle each tag individually
    let newContent = '';
    let lastIndex = 0;

    const tagRegex = /<(input|select|textarea)(\s+[^>]*?)(\/?>)/gi;
    let match;

    while ((match = tagRegex.exec(content)) !== null) {
        newContent += content.substring(lastIndex, match.index);

        let tag = match[0];
        let type = match[1];
        let body = match[2];
        let close = match[3];

        const hasAutoComplete = /autocomplete=/i.test(body);
        const isFile = /type="file"/i.test(body);
        const isRadio = /type="radio"/i.test(body);
        const isCheckbox = /type="checkbox"/i.test(body);
        const hasIdOrName = /id=|name=/i.test(body);

        if (!hasAutoComplete && (hasIdOrName) && !isFile && !isRadio && !isCheckbox) {
            // Insert autoComplete="off" before the close
            tag = `<${type}${body} autoComplete="off" ${close}`;
        }

        newContent += tag;
        lastIndex = tagRegex.lastIndex;
    }
    newContent += content.substring(lastIndex);

    fs.writeFileSync(filePath, newContent);
    console.log(`Processed ${file}`);
});
