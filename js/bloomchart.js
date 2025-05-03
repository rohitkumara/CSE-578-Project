/*
    Reference:
    force sim:  https://observablehq.com/@d3/collision-detection/2
                https://observablehq.com/@celticman3/test-radial
*/

import { countryToCode } from './country_codes.js';

var start_year = 2001;
var end_year = 2024;
var current_year = 2001;
var previous_year = 2001;
var scale = 1.5;
var nodes;
var data = null;
const color = d3.scaleOrdinal(d3.schemePastel2);

const scroller = scrollama();


function step_injector(){
    for(var i=start_year; i<=end_year; i++){
        const step = document.createElement("div");
        step.className = "bloomstep";
        step.dataset.step = `step${i-start_year}`;
        // step.textContent = `Step ${i-start_year}`;
        document.getElementById("bloom-steps-container").appendChild(step);
    }
    console.log("[step_injector] steps injected");
}

export function bloomchart(){
    console.log("[bloomchart]");
    step_injector();
    Promise.all([
            d3.csv('dataset/gdp_data_processed.csv')
        ])
        .then(function (values){
            console.log("[bloom] data loaded");
            data = values[0];
            console.log(data);
            drawFlowers();
            handleScroll();
            console.log("[bloom] data drawn");
        });
}

function filterData(){
    var d = data.filter(d => d.year == current_year);
    return d.slice(0, 20);
}

function createNodeArray(filteredData, margin, height, width){
    // when data is updated, update the node array rather than creating a new one   
    if(nodes){
        var existingNodes = new Map(nodes.map(function(d){ return [d.data.country, d]; }))
    }
    else{
        var existingNodes = new Map([]);
    }

    var radiusScale = d3.scaleLinear()
        .domain(d3.extent(filteredData, function(d){ return d.gdp/10000000000; }))
        .range([5, 20]);

    nodes = filteredData.map(function(d){
        var exist = existingNodes.get(d.country)
        if(exist){
            // console.log(d.country, "found");
            exist.data = d;
            return exist;
        }
        return {
            x: margin.left + width/2,
            y: margin.top + height/2,
            r: scale * radiusScale(d.gdp/10000000000),
            data: d
        }
    });

}

function drawFlowers(){
    console.log("[drawFlowers]");
    
    const svg = d3.select("#bloom_svg");
    const width = svg.style("width").replace("px", "");
    const height = svg.style("height").replace("px", "");

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    
    svg.selectAll(".flower-text").remove();

    const filteredData = filterData(data);

    var petalLength = (2/3)*scale * 40;
    var petalWidth = petalLength * (771/333);

    createNodeArray(filteredData, margin, height, width);


    var flowers = svg.selectAll("g.flower")
        .data(nodes)
        .join("g")
        .attr("class", "flower")
        .attr("transform", function(d){
            return "translate(" + d.x + "," + d.y + ")";
        });

    var max_val = -Infinity
    var min_val = Infinity
    data.forEach(function(d){
        if(d.total_net_worth > max_val){
            console.log()
            max_val = d.total_net_worth;
        }
        if(d.total_net_worth < min_val){
            min_val = d.total_net_worth;
        }
    })
    console.log("max_val:", max_val);
    console.log("min_val:", min_val);
    var petalScale = d3.scaleLinear()
        .domain([min_val, max_val])
        .range([1, 10]);

    flowers.each(function(d){
        var petalCount = Math.round(petalScale(d.data.total_net_worth));
        // var petalCount = 3;
        var angle = 2 * Math.PI / petalCount;
        d3.select(this)
            .selectAll("image")
            .data(d3.range(petalCount))
            .join("image")
            .attr("class", "petal")
            .attr("width", petalWidth)
            .attr("height", petalLength)
            .attr("x", -(petalWidth) / 2)
            .attr("y", d.r/2)
            .attr("href", "imgs/dollar.png")
            .attr("transform", function(d, i){
                var x = Math.cos(i * angle) * ((petalLength + d.r) / 2);
                var y = Math.sin(i * angle) * ((petalLength + d.r) / 2);
                return "rotate(" + (i * (360 / petalCount)) +  ")";
            });

    })

    flowers.append("circle")
        .attr("class", "flower-center")
        .attr("cx", function(d){ return 0;})
        .attr("cy", function(d){ return 0;})
        .attr("r", function(d){ return d.r; })
        .attr("fill", function(d, i){
            return color(i);
        })
        
    flowers.select("flower-center").raise()
        
    flowers.append("text")
        .attr("class", "flower-text")
        .attr("x", function(d){ return 0;})
        .attr("y", function(d){ return 7;})
        .attr("text-anchor", "middle")
        .attr("font-weight", "bold")
        .text(function(d){
            if(countryToCode[d.data.country]){}
            else{
                console.log("not found code for:", d.data.country)
            }
            return countryToCode[d.data.country];
        })

    var year_text = svg.selectAll(".year-text")
    if(year_text.empty()){
        year_text = svg.append("text")
            .attr("class", "year-text")
            .attr("x", width/2)  
            .attr("y", height)
            .attr("text-anchor", "middle")
            .style("font-size", "35px")
            .style("font-weight", "bold")
            .style("fill", "#555555")
            .style("opacity", 0.9)
            .text(current_year);
    }
    year_text.transition().duration(50)
        .text(current_year);
    const simulation = d3.forceSimulation(nodes)
        .force("x", d3.forceX().x(width / 2).strength(0.02))
        .force("y", d3.forceY().y(height / 2).strength(0.1))
        .force("collide", d3.forceCollide().radius(function(d) { return 1.2*petalLength; }))
        .force("charge", d3.forceManyBody().strength(-1))
        .on("tick", ticked);

    function ticked() {
        flowers.attr("transform", function(d){
            return "translate(" + d.x + "," + d.y + ")";    
        })
    }
    
}

function handleScroll(){
    scroller    
        .setup({
            step: '.bloomstep',
            offset: 0.5,
            debug: false
        })
        .onStepEnter(function(d){
            const step = d.index;
            console.log("[handleScroll] step:", step);
            current_year = step + start_year;
            console.log(step, start_year, current_year);
            if(current_year != previous_year){
                drawFlowers();
                previous_year = current_year;
            }
        })
}