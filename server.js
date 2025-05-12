const express = require('express');
     const path = require('path');
     const app = express();
     const port = 8000;

     // Serve static files
     app.use(express.static(path.join(__dirname)));

     // Serve node_modules for local libraries
     app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

     app.listen(port, '0.0.0.0', () => {
        console.log(`Server running at http://0.0.0.0:${port}`);
    });
