const Fuse = require('fuse.js');

function search(list, query, keys=["name","title","author"]) {
  const options = {
    keys,
    minMatchCharLength: 2,
  };
  const fuse = new Fuse(list, options);
  return fuse.search(query).map((res) => res.item);
}

module.exports = search;

// const fuseOptions = {
// 	isCaseSensitive: false,
// 	includeScore: false,
// 	shouldSort: true,
// 	includeMatches: false,
// 	findAllMatches: false,
// 	minMatchCharLength: 1,
// 	location: 0,
// 	threshold: 0.6,
// 	distance: 100,
// 	useExtendedSearch: false,
// 	ignoreLocation: false,
// 	ignoreFieldNorm: false,
// 	fieldNormWeight: 1,
// 	keys: [
// 		"title",
// 		"author.firstName"
// 	]
// };
