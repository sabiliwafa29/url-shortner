// Basic UI behavior for tabs and small interactions
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(btn => btn.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    // In this static demo we don't change form behavior, but you could toggle views here
  }));

  // set current year
  const y = new Date().getFullYear();
  const el = document.getElementById('year'); if (el) el.textContent = y;
});
