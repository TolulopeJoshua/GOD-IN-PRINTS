if(process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}

const { getAllVideosFromVideoIds, getVideoIdsFromVideoPlaylists } = require('./videos_functions');

async function get() {
  await getVideoIdsFromVideoPlaylists();
  await getAllVideosFromVideoIds();
}

get();