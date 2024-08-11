document.getElementById("appointmentForm").addEventListener("submit", function(event) {
    event.preventDefault();
    document.getElementById("successModal").style.display = "block";
});

document.getElementById("okButton").addEventListener("click", function() {
    document.getElementById("successModal").style.display = "none";
    document.getElementById("appointmentForm").reset(); // Reset form fields
});
