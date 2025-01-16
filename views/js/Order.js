class Order {
    constructor() {
        this.order = [{
            penjemputan: {
                long: null,
                lat: null,
                loc: null
            },
            tujuan: {
                long: null,
                lat: null,
                loc: null
            }
        }];
    }

    addOrder() {
        this.order.push({
            penjemputan: {
                long: null,
                lat: null,
                loc: null
            },
            tujuan: {
                long: null,
                lat: null,
                loc: null
            }
        });
    }

    setPenjemputan(i, long, lat, loc) {
        this.order[i - 1].penjemputan = {long, lat, loc};
    }

    setTujuan(i, long, lat, loc) {
        this.order[i - 1].tujuan = {long, lat, loc};
    }
}

export default new Order();