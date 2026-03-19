const pool = require('./db/config');
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'level'")
  .then(res => {
    if (res.rows.length > 0) {
      console.log('✅ Level column exists');
    } else {
      console.log('❌ Level column MISSING');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
