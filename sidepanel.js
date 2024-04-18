// function to get all open tabs and dynamically generate html so that
// they display as a list
document.addEventListener('DOMContentLoaded', function() {
    function updateTabList() {
        chrome.tabs.query({}, function(tabs) {
            const listElement = document.getElementById('tabsList');
            listElement.innerHTML = ''; // Clear existing list items

            tabs.forEach(function(tab) {
                const li = document.createElement('li');
                li.className = 'session';
                li.style.backgroundColor = tab.active ? 'lightgreen' : 'lightred'; // Color coding active/inactive tabs

                const infoDiv = document.createElement('div');
                infoDiv.className = 'session-info';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'tab-select';
                infoDiv.appendChild(checkbox);

                const span = document.createElement('span');
                span.className = 'session-name';
                span.textContent = tab.title || 'No Title'; // Safe fallback for no title
                infoDiv.appendChild(span);

                li.appendChild(infoDiv);

                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'session-actions';
                // Additional actions can be added here

                li.appendChild(actionsDiv);

                listElement.appendChild(li);
            });
        });
    }

    updateTabList(); // Call this function on load to populate the list

    // Optional: Refresh the list periodically or on specific events
    document.getElementById('selectAllInactive').addEventListener('click', function() {
        // Example functionality for selecting all inactive tabs
        const checkboxes = document.querySelectorAll('.session:not(:first-child) .tab-select');
        checkboxes.forEach(checkbox => checkbox.checked = true);
    });

    document.getElementById('deleteSelected').addEventListener('click', function() {
        // Example functionality for deleting selected tabs
        const selectedTabs = document.querySelectorAll('.session .tab-select:checked');
        selectedTabs.forEach(function(box) {
            const sessionElement = box.closest('.session');
            sessionElement.parentNode.removeChild(sessionElement); // Remove from DOM
            // You would add Chrome tab removal logic here using chrome.tabs.remove
        });
    });
});
