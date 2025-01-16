class Config {
    constructor() {
        this.language = 'id';
        this.geocoding_api = 'pk.8b57aae498076591fc6e4170de3428db';
        this.default_lat = 3.5896654;
        this.default_long = 98.6738261;
        this.min_price = {
            instant: {
                bike: 13000,
                car: 26000
            },
            same_day: {
                bike: 8000,
                car: 20000
            }
        };
        this.price_per_km = {
            bike: 2500,
            car: 3000
        };
        this.max_km_distance = 60;
        this.max_weight = 150;
    }

    change_lang() {
        this.language = this.language === 'id' ? 'en' : 'id';
    }
}

module.exports = new Config();