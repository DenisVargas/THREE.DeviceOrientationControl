const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3100;
const mode = process.env.NODE_ENV || 'development';

app.use(express.static(path.join(__dirname, './public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './public/index.html'));
});

//If route is /jsm then send the file from public/jsm
// app.get('/modules/:file', (req, res) => {
//     const file = req.params.file;
//     //set mime type as javascript module
//     res.set('Content-Type', 'application/javascript');
//     res.sendFile(path.join(__dirname, `./public/modules/${file}`));
// });

app.listen(PORT, () => {
    const localHost = `http://localhost:${PORT}`;
    if(mode === 'development') console.log(`Server running on: ${localHost}`);
    else console.log(`Server running on: ${PORT}`);
});