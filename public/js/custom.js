$(document).ready(function(){
  $('.slick-slider').slick({
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false
  });
});

$(document).ready(function(){
  $('.slick-slider-carousel').slick({
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    prevArrow: '<button type="button" class="slick-prev custom-arrow"><i class="fa fa-chevron-left"></i></button>',
    nextArrow: '<button type="button" class="slick-next custom-arrow"><i class="fa fa-chevron-right"></i></button>'
  });
});

$(document).ready(function () {

    console.log("Custom Slider Loaded");

    $('.custom-slider').slick({

        slidesToShow: 4,
        slidesToScroll: 1,
        infinite: true,
        arrows: true,
        dots: true,

        prevArrow: $('.custom-prev'),
        nextArrow: $('.custom-next'),

        responsive: [
            { breakpoint: 1200, settings: { slidesToShow: 3 }},
            { breakpoint: 992, settings: { slidesToShow: 2 }},
            { breakpoint: 768, settings: { slidesToShow: 1 }}
        ]
    });

});




const propertyShows = document.querySelector('.grid-container');
const btnGrid = document.querySelector('.btn-grid');
const btnList = document.querySelector('.btn-list');

if(propertyShows){
  // Default Grid View
propertyShows.classList.add('grids');

// GRID BUTTON
btnGrid&&btnGrid.addEventListener('click', () => {
    propertyShows.classList.add('grids');      // Grid View Active
    propertyShows.classList.remove('list-view');
});

// LIST BUTTON
btnList&&btnList.addEventListener('click', () => {
    propertyShows.classList.remove('grids');   // Remove Grid
    propertyShows.classList.add('list-view');  // Enable List View
});
}




// //MultiStep Form
const nextBtns = document.querySelectorAll(".next-btn");
const prevBtns = document.querySelectorAll(".prev-btn");
const formSteps = document.querySelectorAll(".form-step");
const progressSteps = document.querySelectorAll(".progress-step");

let currentStep = 0;

nextBtns.forEach(btn => {
    btn&&btn.addEventListener("click", () => {
        if (validateCurrentStep()) {
            currentStep++;
            updateSteps();
            updateProgressbar();
        }
    });
});

prevBtns.forEach(btn => {
    btn&&btn.addEventListener("click", () => {
        currentStep--;
        updateSteps();
        updateProgressbar();
    });
});

function updateSteps() {
    formSteps.forEach(step => step.classList.remove("form-step-active"));
    formSteps[currentStep].classList.add("form-step-active");
}

// function updateProgressbar() {
//     progressSteps.forEach((step, i) => {
//         if (i <= currentStep) {
//             step.classList.add("progress-step-active");
//         } else {
//             step.classList.remove("progress-step-active");
//         }
//     });
// }

function updateProgressbar() {
    progressSteps.forEach((step, i) => {
        step.classList.toggle("progress-step-active", i <= currentStep);
    });
}

// VALIDATION FUNCTION
function validateCurrentStep() {
    let isValid = true;
    const currentFormStep = formSteps[currentStep];
    let firstInvalidInput = null;

    const inputs = currentFormStep.querySelectorAll(
        "input[required], select[required], textarea[required]"
    );

    inputs.forEach(input => {
        if (!input.checkValidity()) {
            isValid = false;
            input.classList.add("is-invalid");
            if (!firstInvalidInput) {
                firstInvalidInput = input;
            }
        } else {
            input.classList.remove("is-invalid");
        }
    });

    if (firstInvalidInput) {
        firstInvalidInput.reportValidity();
        firstInvalidInput.focus({ preventScroll: true });
    }

    return isValid;
}

//Checkbox multistop progress bar show hide
document&&document.addEventListener("DOMContentLoaded", function () {
  const checkbox = document.querySelector(".toggle-adults");
  const targetForm = document.querySelector(".adults18older");

  checkbox&&checkbox.addEventListener("change", function () {
    if (this.checked) {
      targetForm.classList.remove("d-none");
    } else {
      targetForm.classList.add("d-none");
    }
  });
});

document&&document.addEventListener("DOMContentLoaded", function () {
  const checkbox = document.querySelector(".toggle-adults2");
  const targetForm = document.querySelector(".adults18older2");

  checkbox&&checkbox.addEventListener("change", function () {
    if (this.checked) {
      targetForm.classList.remove("d-none");
    } else {
      targetForm.classList.add("d-none");
    }
  });
});

document&&document.addEventListener("DOMContentLoaded", function () {
  const checkbox = document.querySelector(".toggle-adults3");
  const targetForm = document.querySelector(".adults18older3");

  checkbox&&checkbox.addEventListener("change", function () {
    if (this.checked) {
      targetForm.classList.remove("d-none");
    } else {
      targetForm.classList.add("d-none");
    }
  });
});

document&&document.addEventListener("DOMContentLoaded", function () {
  const checkbox = document.querySelector(".toggle-adults4");
  const targetForm = document.querySelector(".adults18older4");

  checkbox&&checkbox.addEventListener("change", function () {
    if (this.checked) {
      targetForm.classList.remove("d-none");
    } else {
      targetForm.classList.add("d-none");
    }
  });
});

//select base input show in progressbar multistep form
document&&document.addEventListener("DOMContentLoaded", function () {
  const adultSelect = document.getElementById("adultCount");
  const container = document.getElementById("adultsContainer");

  adultSelect&&adultSelect.addEventListener("change", function () {
    const count = parseInt(this.value);
    const existingBlocks = container.querySelectorAll(".adult-block");

    // ADD blocks if needed
    for (let i = existingBlocks.length; i < count; i++) {
      const clone = existingBlocks[0].cloneNode(true);

      // clear values
      clone.querySelectorAll("input").forEach(input => {
        input.value = "";
      });

      container.appendChild(clone);
    }

    // REMOVE extra blocks
    for (let i = existingBlocks.length; i > count; i--) {
      container.removeChild(container.lastElementChild);
    }
  });
});

const petsSelect = document.getElementById("noOfPets");
  const petsContainer = document.getElementById("petsContainer");

  petsSelect && petsSelect.addEventListener("change", function () {
    const count = parseInt(this.value);
    const existingBlocks = petsContainer.querySelectorAll(".pets-block");

    // ADD blocks if needed
    for (let i = existingBlocks.length; i < count; i++) {
      const clone = existingBlocks[0].cloneNode(true);
      clone.querySelectorAll("input").forEach(input => input.value = "");
      petsContainer.appendChild(clone);
    }

    // REMOVE extra blocks
    for (let i = existingBlocks.length; i > count; i--) {
      petsContainer.removeChild(petsContainer.lastElementChild);
    }
  });


//Flatpicker

document&&document.addEventListener("DOMContentLoaded", function () {

    // Initialize Flatpickr
    const fp = flatpickr("#applyDate", {
        dateFormat: "m/d/Y",
        minDate: "today",   // Disable past dates
        allowInput: true
    });

    // Clear Button
    document.getElementById("clearDate").addEventListener("click", function() {
        fp.clear();
    });

});

// Date and Time script for booking form
const dateInput = document.getElementById("date");
    const timeWrapper = document.getElementById("time-wrapper");

    dateInput&&dateInput.addEventListener("change", function () {
        if (this.value) {
            timeWrapper.style.display = "block"; 
        } else {
            timeWrapper.style.display = "none";
        }
    });

   


    // ---- TIME SLOT SETTINGS ----
    const morningSlots   = ["09:00 AM - 9:30 AM", "09:30 AM - 10:00 AM", "10:00 AM - 10:30 AM", "10:30 AM - 11:00 AM", "11:00 AM - 11:30 AM", "11:30 AM - 12:00 AM"];
    const afternoonSlots = ["12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM"];
    const eveningSlots   = ["03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM"];

    // ---- DATE PICKER ----
    flatpickr("#date", {
        dateFormat: "Y-m-d",
        minDate: new Date().fp_incr(1), //yaha se next day ki date start ho jaye ge
        onChange: function () {
            document.getElementById("time-wrapper").style.display = "block";
            loadSlots();
        }
    });

    // ---- RENDER TIME SLOTS ----
    function loadSlots() {
        renderSlots("slots-morning", morningSlots);
        renderSlots("slots-afternoon", afternoonSlots);
        renderSlots("slots-evening", eveningSlots);
    }

    // ---- SLOT BUTTON RENDER FUNCTION ----
    function renderSlots(containerId, slots) {
        const container = document.getElementById(containerId);
        container.innerHTML = "";

        slots.forEach(slot => {
            let btn = document.createElement("button");
            btn.textContent = slot;

            btn.onclick = function () {
                // Remove old active
                document.querySelectorAll(".slots button").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");

                document.getElementById("time").value = slot;
            };

            container.appendChild(btn);
        });
    }


    // phone with country flag
    var input = document.querySelector("#phone");
var iti = window.intlTelInput(input, {
  utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@16.0.3/build/js/utils.js",
});

// store the instance variable so we can access it in the console e.g. window.iti.getNumber()
window.iti = iti;



//Bootstrap test form feedback
'use strict';
window&&window.addEventListener('load', function() {
  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  var forms = document.getElementsByClassName('needs-validation');
  // Loop over them and prevent submission
  var validation = Array.prototype.filter.call(forms, function(form) {
    form&&form.addEventListener('submit', function(event) {

      console.log(form.checkValidity());

      if (form.checkValidity() === false) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    }, false);
  });
}, false);
    
    // End Date and time scripts

    // booking form submit hai ye

    document&&document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('bookingForm');
  const steps = document.querySelectorAll('.step-content');
  const sidebarSteps = document.querySelectorAll('.step-sidebar .list-group-item');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const submitBtn = document.getElementById('submitBtn');

  let currentStep = 0;

  function showStep(index) {
    steps.forEach((step, i) => {
      step.classList.toggle('d-none', i !== index);
    });
    sidebarSteps.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });
    prevBtn.disabled = index === 0;
    // nextBtn.textContent = index === steps.length - 1 ? 'Next' : 'Next';
    // submitBtn.classList.toggle('d-none', index !== steps.length - 1);
    if (index === steps.length - 1) {
    nextBtn.classList.add('d-none');     // hide Next on last step
    submitBtn.classList.remove('d-none'); // show Submit
  } else {
    nextBtn.classList.remove('d-none');  // show Next
    submitBtn.classList.add('d-none');   // hide Submit
  }
  }

  nextBtn&&nextBtn.addEventListener('click', () => {
    const inputs = steps[currentStep].querySelectorAll('input, select');
    for (let input of inputs) {
      if (!input.checkValidity()) {
        input.reportValidity();
        return;
      }
    }
    if (currentStep < steps.length - 1) {
      currentStep++;
      showStep(currentStep);
    }
  });

  prevBtn&&prevBtn.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep--;
      showStep(currentStep);
    }
  });

  submitBtn&&submitBtn.addEventListener('click', (event) => {
    event.preventDefault();
    const allInputs = form.querySelectorAll('input, select');
    for (let input of allInputs) {
      if (!input.checkValidity()) {
        input.reportValidity();
        return;
      }
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    form.submit();
  });

  showStep(currentStep);
});






// document&&document.addEventListener('DOMContentLoaded', () => {
//   const form = document.getElementById('bookingForm');
//   const steps = document.querySelectorAll('.step-content');
//   const sidebarSteps = document.querySelectorAll('.step-sidebar .list-group-item');
//   const prevBtn = document.getElementById('prevBtn');
//   const nextBtn = document.getElementById('nextBtn');

//   let currentStep = 0;

//   function showStep(index) {
//     steps.forEach((step, i) => {
//       step.classList.toggle('d-none', i !== index);
//     });
//     sidebarSteps.forEach((item, i) => {
//       item.classList.toggle('active', i === index);
//     });
//     prevBtn.disabled = index === 0;
//     nextBtn.textContent = index === steps.length - 1 ? 'Submit' : 'Next';
//   }

//   nextBtn&&nextBtn.addEventListener('click', () => {
//     const inputs = steps[currentStep].querySelectorAll('input, select');
//     for (let input of inputs) {
//       if (!input.checkValidity()) {
//         input.reportValidity();
//         return;
//       }
//     }
//     if (currentStep < steps.length - 1) {
//       currentStep++;
//       showStep(currentStep);
//     } else {
//       // alert('Booking submitted successfully!');
//       form.reset();
//       currentStep = 0;
//       showStep(currentStep);
//     }
//   });

//   prevBtn&&prevBtn.addEventListener('click', () => {
//     if (currentStep > 0) {
//       currentStep--;
//       showStep(currentStep);
//     }
//   });

//   showStep(currentStep);
// });


//Sidebar booking panel input selected show
document && document.addEventListener("DOMContentLoaded", function() {
  const property = document.getElementById("property");
  const date = document.getElementById("date");
  const time = document.getElementById("time");
  const firstName = document.getElementById("fname");
  const lastName = document.getElementById("lname");
  const email = document.getElementById("email");
  const phone = document.getElementById("phone");

  const summaryProperty = document.getElementById("summary-property");
  const summaryDate = document.getElementById("summary-date");
  const summaryTime = document.getElementById("summary-time");
  const summaryName = document.getElementById("summary-name");
  const summaryEmail = document.getElementById("summary-email");
  const summaryPhone = document.getElementById("summary-phone");

  // Property live update
  property && property.addEventListener("change", function() {
      summaryProperty.textContent = property.value || "";
  });

  // Date live update
  date && date.addEventListener("change", function() {
      summaryDate.textContent = date.value || "";
  });

  // Time live update
  time && time.addEventListener("change", function() {
      summaryTime.textContent = time.value || "";
  });

  function updateSummaryName() {
      const combinedName = [firstName && firstName.value, lastName && lastName.value].filter(Boolean).join(" ");
      summaryName.textContent = combinedName;
  }

  firstName && firstName.addEventListener("input", updateSummaryName);
  lastName && lastName.addEventListener("input", updateSummaryName);
  email && email.addEventListener("input", function() {
      summaryEmail.textContent = email.value || "";
  });
  phone && phone.addEventListener("input", function() {
      summaryPhone.textContent = phone.value || "";
  });

  const form = document.getElementById("bookingForm");
  form && form.addEventListener("reset", function() {
      summaryProperty.textContent = "";
      summaryDate.textContent = "";
      summaryTime.textContent = "";
      summaryName.textContent = "";
      summaryEmail.textContent = "";
      summaryPhone.textContent = "";

      // --- Optionally hide time-wrapper if needed ---
      const timeWrapper = document.getElementById("time-wrapper");
      if(timeWrapper) timeWrapper.style.display = "none";

      // --- Reset step to first (if multi-step) ---
      let currentStep = 1;
      document.querySelectorAll(".step-content").forEach((el, idx) => {
          el.classList.toggle("d-none", idx !== 0);
      });

      // --- Reset back/next buttons ---
      const prevBtn = document.getElementById("prevBtn");
      const nextBtn = document.getElementById("nextBtn");
      if(prevBtn) prevBtn.disabled = true;
      if(nextBtn) nextBtn.textContent = "Next";
  });

  // Clear Step 3 summary when back button pressed
  const prevBtn = document.getElementById("prevBtn");
  prevBtn && prevBtn.addEventListener("click", function() {
      summaryName.textContent = "";
      summaryEmail.textContent = "";
      summaryPhone.textContent = "";
  });
});



//booking form validation
function validateStep2() {
    const date = document.getElementById("date");
    const time = document.getElementById("time"); // hidden input

    let valid = true;

    // Validate date
    if(!date.value) {
        date.classList.add("is-invalid");
        valid = false;
    } else {
        date.classList.remove("is-invalid");
    }

    // Validate time (hidden)
    if(!time.value) {
       // alert("Please select a time slot."); // ya custom error message
        valid = false;
    }

    return valid;
}




