const config = require('../config');
const getDistance = require('../services/getDistance');
const generateDriver = require('../services/generateDriver');
const generateNoResi = require('../services/generateNoResi');
const generateStatus = require('../services/generateStatus');
const Rekening = require('./Rekening');

const fakeData = [
    {
        pickup: {
            long: '98.6779258',
            lat: '3.5874245',
            loc: 'Wi Motor, 41, Jalan Mesjid, Kesawan, Medan Barat, Kota Medan, Sumatera Utara, Sumatra, 20212, Indonesia',
            detail: 'Bengkel Wi Motor'
        },
        destination: {
            long: '98.6682164',
            lat: '3.59275865',
            loc: 'Daihatsu Medan, Jalan Jenderal Gatot Subroto, Petisah Tengah, Petisah, Medan Petisah, Kota Medan, Sumatera Utara, Sumatra, 20112, Indonesia',
            detail: 'Capella Medan, titip ke security'
        },
        sender: {
            name: 'Lyna',
            phone: '082164524790'
        },
        recipient: {
            name: 'Richardo Lieberio',
            phone: '081918981214'
        },
        item: {
            size: 's',
            weight: '1',
            type: 1
        },
        delivery: {
            option: 'instant',
            vehicle: 'bike',
        },
        payment: {
            method: 2,
            discount: null
        },
        distance: '2.82',
        detail_price: {
            instant: {
                bike: '17600',
                car: '31500'
            },
            same_day: {
                bike: '12600',
                car: '25500'
            }
        },
        price: '17600',
        status: 3,
        driver: {
            nama: 'Ferdy',
            plat: 'BK 1412 KD',
            rating: 4.4
        },
        time: 1731152398413,
        no_resi: '8SDBWMN27EPA3J9EVVVA'
    },
    {
        pickup: {
            long: '98.6779258',
            lat: '3.5874245',
            loc: 'Wi Motor, 41, Jalan Mesjid, Kesawan, Medan Barat, Kota Medan, Sumatera Utara, Sumatra, 20212, Indonesia',
            detail: 'Bengkel Wi Motor'
        },
        destination: {
            long: '98.6682164',
            lat: '3.59275865',
            loc: 'Daihatsu Medan, Jalan Jenderal Gatot Subroto, Petisah Tengah, Petisah, Medan Petisah, Kota Medan, Sumatera Utara, Sumatra, 20112, Indonesia',
            detail: 'Capella Medan, titip ke security'
        },
        sender: {
            name: 'Lyna',
            phone: '082164524790'
        },
        recipient: {
            name: 'Richardo Lieberio',
            phone: '081918981214'
        },
        item: {
            size: 's',
            weight: '1',
            type: 1
        },
        delivery: {
            option: 'instant',
            vehicle: 'bike',
        },
        payment: {
            method: 2,
            discount: null
        },
        distance: '2.82',
        detail_price: {
            instant: {
                bike: '17600',
                car: '31500'
            },
            same_day: {
                bike: '12600',
                car: '25500'
            }
        },
        price: '17600',
        status: 2,
        time: 1731152398413,
        no_resi: 'C1G8LEHU2YCHZM8826E7'
    },
    {
        pickup: {
            long: '98.6779258',
            lat: '3.5874245',
            loc: 'Wi Motor, 41, Jalan Mesjid, Kesawan, Medan Barat, Kota Medan, Sumatera Utara, Sumatra, 20212, Indonesia',
            detail: 'Bengkel Wi Motor'
        },
        destination: {
            long: '98.6682164',
            lat: '3.59275865',
            loc: 'Daihatsu Medan, Jalan Jenderal Gatot Subroto, Petisah Tengah, Petisah, Medan Petisah, Kota Medan, Sumatera Utara, Sumatra, 20112, Indonesia',
            detail: 'Capella Medan, titip ke security'
        },
        sender: {
            name: 'Lyna',
            phone: '082164524790'
        },
        recipient: {
            name: 'Richardo Lieberio',
            phone: '081918981214'
        },
        item: {
            size: 's',
            weight: '1',
            type: 1
        },
        delivery: {
            option: 'instant',
            vehicle: 'bike',
        },
        payment: {
            method: 2,
            discount: null
        },
        distance: '2.82',
        detail_price: {
            instant: {
                bike: '17600',
                car: '31500'
            },
            same_day: {
                bike: '12600',
                car: '25500'
            }
        },
        price: '17600',
        status: 0,
        driver: {
            nama: 'Budi Yanto',
            plat: 'BK 9912 LD',
            rating: 4.9
        },
        time: 1731152398413,
        no_resi: 'MDN6C591CJERQA1OUDWT'
    },
    {
        pickup: {
            long: '98.6865561',
            lat: '3.5355179',
            loc: 'Gang Sado, Suka Maju, Gedung Johor, Medan Johor, Kota Medan, Sumatera Utara, Sumatra, 20146, Indonesia',
            detail: 'Komplek Sado Permai'
        },
        destination: {
            long: '98.66648694451999',
            lat: '3.5935493434311967',
            loc: 'Jalan Rajak, Petisah Tengah, Petisah, Medan Petisah, City of Medan, North Sumatra, Sumatra, 20112, Indonesia',
            detail: 'Tonspia'
        },
        sender: {
            name: 'Lukas Lieberio',
            phone: '082164524790'
        },
        recipient: {
            name: 'Stefan',
            phone: '081247881909'
        },
        item: {
            size: 'm',
            weight: '3',
            type: 6
        },
        delivery: {
            option: 'same_day',
            vehicle: 'bike',
        },
        payment: {
            method: 1,
            discount: null
        },
        distance: '8.62',
        detail_price: {
            instant: {
                bike: '32000',
                car: '48900'
            },
            same_day: {
                bike: '27000',
                car: '42900'
            }
        },
        price: '32000',
        status: 1,
        driver: {
            nama: 'Bambang',
            plat: 'BK 1924 AS',
            rating: 4.1
        },
        time: 1731152398413,
        no_resi: 'PSL5SUHW3DPLDCGOZ0G5'
    },
    {
        pickup: {
            long: '98.6865561',
            lat: '3.5355179',
            loc: 'Gang Sado, Suka Maju, Gedung Johor, Medan Johor, Kota Medan, Sumatera Utara, Sumatra, 20146, Indonesia',
            detail: 'Komplek Sado Permai'
        },
        destination: {
            long: '98.66648694451999',
            lat: '3.5935493434311967',
            loc: 'Jalan Rajak, Petisah Tengah, Petisah, Medan Petisah, City of Medan, North Sumatra, Sumatra, 20112, Indonesia',
            detail: 'Tonspia'
        },
        sender: {
            name: 'Lukas Lieberio',
            phone: '082164524790'
        },
        recipient: {
            name: 'Stefan',
            phone: '081247881909'
        },
        item: {
            size: 'm',
            weight: '3',
            type: 6
        },
        delivery: {
            option: 'same_day',
            vehicle: 'bike',
        },
        payment: {
            method: 1,
            discount: null
        },
        distance: '8.62',
        detail_price: {
            instant: {
                bike: '32000',
                car: '48900'
            },
            same_day: {
                bike: '27000',
                car: '42900'
            }
        },
        price: '32000',
        status: 0,
        driver: {
            nama: 'Bagus',
            plat: 'BK 4511 FS',
            rating: 4.7
        },
        time: 1731152398413,
        no_resi: '5QFO8E9APRU3KIUI1YJV'
    }
];

class Pesanan {
    constructor() {
        this.format = {
            pickup: {
                long: null,
                lat: null,
                loc: null,
                detail: null
            },
            destination: {
                long: null,
                lat: null,
                loc: null,
                detail: null
            },
            sender: {
                name: null,
                phone: null
            },
            recipient: {
                name: null,
                phone: null
            },
            item: {
                size: null,
                weight: null,
                type: null
            },
            delivery: {
                option: null,
                vehicle: null,
            },
            payment: {
                method: 0,
                discount: null
            },
            distance: null,
            detail_price: {
                instant: {
                    bike: null,
                    car: null
                },
                same_day: {
                    bike: null,
                    car: null
                }
            },
            price: null
        };
        this.pesanan = [structuredClone(this.format)];
        this.history = [];
        this.status = ['Selesai', 'Dibatalkan', 'Tidak ada pengemudi', 'Dikembalikan'];
        this.orders = [];
    }

    getFirstOrder() {
        return this.pesanan[0];
    }

    getAllOrder() {
        return this.pesanan;
    }

    swapOrder(no) {
        const temp = this.pesanan[no - 1].pickup;
        this.pesanan[no - 1].pickup = this.pesanan[no - 1].destination;
        this.pesanan[no - 1].destination = temp;

        const temp2 = this.pesanan[no - 1].sender;
        this.pesanan[no - 1].sender = this.pesanan[no - 1].recipient;
        this.pesanan[no - 1].recipient = temp2;
    }

    updateOrderByMaps(long, lat, loc, type, no) {
        this.pesanan[no - 1][type] = {...this.pesanan[no - 1][type], long, lat, loc};
    }

    chooseDelivery(no, type) {
        this.pesanan[no - 1].delivery.option = type;
    }

    async getDistance(no) {
        const start_long = this.pesanan[no - 1].pickup.long;
        const start_lat = this.pesanan[no - 1].pickup.lat;
        const end_long = this.pesanan[no - 1].destination.long;
        const end_lat = this.pesanan[no - 1].destination.lat;

        if (start_long && start_lat && end_long && end_lat) {
            try {
                const distance = await getDistance(start_long, start_lat, end_long, end_lat);
                if (distance) this.pesanan[no - 1].distance = distance;
                if (distance > config.max_km_distance) {
                    this.pesanan[no - 1].distance = null;
                    this.pesanan[no - 1].price = null;
                    return config.max_km_distance;
                };
            } catch(err) {}
        }
    }

    getDistanceValue(no) {
        if (this.pesanan[no - 1].distance) {
            return this.pesanan[no - 1].distance;
        }
    }

    getPrice(no) {
        if (this.pesanan[no - 1].distance !== null) {
            const bikePerKm = config.price_per_km.bike;
            const carPerKm = config.price_per_km.car;

            const instantBikeBase = config.min_price.instant.bike;
            const sameDayBikeBase = config.min_price.same_day.bike;

            const instantCarBase = config.min_price.instant.car;
            const sameDayCarBase = config.min_price.same_day.car;

            if (this.pesanan[no - 1].distance < 1) {
                this.pesanan[no - 1].detail_price.instant.bike = instantBikeBase;
                this.pesanan[no - 1].detail_price.instant.car = instantCarBase;
                this.pesanan[no - 1].detail_price.same_day.bike = sameDayBikeBase;
                this.pesanan[no - 1].detail_price.same_day.car = sameDayCarBase;
            } else {
                this.pesanan[no - 1].detail_price.instant.bike = instantBikeBase + Math.round((this.pesanan[no - 1].distance - 1) * bikePerKm / 100) * 100;
                this.pesanan[no - 1].detail_price.instant.car = instantCarBase + Math.round((this.pesanan[no - 1].distance - 1) * carPerKm / 100) * 100;
                this.pesanan[no - 1].detail_price.same_day.bike = sameDayBikeBase + Math.round((this.pesanan[no - 1].distance - 1) * bikePerKm / 100) * 100;
                this.pesanan[no - 1].detail_price.same_day.car = sameDayCarBase + Math.round((this.pesanan[no - 1].distance - 1) * carPerKm / 100) * 100;
            }

            const vehicle = this.pesanan[no - 1].delivery.vehicle || 'bike';
            const deliveryOption = this.pesanan[no - 1].delivery.option;

            if (deliveryOption) {
                const price = this.pesanan[no - 1].detail_price[deliveryOption][vehicle];
                this.pesanan[no - 1].price = price;
                return price;
            }
        }
    }

    getEstPrice(no, type) {
        const vehicle = this.pesanan[no - 1].delivery.vehicle || 'bike';
        return this.pesanan[no - 1].detail_price[type][vehicle];
    }

    getOption(no) {
        return this.pesanan[no - 1].delivery.option;
    }

    getDetailPrice(no) {
        if (this.pesanan[no - 1].distance !== null) return this.pesanan[no - 1].detail_price;
    }

    updateWholePesanan(semuaPesanan) {
        const newOrder = [];
        semuaPesanan.map(function(pesanan, index) {
            const price = pesanan.delivery.option && pesanan.delivery.vehicle ? pesanan.detail_price[pesanan.delivery.option][pesanan.delivery.vehicle] : null;
            newOrder.push({...pesanan, price});
        });
        this.pesanan = newOrder;
    }

    disableTotal() {
        for (const pesanan of this.pesanan) {
            if (!(pesanan.pickup.long && pesanan.pickup.lat && pesanan.pickup.loc && pesanan.destination.long && pesanan.destination.lat && pesanan.destination.loc && pesanan.sender.name && pesanan.sender.phone && pesanan.recipient.name && pesanan.recipient.phone && pesanan.item.size && pesanan.item.weight && pesanan.item.type != null && pesanan.delivery.option && pesanan.delivery.vehicle && pesanan.payment.method != null && pesanan.price)) {
                return true;
            }
        }
        return false;
    }

    async order() {
        let totalOvo = 0;
        let totalMastercard = 0;
        let totalVisa = 0;
        for(const order of this.pesanan) {
            if (order.payment.method === 0) totalOvo += parseInt(order.price);
            if (order.payment.method === 1) totalMastercard += parseInt(order.price);
            if (order.payment.method === 2) totalVisa += parseInt(order.price);
        }
        const error = {};
        try {
            Rekening.Ovo.withdraw(totalOvo);
        } catch(err) {
            error.ovo = true;
        }
        try {
            Rekening.Mastercard.withdraw(totalMastercard);
        } catch(err) {
            error.mastercard = true;
        }
        try {
            Rekening.Visa.withdraw(totalVisa);
        } catch(err) {
            error.visa = true;
        }

        if (!(error.ovo || error.mastercard || error.visa)) {
            const drivers = await generateDriver(this.pesanan.length);
            this.pesanan.forEach((pesanan, index) => {
                const no_resi = generateNoResi();
                const status = generateStatus();
                this.orders.push({...pesanan, status, driver: drivers[index], time: Date.now(), no_resi});
            })
            this.pesanan = [structuredClone(this.format)];
        }
        return error;
    }

    getTwoHistory() {
        return this.orders.slice(0, 2);
    }
}

module.exports = new Pesanan();