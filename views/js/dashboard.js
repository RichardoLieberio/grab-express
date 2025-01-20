const socket = io();

const timeFormat = document.getElementById('time_format').value;
const listStatus = document.getElementById('status').value.split(';;');
const allSize = document.getElementById('all_size').value.split(';;');
const allType = document.getElementById('all_type').value.split(';;');
const cash = document.getElementById('cash').value.split(';;');

const history = document.getElementById('history');
const filterBtn = document.getElementById('filter-button');
const filter = document.querySelectorAll('.filter');
const noData = document.getElementById('no-data');
const detail = document.getElementById('detail');

const noResi = document.getElementById('no_resi');
const icon = document.getElementById('icon');
const statusText = document.getElementById('status-text');
const time = document.getElementById('time');
const driverProfile = document.getElementById('driver-profile');
const driverName = document.getElementById('driver-name');
const driverPlat = document.getElementById('driver-plat');
const driverRating = document.getElementById('driver-rating');
const resi = document.getElementById('resi');
const alamatPengirim = document.getElementById('alamat-pengirim');
const alamatPenerima = document.getElementById('alamat-penerima');
const catatanPengirim = document.getElementById('catatan-pengirim');
const namaPengirim = document.getElementById('nama-pengirim');
const nomorPengirim = document.getElementById('nomor-pengirim');
const catatanPenerima = document.getElementById('catatan-penerima');
const namaPenerima = document.getElementById('nama-penerima');
const nomorPenerima = document.getElementById('nomor-penerima');
const size = document.getElementById('size');
const weight = document.getElementById('weight');
const type = document.getElementById('type');
const paymentImage = document.getElementById('payment-image');
const paymentMethod = document.getElementById('payment-method');
const paymentAmount = document.getElementById('payment-amount');

const approve = document.getElementById('approve');

let rawData = [];

const map = L.map('map', {zoomControl: false}).setView([3.5935493434311967, 98.66648694451999], 13);

const pickupMarker = L.marker();
const pickupIcon = L.icon({
    iconUrl: '../assets/Pickup Marker.svg',
    iconSize: [40, 40]
});
pickupMarker.setIcon(pickupIcon);

const destinationMarker = L.marker();
const destinationIcon = L.icon({
    iconUrl: '../assets/Drop Off.svg',
    iconSize: [40, 40]
});
destinationMarker.setIcon(destinationIcon);

const routing = L.Routing.control({
    createMarker: () => null, // Disable markers on the route
    showAlternatives: false,  // Disable alternative routes
    directions: false, // Disable step-by-step directions text
    routeWhileDragging: false, // Disable dragging the route
    draggable: false, // Disable route dragging
    lineOptions: {
        styles: [{ color: '#00b14f', weight: 5, opacity: 0.7 }], // Style the route line
        addWaypoints: false
    },
    // Add a custom 'edit' handler to ensure no drag events
    editOptions: {
        draggable: false // Disable any interactive dragging/editing
    }
}).addTo(map);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

getData();

detail.addEventListener('shown.bs.modal', function() {
    map.invalidateSize();
});

filter.forEach(element => element.addEventListener('click', function(e) {
    filter.forEach(ee => ee.classList.remove('s-selected'));
    e.target.classList.add('s-selected');

    const status = Array.from(filter).indexOf(e.target);
    filterBtn.textContent = listStatus[status];
    rerenderHistory(status);
}));

approve.addEventListener('click', async function(e) {
    const response = await fetch('/api/pesanan/approve/' + noResi.value, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'}
    });
    const result = await response.json();
    if (!result.success) {
        alert(result.message);
    }
});

async function getData() {
    const response = await fetch('/api/pesanan/orders');
    const result = await response.json();
    if (result.status === 200) {
        rawData = result.data;
        generateHistory(result.data);
    } else {
        alert(result.message);
    }
}

function rerenderHistory(status) {
    if (status === 0) return generateHistory(rawData);
    const data = rawData.filter(d => d.status == status - 1);
    generateHistory(data);
}

function generateHistory(data) {
    history.innerHTML = '';
    if (data.length) {
        noData.classList.add('d-none');
        data.forEach((d, i) => {
            const row = createRow(d, i);
            history.innerHTML += row;
        });
    } else {
        noData.classList.remove('d-none');
    }

    rebindUI();
}

function createRow(data, i) {
    return `
        <div id="${i}" class="history-row py-4 gap-4 d-flex text-start row-hover" type="button" data-bs-toggle="modal" data-bs-target="#detail">
            <div style="flex: 1; padding-left: 24px;">${data.sender_name}</div>
            <div class="hide-breakpoint" style="flex: 1;">${data.recipient_name}</div>
            <div style="flex: 1;">${data.pickup_loc}</div>
            <div style="flex: 1;">${data.destination_loc}</div>
            <div style="flex: 1;">${formatToRupiah(data.price)}</div>
            <div class="hide-breakpoint" style="flex: 1;">${data.distance} km</div>
        </div>
    `;
}

function rebindUI() {
    document.querySelectorAll('.history-row').forEach(e => e.addEventListener('click', changeMap));
}

function formatToRupiah(value) {
    if (value == 0) return 'Rp0.000';

    const formattedNumber = Math.floor(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `Rp${formattedNumber}`;
}

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

function getParentId(e) {
    if (e.id) return e.id;
    return getParentId(e.parentElement);
}

function changeMap(e) {
    const index = getParentId(e.target);
    const data = rawData[index];
    changeMapSetting(index);

    icon.src = './assets/Info.png';
    statusText.textContent = listStatus[5];
    approve.classList.remove('d-none');
    driverProfile.classList.add('d-none');

    statusText.textContent = listStatus[data.status + 1];
    time.textContent = formatTime(data.created_at);

    noResi.value = data.no_resi;
    resi.textContent = data.no_resi;
    alamatPengirim.textContent = data.pickup_loc;
    alamatPenerima.textContent = data.destination_loc;

    catatanPengirim.textContent = data.pickup_detail || '-';
    namaPengirim.textContent = data.sender_name;
    nomorPengirim.textContent = `(${data.sender_phone})`;

    catatanPenerima.textContent = data.destination_detail || '-';
    namaPenerima.textContent = data.recipient_name;
    nomorPenerima.textContent = `(${data.recipient_phone})`;

    size.textContent = data.item_size === 's' ? allSize[0] : data.item_size === 'm' ? allSize[1] : allSize[2];
    weight.textContent = data.item_weight;
    type.textContent = allType[data.item_type];

    paymentImage.src = './assets/' + data.payment_path;
    paymentImage.alt = data.payment_name;
    paymentMethod.textContent = data.payment_name === 'Recipient' ? cash[1] : data.payment_name === 'Sender' ? cash[0] : data.payment_name;
    paymentAmount.textContent = formatToRupiah(data.price);
}

function changeMapSetting(index) {
    const data = rawData[index];

    pickupMarker.setLatLng([+data.pickup_lat, +data.pickup_long]);
    pickupMarker.addTo(map);
    destinationMarker.setLatLng([+data.destination_lat, +data.destination_long]);
    destinationMarker.addTo(map);

    routing.setWaypoints([
        L.latLng(+data.pickup_lat, +data.pickup_long),
        L.latLng(+data.destination_lat, +data.destination_long)
    ]);

    const bounds = L.latLngBounds(
        L.latLng(+data.pickup_lat, +data.pickup_long),
        L.latLng(+data.destination_lat, +data.destination_long)
    );

    map.fitBounds(bounds, {padding: [50, 50]});
}

socket.on('new_order', getData);
socket.on('order_cancel', function(data) {
    rawData = rawData.filter(d => d.no_resi !== data.no_resi);
    generateHistory(rawData);
    if (noResi.value === data.no_resi) {
        icon.src = './assets/Error.png';
        statusText.textContent = listStatus[2];
        approve.classList.add('d-none');
    }
});
socket.on('order_approved', function(data) {
    rawData = rawData.filter(d => d.no_resi !== data.no_resi);
    generateHistory(rawData);
    if (noResi.value === data.no_resi) {
        icon.src = './assets/Success.png';
        statusText.textContent = listStatus[1];
        approve.classList.add('d-none');

        driverProfile.classList.remove('d-none');
        driverName.textContent = data.driver.name;
        driverPlat.textContent = data.driver.plat;
        driverRating.textContent = data.driver.rating;
    }
});