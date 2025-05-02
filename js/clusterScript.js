const scroller = scrollama();

(() => {
    d3.csv("dataset/all_billionaires_1997_2024.csv", d => {
        d.year = +d.year;
        d.net_worth_clean = +d.net_worth.replace(" B", "");
        return d;
    }).then(data => {
        const yearly_top5_dict = {};
    
        data.forEach(d => {
            if (!yearly_top5_dict[d.year]) {
                yearly_top5_dict[d.year] = [];
            }
            yearly_top5_dict[d.year].push({ name: d.full_name, net_worth: d.net_worth_clean });
        });
    
        Object.keys(yearly_top5_dict).forEach(year => {
            yearly_top5_dict[year] = yearly_top5_dict[year]
                .sort((a, b) => b.net_worth - a.net_worth)
                .slice(0, 5);
        });
        
        const steps = 2024 - 1997;
        for(var i=0; i<=steps; i++){
            const step = document.createElement("div");
            step.className = "clusterstep";
            step.dataset.step = `step${i}`;
            // step.textContent = `Step ${i}`;
            document.getElementById("cluster-steps-container").appendChild(step);
        }
        console.log("[step_injector] steps injected");

        initializeClusterChart(yearly_top5_dict);
    });
    
    function initializeClusterChart(yearly_top5_dict) {
        let currentYear = 1997;
        let preYear = 1997;
        let playing = false;
        let timer = null;
    
        const svg = d3.select("#dynamicClusterChart");
        const width = svg.style("width").replace("px", "");
        const height = svg.style("height").replace("px", "");

        console.log(svg, width, height)

        const tooltip = d3.select("#clusterTooltip");

        const rankColors = d3.scaleOrdinal()
            .domain([1, 2, 3, 4, 5])
            .range(["#FFD700", "#FF69B4", "#CD7F32", "#4CAF50", "#7B68EE"]);  
            

        function generateNodes(top5) {
            let nodes = [];
            top5.forEach((d, index) => {
                let count = Math.max(3, Math.floor(d.net_worth / 5));  
                for (let i = 0; i < count; i++) {
                    nodes.push({ 
                        id: `${d.name}-${i}`, 
                        group: d.name, 
                        radius: 10, 
                        rank: index + 1,
                        // x: width * ((index + 1) / 6),
                        // y: height/2
                    });
                }
            });
            return nodes;
        }
    
        function updateClusterChart(year) {
            console.log("Calling updateClusterChart with year:", year);
            const top5 = yearly_top5_dict[year];
       
            if (!top5) return;

            const nodesData = generateNodes(top5);
        
            svg.selectAll("*").remove();
            
            svg.append("text")
            .attr("class", "year-label")
            .attr("x", width - 100)  
            .attr("y", 60)
            .attr("text-anchor", "end")
            .style("font-size", "35px")
            .style("font-weight", "bold")
            .style("fill", "#555555")
            .style("opacity", 0.9)
            .text(year);

        
            const nodes = svg.selectAll("circle")
                .data(nodesData)
                .enter()
                .append("circle")
                .attr("r", d => d.radius)
                .attr("fill", d => rankColors(d.rank))
                .on("mouseover", (event, d) => showTooltip(event, d.group, top5))
                .on("mousemove", (event) => moveTooltip(event))
                .on("mouseout", hideTooltip);
            
            const labels = svg.selectAll(".billionaire-label")
                .data(top5)
                .enter()
                .append("text")
                .attr("class", "billionaire-label")
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .style("font-weight", "bold")
                .style("font-family", "'Segoe UI', Arial, sans-serif")
                .style("fill", "#333")
                .text(d => d.name)
                .on("mouseover", (event, d) => showTooltip(event, d.name, top5))
                .on("mousemove", (event) => moveTooltip(event))
                .on("mouseout", hideTooltip);

            const simulation = d3.forceSimulation(nodesData)
                .force("charge", d3.forceManyBody().strength(5))
                .force("center", d3.forceCenter(width / 2, height / 2))
                .force("collision", d3.forceCollide().radius(d => d.radius + 2))
                .force("x", d3.forceX().strength(0.1).x(d => {
                    const positions = {};
                    top5.forEach((d, idx) => {
                        positions[d.name] = width * ((idx + 1) / 6);
                    });
                    return positions[d.group];
                }))
                .force("y", d3.forceY(height / 2).strength(0.1))
                .alpha(1)
                .alphaDecay(0.01)
                .alphaTarget(0.3)
                .restart();
        
            simulation.on("tick", () => {
                nodes
                    .attr("cx", d => {
                        return d.x})
                    .attr("cy", d => d.y);

                labels
                    .attr("x", d => {
                        const groupNodes = nodesData.filter(n => n.group === d.name);
                        return d3.mean(groupNodes, n => n.x);
                    })
                    .attr("y", d => {
                        const groupNodes = nodesData.filter(n => n.group === d.name);
                        return d3.min(groupNodes, n => n.y) - 10;
                    });
            });

            
            const rankLegend = svg.append("g")
                .attr("class", "rank-legend")
                .attr("transform", `translate(${width - 180}, ${height - 140})`);

            rankLegend.append("text")
                .attr("x", 0)
                .attr("y", -10)
                .style("font-size", "13px")
                .style("font-weight", "bold")
                .text("Rankings");



            const ranks = [
                { rank: 1, color: "#FFD700", label: "1st Richest" },
                { rank: 2, color: "#FF69B4", label: "2nd Richest" },
                { rank: 3, color: "#CD7F32", label: "3rd Richest" },
                { rank: 4, color: "#4CAF50", label: "4th Richest" },
                { rank: 5, color: "#7B68EE", label: "5th Richest" }
            ];

            ranks.forEach((d, i) => {
                const row = rankLegend.append("g")
                    .attr("transform", `translate(0, ${i * 20})`);

                row.append("rect")
                    .attr("x", 0)
                    .attr("y", 4)
                    .attr("width", 9)
                    .attr("height", 9)
                    .attr("fill", d.color);
                

                row.append("text")
                    .attr("x", 20)
                    .attr("y", 12)
                    .style("font-size", "12px")
                    .text(d.label);
            });

            
            const wealthLegend = svg.append("g")
                .attr("class", "wealth-legend")
                .attr("transform", `translate(30, ${height - 120})`);

            wealthLegend.append("text")
                .attr("x", 0)
                .attr("y", -18)
                .style("font-size", "13px")
                .style("font-weight", "bold")
                .text("Net Wealth (approx. ranges)");


            const wealthRanges = [
                { label: "$10B - $20B", circles: 3 },
                { label: "$20B - $30B", circles: 5 },
                { label: "$30B+",      circles: 7 }
            ];

            wealthRanges.forEach((range, i) => {
                const legendRow = wealthLegend.append("g")
                    .attr("transform", `translate(0, ${i * 25})`);

                for (let j = 0; j < range.circles; j++) {
                    legendRow.append("circle")
                        .attr("r", 4)
                        .attr("cx", 10 + j * 12)
                        .attr("cy", 0)
                        .attr("fill", "#666");
                }

                legendRow.append("text")
                    .attr("x", 10 + range.circles * 12 + 10)
                    .attr("y", 5)
                    .style("font-size", "12px")
                    .text(`≈ ${range.label}`);
            });
        }

        function showTooltip(event, name, top5) {
            const billionaire = top5.find(b => b.name === name);
            tooltip.style("display", "block")
                .html(`<strong>${billionaire.name}</strong><br/>Wealth: $${billionaire.net_worth} B`);
        }

        function moveTooltip(event) {
            tooltip.style("left", (event.clientX + 15) + "px")
                .style("top", (event.clientY - 20) + "px");
        }

        function hideTooltip() {
            tooltip.style("display", "none");
        }
        
        function handleScroll(){
            scroller    
                .setup({
                    step: '.clusterstep',
                    offset: 0.5,
                    debug: false
                })
                .onStepEnter(function(d){
                    const step = d.index;
                    currentYear = 1997 + step;
                    if(currentYear == preYear){
                        return;
                    }
                    preYear = currentYear;
                    updateClusterChart(currentYear);
                })
        }
        updateClusterChart(currentYear);
        handleScroll();
    }
})();
