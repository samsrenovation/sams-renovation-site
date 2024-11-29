document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburger");
  const menuIcon = document.getElementById("menu-icon");
  const closeIcon = document.getElementById("close-icon");
  const navLinks = document.getElementById("nav-links");
  const heroServicesButton = document.querySelector(".hero-btn");
  const contactForm = document.getElementById("contact-form");

  hamburger.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("active");
    menuIcon.style.display = isOpen ? "none" : "block";
    closeIcon.style.display = isOpen ? "block" : "none";
  });

  navLinks.addEventListener("click", () => {
    navLinks.classList.remove("active");
    menuIcon.style.display = "block";
    closeIcon.style.display = "none";
  });

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const targetId = link.getAttribute("href").substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  if (heroServicesButton) {
    heroServicesButton.addEventListener("click", (event) => {
      event.preventDefault();
      const targetElement = document.getElementById("services");
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData(contactForm);
      const formDataObject = {
        name: formData.get("name"),
        email: formData.get("email"),
        message: formData.get("message"),
      };

      try {
        const response = await fetch("http://localhost:3001/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formDataObject),
        });

        const data = await response.json();

        if (response.ok) {
          alert("Contact form submitted successfully.");
          contactForm.reset();
        } else {
          const errorMessage = data.errors
            ? data.errors.map((error) => error.msg).join("\n")
            : data.error || "An error occurred.";
          alert(errorMessage);
        }
      } catch (error) {
        alert("Failed to submit the form. Please try again later.");
      }
    });
  }
});
