const express = require('express');
const path = require('path');
const datasetsRouter = require('./api/datasets');

const app = express();
const PORT = process.env.PORT || 3000;
app.disable('x-powered-by');
app.use(express.json({limit:'32kb'}));
app.use('/api/datasets', datasetsRouter);
app.use(express.static(path.join(__dirname)));

app.get('/api/health', (_req,res) => res.json({ok:true,service:'DataVault API'}));
app.get('*', (req,res,next) => {
  if(req.path.startsWith('/api/')) return res.status(404).json({error:'API route not found'});
  res.sendFile(path.join(__dirname,'index.html'),err=>err&&next(err));
});

app.listen(PORT,()=>console.log(`DataVault running at http://localhost:${PORT}`));