
const chart = d3.select("#chart");
const overlay = d3.select("#overlay");
const popup = d3.select("#popup");

// Random sampling function
function getRandomSample(arr, sampleSize) {
  const shuffled = arr.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, sampleSize);
}

d3.csv("dataset/Synthetic_Education_Dataset.csv").then(data => {
  // Normalize column names
  data.forEach(d => {
    d.Name = d["Name"];
    d.Industry = d["Industry"];
    d.Education_Status = d["Education_Status (Educated, Dropout, Self-Taught)"];
    d.University = d["University_Name"];
    d.Graduation_Year = d["Graduation_Year"];
  });

  function updateChart(industry) {
    const filtered = getRandomSample(
      data.filter(d => d.Industry === industry && (d.Education_Status === "Educated" || d.Education_Status === "Dropout")),
      50
    );

    const glyphs = chart.selectAll(".glyph")
      .data(filtered, d => d.Name);

    glyphs.exit().remove();

    const enter = glyphs.enter()
      .append("div")
      .attr("class", "glyph")
      .classed("graduate", d => d.Education_Status === "Educated")
      .classed("dropout", d => d.Education_Status === "Dropout")
      .text(d => d.Education_Status === "Educated" ? "🎓" : "🚪")
      .on("click", showPopup)
      .append("title")
      .text(d => d.Name);

    glyphs
      .attr("class", "glyph")
      .classed("graduate", d => d.Education_Status === "Educated")
      .classed("dropout", d => d.Education_Status === "Dropout")
      .text(d => d.Education_Status === "Educated" ? "🎓" : "🚪")
      .on("click", showPopup)
      .select("title")
      .text(d => d.Name);

    function showPopup(event, d) {
      d3.select("#popup-name").text(d.Name);
      d3.select("#popup-university").text(d.University || "Not Available");
      d3.select("#popup-year").text(d.Graduation_Year || "Not Available");
      d3.select("#popup-status").text(d.Education_Status);

      overlay.style("display", "block");
      popup.style("display", "block");
    }
  }

  d3.select("#industry").on("change", function () {
    updateChart(this.value);
  });

  overlay.on("click", () => {
    overlay.style("display", "none");
    popup.style("display", "none");
  });

  updateChart("Tech"); // Initial load
});
