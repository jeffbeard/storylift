const axios = require('axios');

class ClaudeService {
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY;
    this.apiUrl = 'https://api.anthropic.com/v1/messages';
  }

  async extractRequirements(jobContent) {
    // Placeholder implementation - replace with actual Claude API call
    if (!this.apiKey || this.apiKey === 'your_claude_api_key_here') {
      return this.mockExtractRequirements(jobContent);
    }

    try {
      const response = await axios.post(this.apiUrl, {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Please analyze this job description and extract the requirements and qualifications. Return ONLY a valid JSON object with this exact structure:

{
  "requirements": [
    {"title": "Specific requirement", "description": "Detailed description of the requirement"}
  ],
  "qualifications": [
    {"title": "Specific qualification", "description": "Detailed description of the qualification"}
  ]
}

Requirements are must-have skills, experience, or education needed for the role.
Qualifications are preferred/nice-to-have skills that would make a candidate stronger.

Job Description:
${jobContent}`
        }]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        }
      });

      const content = response.data.content[0].text;

      // Extract JSON from Claude's response (may include markdown formatting)
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(jsonStr.trim());
      } else {
        console.log('Claude response:', content);
        // Don't fall back to mock data for parsing errors - return empty results instead
        return {
          requirements: [],
          qualifications: []
        };
      }
    } catch (error) {
      console.error('Claude API error:', error.message);
      // Only use mock data if there's an API connection issue, not for parsing errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.response?.status >= 500) {
        console.log('Using mock data due to API connection issue');
        return this.mockExtractRequirements(jobContent);
      }
      // For other errors (like parsing), return empty results
      return {
        requirements: [],
        qualifications: []
      };
    }
  }

  mockExtractRequirements(jobContent) {
    // Mock data for testing without API key
    return {
      requirements: [
        {
          title: "Bachelor's degree in Computer Science",
          description: "4-year degree in computer science or related technical field"
        },
        {
          title: "3+ years of software development experience",
          description: "Professional experience building software applications"
        },
        {
          title: "Proficiency in JavaScript",
          description: "Strong knowledge of JavaScript programming language"
        }
      ],
      qualifications: [
        {
          title: "Experience with React",
          description: "Hands-on experience with React framework"
        },
        {
          title: "Knowledge of databases",
          description: "Understanding of SQL and database design"
        },
        {
          title: "Strong problem-solving skills",
          description: "Ability to analyze and solve complex technical problems"
        }
      ]
    };
  }
}

module.exports = new ClaudeService();