// ——————————————————————————————————————————————————————————
//  main.js
// ——————————————————————————————————————————————————————————

// 1) Country ↔ Region, Region ↔ Color, Country ↔ Flag, Industry normalization
const countryRegion = {
  "United States":"North America","Canada":"North America","Mexico":"North America","Belize":"North America",
  "Panama":"North America","St. Kitts and Nevis":"North America",
  "Brazil":"South America","Argentina":"South America","Chile":"South America","Colombia":"South America",
  "Peru":"South America","Uruguay":"South America","Venezuela":"South America",
  "China":"Asia","India":"Asia","Japan":"Asia","South Korea":"Asia","Saudi Arabia":"Asia",
  "United Arab Emirates":"Asia","Israel":"Asia","Turkey":"Asia","Thailand":"Asia","Lebanon":"Asia",
  "Hong Kong":"Asia","Kuwait":"Asia","Malaysia":"Asia","Taiwan":"Asia","Philippines":"Asia",
  "Singapore":"Asia","Indonesia":"Asia","Pakistan":"Asia","Bangladesh":"Asia","Vietnam":"Asia",
  "Nepal":"Asia","Macau":"Asia","Qatar":"Asia","Oman":"Asia","Kazakhstan":"Asia",
  "Russia":"Europe","Germany":"Europe","France":"Europe","United Kingdom":"Europe","Italy":"Europe",
  "Spain":"Europe","Switzerland":"Europe","Sweden":"Europe","Norway":"Europe","Portugal":"Europe",
  "Belgium":"Europe","Netherlands":"Europe","Austria":"Europe","Denmark":"Europe","Finland":"Europe",
  "Ireland":"Europe","Greece":"Europe","Czech Republic":"Europe","Czechia":"Europe","Poland":"Europe",
  "Hungary":"Europe","Slovakia":"Europe","Estonia":"Europe","Croatia":"Europe","Romania":"Europe",
  "Georgia":"Europe","Luxembourg":"Europe","Liechtenstein":"Europe","Iceland":"Europe","Monaco":"Europe",
  "Guernsey":"Europe","Australia":"Oceania","New Zealand":"Oceania",
  "South Africa":"Africa","Egypt":"Africa","Morocco":"Africa","Nigeria":"Africa","Algeria":"Africa",
  "Swaziland":"Africa","Eswatini (Swaziland)":"Africa","Uganda":"Africa","Tanzania":"Africa",
  "Angola":"Africa","Zimbabwe":"Africa","Guatemala":"North America"
};

const regionColor = {
  "North America":"#f57c00",
  "Asia":"#4f8bc9",
  "Europe":"#f964a2",
  "South America":"#b76bbd",
  "Oceania":"#66baf1",
  "Africa":"#888"
};

const flagEmoji = {
  "United States":"🇺🇸","Canada":"🇨🇦","Mexico":"🇲🇽","Belize":"🇧🇿","Panama":"🇵🇦",
  "St. Kitts and Nevis":"🇰🇳","Brazil":"🇧🇷","Argentina":"🇦🇷","Chile":"🇨🇱","Colombia":"🇨🇴",
  "Peru":"🇵🇪","Uruguay":"🇺🇾","Venezuela":"🇻🇪","China":"🇨🇳","India":"🇮🇳","Japan":"🇯🇵",
  "South Korea":"🇰🇷","Saudi Arabia":"🇸🇦","United Arab Emirates":"🇦🇪","Israel":"🇮🇱",
  "Turkey":"🇹🇷","Thailand":"🇹🇭","Lebanon":"🇱🇧","Hong Kong":"🇭🇰","Kuwait":"🇰🇼",
  "Malaysia":"🇲🇾","Taiwan":"🇹🇼","Philippines":"🇵🇭","Singapore":"🇸🇬","Indonesia":"🇮🇩",
  "Pakistan":"🇵🇰","Bangladesh":"🇧🇩","Vietnam":"🇻🇳","Nepal":"🇳🇵","Macau":"🇲🇴",
  "Qatar":"🇶🇦","Oman":"🇴🇲","Kazakhstan":"🇰🇿","Russia":"🇷🇺","Germany":"🇩🇪",
  "France":"🇫🇷","United Kingdom":"🇬🇧","Italy":"🇮🇹","Spain":"🇪🇸","Switzerland":"🇨🇭",
  "Sweden":"🇸🇪","Norway":"🇳🇴","Portugal":"🇵🇹","Belgium":"🇧🇪","Netherlands":"🇳🇱",
  "Austria":"🇦🇹","Denmark":"🇩🇰","Finland":"🇫🇮","Ireland":"🇮🇪","Greece":"🇬🇷",
  "Czech Republic":"🇨🇿","Czechia":"🇨🇿","Poland":"🇵🇱","Hungary":"🇭🇺","Slovakia":"🇸🇰",
  "Estonia":"🇪🇪","Croatia":"🇭🇷","Romania":"🇷🇴","Georgia":"🇬🇪","Luxembourg":"🇱🇺",
  "Liechtenstein":"🇱🇮","Iceland":"🇮🇸","Monaco":"🇲🇨","Guernsey":"🇬🇬",
  "Australia":"🇦🇺","New Zealand":"🇳🇿",
  "South Africa":"🇿🇦","Egypt":"🇪🇬","Morocco":"🇲🇦","Nigeria":"🇳🇬","Algeria":"🇩🇿",
  "Swaziland":"🇸🇿","Eswatini (Swaziland)":"🇸🇿","Uganda":"🇺🇬","Tanzania":"🇹🇿",
  "Angola":"🇦🇴","Zimbabwe":"🇿🇼","Guatemala":"🇬🇹"
};

const industryMap = {
  "Finance and Investments":"Finance & Investments",
  "Finance & Investments":"Finance & Investments",
  "Finance":"Finance",
  "Investments":"Investments",
  "Fashion & Retail":"Fashion & Retail",
  "Fashion and Retail":"Fashion & Retail",
  "Apparel":"Fashion & Retail",
  "Food and Beverage":"Food & Beverage",
  "Food & Beverage":"Food & Beverage",
  "Food":"Food & Beverage",
  "Beverages":"Food & Beverage",
  "Media":"Media",
  "Media & Entertainment":"Media",
  "Real Estate":"Real Estate",
  "Construction & Engineering":"Construction & Engineering",
  "Construction &#38; Engineering":"Construction & Engineering",
  "Metals & Mining":"Metals & Mining",
  "Metals &#38; Mining":"Metals & Mining",
  "Hotels &#38; Resorts":"Hotels & Resorts",
  "Gambling & Casinos":"Gambling & Casinos",
  "Casinos &#38; Gaming":"Gambling & Casinos",
  "Service":"Services",
  "Consumer Services":"Services",
  "Technology":"Technology",
  "Telecom":"Telecom",
  "Telecommunications":"Telecom",
  "Health Care":"Healthcare",
  "Health care":"Healthcare",
  "Healthcare":"Healthcare",
  "Medicine":"Healthcare",
  "Leisure":"Leisure"
};

// 2) Set up SVG + margins + groups

const chartSvg  = d3.select("#chart-svg"),
      genderSvg = d3.select("#gender-chart-svg");

const margin     = { top:50, right:180, bottom:190, left:260 },
      W          = +chartSvg.attr("width"),
      H          = +chartSvg.attr("height"),
      baseHeight = H,
      width      = W - margin.left - margin.right,
      height     = H - margin.top - margin.bottom;

const chart         = chartSvg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
const x             = d3.scaleLinear().range([0, width]);
const y             = d3.scaleBand().range([0, height]).padding(0.1);
const xAxisTop      = chart.append("g").attr("class","axis x-axis");
const yAxisLeft     = chart.append("g").attr("class","axis y-axis");
const timelineScale = d3.scaleTime().range([0, width]);

// base positions for timeline & year
const baseTimelineY = margin.top + height + 30;
const baseYearY     = margin.top + height + 95;

const timelineAxisG = chartSvg.append("g")
    .attr("transform", `translate(${margin.left},${baseTimelineY})`)
    .attr("class","axis");

const playhead  = chartSvg.append("path")
    .attr("d","M -4,0 L 4,0 L 0,8 Z")
    .attr("fill","steelblue");

const yearLabel = chartSvg.append("text")
    .attr("class","year-title");

// inline detail state
let openIndex    = null,
    detailHeight = 0,
    currentDate  = null;

// Toggles the little inline history chart under a bar
function toggleInlineDetail(datum, containerG, history) {
  const labels       = y.domain(),
        clickedIndex = labels.indexOf(datum.full_name);

  // if clicking the same bar: close
  if (openIndex === clickedIndex) {
    chart.selectAll(".inline-detail").remove();
    openIndex = null;
  } else {
    chart.selectAll(".inline-detail").remove();
    openIndex = clickedIndex;

    // inline chart dims
    const dm = { top:6, bottom:6 }, w = 200, h = 60;
    detailHeight = dm.top + h + dm.bottom + 10;

    const detailG = containerG.append("g")
      .attr("class","inline-detail")
      .attr("transform", `translate(0,${y.bandwidth() + dm.top})`);

    // mini‐scales
    const x2 = d3.scaleTime()
        .domain(d3.extent(history, d=>d.date))
        .range([0,w]);
    const y2 = d3.scaleLinear()
        .domain([0, d3.max(history, d=>d.net)])
        .range([h,0]);

    // axes + line
    detailG.append("g")
        .attr("transform", `translate(0,${h})`)
        .call(d3.axisBottom(x2).ticks(3).tickFormat(d3.timeFormat("%Y")))
        .selectAll("text").style("font-size","8px");

    detailG.append("g")
        .call(d3.axisLeft(y2).ticks(3).tickFormat(d => d + " B"))
        .selectAll("text").style("font-size","8px");

    detailG.append("path")
        .datum(history)
        .attr("fill","none")
        .attr("stroke","#333")
        .attr("stroke-width",1)
        .attr("d", d3.line()
          .x(d=>x2(d.date))
          .y(d=>y2(d.net))
        );
  }

  // SHIFT ALL BAR-GROUPS (and name-labels) down by detailHeight if needed
  chart.selectAll(".bar-group")
    .transition().duration(300)
    .attr("transform", d => {
      const idx   = y.domain().indexOf(d.label),
            baseY = y(d.label),
            extra = (openIndex!==null && idx > openIndex) ? detailHeight : 0;
      return `translate(0,${baseY + extra + 20})`;
    });

  // bump SVG height too
  const shift = openIndex===null ? 0 : detailHeight;
  chartSvg.transition().duration(300)
    .attr("height", baseHeight + shift + 10);

  // move timeline + playhead + yearLabel by the same shift
  timelineAxisG.transition().duration(300)
    .attr("transform", `translate(${margin.left},${baseTimelineY + shift})`);

  const px = margin.left + timelineScale(currentDate);
  playhead.transition().duration(300)
    .attr("transform", `translate(${px},${baseTimelineY + shift + 100})`);
  yearLabel.transition().duration(300)
    .attr("y", baseYearY + shift);
}


// Load data & fire everything up
d3.csv("dataset/all_billionaires_1997_2024.csv").then(raw => {
  raw.forEach(d => {
    d.net  = +d.net_worth.replace(/[^0-9.]/g,"");
    d.date = new Date(+d.year,0,1);
    const m  = /'([^']+)'/.exec(d.business_industries||""),
          ri = m ? m[1].trim() : "Unknown";
    d.industry = industryMap[ri]||ri;
    const g = (d.gender||"").trim().toLowerCase();
    d.gender    = g==="male"?"Male":g==="female"?"Female":"";
  });

  // history by person
  const dataByName = d3.group(raw, d=>d.full_name);
  dataByName.forEach(arr => arr.sort((a,b)=>a.date - b.date));

  // group by year
  raw = raw.filter(d => +d.year >= 2001);
  const byYear = d3.group(raw, d=>+d.year),
        years  = Array.from(byYear.keys()).sort((a,b)=>a-b),
        dates  = years.map(y=> new Date(y,0,1));

  // draw bottom timeline
  timelineScale.domain([
    d3.timeYear.floor(dates[0]),
    d3.timeYear.ceil(dates[dates.length-1])
  ]);
  timelineAxisG.call(
    d3.axisBottom(timelineScale)
      .ticks(d3.timeYear.every(1))
      .tickFormat(d3.timeFormat("%Y"))
  ).selectAll("text").style("text-anchor","middle");

  // industry dropdown + gender row
  const categories = Array.from(new Set(raw.map(d=>d.industry))).sort();
  d3.select("#industry-select")
    .selectAll("option").data(categories)
    .enter().append("option")
      .text(d=>d).attr("value",d=>d);

  d3.select("#industry-select").on("change", function(){
    updateGenderIcons(this.value);
    // snap back to whatever year we're currently scrolled to:
    const year = currentDate.getFullYear();
    updateRace(new Date(year,0,1), byYear.get(year));
  });

  // keep a pixel‐offset along our timeline
  let scrollOffset = 0;

  // INITIAL DRAW
  updateRace(dates[0], byYear.get(years[0]));
  updateGenderIcons(categories[0]);

  // WIRE UP SCROLL‐TO‐SCRUB
  const svgNode = chartSvg.node();
  const scrollSensitivity = 0.1;  
  svgNode.addEventListener("wheel", e => {
    e.preventDefault();
    // accumulate horizontal scroll (fallback to vertical if no horizontal wheel)
    const raw = (e.deltaX !== 0 ? e.deltaX : e.deltaY);
    scrollOffset += raw * scrollSensitivity;
    scrollOffset = Math.max(0, Math.min(scrollOffset, width));

    // invert to Date, snap to full‐year, update
    const dt   = timelineScale.invert(scrollOffset),
          yr   = dt.getFullYear(),
          date = new Date(yr,0,1);

    updateRace(date, byYear.get(yr));
  });

  // ───────────────────────────────────────────────────────────────
  function updateRace(date, dataForYear) {
    // close any open detail
    chart.selectAll(".inline-detail").remove();
    openIndex = null;
    currentDate = date;

    const top10 = Array.from(dataForYear)
      .sort((a,b)=>b.net - a.net)
      .slice(0,10)
      .map(d=>({ ...d, label:d.full_name }));

    x.domain([0, d3.max(top10, d=>d.net)]);
    y.domain(top10.map(d=>d.label));

    xAxisTop.transition().duration(600)
      .call(d3.axisTop(x).ticks(5).tickFormat(d=>" "+d+" B"));

    yAxisLeft.transition().duration(600)
      .call(d3.axisLeft(y)
        .tickSize(0)
        .tickPadding(48)
        .tickFormat("")
      );

    // JOIN
    const groups = chart.selectAll(".bar-group")
      .data(top10, d=>d.full_name);
    groups.exit().remove();

    // ENTER
    const ge = groups.enter().append("g")
      .attr("class","bar-group")
      .attr("transform", d=>`translate(0,${y(d.label)})`);

    ge.append("text")
      .attr("class","name-label")
      .attr("x",-10)
      .attr("y",y.bandwidth()/2+5)
      .attr("text-anchor","end")
      .text(d=>d.label);

    ge.append("rect")
      .attr("class","bar")
      .attr("y",0)
      .attr("height", y.bandwidth())
      .attr("width", 0)
      .on("mouseover", function(){ d3.select(this).attr("opacity",0.7); })
      .on("mouseout",  function(){ d3.select(this).attr("opacity",1); })
      .on("click", (ev,d) => toggleInlineDetail(
        d,
        d3.select(ev.currentTarget.parentNode),
        dataByName.get(d.full_name)
      ));

    ge.append("text").attr("class","flag");
    ge.append("text").attr("class","value-label").attr("text-anchor","end");

    const allG = ge.merge(groups);
    allG.transition().duration(600)
      .attr("transform", d=>`translate(0,${y(d.label)})`);

    allG.select("rect.bar").transition().duration(600)
      .attr("width", d=>x(d.net))
      .attr("fill",  d=>regionColor[countryRegion[d.country_of_citizenship]||"Africa"]);

    allG.select("text.flag").transition().duration(600)
      .attr("x", d=>x(d.net)+6)
      .attr("y", y.bandwidth()/2+10)
      .text(d=>flagEmoji[d.country_of_citizenship]||"");

    allG.select("text.value-label").transition().duration(600)
      .attr("x", d=>x(d.net)-6)
      .attr("y", y.bandwidth()/2+5)
      .text(d=>d.net+" B");

    // move playhead, yearLabel & bottom axis back to base position
    const px = margin.left + timelineScale(date);
    playhead.transition().duration(600)
      .attr("transform", `translate(${px},${baseTimelineY})`);
    yearLabel.transition().duration(600)
      .attr("x", px)
      .attr("y", baseYearY)
      .text(d3.timeFormat("%Y")(date));
    timelineAxisG.transition().duration(600)
      .attr("transform", `translate(${margin.left},${baseTimelineY})`);

    // restore SVG height
    chartSvg.transition().duration(600)
      .attr("height", baseHeight);
  }

  // ───────────────────────────────────────────────────────────────
  function updateGenderIcons(category) {
    const subset      = raw.filter(d=>d.industry===category),
          maleCount   = subset.filter(d=>d.gender==="Male").length,
          femaleCount = subset.filter(d=>d.gender==="Female").length,
          totalKnown  = maleCount + femaleCount,
          maleIcons   = totalKnown ? Math.round(maleCount/totalKnown*10) : 5,
          femaleIcons = 10 - maleIcons,
          iconsData   = [
            ...Array(femaleIcons).fill("female"),
            ...Array(maleIcons).fill("male")
          ];

    const icons = genderSvg.selectAll("image").data(iconsData);
    icons.exit().remove();

    icons.enter().append("image")
      .attr("width",40).attr("height",40)
      .merge(icons)
      .attr("href", d=>"icons/"+d+".png")
      .attr("x", (_,i)=> margin.left + i*(40+8))
      .attr("y", (60-40)/2);
  }

}); // end d3.csv