import fs from 'fs';
import https from 'https';
import path from 'path';

if (!fs.existsSync('public')) fs.mkdirSync('public');
if (!fs.existsSync('public/fonts')) fs.mkdirSync('public/fonts');

const file = fs.createWriteStream("public/fonts/Cairo.ttf");
https.get("https://raw.githubusercontent.com/google/fonts/main/ofl/cairo/Cairo%5Bslnt,wght%5D.ttf", function(response) {
  response.pipe(file);
});
