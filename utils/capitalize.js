module.exports = (text) => {
    const words = text.toLowerCase().split(' ');
    return words.map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
}