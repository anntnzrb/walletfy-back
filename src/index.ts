import app from './app';

const PORT = 3030;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health endpoint available at http://localhost:${PORT}/health`);
  console.log(`🔧 API endpoints available at http://localhost:${PORT}/api/eventos`);
});