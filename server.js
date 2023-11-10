require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// Apply rate limits to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Middleware for JSON body parsing
app.use(express.json());

// Fetch the GitHub token from the environment variables
const githubToken = process.env.GITHUB_TOKEN;

// Base URL for GitHub API
const githubApiBaseUrl = 'https://api.github.com';

// Endpoint to get the contents of a file or directory in your GitHub repo
app.get('/repos/:owner/:repo/contents/*', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const path = req.params[0] || ''; // Fallback to an empty string if no path is provided
    
    const apiUrl = `${githubApiBaseUrl}/repos/${owner}/${repo}/contents/${path}`;
    
    const response = await axios.get(apiUrl, {
      headers: { 'Authorization': `token ${githubToken}` },
    });
    
    // Check if the response is for a file and has content encoded in base64
    if (response.data.type === 'file' && response.data.encoding === 'base64') {
      // Decode base64 to a string
      const content = Buffer.from(response.data.content, 'base64').toString('utf8');
      res.send(content);
    } else {
      // If it's not a file or not encoded in base64, return the raw response
      res.json(response.data);
    }
  } catch (error) {
    res.status(error.response ? error.response.status : 500).json(error.response ? error.response.data : 'Error');
  }
});

// Start the server and log any errors
module.exports = app;
