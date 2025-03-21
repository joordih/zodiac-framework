import express from 'express';
import { renderApp, renderError } from './entry';
import { DashboardComponent } from '@/test/components/dashboard.tsx';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('dist'));

app.get('*', async (req, res) => {
  try {
    const result = await renderApp(DashboardComponent, req.url, {
      initialDateRange: {
        startDate: "Jan 20, 2023",
        endDate: "Feb 09, 2023"
      }
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(result.html);
  } catch (error) {
    console.error('SSR Error:', error);
    const errorResult = await renderError(error as Error, req.url);
    res.status(500).send(errorResult.html);
  }
});

app.listen(port, () => {
  console.log(`SSR Server running at http://localhost:${port}`);
}); 