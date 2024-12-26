module.exports.dateDesc = (a, b) => new Date(b.pubDate) - new Date(a.pubDate);

module.exports.noimage = (a, b) =>
    a.image_url && !b.image_url ? -1 : b.image_url && !a.image_url ? 1 : 0

