const axios = require('axios');

const HUGGING_FACE_SPACE_URL = process.env.HUGGING_FACE_SPACE_URL;
const HUGGING_FACE_API_ENDPOINT = `${HUGGING_FACE_SPACE_URL}chat`;
async function askAgent(req, res) {
    const userQuestion = req.body.question;

    if (!userQuestion) {
        return res.status(400).json({ message: "A 'question' parameter is required in the request body." });
    }

    if (!HUGGING_FACE_SPACE_URL) {
        return res.status(500).json({ message: "Server configuration error: Hugging Face Space URL is missing." });
    }

    try {
        const payload = {
            data: [
                userQuestion,
                [] 
            ]
        };

        const response = await axios.post(HUGGING_FACE_API_ENDPOINT, payload, {
            headers: {
                'Content-Type': 'application/json'
                // 'Authorization': `Bearer ${process.env.HF_API_TOKEN}`
            }
        });

        const agentResponse = response.data.data[0]; 
        res.status(200).json({ answer: agentResponse });

    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json({
                message: 'Failed to get a valid response from the AI agent.',
                details: error.response.data,
                status: error.response.status
            });
        } else if (error.request) {
            res.status(500).json({
                message: 'The AI agent is unreachable or did not respond.',
                details: 'Network error or agent service is unavailable.'
            });
        } else {
            res.status(500).json({ message: 'An unexpected server error occurred.', error: error.message });
        }
    }
}

module.exports = {
    askAgent
};