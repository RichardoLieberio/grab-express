const {db} = require('../models/database');

const config = require('../config');
const getDistance = require('../services/getDistance');
const generateDriver = require('../services/generateDriver');
const generateNoResi = require('../services/generateNoResi');
const generateStatus = require('../services/generateStatus');

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

    async order(user_id) {
        return new Promise((resolve, reject) => {
            const total = [{total: 0}, {total: 0}, {total: 0}, {total: null}, {total: null}];

            for(const order of this.pesanan) {
                if (order.payment.method !== 3 && order.payment.method !== 4) {
                    total[order.payment.method].total += parseInt(order.price);
                }
            }

            const error = {};
            const query = `
                SELECT user_payments.id, user_payments.amount, user_payments.payment_id, payments.name
                FROM user_payments
                JOIN payments ON user_payments.payment_id = payments.id
                WHERE user_payments.user_id = ?
            `;

            db.query(query, [user_id], (err, results) => {
                if (err) {
                    console.error(err);
                    return resolve(500);
                }

                results.forEach((result) => {
                    total[result.payment_id - 1].id = result.id;
                    if (total[result.payment_id - 1].total !== null) {
                        total[result.payment_id - 1].total = result.amount - total[result.payment_id - 1].total;
                        if (total[result.payment_id - 1].total < 0) error[result.name.toLowerCase()] = true;
                    }
                });

                if (!Object.keys(error).length) {
                    total.forEach(({id, total}) => {
                        if (total !== null) {
                            db.query('UPDATE user_payments SET amount = ? WHERE id = ?' , [total, id], (err, _) => {
                                if (err) console.error(err);
                            });
                        }
                    });

                    const details = `
                        INSERT INTO order_details
                            (pickup_lat, pickup_long, pickup_loc, pickup_detail, destination_lat, destination_long, destination_loc, destination_detail, sender_name, sender_phone, recipient_name, recipient_phone)
                            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    const orders = `
                        INSERT INTO orders
                            (no_resi, user_id, user_payment_id, order_detail_id, item_size, item_weight, item_type, delivery_option, delivery_vehicle, distance, price)
                            values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;

                    let completed = 0;
                    const datas = [];

                    this.pesanan.forEach((pesanan) => {
                        const data = [
                            pesanan.pickup.lat, pesanan.pickup.long, pesanan.pickup.loc, pesanan.pickup.detail,
                            pesanan.destination.lat, pesanan.destination.long, pesanan.destination.loc, pesanan.destination.detail,
                            pesanan.sender.name, pesanan.sender.phone, pesanan.recipient.name, pesanan.recipient.phone,
                        ];
                        db.query(details, data, (err, result) => {
                            if (err) {
                                console.error(err);
                            } else {
                                const no_resi = generateNoResi();
                                datas.push(no_resi);
                                const data = [
                                    no_resi, user_id, total[pesanan.payment.method].id, result.insertId,
                                    pesanan.item.size, pesanan.item.weight, pesanan.item.type,
                                    pesanan.delivery.option, pesanan.delivery.vehicle,
                                    pesanan.distance, pesanan.price
                                ];
                                db.query(orders, data, (err) => {
                                    if (err) {
                                        console.error(err);
                                    } else if (++completed === this.pesanan.length) {
                                        this.clearPesanan();
                                        resolve({success: true, data: datas});
                                    }
                                });
                            }
                        });
                    });
                } else {
                    this.clearPesanan();
                    resolve({success: false, error});
                }

            });
        });
    }

    clearPesanan() {
        this.pesanan = [structuredClone(this.format)];
    }
}

module.exports = new Pesanan();