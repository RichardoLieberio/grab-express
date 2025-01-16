async function generateDriver(count) {
    const semuaNama = await generateName(count);
    const driver = [];
    for (let i = 0; i < count; i ++) {
      const nama = semuaNama[i]?.name.first && semuaNama[i]?.name.first ? `${semuaNama[i]?.name.first} ${semuaNama[i]?.name.last}` : 'Bambang';
      const plat = generatePlat();
      const rating = generateRating();
      driver.push({nama, plat, rating});
    }

    return driver;
}

async function generateName(count) {
    try {
        const response = await fetch(`https://randomuser.me/api/?results=${count}&inc=name`);
        const data = await response.json();
        return data.results;
    } catch(err) {}
}

function generatePlat() {
    const nomor = Math.floor(1000 + Math.random() * 9000);

    const huruf = String.fromCharCode(
        65 + Math.floor(Math.random() * 26),
        65 + Math.floor(Math.random() * 26)
    );

  return `BK ${nomor} ${huruf}`;
}

function generateRating() {
    const rating = [];
    for (let i = 4.0; i <= 5.0; i += 0.1) {
      rating.push(i.toFixed(1));
    }

    const randomRating = Math.floor(Math.random() * rating.length);
    return parseFloat(rating[randomRating]);
  }

module.exports = generateDriver;