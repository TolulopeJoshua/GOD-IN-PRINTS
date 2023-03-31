module.exports = (text) => {
    const separators = [' ', ' \'', '-', '_', '.']
    let words = text.toLowerCase();
    for (let separator of separators) {
        words = words.split(separator).map(word => word[0]?.toUpperCase() + word.slice(1)).join(separator);
    }
    return words;
}