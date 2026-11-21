const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello from the CI/CD pipeline! Version 1.0');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
}
