let globalData = []; 
let bubbleGroups;
let chartVisible = false;
let yearSelector;
let currentYear = "2024";
let colorScale;
let scrollProgress;
const oldPositions = {};

const steps = 23;

const scroller = scrollama();

function step_injector(){
    for(var i=0; i<=steps; i++){
        const step = document.createElement("div");
        step.className = "bubblestep";
        step.dataset.step = `step${i}`;
        // step.textContent = `Step ${i}`;
        document.getElementById("bubble-steps-container").appendChild(step);
    }
    console.log("[step_injector] bubble steps injected");
}

document.addEventListener('DOMContentLoaded', () => {
    d3.csv("dataset/Billionaire_Industry.csv").then(data => {
        step_injector();

        globalData = data;
        const selectedYearData = processDataForYear(data, currentYear);

        createColorScale(data);
        
        createIndustryBubbles(selectedYearData);
        createLegend(selectedYearData);
       
        const newYearData = processDataForYear(globalData, "2001");    
        updateChartWithTransition([], newYearData);

        handleScroll();
    });
});

function createColorScale(data) {
    const allIndustries = new Set();
    
    data.forEach(yearData => {
        Object.keys(yearData).forEach(key => {
            if (!key.includes("Richest") && key !== "Year" && !isNaN(parseInt(yearData[key]))) {
                allIndustries.add(key);
            }
        });
    });

    colorScale = d3.scaleOrdinal()
        .domain([...allIndustries])
        .range([
            "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", 
            "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
            "#aec7e8", "#ffbb78", "#98df8a", "#ff9896", "#c5b0d5",
            "#c49c94", "#f7b6d2", "#c7c7c7", "#dbdb8d", "#9edae5"
        ]);
}

function processDataForYear(data, year) {
    const yearData = data.find(d => d.Year === year);
    
    if (!yearData) return [];
    
    const industries = Object.keys(yearData).filter(key => 
        !key.includes("Richest") && 
        key !== "Year" && 
        !isNaN(parseInt(yearData[key]))
    );
    
    return industries.map(industry => {
        const count = parseInt(yearData[industry]);
        const richestPerson = yearData[`${industry} Richest`];
        
        return {
            name: industry,
            count: count,
            richest: richestPerson || "Unknown",
            finalRadius: 0
        };
    }).filter(d => d.count > 0);
}

function handleScroll(){
    console.log("[handleScroll]");
    scroller    
        .setup({
            step: '.bubblestep',
            offset: 0.5,
            debug: false
        })
        .onStepEnter(function(d){
            const step = d.index;
            const oldYear = currentYear;
            currentYear = 2001 + step + "";
            
            const oldYearData = processDataForYear(globalData, oldYear);
            const newYearData = processDataForYear(globalData, currentYear);
            
            updateChartWithTransition(oldYearData, newYearData);
            
            d3.select("#chart-title").text(`${currentYear}`);
            })
}

function updateChartWithTransition(oldData, newData) {
    const container = document.getElementById("bubble-chart").parentElement;
    const width = container.clientWidth;
    const height = 700;
    
    const svg = d3.select("#bubble-chart");
    
    const pack = d3.pack()
        .size([width, height - 100])
        .padding(20);

    const root = d3.hierarchy({ children: newData })
        .sum(d => d.count);

    const newNodes = pack(root).leaves();
    
    newNodes.forEach(node => {
        node.finalRadius = node.r;
        node.finalX = node.x;
        node.finalY = node.y + 50;
        node.data.finalRadius = node.r;
    });

    let tooltip = d3.select("#bubbletooltip")
        .attr("id", "bubbletooltip")
        .style("position", "fixed")
        .style("padding", "10px")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("border-radius", "4px")
        .style("color", "white")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("z-index", 9999);

    if (bubbleGroups) {
        bubbleGroups.each(function(d) {
            oldPositions[d.data.name] = {
                x: parseFloat(d3.select(this).attr("transform").split("(")[1].split(",")[0]),
                y: parseFloat(d3.select(this).attr("transform").split(",")[1].split(")")[0]),
                radius: parseFloat(d3.select(this).select("circle.main-bubble").attr("r"))
            };
        });
    }
    
    svg.selectAll("g.bubble-group").remove();
    
    bubbleGroups = svg.selectAll("g.bubble-group")
        .data(newNodes, d => d.data.name)
        .join("g")
        .attr("class", "bubble-group");
    
    bubbleGroups.each(function(d) {
        if (oldPositions[d.data.name]) {
            d3.select(this).attr("transform", `translate(${oldPositions[d.data.name].x},${oldPositions[d.data.name].y})`);
            d.startX = oldPositions[d.data.name].x;
            d.startY = oldPositions[d.data.name].y;
        } else {
            const centerX = width / 2;
            const centerY = height / 2;
            d3.select(this).attr("transform", `translate(${centerX},${centerY})`);
            d.startX = centerX;
            d.startY = centerY;
        }
    });
    
    bubbleGroups.append("circle")
        .attr("class", "main-bubble")
        .attr("r", d => {
            if (oldPositions[d.data.name]) {
                return oldPositions[d.data.name].radius;
            }
            return 10;
        })
        .attr("fill", d => colorScale(d.data.name))
        .attr("opacity", 0.8)
        .attr("filter", "url(#bubble-shadow)");
    
    bubbleGroups.append("circle")
        .attr("class", "highlight")
        .attr("r", d => {
            if (oldPositions[d.data.name]) {
                return oldPositions[d.data.name].radius * 0.3;
            }
            return 3;
        })
        .attr("cx", d => {
            if (oldPositions[d.data.name]) {
                return -oldPositions[d.data.name].radius * 0.3;
            }
            return -3;
        })
        .attr("cy", d => {
            if (oldPositions[d.data.name]) {
                return -oldPositions[d.data.name].radius * 0.3;
            }
            return -3;
        })
        .attr("fill", "url(#bubble-gradient)")
        .attr("opacity", 0.7);

    
    bubbleGroups.transition()
        .duration(350)
        .attr("transform", d => `translate(${d.finalX},${d.finalY})`);
    
    bubbleGroups.select("circle.main-bubble")
        .transition()
        .duration(350)
        .attr("r", d => d.finalRadius);
    
    bubbleGroups.select("circle.highlight")
        .transition()
        .duration(350)
        .attr("r", d => d.finalRadius * 0.3)
        .attr("cx", d => -d.finalRadius * 0.3)
        .attr("cy", d => -d.finalRadius * 0.3);
    
    bubbleGroups.select("text.industry-name")
        .transition()
        .duration(350)
        .attr("font-size", d => Math.min(d.finalRadius / 3, 18))
        .attr("opacity", 1);
    
    bubbleGroups.select("text.industry-count")
        .transition()
        .duration(350)
        .attr("font-size", d => Math.min(d.finalRadius / 4, 14))
        .attr("opacity", 1);
    
    bubbleGroups.select("text.richest-person")
        .transition()
        .duration(350)
        .attr("font-size", d => Math.min(d.finalRadius / 5, 12))
        .attr("opacity", 0.8);
    
    console.log(bubbleGroups)
    bubbleGroups.on("mouseenter", function(event, d) {
        console.log("mouse enter bubble")
        console.log(d3.select(this).select("circle.main-bubble"))
        d3.select(this).select("circle.main-bubble")
            .transition().duration(200)
            .attr("opacity", 1);
            
        tooltip.style("opacity", 1)
            .html(`
                <strong>${d.data.name}</strong><br>
                Number of Billionaires: ${d.data.count}<br>
                Richest Person: ${d.data.richest}
            `)
            .style("left", (event.clientX + 15) + "px")
            .style("top", (event.clientY - 30) + "px");
    })
    .on("mousemove", function(event) {
        console.log("mouse movement bubble")
        tooltip.style("left", (event.clientX + 15) + "px")
            .style("top", (event.clientY - 30) + "px");
    })
    .on("mouseleave", function() {
        d3.select(this).select("circle.main-bubble")
            .transition().duration(200)
            .attr("opacity", 0.8);
            
        tooltip
            .style("opacity", 0);
    });   
    

}

function createIndustryBubbles(data) {
    const container = document.getElementById("bubble-chart").parentElement;
    const width = container.clientWidth;
    const height = 700;

    const svg = d3.select("#bubble-chart")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("width", "100%")
        .attr("height", height);
    
    svg.selectAll("*").remove();
    
    let tooltip = d3.select("#tooltip");
    console.log(tooltip)
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div")
            .attr("id", "tooltip")
            .style("position", "absolute")
            .style("padding", "10px")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("border-radius", "4px")
            .style("color", "white")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("z-index", 9999);
    }

    svg.append("defs").append("radialGradient")
        .attr("id", "bubble-gradient")
        .attr("cx", "30%")
        .attr("cy", "30%")
        .attr("r", "70%")
        .selectAll("stop")
        .data([
            {offset: "0%", color: "rgba(255,255,255,0.9)"},
            {offset: "70%", color: "rgba(255,255,255,0.3)"},
            {offset: "100%", color: "rgba(255,255,255,0)"}
        ])
        .enter().append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);
    
    svg.append("filter")
        .attr("id", "bubble-shadow")
        .append("feDropShadow")
        .attr("dx", 2)
        .attr("dy", 2)
        .attr("stdDeviation", 3)
        .attr("flood-color", "rgba(0, 0, 0, 0.3)");

    const pack = d3.pack()
        .size([width, height - 100])
        .padding(20);

    const root = d3.hierarchy({ children: data })
        .sum(d => d.count);

    const nodes = pack(root).leaves();
    
    nodes.forEach(node => {
        node.finalRadius = node.r;
        node.finalX = node.x;
        node.finalY = node.y + 50;
        
        node.data.finalRadius = node.r;
    });

    const centerX = width / 2;
    const centerY = height / 2;

    bubbleGroups = svg.selectAll("g")
        .data(nodes)
        .join("g")
        .attr("transform", d => `translate(${centerX},${centerY})`)
        .attr("class", "bubble-group");
    
    bubbleGroups.each(function(d) {
        d.startX = centerX;
        d.startY = centerY;
    });

    bubbleGroups.append("circle")
        .attr("class", "main-bubble")
        .attr("r", 10)
        .attr("fill", d => colorScale(d.data.name))
        .attr("opacity", 0.8)
        .attr("filter", "url(#bubble-shadow)");

    bubbleGroups.append("circle")
        .attr("class", "highlight")
        .attr("r", 3)
        .attr("cx", -3)
        .attr("cy", -3)
        .attr("fill", "url(#bubble-gradient)")
        .attr("opacity", 0.7);

    bubbleGroups.on("mouseenter", function(event, d) {
        d3.select(this).select("circle.main-bubble")
            .transition().duration(200)
            .attr("opacity", 1);
            
        tooltip.style("opacity", 1)
            .html(`
                <b>${d.data.name}</b><br>
                Number of Billionaires: ${d.data.count}<br>
                Richest Person: ${d.data.richest}
            `)
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 30) + "px");
    })
    .on("mousemove", function(event) {
        tooltip.style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 30) + "px");
    })
    .on("mouseleave", function() {
        d3.select(this).select("circle.main-bubble")
            .transition().duration(200)
            .attr("opacity", 0.8);
            
        tooltip.transition().duration(200)
            .style("opacity", 0);
    });

    svg.append("text")
        .attr("id", "chart-title")
        .attr("x", width/2)  
        .attr("y", height)
        .attr("text-anchor", "middle")
        .style("font-size", "35px")
        .style("font-weight", "bold")
        .style("fill", "#555555")
        .style("opacity", 0.9)
        .text(currentYear);
}

function createLegend(data) {
    const svg = d3.select("#bubble-chart");
    const container = document.getElementById("bubble-chart").parentElement;
    const width     = container.clientWidth;
    const sortedData = [...data].sort((a, b) => b.count - a.count);
    const legendData = sortedData.slice(0, 18);
  
    const legend = svg.append("g")
      .attr("class", "chart-legend")
      .attr("transform", `translate(${width - 250}, 70)`);
    
    legend.append("text")
      .attr("class", "legend-title")
      .attr("x", 0)
      .attr("y", -30)
      .attr("font-size", "24px")
      .attr("font-weight", "bold")
      .text("Top Industries Legend")
    
    const legendItems = legend.selectAll(".legend-item")
      .data(legendData)
      .enter()
      .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 25})`);
    
        legendItems.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("x", -6)
        .attr("y", -6)
        .attr("fill", d => colorScale(d.name));
    
    legendItems.append("text")
      .attr("x", 20)
      .attr("y", 4)
      .attr("font-size", "18px")
      .text(d => d.name);
}
