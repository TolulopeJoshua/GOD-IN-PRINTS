module.exports.bufferFromUri = (uri) => {
  const regex = /^data:.+\/(.+);base64,(.*)$/;
  const matches = uri.match(regex);
//   const ext = matches[1];
  const data = matches[2];
  return new Buffer(data, 'base64');
}