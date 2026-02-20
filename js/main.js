mapboxgl.accessToken = 'pk.eyJ1IjoibmFsMTIiLCJhIjoiY21reXBkYmxtMDltbDNyb2NmcjZpaDdvdiJ9.ZX7GLNtaTYyTjLOhx4ITqg';

// Creates the map object centered on the continental US
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [-96, 38],
  zoom: 3.5
});

// Adds zoom and rotation controls to top right
map.addControl(new mapboxgl.NavigationControl(), 'top-right');

const ROW_OVERALL    = 1;  // All households
const ROW_WHITE      = 3;  // White
const ROW_BLACK      = 4;  // Black or African American
const ROW_ASIAN      = 6;  // Asian
const ROW_HISPANIC   = 10; // Hispanic or Latino
const ROW_AGE_15_24  = 13; // Age 15-24
const ROW_AGE_25_44  = 14; // Age 25-44
const ROW_AGE_45_64  = 15; // Age 45-64
const ROW_AGE_65PLUS = 16; // Age 65 and over

// Will store parsed income data for all states
let stateData = {};

// Charts references so we can update them later
let barChart, raceChart, ageChart;

// Converts Census dollar strings like "66,659" to integers like 66659
function parseDollar(str) {
  if (!str || str.trim() === '' || str.trim() === 'N') return 0;
  return parseInt(str.replace(/,/g, '').replace(/\+/g, '').trim()) || 0;
}

d3.csv('data/ACSST1Y2024.S1903-2026-02-19T050443.csv').then(function(rawRows) {

  // Extract all state names from the column headers
  const headers = Object.keys(rawRows[0]);
  const states = new Set();
  headers.forEach(h => {
    const match = h.match(/^([^!]+)!!Median income \(dollars\)!!Estimate$/);
    if (match) states.add(match[1]);
  });

  // For each state, we extract income values for all demographic groups
  states.forEach(state => {
    const col = state + '!!Median income (dollars)!!Estimate';
    stateData[state] = {
      overall:   parseDollar(rawRows[ROW_OVERALL][col]),
      white:     parseDollar(rawRows[ROW_WHITE][col]),
      black:     parseDollar(rawRows[ROW_BLACK][col]),
      asian:     parseDollar(rawRows[ROW_ASIAN][col]),
      hispanic:  parseDollar(rawRows[ROW_HISPANIC][col]),
      age15_24:  parseDollar(rawRows[ROW_AGE_15_24][col]),
      age25_44:  parseDollar(rawRows[ROW_AGE_25_44][col]),
      age45_64:  parseDollar(rawRows[ROW_AGE_45_64][col]),
      age65plus: parseDollar(rawRows[ROW_AGE_65PLUS][col])
    };
  });

  initCharts();
  initMap();

}).catch(err => console.error('CSV error:', err));

// Build all three C3 charts on page load
function initCharts() {

  // Get top 8 states by overall income for the initial bar chart view
  const allStates = Object.entries(stateData)
    .filter(([k]) => k !== 'Puerto Rico')
    .sort((a, b) => b[1].overall - a[1].overall)
    .slice(0, 8);

  // Bar chart: top states by median income (updates as user pans/zooms)
  barChart = c3.generate({
    bindto: '#bar-chart',
    data: {
      x: 'x',
      columns: [
        ['x', ...allStates.map(d => d[0])],
        ['Income', ...allStates.map(d => d[1].overall)]
      ],
      type: 'bar',
      colors: { Income: '#4fc3c3' }
    },
    bar: { width: { ratio: 0.6 } },
    axis: {
      x: { type: 'category', tick: { rotate: -35, multiline: false }, height: 50 },
      y: { tick: { format: d => '$' + (d/1000).toFixed(0) + 'k' }, min: 40000, padding: { bottom: 0 } }
    },
    legend: { show: false },
    padding: { right: 20 }
  });

  // Race chart: income by race for a clicked state (starts off empty)
  raceChart = c3.generate({
    bindto: '#race-chart',
    data: {
      x: 'x',
      columns: [
        ['x', 'White', 'Black', 'Asian', 'Hispanic'],
        ['Income', 0, 0, 0, 0]
      ],
      type: 'bar',
      colors: { Income: '#f5a623' }
    },
    bar: { width: { ratio: 0.6 } },
    axis: {
      x: { type: 'category' },
      y: { tick: { format: d => '$' + (d/1000).toFixed(0) + 'k' }, min: 0, padding: { bottom: 0 } }
    },
    legend: { show: false },
    padding: { right: 20 }
  });

  // Age chart: income by age group for a clicked state (starts off empty)
  ageChart = c3.generate({
    bindto: '#age-chart',
    data: {
      x: 'x',
      columns: [
        ['x', '15–24', '25–44', '45–64', '65+'],
        ['Income', 0, 0, 0, 0]
      ],
      type: 'bar',
      colors: { Income: '#84bcca' }
    },
    bar: { width: { ratio: 0.6 } },
    axis: {
      x: { type: 'category' },
      y: { tick: { format: d => '$' + (d/1000).toFixed(0) + 'k' }, min: 0, padding: { bottom: 0 } }
    },
    legend: { show: false },
    padding: { right: 20 }
  });
}

// Updates the income counter and bar chart based on currently visible states
function updateDashboard() {
  if (!map.getLayer('states-fill')) return;

  // Gets all state features currently visible in the map viewport
  const features = map.queryRenderedFeatures({ layers: ['states-fill'] });
  const seen = new Set();
  const visible = [];

  features.forEach(f => {
    const name = f.properties.name;
    // Skip duplicates and Puerto Rico (territory, not a state)
    if (name && stateData[name] && !seen.has(name) && name !== 'Puerto Rico') {
      seen.add(name);
      visible.push({ name, income: stateData[name].overall });
    }
  });

  if (visible.length === 0) return;

  // Calculates and displays average income for visible states
  const avg = visible.reduce((s, d) => s + d.income, 0) / visible.length;
  document.getElementById('income-count').textContent = '$' + Math.round(avg).toLocaleString();

  // Updates bar chart with top 8 visible states
  const top = [...visible].sort((a, b) => b.income - a.income).slice(0, 8);
  barChart.load({
    columns: [
      ['x', ...top.map(d => d.name)],
      ['Income', ...top.map(d => d.income)]
    ]
  });
}

// Updates the race and age charts when a state is clicked
function updateStatCharts(stateName) {
  const d = stateData[stateName];
  if (!d) return;

  // Updates chart titles to show which state was clicked
  document.getElementById('race-title').textContent = stateName + ' - Income by Race';
  document.getElementById('age-title').textContent = stateName + ' - Income by Age Group';

  // Loads race breakdown data for clicked state
  raceChart.load({
    columns: [
      ['x', 'White', 'Black', 'Asian', 'Hispanic'],
      ['Income', d.white, d.black, d.asian, d.hispanic]
    ]
  });

  // Loads age breakdown data for clicked state
  ageChart.load({
    columns: [
      ['x', '15–24', '25–44', '45–64', '65+'],
      ['Income', d.age15_24, d.age25_44, d.age45_64, d.age65plus]
    ]
  });
}

// Initializes the map and add all layers
function initMap() {
  map.on('load', function() {

    fetch('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json')
      .then(r => r.json())
      .then(function(geojson) {

        geojson.features.forEach(function(f) {
          const name = f.properties.name;
          f.properties.income = stateData[name] ? stateData[name].overall : 0;
        });

        map.addSource('states', { type: 'geojson', data: geojson });

        // Choropleth fill layer: colors each state by median income
        map.addLayer({
          id: 'states-fill',
          type: 'fill',
          source: 'states',
          paint: {
            'fill-color': [
              'interpolate', ['linear'], ['get', 'income'],
              55000, '#084c61',  // dark teal = lowest income
              65000, '#177e89',
              75000, '#84bcca',
              85000, '#ffc857',
              100000, '#e74c3c' // red = highest income
            ],
            'fill-opacity': 0.8
          }
        });

        // State border outline layer
        map.addLayer({
          id: 'states-line',
          type: 'line',
          source: 'states',
          paint: { 'line-color': '#ffffff', 'line-width': 1 }
        });

        // Popup that appears when hovering on a state which shows the state name and income
        const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

        map.on('mousemove', 'states-fill', function(e) {
          map.getCanvas().style.cursor = 'pointer';
          const name = e.features[0].properties.name;
          const income = e.features[0].properties.income;
          popup.setLngLat(e.lngLat)
            .setHTML('<strong>' + name + '</strong><br>Median Income: $' + income.toLocaleString())
            .addTo(map);
        });

        // Removes popup when mouse leaves a state
        map.on('mouseleave', 'states-fill', function() {
          map.getCanvas().style.cursor = '';
          popup.remove();
        });

        // Click a state to update the race and age breakdown charts
        map.on('click', 'states-fill', function(e) {
          const name = e.features[0].properties.name;
          updateStatCharts(name);
        });

        // Updates dashboard whenever the map finishes moving
        map.on('idle', updateDashboard);

        // Initial dashboard update after 1 second delay for map to fully render
        setTimeout(updateDashboard, 1000);
      });
  });
}