function generateStatus() {
    const random = Math.random();
    if (random < 0.6) return 0;

    const remainder = Math.random();
    if (remainder < 0.33) return 1
    else if (remainder < 0.66) return 2
    else return 3;
}

module.exports = generateStatus;