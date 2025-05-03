document.addEventListener("DOMContentLoaded", function() {
    const firstPage = d3.select("#first-page");
    const secondPage = d3.select("#cards-scroll-container");
    
    // Set initial positions explicitly
    firstPage.style("transform", "translateX(0%)");
    secondPage.style("transform", "translateX(100%)"); // Start off-screen to the right
    
    // Add CSS transitions
    firstPage.style("transition", "transform 0.7s ease-out");
    secondPage.style("transition", "transform 0.7s ease-out");
    
    var transition = false;
    var page_height = firstPage.node().getBoundingClientRect().height;
    
    window.addEventListener("scroll", function() {
        const scrollY = window.scrollY;
        if(transition){
            if(scrollY < page_height){
                transition = false;
            }
            return;
        }
        
        if (scrollY > page_height/3) {
            firstPage.style("transform", "translateX(-100%)");
            secondPage.style("transform", "translateX(-100%)");
            transition = true;
            // Wait for transition to complete then clean up
            setTimeout(function() {
                console.log("Transition complete, cleaning up");
                firstPage.style("display", "none");
            }, 500);
        }
        else if (scrollY < page_height/3) {
            firstPage.style("transform", "translateX(0%)");
            secondPage.style("transform", "translateX(100%)");
            // Wait for transition to complete then clean up
            setTimeout(function() {
                console.log("Transition complete, cleaning up");
                firstPage.style("display", "block");
            }, 500);
        }
    });
});