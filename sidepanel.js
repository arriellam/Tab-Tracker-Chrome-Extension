// // function to get all open tabs and dynamically generate html so that
// // they display as a list)

document.addEventListener('DOMContentLoaded', function() {
    // Get reference to the search input element
    const searchInput = document.getElementById('searchSessions');

    // Function to filter tabs based on search input
    function filterTabs(searchText) {
        const tabs = document.querySelectorAll('.session');
        tabs.forEach(tab => {
            const tabTitle = tab.querySelector('.session-name').textContent.toLowerCase();
            const tabUrl = tab.querySelector('.tab-url').textContent.toLowerCase();
            if (tabTitle.includes(searchText) || tabUrl.includes(searchText)) {
                tab.style.display = ''; // Show tab if it matches search text
            } else {
                tab.style.display = 'none'; // Hide tab if it doesn't match search text
            }
        });
    }

    // Event listener for input event on the search input
    searchInput.addEventListener('input', function() {
        const searchText = searchInput.value.toLowerCase();
        filterTabs(searchText);
    });
    
    function updateTabList() {
        chrome.tabs.query({}, function(tabs) {
            const listElement = document.getElementById('tabsList');
            listElement.innerHTML = ''; // Clear existing list items

            // Group tabs by windowId
            const windows = tabs.reduce((acc, tab) => {
                acc[tab.windowId] = acc[tab.windowId] || [];
                acc[tab.windowId].push(tab);
                return acc;
            }, {});

            // Counter for window numbering
            let windowCount = 1;

            // Create UI elements for each window and its tabs
            Object.keys(windows).forEach(windowId => {
                const windowDiv = document.createElement('div');
                windowDiv.className = 'window-group';
                const windowTitle = document.createElement('h2');
                windowTitle.textContent = `Window ${windowCount++}`; // Sequential numbering instead of windowId
                windowDiv.appendChild(windowTitle);

                windows[windowId].forEach(tab => {
                    const li = document.createElement('li');
                    li.className = 'session';
                    li.style.backgroundColor = tab.active ? 'lightgreen' : 'lightred';

                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'session-info';

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'tab-select';
                    infoDiv.appendChild(checkbox);

                    const span = document.createElement('span');
                    span.className = 'session-name';
                    span.textContent = tab.title || 'No Title';
                    infoDiv.appendChild(span);

                    const idSpan = document.createElement('span');
                    idSpan.className = 'tab-id';
                    idSpan.textContent = tab.id;
                    idSpan.style.display = 'none';
                    infoDiv.appendChild(idSpan);

                    const aLink = document.createElement('a');
                    aLink.className = 'tab-url';
                    aLink.href = '#';
                    const maxLength = 30;
                    let displayUrl = tab.url.length > maxLength ? tab.url.substring(0, maxLength) + '...' : tab.url;
                    aLink.textContent = displayUrl;
                    aLink.addEventListener('click', function(event) {
                        event.preventDefault();
                        chrome.tabs.update(tab.id, {active: true});
                    });
                    infoDiv.appendChild(aLink);

                    li.appendChild(infoDiv);

                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'session-actions';
                    li.appendChild(actionsDiv);

                    windowDiv.appendChild(li);
                });

                listElement.appendChild(windowDiv);
            });
        });
    }

    updateTabList();
    chrome.tabs.onCreated.addListener(updateTabList);
    chrome.tabs.onRemoved.addListener(updateTabList);

    document.getElementById('selectAllInactive').addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.session:not(:first-child) .tab-select');
        checkboxes.forEach(checkbox => checkbox.checked = true);
    });

    document.getElementById('deleteSelected').addEventListener('click', function() {
        const selectedTabs = document.querySelectorAll('.session .tab-select:checked');
        selectedTabs.forEach(function(box) {
            const sessionElement = box.closest('.session');
            const tabID = sessionElement.querySelector('.tab-id').textContent;
            sessionElement.parentNode.removeChild(sessionElement);
            chrome.tabs.remove(parseInt(tabID));
        });
    });
});
