document.addEventListener('DOMContentLoaded', function() {
    // Add loaded class to body after a small delay to ensure everything is ready
    // This triggers all animations
    setTimeout(function() {
        document.body.classList.add('loaded');
    }, 100);
});
