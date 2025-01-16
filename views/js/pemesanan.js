const timeFormat = document.getElementById('time_format').value;
const listStatus = document.getElementById('status').value.split(';;');
const allSize = document.getElementById('all_size').value.split(';;');
const allType = document.getElementById('all_type').value.split(';;');

const history = document.getElementById('history');
const filterBtn = document.getElementById('filter-button');
const filter = document.querySelectorAll('.filter');
const noData = document.getElementById('no-data');
const detail = document.getElementById('detail');

const statusIcon = document.getElementById('status-icon');
const statusText = document.getElementById('status-text');
const time = document.getElementById('time');
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

let rawData;

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

async function getData() {
    const response = await fetch('/api/pesanan');
    const {data} = await response.json();
    rawData = data;
    generateHistory(data);
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
    const time = formatTime(data.time);
    const option = data.delivery.option === 'same_day' ? 'Same Day' : 'Instant';
    const vehicle = data.delivery.vehicle === 'car' ? 'Car' : 'Bike';

    return `
        <div id="${i}" class="history-row py-4 gap-4 d-flex text-start row-hover" type="button" data-bs-toggle="modal" data-bs-target="#detail">
            <div style="flex: 1; padding-left: 24px;">${time}</div>
            <div style="flex: 1;">${data.sender.name}</div>
            <div style="flex: 1;">${data.recipient.name}</div>
            <div class="hide-breakpoint" style="flex: 1;">${option} - ${vehicle}</div>
            <div style="flex: 1;">${formatToRupiah(data.price)}</div>
            <div class="hide-breakpoint" style="flex: 1;">
                <span class="py-1 px-2 status-${data.status}">${listStatus[data.status + 1]}</span>
            </div>
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

    const iconPath = ['./assets/Success.png', './assets/Error.png', './assets/Warning.png', './assets/Info.png'];
    statusIcon.src = iconPath[data.status];
    statusText.textContent = listStatus[data.status + 1];
    time.textContent = formatTime(data.time);

    driverName.textContent = data.driver.nama;
    driverPlat.textContent = data.driver.plat;
    driverRating.textContent = data.driver.rating;

    resi.textContent = data.no_resi;
    alamatPengirim.textContent = data.pickup.loc;
    alamatPenerima.textContent = data.destination.loc;

    catatanPengirim.textContent = data.pickup.detail || '-';
    namaPengirim.textContent = data.sender.name;
    nomorPengirim.textContent = `(${data.sender.phone})`;

    catatanPenerima.textContent = data.destination.detail || '-';
    namaPenerima.textContent = data.recipient.name;
    nomorPenerima.textContent = `(${data.recipient.phone})`;

    size.textContent = data.item.size === 's' ? allSize[0] : data.item.size === 'm' ? allSize[1] : allSize[2];
    weight.textContent = data.item.weight;
    type.textContent = allType[data.item.type];
}

function changeMapSetting(index) {
    const pickup = rawData[index].pickup;
    const destination = rawData[index].destination;

    pickupMarker.setLatLng([+pickup.lat, +pickup.long]);
    pickupMarker.addTo(map);
    destinationMarker.setLatLng([+destination.lat, +destination.long]);
    destinationMarker.addTo(map);

    routing.setWaypoints([
        L.latLng(+pickup.lat, +pickup.long),
        L.latLng(+destination.lat, +destination.long)
    ]);

    const bounds = L.latLngBounds(
        L.latLng(+pickup.lat, +pickup.long),
        L.latLng(+destination.lat, +destination.long)
    );

    map.fitBounds(bounds, {padding: [50, 50]});
}