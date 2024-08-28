import axios from 'axios';

const API_BASE_URL = 'https://demo-core-dashboard.vercel.app';

const sendJsonData = (inputData) => {
    return axios.post(`${API_BASE_URL}/api/json/`, { input: inputData });
};

export default sendJsonData;
