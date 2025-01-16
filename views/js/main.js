const geocoding_api = document.getElementById('geocoding_api').value;
const default_lat = document.getElementById('default_lat').value;
const default_long = document.getElementById('default_long').value;
const timeFormat = document.getElementById('time_format').value;

const pickup_placeholder = document.getElementById('pickup_placeholder').value;
const destination_placeholder = document.getElementById('destination_placeholder').value;
const delivery_option = document.getElementById('delivery_option').value;

let pickup_long = document.getElementById('pickup_long').value;
let pickup_lat = document.getElementById('pickup_lat').value;
let pickup_loc = document.getElementById('pickup_loc').value;

let destination_long = document.getElementById('destination_long').value;
let destination_lat = document.getElementById('destination_lat').value;
let destination_loc = document.getElementById('destination_loc').value;

const kotaDropDown = document.getElementById('kotaDropDown');
const mapsBtn = document.getElementById('maps-button');
const penjemputanContainer = document.getElementById('penjemputan-container');
const penjemputan = document.getElementById('penjemputan');
const swap = document.getElementById('swap');
const tujuanContainer = document.getElementById('tujuan-container');
const tujuan = document.getElementById('tujuan');

const delivery = document.getElementById('delivery-options');
const deliveryIcon = document.getElementById('delivery-icon');
const deliveryText = document.getElementById('delivery-text');
const instant = document.getElementById('instant');
const sameDay = document.getElementById('same-day');
const price = document.getElementById('price');
const pemesananGanda = document.getElementById('pemesanan-ganda');

const currency = document.querySelectorAll('.currency');
const instantPrice = document.getElementById('instant-price');
const sameDayPrice = document.getElementById('same-day-price');

const cari = document.getElementById('cari');
const cariIcon = document.getElementById('cari-icon');
const lokasi_container = document.getElementById('lokasi_container');
const list_lokasi = document.getElementById('list_lokasi');

let tipe_map = 'pickup';
let isChangingLanguage = false;
let isSearching = false;
let isSavingLoc = false;
let isChoosingDelivery = false;
let isWaitingToChooseDelivery = false;
let isValidSwap = false;
let controller;
let deliveryTimeout;
let swapTimeout;
let searchTimeout;

const map = L.map('map', {zoomControl: false}).setView([+default_lat, +default_long], 13);
const marker = L.marker();
const pickupIcon = L.icon({
    iconUrl: '../assets/Pickup Marker.svg',
    iconSize: [40, 40]
});
const destinationIcon = L.icon({
    iconUrl: '../assets/Drop Off.svg',
    iconSize: [40, 40]
});

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

map.on('click', async function(e) {
    try {
        controller && controller.abort();
        controller = new AbortController();
        const signal = controller.signal;

        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${e.latlng.lat}&lon=${e.latlng.lng}&format=json`, {signal});
        const data = await response.json();

        await chooseLoc(data.lon, data.lat, data.display_name);
    } catch(err) {
        if (err.name !== 'AbortError') console.error(err);
    }
});

currency.forEach(function(e) {
    e.textContent = formatToRupiah(e.textContent);
});

penjemputanContainer.addEventListener('click', function() {
    tipe_map = 'pickup';
    cari.placeholder = pickup_placeholder;
    cariIcon.src = './assets/Pickup Large.svg';
    if (pickup_long && pickup_lat) {
        map.setView([pickup_lat, pickup_long], 16);
        marker.setIcon(pickupIcon);
        marker.setLatLng([pickup_lat, pickup_long]);
        marker.addTo(map);

        cari.value = pickup_loc;
    } else {
        cari.value = '';
        map.setView([+default_lat, +default_long], 13);
        marker.remove();
    }
});

tujuanContainer.addEventListener('click', function() {
    tipe_map = 'destination';
    cari.placeholder = destination_placeholder;
    cariIcon.src = './assets/Drop Off.svg';
    if (destination_long && destination_lat) {
        map.setView([destination_lat, destination_long], 16);
        marker.setIcon(destinationIcon);
        marker.setLatLng([destination_lat, destination_long]);
        marker.addTo(map);

        cari.value = destination_loc;
    } else {
        cari.value = '';
        map.setView([+default_lat, +default_long], 13);
        marker.remove();
    }
});

swap.addEventListener('click', function() {
    if (!isSavingLoc && (pickup_loc || destination_loc)) {
        clearTimeout(swapTimeout);
        swapLoc();
        isValidSwap = !isValidSwap;

        swapTimeout = setTimeout(async function() {
            if (isValidSwap) {
                isSavingLoc = true;

                try {
                    controller && controller.abort();
                    controller = new AbortController();
                    const signal = controller.signal;

                    const response = await fetch('/api/pesanan/swap', {
                        signal,
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({no: 1})
                    });
                    const data = await response.json();
                    if (data.price) {
                        pemesananGanda.disabled = false;
                        price.textContent = formatToRupiah(data.price);
                    }
                    if (data.option) {
                        delivery.disabled = false;
                        if (data.option === 'instant') {
                            deliveryIcon.src = './assets/Instant Delivery.png';
                            deliveryText.textContent = 'Instant';
                        } else {
                            deliveryIcon.src = './assets/Same Day Delivery.png';
                            deliveryText.textContent = 'Same Day';
                        }
                    }
                    if (data.instantPrice) instantPrice.textContent = formatToRupiah(data.instantPrice);
                    if (data.sameDayPrice) sameDayPrice.textContent = formatToRupiah(data.sameDayPrice);
                    if (data.max) {
                        delivery.disabled = true;
                        deliveryIcon.src = './assets/Delivery Option.svg';
                        deliveryText.textContent = delivery_option;

                        pemesananGanda.disabled = true;
                        price.textContent = formatToRupiah(0);
                        alert(`Jarak pengiriman maksimal ${data.max} km`);
                    }
                } catch(err) {
                    if (err.name !== 'AbortError') {
                        swapLoc();
                        console.error(err);
                    }
                } finally {
                    isSavingLoc = false;
                    isValidSwap = false;
                }
            }
        }, 1200);
    }
});

instant.addEventListener('click', function() {
    chooseDeliveryOption('instant');
});

sameDay.addEventListener('click', function() {
    chooseDeliveryOption('same_day');
});

cari.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(function() {
        searchKota();
    }, 1200);
});

cari.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        clearTimeout(searchTimeout);
        searchKota();
    }
});

pemesananGanda.addEventListener('click', function() {
    if (!pemesananGanda.disabled) location.href = '/pemesanan-ganda';
});

window.addEventListener('click', function(e) {
    if (!e.target.classList.contains('no-close')) {
        lokasi_container.style.display = 'none';
    }
});

window.addEventListener('beforeunload', function(e) {
    (isChangingLanguage || isSearching || isSavingLoc || isChoosingDelivery || isWaitingToChooseDelivery || isValidSwap) && e.preventDefault();
});

document.querySelectorAll('.custom-time').forEach(e => e.textContent = formatTime(+e.textContent));

function formatTime(time) {
    const date = new Date(time);
    const options = {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    return date.toLocaleString(timeFormat, options);
}

function formatToRupiah(value) {
    if (value == 0) return 'Rp0.000';

    const formattedNumber = Math.floor(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `Rp${formattedNumber}`;
}

async function searchKota() {
    if (!isSearching && cari.value) {
        isSearching = true;
        try {
            controller && controller.abort();
            controller = new AbortController();
            const signal = controller.signal;

            const response = await fetch(`https://us1.locationiq.com/v1/search?key=${geocoding_api}&countrycodes=id&q=${cari.value}&format=json&limit=5&accept-language=id`, {signal});
            const data = await response.json();

            lokasi_container.style.display = 'initial';
            list_lokasi.innerHTML = '';

            if (data.error) {
                list_lokasi.innerHTML = '<span class="w-100 py-2 text-center text-black-50 bg-white no-close">No data</span>'
                throw new Error(data.error)
            };

            data.map(d => list_lokasi.innerHTML += `
                <div onclick="chooseLoc('${d.lon}', '${d.lat}', '${d.display_name}')" class="w-100 p-3 d-flex align-items-center gap-3 text-left bg-white overflow-hidden no-close" style="cursor: pointer">
                    <img src="./assets/POI.svg" alt="Pickup Icon" width="16px" height="16px" class="no-close" />
                    <span class="flex-1 text-truncate no-close">${d.display_name}</span>
                </div>
            `);
        } catch(err) {
            if (err.name !== 'AbortError') console.error(err);
        } finally {
            isSearching = false;
        }
    }
}

async function chooseLoc(long, lat, loc) {
    isSavingLoc = true;
    lokasi_container.style.display = 'none';
    cari.value = loc;

    if (tipe_map === 'pickup') {
        penjemputan.value = loc
        pickup_long = +long;
        pickup_lat = +lat;
        pickup_loc = loc;
    } else {
        tujuan.value = loc
        destination_long = +long;
        destination_lat = +lat;
        destination_loc = loc;
    }

    marker.setIcon(tipe_map === 'pickup' ? pickupIcon : destinationIcon);
    marker.setLatLng([lat, long]);
    marker.addTo(map);
    map.setView([lat, long], 16);

    try {
        controller && controller.abort();
        controller = new AbortController();
        const signal = controller.signal;

        const response = await fetch('/api/pesanan/', {
            signal,
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({long: +long, lat: +lat, loc, type: tipe_map, no: 1})
        });
        const data = await response.json();
        if (data.price) {
            pemesananGanda.disabled = false;
            price.textContent = formatToRupiah(data.price);
        }
        if (data.option) {
            delivery.disabled = false;
            if (data.option === 'instant') {
                deliveryIcon.src = './assets/Instant Delivery.png';
                deliveryText.textContent = 'Instant';
            } else {
                deliveryIcon.src = './assets/Same Day Delivery.png';
                deliveryText.textContent = 'Same Day';
            }
        }
        if (data.instantPrice) instantPrice.textContent = formatToRupiah(data.instantPrice);
        if (data.sameDayPrice) sameDayPrice.textContent = formatToRupiah(data.sameDayPrice);
        if (!data.max && pickup_long && pickup_lat && destination_long && destination_lat) delivery.disabled = false;
        if (data.max) {
            delivery.disabled = true;
            deliveryIcon.src = './assets/Delivery Option.svg';
            deliveryText.textContent = delivery_option;

            pemesananGanda.disabled = true;
            price.textContent = formatToRupiah(0);
            alert(`Jarak pengiriman maksimal ${data.max} km`);
        }
    } catch(err) {
        if (err.name !== 'AbortError') console.error(err);
    } finally {
        isSavingLoc = false;
    }
}

function swapLoc() {
    [pickup_long, destination_long] = [destination_long, pickup_long];
    [pickup_lat, destination_lat] = [destination_lat, pickup_lat];
    [pickup_loc, destination_loc] = [destination_loc, pickup_loc];

    penjemputan.value = pickup_loc;
    tujuan.value = destination_loc;
}

function chooseDeliveryOption(type) {
    instant.disabled = (type === 'instant');
    sameDay.disabled = (type === 'same_day');
    deliveryIcon.src = type === 'instant' ? './assets/Instant Delivery.png' : './assets/Same Day Delivery.png';
    deliveryText.textContent = type === 'instant' ? 'Instant' : 'Same Day';
    price.textContent = type === 'instant' ? instantPrice.textContent : sameDayPrice.textContent;
    pemesananGanda.disabled = false;
    isWaitingToChooseDelivery = true;

    clearTimeout(deliveryTimeout);

    deliveryTimeout = setTimeout(async function() {
        if (!isChoosingDelivery) {
            isChoosingDelivery = true;
            try {
                controller && controller.abort();
                controller = new AbortController();
                const signal = controller.signal;

                const response = await fetch('/api/pesanan/delivery', {
                    signal,
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({no: 1, type})
                });
                const data = await response.json();
                if (data.price) price.textContent = formatToRupiah(data.price);
            } catch(err) {
                if (err.name !== 'AbortError') console.error(err);
            } finally {
                isChoosingDelivery = false;
                isWaitingToChooseDelivery = false;
            }
        }
    }, 1200);
}