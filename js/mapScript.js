// mapscript.js

const scroller = scrollama();

// — Globals & setup —
let lastHoveredCountry = null,
    processedData      = {},
    features,          // will hold geo + centroids + countryKey
    countryPaths,      // cached paths selection
    iconGroup,         // dollar-icon group
    colorScale;

let currentYear = "1997"; // default year

const steps = 27;
for(var i=0; i<=steps; i++){
  const step = document.createElement("div");
  step.className = "mapstep";
  step.dataset.step = `step${i}`;
  // step.textContent = `Step ${i}`;
  document.getElementById("mapchart-steps-container").appendChild(step);
}
console.log("[step_injector] steps injected");

const svg     = d3.select("#mapChart"),
      width   = svg.style("width").replace("px", ""),
      height  = svg.style("height").replace("px", ""),
      tooltip = d3.select("#maptooltip");

// const projection = d3.geoNaturalEarth1()
//     .scale(width / 1.3 / Math.PI)
//     .translate([width / 2, height / 2]);

const projection = d3.geoMercator()
    .scale(width / 1.8 / Math.PI)
    .translate([width / 2, height / 2 + 70]);

const path = d3.geoPath().projection(projection);

// filters for glow + shadow
const defs = svg.append("defs");
const glow = defs.append("filter").attr("id","glow");
glow.append("feGaussianBlur").attr("stdDeviation","1.5").attr("result","blur");
glow.append("feMerge")
    .selectAll("feMergeNode")
    .data(["blur","SourceGraphic"])
    .enter().append("feMergeNode").attr("in", d=>d);
const shadow = defs.append("filter").attr("id","drop-shadow").attr("height","130%");
shadow.append("feGaussianBlur").attr("in","SourceAlpha").attr("stdDeviation",3).attr("result","blur");
shadow.append("feOffset").attr("in","blur").attr("dx",2).attr("dy",2).attr("result","offBlur");
const ms = shadow.append("feMerge");
ms.append("feMergeNode").attr("in","offBlur");
ms.append("feMergeNode").attr("in","SourceGraphic");

// country name fixes
const countryNameFixes = {
  "usa":"united states","russian federation":"russia",
  "korea, republic of":"south korea","korea, democratic people's republic of":"north korea",
  "iran (islamic republic of)":"iran","venezuela (bolivarian republic of)":"venezuela",
  "viet nam":"vietnam","bolivia (plurinational state of)":"bolivia",
  "tanzania, united republic of":"tanzania","syrian arab republic":"syria",
  "republic of moldova":"moldova","lao people's democratic republic":"laos",
  "brunei darussalam":"brunei","czechia":"czech republic","swaziland":"eswatini"
};

// — Load data, precompute & draw —
Promise.all([
  d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
  d3.csv("dataset/all_billionaires_1997_2024.csv", d => {
    d.netWorthClean = +d.net_worth.replace(" B","");
    d.country = d.country_of_citizenship?.toLowerCase().trim();
    return d;
  })
]).then(([geoData, csvData]) => {
  // 1) Aggregate data
  csvData.forEach(d => {
    if (!processedData[d.year]) processedData[d.year] = {};
    const c = d.country;
    if (!processedData[d.year][c]) {
      processedData[d.year][c] = {count:0, totalNetWorth:0, richest:{name:"",netWorth:0}};
    }
    const e = processedData[d.year][c];
    e.count++;
    e.totalNetWorth += d.netWorthClean;
    if (d.netWorthClean > e.richest.netWorth) {
      e.richest = {name:d.full_name, netWorth:d.netWorthClean};
    }
  });

  // 2) Compute color scale
  const allTotals = Object.values(processedData)
    .flatMap(y => Object.values(y).map(e => e.totalNetWorth));
  const [minW, maxW] = [d3.min(allTotals), d3.max(allTotals)];
  colorScale = d3.scaleSequential(t => d3.interpolateRgb("#A0D683","#3F7D58")(t))
                 .domain([minW, maxW]);

  // 3) Precompute centroids & keys
  features = geoData.features.map(f => {
    const name = f.properties.name.toLowerCase().trim();
    const key  = countryNameFixes[name] || name;
    const [x,y]= path.centroid(f);
    return {geo:f, key, x, y};
  });

  // 4) Draw country paths & cache selection
  countryPaths = svg.append("g")
    .attr("filter","url(#drop-shadow)")
    .selectAll("path")
    .data(features)
    .enter().append("path")
      .attr("d", d=>path(d.geo))
      .attr("fill", d => getFill(d.key))
      .attr("stroke","#222")
      .attr("stroke-width",1.2)
      .attr("filter","url(#glow)")
      .on("mouseover", countryMouseOver)
      .on("mousemove", countryMouseMove)
      .on("mouseout",  countryMouseOut);

  // 5) Dollar-icon group
  iconGroup = svg.append("g").attr("id","cashIcons");

  // 6) Year label
  svg.append("text")
    .attr("id","yearDisplay")
    .attr("x", width/2).attr("y", height-10)
    .attr("text-anchor","middle")
    .style("font-size","32px")
    .style("font-weight","bold")
    .style("fill","#333")
    .style("opacity",0.85)
    .text(currentYear);

  // 7) Legend
  const shift=400, W=200, H=15;
  const lg=defs.append("linearGradient").attr("id","legend-gradient")
    .attr("x1","0%").attr("y1","0%").attr("x2","100%").attr("y2","0%");
  lg.selectAll("stop").data(d3.range(0,1.1,0.1))
    .enter().append("stop")
      .attr("offset",d=>`${d*100}%`)
      .attr("stop-color",d=>d3.interpolateRgb("#A0D683","#3F7D58")(d));
  svg.append("rect")
    .attr("x", width/2 - W/2 + shift)
    .attr("y", height-50)
    .attr("width", W).attr("height", H)
    .attr("rx",5)
    .style("fill","url(#legend-gradient)")
    .style("fill","url(#legend-gradient)")
    .attr("stroke","#aaa").attr("stroke-width",0.7);
  svg.append("text")
    .attr("x", width/2+shift).attr("y",height-80)
    .attr("text-anchor","middle")
    .style("font-size","13px")
    .style("font-weight","600")
    .style("fill","#444")
    .text("Net Worth (approx. range)");
  svg.append("text")
    .attr("x", width/2 - W/2 + shift).attr("y",height-55)
    .style("font-size","12px")
    .attr("text-anchor","start")
    .text(`$${minW.toFixed(1)} B`);
  svg.append("text")
    .attr("x", width/2 + W/2 + shift).attr("y",height-55)
    .style("font-size","12px")
    .attr("text-anchor","end")
    .text(`$${maxW.toFixed(0)} B`);

  // 8) Initial icons
  updateIcons();

  handleScroll();
});

// — helper to get fill color —
function getFill(countryKey) {
  const e = processedData[currentYear]?.[countryKey];
  return e ? colorScale(e.totalNetWorth) : "#f0eeee";
}

// — update country fills & icons —
function updateMap(animate=false) {
  if (animate) {
    countryPaths.transition().duration(200)
      .attr("fill", d => getFill(d.key));
  } else {
    countryPaths.interrupt()
      .attr("fill", d => getFill(d.key));
  }
  d3.select("#yearDisplay").text(currentYear);
  if (lastHoveredCountry) {
    tooltip.html(getCountryData(lastHoveredCountry, currentYear).tooltip);
  }
  updateIcons();
}

// — data for tooltips —
function getCountryData(d, year) {
  const e = processedData[year]?.[d.key];
  if (!e) return { tooltip: `<strong>${d.geo.properties.name}</strong><br/>No data for ${year}` };
  return {
    tooltip: `<strong>${d.geo.properties.name} (${year})</strong><br/>
              Billionaires: ${e.count}<br/>
              Total Net Worth: $${e.totalNetWorth.toFixed(1)} B<br/>
              Richest: ${e.richest.name} ($${e.richest.netWorth} B)`
  };
}

// — hover handlers —
function countryMouseOver(event, d) {
  lastHoveredCountry = d;
  const data = getCountryData(d, currentYear);
  tooltip.style("display","block").style("opacity",0.9);
  tooltip.html(data.tooltip)
    .style("left", Math.min(event.clientX+10, window.innerWidth-200)+"px")
    .style("top", (event.clientY-28)+"px");
  d3.select(this)
    .transition().duration(200)
    .attr("stroke","#FFD700")
    .attr("stroke-width",2)
    .attr("transform","scale(1.02)")
    .attr("fill", d3.color(getFill(d.key)).brighter(0.6));
}

function countryMouseMove(event, d) {
  tooltip
    .style("left", Math.min(event.clientX+10, window.innerWidth-200)+"px")
    .style("top", (event.clientY-28)+"px");
}

function countryMouseOut() {
  tooltip.style("opacity", 0)
    .on("end",()=>tooltip.style("display","none"));
  lastHoveredCountry = null;
  d3.select(this)
    .transition().duration(300)
    .attr("stroke","#222")
    .attr("stroke-width",1.2)
    .attr("transform","scale(1)")
    .attr("fill", d => getFill(d.key));
}

// — fast D3 join for icons —
function updateIcons() {
  const iconsData = features.flatMap(f => {
    const e = processedData[currentYear]?.[f.key];
    if (!e || e.count===0) return [];
    const count = e.count>=100 ? 2 : 1;
    return Array.from({length:count}, (_,i) => ({
      x: f.x + (i*28 - 14),
      y: f.y - 10,
      id: f.key + "-" + i
    }));
  });

  const icons = iconGroup.selectAll("image")
    .data(iconsData, d => d.id);

  icons.exit().remove();

  icons.enter().append("image")
      .attr("href","imgs/saco.svg")
      .attr("width",30).attr("height",30)
    .merge(icons)
      .attr("x", d => d.x)
      .attr("y", d => d.y);
}

function handleScroll(){
  console.log("[handleScroll]");
  scroller    
      .setup({
          step: '.mapstep',
          offset: 0.5,
          debug: false
      })
      .onStepEnter(function(d){
          const step = d.index;
          currentYear = 1997 + step + "";
          var year_span = document.getElementById("year");
          console.log(year_span)

          updateMap(true);
      })
}