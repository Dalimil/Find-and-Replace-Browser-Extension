# Search UI Widget
This directory contains the code implementing the search widget (extension popup). It utilizes React.js and is set up as a separate npm project.

During project build, the output code will be placed into the relevant directory -> `/main/widget/`  
To make the dev server work, we symlink files from the original widget directory (styles, fonts, etc), so that we can test this component in isolation (without any Chrome extension).
