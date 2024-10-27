const axios = require('axios').default;

const url = 'https://godinprints-default-rtdb.firebaseio.com/weekliesIndex.json';

module.exports.getIndex = async () => {
    const index = await axios.get(url);
    return parseInt(index.data);
}

module.exports.putIndex = async (index) => {
    return await axios.put(url, index.toString());
}