const mysql = require('mysql2/promise');
require('dotenv').config();

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'storylift'
};

async function fixRequirementIdColumn() {
  let connection;

  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);

    // First, let's check the current table structure
    console.log('Checking current star_stories table structure...');
    const [columns] = await connection.execute('DESCRIBE star_stories');
    console.log('Current columns:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default !== null ? `DEFAULT ${col.Default}` : ''}`);
    });

    // Check if requirement_id column exists
    const requirementIdCol = columns.find(col => col.Field === 'requirement_id');

    if (requirementIdCol) {
      console.log('\nFound requirement_id column. This should be removed since we use story_requirement_mappings table now.');

      try {
        // First, drop the foreign key constraint
        console.log('Dropping foreign key constraint...');
        await connection.execute('ALTER TABLE star_stories DROP FOREIGN KEY star_stories_ibfk_1');
        console.log('✓ Foreign key constraint removed');

        // Now drop the requirement_id column
        console.log('Dropping requirement_id column...');
        await connection.execute('ALTER TABLE star_stories DROP COLUMN requirement_id');
        console.log('✓ requirement_id column removed successfully');
      } catch (error) {
        console.log('Error removing constraint/column:', error.message);

        // Alternative approach: just make the column nullable
        console.log('Trying alternative approach: making requirement_id nullable...');
        await connection.execute('ALTER TABLE star_stories MODIFY COLUMN requirement_id INT NULL');
        console.log('✓ requirement_id column is now nullable');
      }
    } else {
      console.log('\nNo requirement_id column found in star_stories table.');
    }

    // Show the updated table structure
    console.log('\nUpdated table structure:');
    const [newColumns] = await connection.execute('DESCRIBE star_stories');
    newColumns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default !== null ? `DEFAULT ${col.Default}` : ''}`);
    });

  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
fixRequirementIdColumn();