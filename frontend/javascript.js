// =========================
// SIMPLE SCROLL ANIMATION
// =========================

window.addEventListener("scroll",()=>{

    let navbar = document.querySelector(".navbar");

    if(window.scrollY > 50){

        navbar.style.background = "#020b2d";

    }
    else{

        navbar.style.background = "#03113d";

    }

});

// =========================
// BUTTON CLICK EFFECT
// =========================

const buttons = document.querySelectorAll("button");

buttons.forEach(button=>{

    button.addEventListener("mouseenter",()=>{

        button.style.transform = "scale(1.05)";

    });

    button.addEventListener("mouseleave",()=>{

        button.style.transform = "scale(1)";

    });

});

// =========================
// SMOOTH SCROLL
// =========================

document.querySelectorAll('a[href^="#"]').forEach(anchor=>{

    anchor.addEventListener('click', function (e){

        e.preventDefault();

        document.querySelector(this.getAttribute('href'))
        .scrollIntoView({
            behavior:'smooth'
        });

    });

});