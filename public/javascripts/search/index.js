const searchInput = document.getElementById("search");

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && ["/"].includes(e.key)) {
    searchInput?.focus();
  }
});