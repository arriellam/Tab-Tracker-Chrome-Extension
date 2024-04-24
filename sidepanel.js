// function to get all open tabs and dynamically generate html so that
// they display as a list)
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

                const idSpan = document.createElement('span');
                idSpan.className = 'tab-id';
                idSpan.textContent = tab.id; // Set tab ID as its text content
                idSpan.style.display = 'none'; 
                infoDiv.appendChild(idSpan);
                
                const aLink = document.createElement('a');
                aLink.className = 'tab-url';

                // hyperlink
                aLink.href = '#'; // Placeholder, as the actual navigation is handled by script
                // aLink.textContent = tab.url; // Display the URL
                const maxLength = 30; // Maximum length of displayed URL
                let displayUrl = tab.url.length > maxLength ? tab.url.substring(0, maxLength) + '...' : tab.url;
                aLink.textContent = displayUrl; // Display the truncated URL
                aLink.addEventListener('click', function(event) {
                    event.preventDefault(); // Prevent default anchor click behavior
                    chrome.tabs.update(tab.id, {active: true}); // Focus the tab
                });
                
                infoDiv.appendChild(aLink);

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

    chrome.tabs.onCreated.addListener(updateTabList); // update when new tab is created
    chrome.tabs.onRemoved.addListener(updateTabList); // update when tab is closed
    

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
            const tabID = sessionElement.querySelector('.tab-id').textContent;
            sessionElement.parentNode.removeChild(sessionElement); // Remove from DOM
            // You would add Chrome tab removal logic here using chrome.tabs.remove
            chrome.tabs.remove(parseInt(tabID));
        });
    });
});
