const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');
require('dotenv').config();

const upload = multer(); // muistiin, ei levylle
const app = express();

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// POST /upload
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'ei file kenttää' });

    const targetUrl = process.env.TARGET_URL || 'https://pomf.cat/upload';
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      knownLength: req.file.size
    });

    if (process.env.TARGET_API_KEY) {
      form.append('api-key', process.env.TARGET_API_KEY);
    }

    const resp = await axios.post(targetUrl, form, {
      headers: { ...form.getHeaders() },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    return res.status(200).json({
      ok: true,
      upstreamStatus: resp.status,
      data: resp.data
    });
  } catch (err) {
    console.error('proxy upload error:', err?.response?.data || err.message || err);
    return res.status(500).json({ error: 'upload epäonnistui', details: err?.response?.data || err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));