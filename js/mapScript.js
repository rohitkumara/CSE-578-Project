
let lastHoveredCountry = null;

const svg = d3.select("#mapChart"),
      width = +svg.attr("width"),
      height = +svg.attr("height");

const tooltip = d3.select("#tooltip");

const projection = d3.geoNaturalEarth1()
  .scale(width / 1.3 / Math.PI)
  .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);


const defs = svg.append("defs");


const glow = defs.append("filter")
    .attr("id", "glow");

glow.append("feGaussianBlur")
    .attr("stdDeviation", "1.5")
    .attr("result", "coloredBlur");

glow.append("feMerge")
    .selectAll("feMergeNode")
    .data(["coloredBlur", "SourceGraphic"])
    .enter()
    .append("feMergeNode")
    .attr("in", d => d);

const shadow = defs.append("filter")
    .attr("id", "drop-shadow")
    .attr("height", "130%");

shadow.append("feGaussianBlur")
    .attr("in", "SourceAlpha")
    .attr("stdDeviation", 3)
    .attr("result", "blur");

shadow.append("feOffset")
    .attr("in", "blur")
    .attr("dx", 2)
    .attr("dy", 2)
    .attr("result", "offsetBlur");

const feMergeShadow = shadow.append("feMerge");
feMergeShadow.append("feMergeNode").attr("in", "offsetBlur");
feMergeShadow.append("feMergeNode").attr("in", "SourceGraphic");


const countryNameFixes = {
  "usa": "united states",
  "russian federation": "russia",
  "korea, republic of": "south korea",
  "korea, democratic people's republic of": "north korea",
  "iran (islamic republic of)": "iran",
  "venezuela (bolivarian republic of)": "venezuela",
  "viet nam": "vietnam",
  "bolivia (plurinational state of)": "bolivia",
  "tanzania, united republic of": "tanzania",
  "syrian arab republic": "syria",
  "republic of moldova": "moldova",
  "lao people's democratic republic": "laos",
  "brunei darussalam": "brunei",
  "czechia": "czech republic",
  "swaziland": "eswatini"
};

let processedData = {};
let currentYear = 2024;
let playing = false;
let timer = null;
let iconGroup;
let colorScale;

const slider = document.getElementById("yearSlider");
const yearValue = document.getElementById("yearValue");
const yearLabel = document.getElementById("yearLabel");
const playButton = document.getElementById("playButton");

slider.addEventListener("input", function() {
  currentYear = +this.value;
  yearValue.textContent = currentYear;
  yearLabel.textContent = currentYear;
  updateMap();
});

playButton.addEventListener("click", function() {
  if (!playing) {
    playing = true;
    playButton.value = "Pause";
    timer = setInterval(() => {
      currentYear = currentYear < 2024 ? currentYear + 1 : 1997;
      slider.value = currentYear;
      yearValue.textContent = currentYear;
      yearLabel.textContent = currentYear;
      updateMap();
    }, 1000);
  } else {
    playing = false;
    playButton.value = "Play";
    clearInterval(timer);
  }
});

Promise.all([
  d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
  d3.csv("dataset/all_billionaires_1997_2024.csv", d => {
    d.netWorthClean = +d.net_worth.replace(" B", "");
    d.country = d.country_of_citizenship?.toLowerCase().trim();
    return d;
  })
]).then(([geoData, csvData]) => {

  csvData.forEach(d => {
    if (!processedData[d.year]) processedData[d.year] = {};
    const country = d.country;
    if (!processedData[d.year][country]) {
      processedData[d.year][country] = { count: 0, totalNetWorth: 0, richest: { name: "", netWorth: 0 }};
    }
    let entry = processedData[d.year][country];
    entry.count += 1;
    entry.totalNetWorth += d.netWorthClean;
    if (d.netWorthClean > entry.richest.netWorth) {
      entry.richest = { name: d.full_name, netWorth: d.netWorthClean };
    }
  });

  const globalMax = d3.max(Object.values(processedData).flatMap(yearData => 
    Object.values(yearData).map(d => d.totalNetWorth)
  ));
  const globalMin = d3.min(Object.values(processedData).flatMap(yearData => 
    Object.values(yearData).map(d => d.totalNetWorth)
  ));

  colorScale = d3.scaleSequential(t => d3.interpolateRgb("#A0D683", "#3F7D58")(t))
               .domain([globalMin, globalMax]);


  svg.append("g")
    .attr("filter", "url(#drop-shadow)")
    .selectAll("path")
    .data(geoData.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => getCountryColor(d, currentYear))
    .attr("stroke", "#222")
    .attr("stroke-width", 1.2)
    .attr("filter", "url(#glow)")
    .on("mouseover", function(event, d) {
      lastHoveredCountry = d;
      const data = getCountryData(d, currentYear);
      tooltip.transition().duration(200).style("display", "block").style("opacity", 0.9);
      tooltip.html(data.tooltip)
        .style("left", Math.min(event.pageX + 10, window.innerWidth - 200) + "px")
        .style("top", (event.pageY - 28) + "px");
      d3.select(this)
        .transition().duration(200)
        .attr("stroke", "#FFD700")
        .attr("stroke-width", 2)
        .attr("transform", "scale(1.02)")
        .attr("fill", d3.color(getCountryColor(d, currentYear)).brighter(0.6));
    })
    .on("mouseout", function() {
      tooltip.transition().duration(300).style("opacity", 0).on("end", () => tooltip.style("display", "none"));
      lastHoveredCountry = null;
      d3.select(this)
        .transition().duration(300)
        .attr("stroke", "#222")
        .attr("stroke-width", 1.2)
        .attr("transform", "scale(1)")
        .attr("fill", d => getCountryColor(d, currentYear));
    });

  iconGroup = svg.append("g").attr("id", "cashIcons");

  svg.append("text")
    .attr("id", "yearDisplay")
    .attr("x", width / 2)
    .attr("y", height - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "32px")
    .style("font-weight", "bold")
    .style("fill", "#333")
    .style("opacity", 0.85)
    .text(currentYear);

  const legendShift = 400;
  const legendWidth = 200, legendHeight = 15;

  const linearGradient = defs.append("linearGradient")
      .attr("id", "legend-gradient")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "100%").attr("y2", "0%");

      linearGradient.selectAll("stop")
      .data(d3.range(0, 1.1, 0.1))
      .enter()
      .append("stop")
      .attr("offset", d => `${d * 100}%`)
      .attr("stop-color", d => d3.interpolateRgb("#A0D683", "#3F7D58")(d));   

  
  svg.append("text")
  .attr("x", width / 2 + legendShift)
  .attr("y", height - 80)
  .attr("text-anchor", "middle")
  .style("font-size", "13px")
  .style("font-weight", "600")
  .style("fill", "#444")
  .text("Net Worth (approx. range)");

  
  svg.append("rect")
      .attr("x", width / 2 - legendWidth / 2 + legendShift)
      .attr("y", height - 50)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .attr("rx", 5)
      .style("fill", "url(#legend-gradient)")
      .attr("stroke", "#aaa")
      .attr("stroke-width", 0.7);

  svg.append("text")
      .attr("x", width / 2 - legendWidth / 2 + legendShift)
      .attr("y", height - 55)
      .style("font-size", "12px")
      .attr("text-anchor", "start")
      .text(`$${globalMin.toFixed(1)} B`);

  svg.append("text")
      .attr("x", width / 2 + legendWidth / 2 + legendShift)
      .attr("y", height - 55)
      .style("font-size", "12px")
      .attr("text-anchor", "end")
      .text(`$${globalMax.toFixed(0)} B`);

  updateDollarIcons();
});

// Update Map Function
function updateMap() {
  if (!processedData[currentYear]) return;

  svg.selectAll("g path").transition().duration(500)
    .attr("fill", d => getCountryColor(d, currentYear));
  
  d3.select("#yearDisplay").text(currentYear);

  if (lastHoveredCountry) {
    const data = getCountryData(lastHoveredCountry, currentYear);
    tooltip.html(data.tooltip);
  }

  updateDollarIcons();
}

function getCountryColor(d, year) {
  let geoCountry = d.properties.name.toLowerCase().trim();
  if (countryNameFixes[geoCountry]) geoCountry = countryNameFixes[geoCountry];
  const entry = processedData[year]?.[geoCountry];
  return entry ? colorScale(entry.totalNetWorth) :"#f0eeee";
}

function getCountryData(d, year) {
  let geoCountry = d.properties.name.toLowerCase().trim();
  if (countryNameFixes[geoCountry]) geoCountry = countryNameFixes[geoCountry];
  const entry = processedData[year]?.[geoCountry];
  if (!entry) {
    return { tooltip: `<strong>${d.properties.name}</strong><br/>No data for ${year}` };
  }
  return {
    tooltip: `<strong>${d.properties.name} (${year})</strong><br/>
              Billionaires: ${entry.count}<br/>
              Total Net Worth: $${entry.totalNetWorth.toFixed(1)} B<br/>
              Richest: ${entry.richest.name} ($${entry.richest.netWorth} B)`
  };
}

function updateDollarIcons() {
  iconGroup.selectAll("*").remove(); 

  const countries = svg.selectAll("path").data();

  countries.forEach(d => {
    const countryName = d.properties.name.toLowerCase().trim();
    const fixedName = countryNameFixes[countryName] || countryName;
    const data = processedData[currentYear]?.[fixedName];

    if (data && data.count > 0) {
      const [x, y] = path.centroid(d);
      
      
      let iconCount = 1;
      if (data.count >= 100) {
        iconCount = 2;
      } else if (data.count === 2) {
        iconCount = 1;
      }

      for (let i = 0; i < iconCount; i++) {
        iconGroup.append("image")
          .attr("href", "imgs/saco.svg")
          .attr("x", x + i * 28 - 14)   
          .attr("y", y - 10)
          .attr("width", 30)
          .attr("height", 30);
      }
    }
  });
}

