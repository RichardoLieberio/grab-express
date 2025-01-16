async function getDistance(start_long, start_lat, end_long, end_lat) {
    try {
        const response = await fetch(`http://router.project-osrm.org/route/v1/driving/${start_long},${start_lat};${end_long},${end_lat}?overview=false`);
        const data = await response.json();
        return (data.routes[0].distance / 1000).toFixed(2);
    } catch(err) {
        return null;
    }
}

module.exports = getDistance;