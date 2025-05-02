document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.querySelector('.currency-wheel-wrapper');
    const strip   = document.querySelector('.arrow-strip');
    const wheel   = document.querySelector('.currency-wheel');
    const circles = document.querySelectorAll('.circle');
  
    let lastY     = window.pageYOffset;
    let stripX    = 0;
    let wheelX    = 0;
    let spinAngle = -10;
  
    const SLIDE_SPEED = 0.5;
    const SPIN_SPEED  = 0.3;
  
    strip.style.transform = `translateX(${stripX}px)`;
    wheel.style.transform = `translateX(${wheelX}px)`;
    window.addEventListener('scroll', () => {
      const y     = window.pageYOffset;
      const delta = y - lastY;
      lastY       = y;
  
      // compute vertical center of wrapper relative to viewport
      const rect       = wrapper.getBoundingClientRect();
      const elemCenter = rect.top + rect.height / 2;
      const viewCenter = window.innerHeight / 2+300;
  
      // only start moving once the viz center crosses the viewport center
      if (elemCenter <= viewCenter) {
        // 1) slide the green strip
        stripX += delta * SLIDE_SPEED;
        strip.style.transform = `translateX(${stripX}px)`;
  
        // 2) slide the whole wheel
        wheelX += delta * SLIDE_SPEED;
        wheel.style.transform = `translateX(${wheelX}px)`;
  
        // 3) spin each currency in place
        spinAngle += delta * SPIN_SPEED;
        circles.forEach(c => {
          c.style.transform = `rotate(${spinAngle}deg)`;
        });
  
        // 4) optional wrap-around for infinite scroll
        const half = wheel.scrollWidth / 2;
        if (wheelX >= half) { wheelX -= half; stripX -= half; }
        if (wheelX <= -half){ wheelX += half; stripX += half; }
      }
    });
  });
  