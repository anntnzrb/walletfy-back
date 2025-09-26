const { defineConfig } = require('poku');

module.exports = defineConfig({
  include: ['tests'],
  sequential: true,
  envFile: '.env',
});
