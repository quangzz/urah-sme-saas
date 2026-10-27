import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

app.use(cors());
app.use(express.json());

// API healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Node.js Gateway' });
});

// Proxy to FastAPI
app.use('/api/fastapi', async (req, res) => {
  try {
    const url = `${FASTAPI_URL}${req.path}`;
    const response = await axios({
      method: req.method,
      url: url,
      data: req.body,
      headers: {
        ...req.headers,
        host: undefined, // Let Axios handle host
      },
      params: req.query,
    });
    
    res.status(response.status).send(response.data);
  } catch (error: any) {
    console.error('FastAPI Proxy Error:', error.message);
    if (error.response) {
      res.status(error.response.status).send(error.response.data);
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

app.listen(port, () => {
  console.log(`Node.js Gateway running at http://localhost:${port}`);
});
