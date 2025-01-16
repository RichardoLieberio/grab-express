const geocoding_api = document.getElementById('geocoding_api').value;
const default_lat = document.getElementById('default_lat').value;
const default_long = document.getElementById('default_long').value;
const delivery_option = document.getElementById('delivery_option').value;
const item_type = document.getElementById('item_type').value.split(';;');
const max_weight = document.getElementById('max_weight').value;

const cari = document.getElementById('cari');
const cariIcon = document.getElementById('cari-icon');
const lokasi_container = document.getElementById('lokasi_container');
const list_lokasi = document.getElementById('list_lokasi');

const instant = document.getElementById('instant');
const sameDay = document.getElementById('same-day');
const instantPrice = document.getElementById('instant-price');
const sameDayPrice = document.getElementById('same-day-price');

const stepIndicator = document.getElementById('step-indicator');
const deliveryForm = document.getElementById('delivery-forms');
const lastElement = document.getElementById('last-element');
const priceSummary = document.getElementById('price-summary');
const addDeliveries = document.querySelectorAll('.add-delivery');
const total = document.getElementById('total');
const submitBtn = document.getElementById('submit');

const currency = document.querySelectorAll('.currency');

let no = null;
let tipe_map = 'pickup';
let isAutoSaving = false;
let isChangingLanguage = false;
let isSavingLoc = false;
let isSearching = false;
let isMapLoading = false;
let autosave;
let controller;

rebindUI();

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
    if (!isMapLoading) {
        isMapLoading = true;
        try {
            controller && controller.abort();
            controller = new AbortController();
            const signal = controller.signal;

            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${e.latlng.lat}&lon=${e.latlng.lng}&format=json`, {signal});
            const data = await response.json();

            await chooseLoc(data.lon, data.lat, data.display_name);
        } catch(err) {
            if (err.name !== 'AbortError') console.error(err);
        } finally {
            isMapLoading = false;
        }
    }
});

addDeliveries.forEach(e => e.addEventListener('click', addDelivery));

currency.forEach(function(e) {
    e.textContent = formatToRupiah(e.textContent);
});

cari.addEventListener('change', searchKota);

instant.addEventListener('click', function() {
    chooseDeliveryOption('instant');
});

sameDay.addEventListener('click', function() {
    chooseDeliveryOption('same_day');
});

submitBtn.addEventListener('click', submit);

window.addEventListener('click', function(e) {
    if (!e.target.classList.contains('no-close')) {
        lokasi_container.style.display = 'none';
    }
});

window.addEventListener('beforeunload', function(e) {
    (isAutoSaving || isChangingLanguage || isSavingLoc || isSearching || isMapLoading) && e.preventDefault();
});

function rebindUI() {
    submitBtn.textContent = `${document.getElementById('language_pesan').value} ${document.querySelectorAll('.delivery-section').length} ${document.getElementById('language_pengantaran').value}`;
    document.querySelectorAll('.delivery-section').forEach((e, i) => {
        e.id = i + 1
        e.querySelector('.index').textContent = `${document.getElementById('language_pg_delivery').value} ${i + 1}`
    });
    Array.from(stepIndicator.children).forEach((e, i) => e.textContent = i + 1);
    document.querySelectorAll('.prices').forEach((e, i) => e.textContent = `${document.getElementById('language_pg_delivery').value} ${i + 1}`);

    document.querySelectorAll('.delete-icon').forEach(e => {
        e.classList.remove('d-none');
        e.addEventListener('click', deleteDelivery);
    });
    deliveryForm.childElementCount <= 2 && document.querySelectorAll('.delete-icon').forEach(e => e.classList.add('d-none'));

    document.querySelectorAll('.copy-icon').forEach(e => e.addEventListener('click', copyDelivery));

    document.querySelectorAll('.from').forEach(e => e.addEventListener('click', function(e) {
        const no = getParentsId(e.target.parentElement);
        changeMapSettings(no, 'pickup')
    }));

    document.querySelectorAll('.to').forEach(e => e.addEventListener('click', function(e) {
        const no = getParentsId(e.target.parentElement);
        changeMapSettings(no, 'destination')
    }));

    document.querySelectorAll('.phone').forEach(e => e.addEventListener('input', phoneValidation));
    document.querySelectorAll('.auto-save').forEach(e => e.addEventListener('input', save));
    document.querySelectorAll('.delivery-drawer').forEach(e => e.addEventListener('click', openDeliveryDrawer));
    document.querySelectorAll('.size-button').forEach(e => e.addEventListener('click', changeSize));
    document.querySelectorAll('.weight').forEach(e => e.addEventListener('input', weightValidation));
    document.querySelectorAll('.weight').forEach(e => e.addEventListener('change', weightChecker));
    document.querySelectorAll('.item-type').forEach(e => e.addEventListener('click', changeItemType));
    document.querySelectorAll('.vehicle').forEach(e => e.addEventListener('click', selectVehicle));
    document.querySelectorAll('.payment').forEach(e => e.addEventListener('click', changePayment));
}

function addDelivery() {
    if (document.querySelectorAll('.delivery-section').length >= 10) {
        return alert(document.getElementById('max_order').value);
    }

    submitBtn.disabled = true;
    const index = deliveryForm.childElementCount;
    const section = document.createElement('section');
    section.classList.add('delivery-section', 'p-4', 'bg-white', 'shadow-sm', 'rounded', 'mb-3');
    section.id = index;

    const html = `
        <input class="pickup" type="hidden" value=";;;;;;">
        <input class="destination" type="hidden" value=";;;;;;">
        <input class="instant-bike" type="hidden">
        <input class="sameday-bike" type="hidden">
        <input class="instant-car" type="hidden">
        <input class="sameday-car" type="hidden">
        <input class="delivery-option" type="hidden">
        <input class="distance" type="hidden">
        <input class="price" type="hidden">

        <div class="mb-4 d-flex justify-content-between align-items-center">
            <h5 class="index fw-semi-bold">${document.getElementById('language_pg_delivery').value} ${index}</h5>
            <div class="d-flex align-items-center">
                <button class="delete-icon bg-transparent border-0 d-none" width="16px" height="16px">
                    <img src="./assets/Trash.svg" alt="Trash Icon">
                </button>
                <button class="copy-icon bg-transparent border-0" width="16px" height="16px">
                    <img src="./assets/Copy.svg" alt="Copy Icon">
                </button>
            </div>
        </div>
        <div class="mb-5">
            <label class="mb-4 form-label fw-semibold text-black-50">${document.getElementById('language_pg_route').value}</label>
            <div class="mb-4 d-flex align-items-center gap-2 from filled-map" data-bs-toggle="offcanvas" data-bs-target="#maps" aria-controls="maps">
                <img src="./assets/Pickup Large.svg" alt="Pickup Location" width="24px" height="24px">
                <input type="text" placeholder="${document.getElementById('language_from').value}" class="w-100 p-3 border-0 pickup-loc" style="outline: none; cursor: pointer; background-color: #F6F8FB;" readonly autocomplete="off">
            </div>
            <div class="w-full mb-4 d-flex flex-column gap-2 d-none" style="max-width: 400px; margin-left: 32px;">
                <input type="text" placeholder="${document.getElementById('language_pg_detail_placeholder').value}" class="pickup-detail auto-save py-2 px-3" style="background-color: #F6F8FB; border: none; outline: none; font-size: 14px;">
                <div class="d-flex gap-3">
                    <input type="text" placeholder="${document.getElementById('language_pg_sender_placeholder').value}" class="pickup-name auto-save py-2 px-3" style="flex: 1; background-color: #F6F8FB; border: none; outline: none; font-size: 14px;">
                    <input type="text" placeholder="${document.getElementById('language_pg_no_telp_placeholder').value}" class="phone pickup-phone auto-save py-2 px-3" style="flex: 1; background-color: #F6F8FB; border: none; outline: none; font-size: 14px;">
                </div>
            </div>
            <div class="mb-4 d-flex align-items-center gap-2 to filled-map" data-bs-toggle="offcanvas" data-bs-target="#maps" aria-controls="maps">
                <img src="./assets/Drop Off.svg" alt="Pickup Location" width="24px" height="24px">
                <input type="text" placeholder="${document.getElementById('language_to').value}" class="w-100 p-3 border-0 destination-loc" style="outline: none; cursor: pointer; background-color: #F6F8FB;" readonly autocomplete="off">
            </div>
            <div class="w-full mb-4 d-flex flex-column gap-2 d-none" style="max-width: 400px; margin-left: 32px;">
                <input type="text" placeholder="${document.getElementById('language_pg_detail_placeholder').value}" class="destination-detail auto-save py-2 px-3" style="background-color: #F6F8FB; border: none; outline: none; font-size: 14px;">
                <div class="d-flex gap-3">
                    <input type="text" placeholder="${document.getElementById('language_pg_recipient_placeholder').value}" class="destination-name auto-save py-2 px-3" style="flex: 1; background-color: #F6F8FB; border: none; outline: none; font-size: 14px;">
                    <input type="text" placeholder="${document.getElementById('language_pg_no_telp_placeholder').value}" class="phone destination-phone auto-save py-2 px-3" style="flex: 1; background-color: #F6F8FB; border: none; outline: none; font-size: 14px;">
                </div>
            </div>
        </div>
        <div class="mb-5">
            <label class="mb-3 form-label fw-semibold text-black-50">${document.getElementById('language_pg_detail').value}</label>
            <br>
            <img src="./assets/Small.png" class="d-none" alt="Small" height="148px">
            <div class="d-flex gap-3 mt-3 flex-column-break">
                <div class="d-flex justify-content-evenly" style="flex: 1;">
                    <button class="border-0 size-button" style="width: 48px; height: 48px; border-radius: 50%; outline: none; background-color: #F7F9FC;">S</button>
                    <button class="border-0 size-button" style="width: 48px; height: 48px; border-radius: 50%; outline: none; background-color: #F7F9FC;">M</button>
                    <button class="border-0 size-button" style="width: 48px; height: 48px; border-radius: 50%; outline: none; background-color: #F7F9FC;">L</button>
                </div>
                <div class="p-3 d-flex align-items-center" style="flex: 1; height: 48px; background-color: #F7F9FC;">
                    <input type="number" placeholder="${document.getElementById('language_pg_berat').value}" class="weight auto-save bg-transparent border-0" style="width: 100%; background-color: #F7F9FC; outline: none;">
                    <span class="fw-semibold text-black-50">KG</span>
                </div>
                <button type="button" data-bs-toggle="dropdown" aria-expanded="false" class="py-2 px-3 text-black-50 text-start text-truncate" style="flex: 1; background-color: #F7F9FC; outline: none; border: none;">
                    ${document.getElementById('language_pg_jenis_barang').value}
                </button>
                <ul class="dropdown-menu" style="width: 220px;">
                    <li class="py-2 dropdown-item active-gray item-type" style="cursor: pointer;">${document.getElementById('item_type').value.split(';;')[0]}</li>
                    <li class="py-2 dropdown-item active-gray item-type" style="cursor: pointer;">${document.getElementById('item_type').value.split(';;')[1]}</li>
                    <li class="py-2 dropdown-item active-gray item-type" style="cursor: pointer;">${document.getElementById('item_type').value.split(';;')[2]}</li>
                    <li class="py-2 dropdown-item active-gray item-type" style="cursor: pointer;">${document.getElementById('item_type').value.split(';;')[3]}</li>
                    <li class="py-2 dropdown-item active-gray item-type" style="cursor: pointer;">${document.getElementById('item_type').value.split(';;')[4]}</li>
                    <li class="py-2 dropdown-item active-gray item-type" style="cursor: pointer;">${document.getElementById('item_type').value.split(';;')[5]}</li>
                    <li class="py-2 dropdown-item active-gray item-type" style="cursor: pointer;">${document.getElementById('item_type').value.split(';;')[6]}</li>
                </ul>
            </div>
        </div>
        <div class="mb-5">
            <label class="mb-4 form-label fw-semibold text-black-50">${document.getElementById('language_pg_opsi').value}</label>
            <div class="d-flex gap-3 delivery-option">
                <button type="button" data-bs-toggle="offcanvas" data-bs-target="#delivery-drawer" aria-controls="delivery-drawer" class="delivery-drawer ps-3 d-flex align-items-center gap-2 rounded-3 border-0 disabled-not-allowed disabled-opacity-50" style="height: 64px; background-color: #f8f8f8; cursor: pointer; flex: 1;" disabled>
                    <img class="delivery-icon" src="./assets/Delivery Option.svg" alt="Delivery Option" width="20px" height="20px">
                    <span class="delivery-text">${document.getElementById('language_option').value}</span>
                </button>
                <button type="button" data-bs-toggle="dropdown" aria-expanded="false" class="vehicle-button ps-3 d-flex align-items-center text-start gap-3 rounded-3 border-0 disabled-not-allowed disabled-opacity-50" style="height: 64px; background-color: #f8f8f8; cursor: pointer; width: 300px;" disabled>
                    <img class="vehicle-img" src="./assets/Warning Red.svg" alt="Warning Red" width="20px" height="20px">
                    <span class="vehicle-text">No vehicle selected</span>
                </button>
                <div class="dropdown-menu vehicle-container">
                    <button class="vehicle bike py-2 dropdown-item d-flex align-items-center gap-3 active-gray disabled-opacity-50" style="cursor: pointer;">
                        <img src="./assets/Bike.png" alt="Bike" style="cursor: pointer;" width="32px" height="32px">
                        <div>
                            <p class="p-0 m-0 lh-1" style="cursor: pointer;">Bike</p>
                            <small class="p-0 m-0 lh-1 text-black-50" style="cursor: pointer;">For small items, max 20kg</small>
                        </div>
                    </button>
                    <button class="vehicle car py-2 dropdown-item d-flex align-items-center gap-3 active-gray disabled-opacity-50" style="cursor: pointer;">
                        <img src="./assets/Car.png" alt="Car" style="cursor: pointer;" width="32px" height="32px">
                        <div>
                            <p class="p-0 m-0 lh-1" style="cursor: pointer;">Car</p>
                            <small class="p-0 m-0 lh-1 text-black-50" style="cursor: pointer;">Max 150kg (100&#xd7;100&#xd7;100 cm)</small>
                        </div>
                    </button>
                </div>
            </div>
        </div>
        <div class="mb-5">
            <label class="mb-4 form-label fw-semibold text-black-50">${document.getElementById('language_pg_detail_pembayaran').value}</label>
            <div class="d-flex flex-column gap-3">
                <button type="button" data-bs-toggle="dropdown" aria-expanded="false" class="p-3 payment-button text-black-50 text-start d-flex gap-2 align-items-center" style="width: 220px; background-color: #F7F9FC; outline: none; border: none;">
                    <img src="./assets/Ovo.svg" alt="Ovo" width="22px" height="22px">
                    <span class="text-black currency">${formatToRupiah(document.getElementById('ovo_saldo').value)}</span>
                </button>
                <p class="d-none" style="color: red;">${document.getElementById('language_balance').value}</p>
                <ul class="dropdown-menu payment-container" style="width: 250px;">
                    <li class="py-2 payment dropdown-item d-flex align-items-center gap-3 active-gray s-selected" style="cursor: pointer;">
                        <img src="./assets/Ovo.svg" alt="Ovo" width="22px" height="22px">
                        <span class="text-black currency">${formatToRupiah(document.getElementById('ovo_saldo').value)}</span>
                    </li>
                    <li class="py-2 payment dropdown-item d-flex align-items-center gap-3 active-gray" style="cursor: pointer;">
                        <img src="./assets/Mastercard.svg" alt="Mastercard" width="22px" height="22px">
                        <span class="text-black currency">${formatToRupiah(document.getElementById('mastercard_saldo').value)}</span>
                    </li>
                    <li class="py-2 payment dropdown-item d-flex align-items-center gap-3 active-gray" style="cursor: pointer;">
                        <img src="./assets/Visa.png" alt="Visa" width="22px" height="22px">
                        <span class="text-black currency">${formatToRupiah(document.getElementById('visa_saldo').value)}</span>
                    </li>
                    <li class="py-2 payment dropdown-item d-flex align-items-center gap-3 active-gray" style="cursor: pointer;">
                        <img src="./assets/Cash.svg" alt="Cash" width="22px" height="22px">
                        <span class="text-black">${document.getElementById('language_cash_recipient').value}</span>
                    </li>
                    <li class="py-2 payment dropdown-item d-flex align-items-center gap-3 active-gray" style="cursor: pointer;">
                        <img src="./assets/Cash.svg" alt="Cash" width="22px" height="22px">
                        <span class="text-black">${document.getElementById('language_cash_sender').value}</span>
                    </li>
                </ul>
            </div>
        </div>
    `;
    section.innerHTML = html;

    const totalPrice = document.createElement('div');
    totalPrice.classList.add('d-flex', 'justify-content-between');

    totalPrice.innerHTML = `
    <span class="prices fs-6">${document.getElementById('language_pg_delivery').value} ${index}</span>
    <span class="harga currency fs-6">${formatToRupiah(0)}</span>
    `;

    stepIndicator.innerHTML += `<div class="text-black-50 fw-bold d-flex align-items-center justify-content-center" style="width: 20px; height: 20px;">${stepIndicator.childElementCount += 1}</div>`;
    deliveryForm.insertBefore(section, lastElement);
    priceSummary.appendChild(totalPrice);

    save();
    rebindUI();
}

function deleteDelivery(e) {
    const no = getParentsId(e.target);
    document.getElementById(no).remove();
    stepIndicator.children[no - 1].remove();
    document.querySelectorAll('.prices')[no - 1].parentElement.remove();

    recountTotal();
    save();
    rebindUI();
}

function copyDelivery(e) {
    if (document.querySelectorAll('.delivery-section').length >= 10) {
        return alert(document.getElementById('max_order').value);
    }

    const no = getParentsId(e.target);
    const container = document.getElementById(no);
    const element = container.cloneNode(true)

    const priceElement = priceSummary.children[no - 1];
    const newPrice = priceElement.cloneNode(true)

    container.insertAdjacentElement('afterend', element);
    priceElement.insertAdjacentElement('afterend', newPrice);
    stepIndicator.innerHTML += `<div class="text-black-50 fw-bold d-flex align-items-center justify-content-center" style="width: 20px; height: 20px;">${stepIndicator.childElementCount += 1}</div>`;

    recountTotal();
    save();
    rebindUI();
}

function getParentsId(e) {
    if (e.id) return e.id;
    return getParentsId(e.parentElement);
}

function getChildrenByParentClassName(e, className) {
    if (e.classList.contains(className)) return Array.from(e.children);
    return getChildrenByParentClassName(e.parentElement, className);
}

function getParentByClassName(e, className) {
    if (e.classList.contains(className)) return e;
    return getParentByClassName(e.parentElement, className);
}

function getElementByParentsClassName(e, pClassName, tClassName) {
    if (e.classList.contains(pClassName)) return e.querySelector(`.${tClassName}`);
    return getElementByParentsClassName(e.parentElement, pClassName, tClassName);
}

function changeMapSettings(number, type) {
    const container = document.getElementById(number);
    const value = container.querySelector(`.${type}`).value.split(';;');
    const icon = type === 'pickup' ? pickupIcon : destinationIcon;
    cariIcon.src = type === 'pickup' ? './assets/Pickup Large.svg' : './assets/Drop Off.svg';

    no = number;
    tipe_map = type;

    if (value[0] && value[1] && value[2]) {
        map.setView([+value[1], +value[0]], 16);
        marker.setLatLng([+value[1], +value[0]]);
        marker.setIcon(icon);
        marker.addTo(map);
        cari.value = value[2];
    } else {
        cari.value = '';
        map.setView([+default_lat, +default_long], 13);
        marker.remove();
    }
}

function phoneValidation(e) {
    const value = e.target.value;
    if (isNaN(value[value.length - 1]) || value.length > 13) e.target.value = value.slice(0, -1);
}

function openDeliveryDrawer(e) {
    no = getParentsId(e.target);
    const container = document.getElementById(no);
    const option = container.querySelector('.delivery-option').value;
    const vehicle = container.querySelector('.vehicle.car.s-selected');

    instant.disabled = false;
    sameDay.disabled = false;

    if (option === 'instant') {
        instant.disabled = true;
        sameDay.disabled = false;
    }

    if (option === 'same_day') {
        instant.disabled = false;
        sameDay.disabled = true;
    }

    if (vehicle) {
        const instantValue = container.querySelector('.instant-car').value;
        const sameDayValue = container.querySelector('.sameday-car').value;
        instantPrice.textContent = formatToRupiah(instantValue);
        sameDayPrice.textContent = formatToRupiah(sameDayValue);
    } else {
        const instantValue = container.querySelector('.instant-bike').value;
        const sameDayValue = container.querySelector('.sameday-bike').value;
        instantPrice.textContent = formatToRupiah(instantValue);
        sameDayPrice.textContent = formatToRupiah(sameDayValue);
    }

}

function changeSize(e) {
    const element = e.target;
    const children = Array.from(element.parentElement.children);
    const image = element.parentElement.parentElement.previousElementSibling;
    const imagesPath = ['./assets/Small.png', './assets/Medium.png', './assets/Large.png'];
    const size = children.indexOf(element);

    children.forEach(b => b.classList.remove('size-selected'));
    element.classList.add('size-selected');
    image.src = imagesPath[size];
    image.classList.remove('d-none');

    const container = document.getElementById(getParentsId(element));
    const bike = container.querySelector('.bike');
    const car = container.querySelector('.car');

    bike.disabled = size === 2 ? true : false;

    if (size === 2) {
        bike.disabled = true;
        if (bike.classList.contains('s-selected')) {
            const button = container.querySelector('.vehicle-button');
            if (!button.disabled) button.innerHTML = car.innerHTML;
            bike.classList.remove('s-selected');
            car.classList.add('s-selected');
        }
    } else if (size == 0 || size == 1) {
        const weight = container.querySelector('.weight').value || 0;
        bike.disabled = +weight > 20 ? true : false;
    }

    setPrice(getParentsId(element));
    save();
}

function weightValidation(e) {
    const value = e.target.value;
    if (isNaN(value[value.length - 1])) e.target.value = value.slice(0, -1)
    else if (+value > max_weight) e.target.value = max_weight
    else if (+value < 0) e.target.value = 0;
}

function weightChecker(e) {
    const container = document.getElementById(getParentsId(e.target));
    const button = container.querySelector('.vehicle-button');
    const bike = container.querySelector('.bike');
    const car = container.querySelector('.car');
    if (+e.target.value > 20) {
        bike.disabled = true;

        if (bike.classList.contains('s-selected')) {
            if (!button.disabled) button.innerHTML = car.innerHTML;
            bike.classList.remove('s-selected');
            car.classList.add('s-selected');
        }
    } else {
        const sizeButton = Array.from(container.querySelectorAll('.size-button'));
        const size = sizeButton.indexOf(container.querySelector('.size-button.size-selected'));
        if (size == 0 || size == 1) {
            bike.disabled = false;
        }
    }

    setPrice(getParentsId(e.target));
}

function optionEnable(max) {
    const container = document.getElementById(no);
    const pickup = container.querySelector('.pickup').value.split(';;');
    const destination = container.querySelector('.destination').value.split(';;');

    if (max) {
        const delivery = container.querySelector('.delivery-drawer');
        const deliveryIcon = container.querySelector('.delivery-icon');
        const deliveryText = container.querySelector('.delivery-text');

        delivery.disabled = true;
        deliveryIcon.src = './assets/Delivery Option.svg';
        deliveryText.textContent = delivery_option;

        const vehicle = container.querySelector('.vehicle-button');
        vehicle.disabled = true;
        vehicle.innerHTML = `
            <img class="vehicle-img" src="./assets/Warning Red.svg" alt="Warning Red" width="20px" height="20px">
            <span class="vehicle-text">No vehicle selected</span>
        `;

        alert(`Jarak pengiriman maksimal ${max} km`)
    } else if (pickup[0] && pickup[1] && pickup[2] && destination[0] && destination[1] && destination[2]) {
        const deliveryOption = container.querySelector('.delivery-option').value;
        deliveryOption && chooseDeliveryOption(deliveryOption);
        container.querySelector('.delivery-drawer').disabled = false;
    }
}

function changeItemType(e) {
    const element = e.target;
    const children = Array.from(element.parentElement.children);
    const text = element.parentElement.previousElementSibling;

    children.forEach(b => b.classList.remove('s-selected'));
    element.classList.add('s-selected');
    text.innerHTML = `<span class="text-black">${item_type[children.indexOf(element)]}</span>`;

    save();
}

function selectVehicle(e) {
    const element = e.target;
    if (!element.classList.contains('s-selected')) {
        const children = getChildrenByParentClassName(element, 'vehicle-container');
        children.forEach(es => es.classList.remove('s-selected'));

        const parent = getParentByClassName(element, 'vehicle');
        parent.classList.add('s-selected');

        const button = getElementByParentsClassName(element, 'delivery-option', 'vehicle-button');
        button.innerHTML = parent.innerHTML;

        setPrice(getParentsId(e.target));
        save();
    }
}

function changePayment(e) {
    const no = getParentsId(e.target);
    const container = document.getElementById(no);
    const parent = getParentByClassName(e.target, 'payment');
    const button = container.querySelector('.payment-button');
    const siblings = getChildrenByParentClassName(e.target, 'payment-container');

    siblings.forEach(element => element.classList.remove('s-selected'));
    parent.classList.add('s-selected');
    button.classList.remove('border-error');
    button.innerHTML = parent.innerHTML;

    save();
}

function setPrice(nom = false) {
    const index = nom || no;
    const container = document.getElementById(index);
    const pickup = container.querySelector('.pickup').value.split(';;')
    const destination = container.querySelector('.pickup').value.split(';;')
    const option = container.querySelector('.delivery-option').value;
    const vehicle = container.querySelector('.vehicle.s-selected.bike') ? 'bike' : container.querySelector('.vehicle.s-selected.car') ? 'car' : null;

    if (pickup[0] && pickup[1] && pickup[2] && destination[0] && destination[1] && destination[2] && option && vehicle) {
        const price = container.querySelector(`.${option === 'same_day' ? 'sameday' : 'instant'}-${vehicle}`).value;
        container.querySelector('.price').value = price;
        document.querySelectorAll('.harga')[index - 1].textContent = formatToRupiah(price);
        recountTotal();
    }
}

function recountTotal() {
    let price = 0;
    document.querySelectorAll('.delivery-section').forEach(e => price += parseInt(e.querySelector('.price').value || 0));
    total.textContent = formatToRupiah(price);
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

    const container = document.getElementById(no);
    const hiddenInput = container.querySelector(`.${tipe_map}`);
    const input = container.querySelector(`.${tipe_map}-loc`);

    hiddenInput.value = `${long};;${lat};;${loc};;${hiddenInput.value.split(';;')[3]}`;
    input.value = loc;

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
            body: JSON.stringify({long: +long, lat: +lat, loc, type: tipe_map, no})
        });
        const data = await response.json();

        optionEnable(data.max);
        if (data.detailPrice) {
            container.querySelector('.instant-bike').value = data.detailPrice.instant.bike;
            container.querySelector('.instant-car').value = data.detailPrice.instant.car;
            container.querySelector('.sameday-bike').value = data.detailPrice.same_day.bike;
            container.querySelector('.sameday-car').value = data.detailPrice.same_day.car;
        }
        if (data.distance) {
            container.querySelector('.distance').value = data.distance;
        }

        setPrice();
        save();
    } catch(err) {
        if (err.name !== 'AbortError') console.error(err);
    } finally {
        isSavingLoc = false;
    }
}

function chooseDeliveryOption(type) {
    const container = document.getElementById(no);
    const deliveryOption = container.querySelector('.delivery-option');
    const vehicle = container.querySelector('.vehicle.s-selected');
    deliveryIcon = container.querySelector('.delivery-icon');
    deliveryText = container.querySelector('.delivery-text');

    deliveryOption.value = type;
    instant.disabled = (type === 'instant');
    sameDay.disabled = (type === 'same_day');

    deliveryIcon.src = type === 'instant' ? './assets/Instant Delivery.png' : './assets/Same Day Delivery.png';
    deliveryText.textContent = type === 'instant' ? 'Instant' : 'Same Day';

    container.querySelector('.vehicle-button').disabled = false;
    if (vehicle) {
        container.querySelectorAll('.vehicle').forEach(e => e.classList.remove('s-selected'));
        vehicle.classList.add('s-selected');
        container.querySelector('.vehicle-button').innerHTML = vehicle.innerHTML;
    }

    setPrice();
    save();
}

function save() {
    isAutoSaving = true;
    submitBtn.disabled = true;
    clearTimeout(autosave);
    autosave = setTimeout(async function() {
        const data = [];
        const allDelivery = document.querySelectorAll('.delivery-section');
        let disabled = false;
        allDelivery.forEach(delivery => {
            const pickup = delivery.querySelector('.pickup').value.split(';;');
            const destination = delivery.querySelector('.destination').value.split(';;');
            const sizeButton = Array.from(delivery.querySelectorAll('.size-button'));
            const size = sizeButton.indexOf(delivery.querySelector('.size-button.size-selected'));
            const typeButton = Array.from(delivery.querySelectorAll('.item-type'));
            const type = typeButton.indexOf(delivery.querySelector('.item-type.s-selected'));
            const paymentButton = Array.from(delivery.querySelectorAll('.payment'));
            const payment = paymentButton.indexOf(delivery.querySelector('.payment.s-selected'));

            const pickup_long = pickup[0] || null;
            const pickup_lat = pickup[1] || null;
            const pickup_loc = pickup[2] || null;
            const pickup_detail = delivery.querySelector('.pickup-detail').value || null;
            const destination_long = destination[0] || null;
            const destination_lat = destination[1] || null;
            const destination_loc = destination[2] || null;
            const destination_detail = delivery.querySelector('.destination-detail').value || null;
            const sender_name = delivery.querySelector('.pickup-name').value || null;
            const sender_phone = delivery.querySelector('.pickup-phone').value || null;
            const recipient_name = delivery.querySelector('.destination-name').value || null;
            const recipient_phone = delivery.querySelector('.destination-phone').value || null;
            const item_size = size == 0 ? 's' : size == 1 ? 'm' : size == 2 ? 'l' : null;
            const item_weight = delivery.querySelector('.weight').value || null;
            const item_type = type;
            const delivery_option = delivery.querySelector('.delivery-option').value || null;
            const delivery_vehicle = delivery.querySelector('.vehicle.s-selected.bike') ? 'bike' : delivery.querySelector('.vehicle.s-selected.car') ? 'car' : null;
            const payment_method = payment;
            const distance = delivery.querySelector('.distance').value || null;
            const instant_bike = delivery.querySelector('.instant-bike').value || null;
            const instant_car = delivery.querySelector('.instant-car').value || null;
            const sameday_bike = delivery.querySelector('.sameday-bike').value || null;
            const sameday_car = delivery.querySelector('.sameday-car').value || null;
            const price = delivery.querySelector('.price').value || null;

            if (!(pickup_long && pickup_lat && pickup_loc && destination_long && destination_lat && destination_loc && sender_name && sender_phone && recipient_name && recipient_phone && item_size && item_weight && item_type !== null && delivery_option && delivery_vehicle && payment_method !== null && distance && instant_bike && instant_car && sameday_bike && sameday_car && price)) {
                disabled = true;
            }

            const d = {
                pickup: {
                    long: pickup_long,
                    lat: pickup_lat,
                    loc: pickup_loc,
                    detail: pickup_detail
                },
                destination: {
                    long: destination_long,
                    lat: destination_lat,
                    loc: destination_loc,
                    detail: destination_detail
                },
                sender: {
                    name: sender_name,
                    phone: sender_phone
                },
                recipient: {
                    name: recipient_name,
                    phone: recipient_phone
                },
                item: {
                    size: item_size,
                    weight: item_weight,
                    type: item_type
                },
                delivery: {
                    option: delivery_option,
                    vehicle: delivery_vehicle,
                },
                payment: {
                    method: payment_method,
                    discount: null
                },
                distance: distance,
                detail_price: {
                    instant: {
                        bike: instant_bike,
                        car: instant_car
                    },
                    same_day: {
                        bike: sameday_bike,
                        car: sameday_car
                    }
                },
                price: price
            }
            data.push(d);
        });
        submitBtn.disabled = disabled;
        try {
            await fetch('/api/pesanan', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
        } catch(err) {
            console.error(err);
        } finally {
            isAutoSaving = false;
        }

    }, 2000);
}

async function submit() {
    const disabledElement = [];
    document.querySelectorAll('input').forEach(e => {
        e.disabled = true;
        disabledElement.push(e);
    });
    document.querySelectorAll('button').forEach(e => {
        e.disabled = true;
        disabledElement.push(e);
    });

    try {
        const response = await fetch('/api/pesanan', {
            method: 'POST'
        });
        const data = await response.json();
        if (data.error.ovo || data.error.mastercard || data.error.visa) {
            document.querySelectorAll('.delivery-section').forEach(e => {
                const method = Array.from(e.querySelectorAll('.payment')).indexOf(e.querySelector('.payment.s-selected'));
                if ((data.error.ovo && method === 0) || (data.error.mastercard && method === 1) || (data.error.visa && method === 2)) {
                    e.querySelector('.payment-button').classList.add('border-error');
                }
            });
            alert(document.getElementById('language_balance').value);
        } else {
            location.href = '/pemesanan';
        }
    } catch(err) {
        console.error(err);
    } finally {
        disabledElement.forEach(e => e.disabled = false);
    }
}