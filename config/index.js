 const config = {
    brightData: {
        username: process.env.BRIGHT_DATA_USERNAME,
        password: process.env.BRIGHT_DATA_PASSWORD,
        host: process.env.BRIGHT_DATA_HOST,
        port: parseInt(process.env.BRIGHT_DATA_PORT, 10),
    },
    huggingFace: {
        apiKey: process.env.HF_API_KEY,
        modelUrl: process.env.HF_MODEL_URL,
    }
};

module.exports = config;