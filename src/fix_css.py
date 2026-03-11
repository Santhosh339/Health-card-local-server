
path = r'c:\Users\hemanth.malla_oneto7\Desktop\healthcare\Health_card\src\App.css'
with open(path, 'rb') as f:
    content = f.read()

# Find the end of the good CSS (line 2742 ends with '}\n')
# We know line 2736 starts with .records-table-container
good_end_marker = b'.records-table-container {'
idx = content.rfind(good_end_marker)
if idx != -1:
    # Find the next closing brace after this container
    end_idx = content.find(b'}', idx)
    if end_idx != -1:
        clean_content = content[:end_idx+1]
        
        # Add the new CSS
        extra_css = b"""
/* Global Table Fixes */
.records-table {
    table-layout: auto !important;
    min-width: 1100px !important;
    border-spacing: 0 8px !important;
}

.records-table th, .records-table td {
    width: auto !important;
    white-space: nowrap !important;
}
"""
        with open(path, 'wb') as f:
            f.write(clean_content + extra_css)
        print("Successfully cleaned and updated App.css")
    else:
        print("Could not find closing brace")
else:
    print("Could not find marker")
