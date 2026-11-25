// Vercel serverless entry point for the Express API.
const express = require('express');
const datasetsRouter = require('./datasets');
const app = express();
app.disable('x-powered-by');
app.use(express.json({limit:'32kb'}));
app.use('/api/datasets', datasetsRouter);
app.get('/api/health', (_req,res)=>res.json({ok:true,service:'DataVault API'}));
module.exports = app;