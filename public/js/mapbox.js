/* eslint-disable */

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoicmxtMDIwNCIsImEiOiJjbGk4czBudWEwMm16M2VwcWl5c2JydmE2In0.wImFOaNVe8BuFAJgJqEM1w';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/rlm0204/cli8t2tvb02s601pnfla71cdu',
    zoom: 6,
  });

  const bounds = new mapboxgl.LngLatBounds();
  locations.forEach((loc) => {
    // console.log(loc)
    // Create Marker
    const el = document.createElement('div');
    el.className = 'marker';
    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add pop up

    new mapboxgl.Popup({ offset: 30 })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extends map bound to include current location

    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: { top: 200, bottom: 150, left: 100, right: 100 },
  });
};
