
const svg = d3.select("#sankey_svg"), 
width = svg.style("width").replace("px", ""), 
height = svg.style("height").replace("px", "");
const tooltip = d3.select("#sankey_tooltip");
let useNetWorth = false;

d3.csv("dataset/Synthetic_Inheritance_Billionaire_Dataset.csv").then(function(data) {
    data.forEach(d => d.Net_Worth_Billions = +d.Net_Worth_Billions);

    const color = d3.scaleOrdinal(d3.schemeTableau10);
    let selections = [];

    function buildChart() {
    svg.selectAll("*").remove();

    let links = [];
    data.forEach(d => {
        if (selections.length === 0 || selections[0] === d.Wealth_Type) {
        links.push({ source: d.Wealth_Type, target: d.Country, value: useNetWorth ? d.Net_Worth_Billions : 1, name: d.Name });
        if (selections.length <= 1 || selections[1] === d.Country) {
            links.push({ source: d.Country, target: d.Source_of_Wealth, value: useNetWorth ? d.Net_Worth_Billions : 1, name: d.Name });
            if (selections.length <= 2 || selections[2] === d.Source_of_Wealth) {
            links.push({ source: d.Source_of_Wealth, target: d.Philanthropy_Level, value: useNetWorth ? d.Net_Worth_Billions : 1, name: d.Name });
            }
        }
        }
    });

    let rolledLinks = d3.rollup(links, v => ({ total: d3.sum(v, d => d.value), names: v.map(d => d.name).slice(0, 3) }), d => `${d.source}|${d.target}`);
    let graph = { nodes: [], links: [] };
    let nodesSet = new Set();

    rolledLinks.forEach((obj, key) => {
        const [source, target] = key.split("|");
        nodesSet.add(source);
        nodesSet.add(target);
        graph.links.push({ source, target, value: obj.total, names: obj.names });
    });

    graph.nodes = Array.from(nodesSet).map(name => ({ name }));
    const nameToNode = new Map(graph.nodes.map(d => [d.name, d]));
    graph.links.forEach(l => { l.source = nameToNode.get(l.source); l.target = nameToNode.get(l.target); });

    const sankey = d3.sankey().nodeWidth(24).nodePadding(30).extent([[10, 10], [width - 10, height - 10]]);
    sankey(graph);

    const link = svg.append("g").attr("fill", "none").attr("stroke-opacity", 0.4)
        .selectAll("path")
        .data(graph.links)
        .join("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", d => color(d.source.name))
        .attr("stroke-width", d => Math.max(1, d.width))
        .on("mouseover", (event, d) => {
        tooltip.style("opacity", 1)
            .html(`<strong>From:</strong> ${d.source.name}<br><strong>To:</strong> ${d.target.name}<br><strong>Value:</strong> ${d.value.toFixed(2)}<br><strong>Example Names:</strong> ${d.names.join(", ")}`)
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 30) + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0));

    const node = svg.append("g")
        .selectAll("rect")
        .data(graph.nodes)
        .join("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", d => color(d.name))
        .attr("rx", 6).attr("ry", 6)
        .on("click", (event, d) => {
        if (selections.length === 0 && data.some(x => x.Wealth_Type === d.name)) selections.push(d.name);
        else if (selections.length === 1 && data.some(x => x.Country === d.name)) selections.push(d.name);
        else if (selections.length === 2 && data.some(x => x.Source_of_Wealth === d.name)) selections.push(d.name);
        buildChart();
        });

    svg.append("g")
        .style("font", "12px sans-serif")
        .selectAll("text")
        .data(graph.nodes)
        .join("text")
        .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
        .text(d => d.name);
    }

    function initialView() {
    selections = [];
    buildChart();
    }

    initialView();

    document.getElementById("toggle-btn").addEventListener("click", () => {
    useNetWorth = !useNetWorth;
    document.getElementById("toggle-btn").textContent = useNetWorth ? "Switch to Count Mode" : "Switch to Net Worth Mode";
    buildChart();
    });

    document.getElementById("reset-btn").addEventListener("click", initialView);
});