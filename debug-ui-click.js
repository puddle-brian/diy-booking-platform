// Quick debug script - paste this into browser console to check if button click is firing

// Add debugging to all buttons with ✓ text
document.querySelectorAll('button').forEach(button => {
  if (button.textContent === '✓') {
    console.log('Found green checkmark button:', button);
    
    // Add click listener to see if it fires
    button.addEventListener('click', function(e) {
      console.log('🎯 GREEN CHECKMARK CLICKED!', {
        button: this,
        event: e,
        disabled: this.disabled,
        className: this.className
      });
    }, true); // Use capture to see it first
    
    // Check if button is disabled
    console.log('Button disabled?', button.disabled);
    console.log('Button classes:', button.className);
  }
});

console.log('✅ Debug listeners added to all ✓ buttons'); 