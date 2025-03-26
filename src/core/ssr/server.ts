import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderToString } from '@/core/ssr/entry';

const app = express();
const PORT = process.env.PORT || 3000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../../../dist');


app.use(express.static(distPath));


app.get('*', async (req, res) => {
  try {
    const url = req.url;
    const html = await renderToString(url);
    
    
    const finalHtml = html.replace(
      '</body>',
      `
        <script src="/zodiac.js"></script>
        <script src="/main.js"></script>
      </body>`
    );

    res.send(finalHtml);
  } catch (error) {
    console.error('SSR Error:', error);
    
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📁 Serving static files from ${distPath}`);
}); 