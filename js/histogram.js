/*
    Reference:
    Histogram: https://d3-graph-gallery.com/graph/histogram_basic.html
*/

const steps = 22;
var data, bins, x, y;

const scroller = scrollama();
const color = d3.scaleOrdinal(d3.schemePastel2);
var preStep = -1;

function step_injector(){
    for(var i=0; i<=steps; i++){
        const step = document.createElement("div");
        step.className = "histstep";
        step.dataset.step = `step${i}`;
        // step.textContent = `Step ${i}`;
        document.getElementById("histogram-steps-container").appendChild(step);
    }
    console.log("[step_injector] steps injected");
}

export function histogram(){
    console.log("[histogram]");
    step_injector();
    Promise.all([d3.csv('dataset/age_distribution.csv')])
        .then(function (values){
            console.log("[histogram] data loaded");
            data = values[0];
            // console.log(data);
            drawHistogram();
            handleScroll();
            console.log("[histogram] data drawn");
        });
}

function drawHistogram(){
    console.log("[drawHistogram]");
    
    const svg = d3.select("#histogram_svg");
    const width = svg.style("width").replace("px", "");
    const height = svg.style("height").replace("px", "");

    const margin = {top: 20, right: 30, bottom: 45, left: 55};
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;    

    x = d3.scaleLinear()
        .domain([15, 100])
        .range([0, innerWidth]);
    svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + (margin.top + innerHeight) + ")")
        .call(d3.axisBottom(x));

    const histogram = d3.histogram()
        .value(function(d) { return d.age; })
        .domain(x.domain())
        .thresholds(x.ticks(20));

    bins = histogram(data);
    // console.log(bins);

    y = d3.scaleLinear()
        .domain([0, 31 + d3.max(bins, function(d) { 
            return sumTotal(d);
         })])
        .range([innerHeight, 0]);
    svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", (height - margin.bottom + 35))
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .text("Age at which billionaires made their first billion");

    svg.append("text")  
        .attr("transform", "rotate(-90)")
        .attr("x", -(height / 2))
        .attr("y", margin.left - 35)
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .text("# of billionaires");

}

function updateHistogram(step){
    const svg = d3.select("#histogram_svg");
    const width = svg.style("width").replace("px", "");
    const height = svg.style("height").replace("px", "");

    const margin = {top: 20, right: 30, bottom: 45, left: 55};
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom; 

    var bars = 0;
    if(step < 17){
        bars = step;
    }
    else{
        bars = 17;
    }
    // console.log("[updateHistogram] step: " + step + ", bars: " + bars, bins.length);
    
    // 830 × 467
    const coinSize = 467 / 20;
    const coinWidth = 830 / 20;
    const pplPerCoin = 20;
    y = d3.scaleLinear()
        .domain([0, 31 + d3.max(bins, function(d) { 
            return sumTotal(d);
         })])
        .range([0, innerHeight]);
        

    var tmpBins = bins.slice(0, bars);
    var binGrps = svg.selectAll(".binGrp")
        .data(tmpBins)
        .join(
            function(enter){
                var g = enter.append("g")
                .attr("class", "binGrp")
                .attr("transform", function(d) {
                    return "translate(" + (margin.left + x(d.x0)) + "," + (margin.top) + ")"; 
                })
                g.each(function(d){
                    console.log(sumTotal(d), y(sumTotal(d)), y(sumTotal(d))/(coinSize-10))
                    var noOfCoins = Math.ceil((y(sumTotal(d))/(coinSize-10)));
                    // console.log(d, noOfCoins);
                    var coins = d3.select(this).selectAll(".coin")
                        .data(d3.range(noOfCoins), function(d, i){
                            // console.log("range", i, noOfCoins)
                            return i;
                        })
                        .enter().append("image")
                        .attr("class", "coin")
                        .attr("x", 0)
                        .attr("y", 0)
                        .attr("width", coinWidth)
                        .attr("height", coinSize)
                        .attr("href", "imgs/coin.png")
                        .attr("opacity", 0)
                        .transition()
                        .delay(function(d,i){
                            return 1000/noOfCoins * i;
                        })
                        .duration(1000/noOfCoins + 100)
                        .ease(d3.easeBounceOut)
                        .attr("opacity", 1)
                        .attr("y", function(i){
                            return (innerHeight - coinSize) - i * (coinSize-10);
                        })
                })
            },
            function(update){
                update.attr("opacity", function(d, i){
                    if(step == 19){
                        if(i == 8){
                            return 1;
                        }
                        return 0.5;
                    }
                    else if(step == 20){
                        if(i == 0){
                            return 1;
                        }
                        return 0.5;
                    }
                    else if(step == 21){
                        if(i == 16){
                            return 1;
                        }
                        return 0.5;
                    }
                    else{
                        return 1;
                    }
                })
            },
            function(exit){
                exit.each(function(d){
                    var b = d3.select(this);
                    var noOfCoins = Math.ceil((y(sumTotal(d))/(coinSize-10)));
                    var coins = b.selectAll(".coin")
                        .data(d3.range(noOfCoins), function(d, i){
                            // console.log("range", i, noOfCoins)
                            return i;
                        })
                        .transition()
                        .delay(function(d,i){
                            return 500/noOfCoins * (noOfCoins - i);
                        })
                        .duration(500/noOfCoins + 100)
                        .attr("opacity", 0)
                        .attr("y", 0)
                        .remove();
                    
                    b.transition().delay(500/noOfCoins + 100)
                        .remove();
                })
            },
        )
}

function sumTotal(d){
    var sum=0;
    d.forEach(function(e){
        sum += parseInt(e.count);
    });
    return sum;
}

function highlightHistogram(step){
    const svg = d3.select("#histogram_svg");
    const width = svg.style("width").replace("px", "");
    const height = svg.style("height").replace("px", "");

    const margin = {top: 20, right: 30, bottom: 45, left: 55};
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom; 

    // highlight the 3 marks
    if(step == 19){
        var highlight = d3.select("#middle-highlight")
        highlight.transition().duration(500)
            .style("opacity", 1)
        highlight = d3.select("#left-highlight")
        highlight.transition().duration(500)
            .style("opacity", 0)
        highlight = d3.select("#right-highlight")
        highlight.transition().duration(500)
            .style("opacity", 0)
    }
    else if(step == 20){
        var highlight = d3.select("#middle-highlight")
        highlight.transition().duration(500)
            .style("opacity", 0)
        highlight = d3.select("#left-highlight")
        highlight.transition().duration(500)
            .style("opacity", 1)
        highlight = d3.select("#right-highlight")
        highlight.transition().duration(500)
            .style("opacity", 0)
    }
    else if(step == 21){
        var highlight = d3.select("#middle-highlight")
        highlight.transition().duration(500)
            .style("opacity", 0)
        highlight = d3.select("#left-highlight")
        highlight.transition().duration(500)
            .style("opacity", 0)
        highlight = d3.select("#right-highlight")
        highlight.transition().duration(500)
            .style("opacity", 1)
    }
    else {
        var highlight = d3.select("#middle-highlight")
        highlight.transition().duration(500)
            .style("opacity", 0)
        highlight = d3.select("#left-highlight")
        highlight.transition().duration(500)
            .style("opacity", 0)
        highlight = d3.select("#right-highlight")
        highlight.transition().duration(500)
            .style("opacity", 0)
    }

}

function handleScroll(){
    console.log("[handleScroll]");
    scroller    
        .setup({
            step: '.histstep',
            offset: 0.5,
            debug: false
        })
        .onStepEnter(function(d){
            const step = d.index;
            updateHistogram(step);
            var highlight = d3.select("#middle-highlight")
            highlight.transition().duration(500)
                .style("opacity", 0)
            highlight = d3.select("#left-highlight")
            highlight.transition().duration(500)
                .style("opacity", 0)
            highlight = d3.select("#right-highlight")
            highlight.transition().duration(500)
                .style("opacity", 0)
            if(step>=19){
                highlightHistogram(step);
            }
        })
}