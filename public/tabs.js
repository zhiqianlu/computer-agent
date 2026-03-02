/**
 * Tab Navigation Script
 */

function switchTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });

  // Remove active class from all tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Show selected tab content
  const tabContent = document.getElementById(tabName + '-tab');
  if (tabContent) {
    tabContent.classList.add('active');
  }

  // Add active class to clicked button
  event.target.classList.add('active');
}
