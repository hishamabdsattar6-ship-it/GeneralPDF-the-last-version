const https = require('https');

https.get('https://raw.githubusercontent.com/googlefonts/cairo/main/fonts/ttf/Cairo-Regular.ttf', (res) => {
  console.log("Cairo-Regular.ttf:", res.statusCode);
});

https.get('https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvalIvTp0ijw.ttf', (res) => {
  console.log("gstatic Cairo:", res.statusCode);
});
