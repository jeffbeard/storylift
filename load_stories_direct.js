const mysql = require('mysql2/promise');
require('dotenv').config();

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'storylift'
};

// Extracted STAR stories from the PDF
const stories = [
  {
    title: "College Recruiting Program",
    description: "Enhanced Oracle Advertising's intern program post-acquisition, boosting engineer intake by 212% and retention rates to over four years.",
    situation: "When Datalogix was acquired by Oracle, the intern program leader transitioned to a different role and I was tapped to lead the program. This meant engaging with the corporate college recruiting team for support and guidance, maintaining the best parts of our program and growing it.",
    task: "I built a team of college recruiting specialists that included previous participants, senior engineers, and an executive sponsor. We focused on quality engineering schools local to our offices. We built a schedule based on the school job fairs to synchronize with when students were looking for internships. We also targeted when students would graduate since those who were successful could transition to full-time roles. We also introduced new program features: WiT mentoring, Rotational programs for first 2 years before settling into permanent role, Merged with Data Science program, Elevated program to encompass sister business units, Paired interns on host teams to reduce overhead, increase self-sufficiency, and teach teamwork, Piloted neuro-diversity intern program in collaboration with corporate team (50% hire rate of excellent candidates).",
    action: "We built a robust pipeline of early career engineers who were exceptionally well suited for our business. We increased our visibility and grew our reputation within the schools we drew from. We grew from 8 to 25 engineers.",
    result: "Enhanced Oracle Advertising's intern program post-acquisition, boosting engineer intake by 212% and retention rates to over four years. Added key features like WiT mentoring and a 50% hire rate neuro-diversity pilot, elevating early-career development.",
    user_id: 2
  },
  {
    title: "Infrastructure Product Management Function",
    description: "Consolidated six acquisition teams into a single infrastructure group, aligning over 700 employees with an agile roadmap in three months.",
    situation: "Because the business unit was an amalgam of six acquisitions, there were legacy team topologies, infrastructure, and backlogs that interfered with a unified roadmap and alignment with forward looking business objectives. Though we had tried to execute against a unified roadmap, the matrixed nature of the infrastructure function introduced significant friction. I saw this as an opportunity to propose a structural change and to introduce agile product management for transparency, accountability, and alignment with stakeholders.",
    task: "I developed a proposal and presented it to executive leadership. It was eventually approved, structural changes made, and I was charged with implementing the Product Management function. We built up a unified roadmap, a prioritized backlog, and rituals around feature intake, transparency, and communication with stakeholders.",
    action: "The matrixed organization was collapsed into a single team, the sub teams were organized around functions and capabilities, all teams worked off a common high-level roadmap, stakeholders had well communicated on-boarding and intake pipelines, operations and incident response models were also unified. Essentially, we went from failing to deliver commitments (except for my team) to provably delivering on strategic objectives and stakeholder requirements.",
    result: "Consolidated six acquisition teams into a single infrastructure group, aligning over 700 employees with an agile roadmap in three months. This shift increased planned work to 70%, enhancing strategic delivery and stakeholder alignment.",
    user_id: 2
  },
  {
    title: "Product Lead for SaFE and quarterly planning",
    description: "Streamlined 400+ initiatives to the top 10, achieving a 98% reduction in active tasks quarterly, enhancing alignment and efficiency among 700+ employees.",
    situation: "In an attempt to gain alignment internally and with customers as well as to focus on priority work and measure success, the organization adopted a quarterly planning regime, OKRs, and the SaFE enterprise agile methodology.",
    task: "I received a SaFE certification and applied knowledge from that and the transformation leaders to bring the Infrastructure teams into the SaFE agile practice and quarterly planning. I brought the new approach to the Infrastructure team along with the various processes, tools, schedules, and methodologies such that we could align with the larger organization. I performed readouts of committed and prioritized work as well as scheduled regular meetings with engineering and other stakeholders to review progress, changes, and receive feedback.",
    action: "The Infrastructure team was aligned with the new approach, participated in the product management rituals, engaged with stakeholders, made work transparent using the same tools and common rituals, and could show progress on key initiatives as well as surface blockers, identify tech debt, and other friction.",
    result: "Streamlined 400+ initiatives to the top 10, achieving a 98% reduction in active tasks quarterly, enhancing alignment and efficiency among 700+ employees.",
    user_id: 2
  },
  {
    title: "Migrated to GitLab Security Scanning systems",
    description: "Migrated over 4,000 projects to GitLab, saving $250K annually and enhancing risk management by deprecating 15% of inactive projects.",
    situation: "GitLab's feature list grew significantly in the software security feature set to the extent that it became redundant to operate a separate Software Component Analysis (SCM) platform. Additionally, we had corporate requirements for Secrets in Code monitoring, Static Code Analysis Dynamic Code Analysis (DAST), and Container scanning all which GitLab had supported with a license upgrade.",
    task: "We collaborated with over 20 of our development teams and GitLab solution architects to define the initial feature set, develop a plan, then did a rolling release across development pillar (aggregated) teams. This required some changes a head of time as well as building a data asset to visualization progress. We presented key milestones to executive leadership and other stakeholders which gave us an opportunity to perform course corrections and get feedback. After working with early adopter teams, we were able to develop accurate timelines, roadmap, communications plans, and built a virtual team of collaborators across the organization to drive the changes to completion.",
    action: "We migrated all 4000+ software projects across 20+ team to GitLab's security features, did training on the new processes, code, and procedures by our predicted date. Afterwards, we deprecated the legacy platform and associate processes allowing us to recoup several hundred hours of work per year. Additionally, we were able to deprecate around 15% of software projects that were inactive and assign ownership to all projects to improve compliance. With additional, newer scans we were able to find and remediate a few high-priority risks that were missed on the legacy system.",
    result: "Migrated over 4,000 projects to GitLab, saving $250K annually and enhancing risk management by deprecating 15% of inactive projects. Achieved 100% code scan coverage and enforced strict compliance, significantly improving security.",
    user_id: 2
  }
];

async function loadStoriesDirectly() {
  let connection;

  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);

    console.log('Loading STAR stories directly into database...');

    for (const story of stories) {
      try {
        const [result] = await connection.execute(
          `INSERT INTO star_stories (user_id, title, description, situation, task, action, result, notes, created, updated)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            story.user_id,
            story.title,
            story.description || '',
            story.situation,
            story.task,
            story.action,
            story.result,
            '' // notes field
          ]
        );

        console.log(`✓ Created story: "${story.title}" (ID: ${result.insertId})`);
      } catch (error) {
        console.error(`✗ Failed to create story "${story.title}":`, error.message);
      }
    }

    console.log('\nAll stories processed!');

    // Let's also check what stories now exist for user_id 2
    console.log('\nChecking stories for user_id 2:');
    const [userStories] = await connection.execute(
      'SELECT id, title, description FROM star_stories WHERE user_id = 2',
      []
    );

    userStories.forEach(story => {
      console.log(`- ${story.id}: ${story.title}`);
    });

  } catch (error) {
    console.error('Database connection error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
loadStoriesDirectly();