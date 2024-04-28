// Opens the side panel when the extension icon is clicked
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));


// function to get all open tabs and dynamically generate html so that
// they display as a list)
document.addEventListener('DOMContentLoaded', function() {
    // Get reference to the search input element
    const searchInput = document.getElementById('searchSessions');
    // Store checkbox states for each tab
    const checkboxStates = {}; 
    // Store last active times for each tab
    const lastActiveTimes = {};
    
    

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
        // maintain checkbox states
        getCheck();
        const listElement = document.getElementById('tabsList');
        chrome.tabs.query({}, function(tabs) {
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
                   
                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'session-info';

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'tab-select';
                    checkbox.checked = checkboxStates[tab.id] || false;
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

                    // updated color based on time threshold
                    const minutesSinceLastAccess = calculateTimeDifference(tab);
                    if ((minutesSinceLastAccess < 1)) {
                        li.style.backgroundColor = 'lightgreen' 
                    } else {
                        li.style.backgroundColor = 'lightcoral';
                    }

                    li.appendChild(infoDiv);

                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'session-actions';
                    li.appendChild(actionsDiv);

                    windowDiv.appendChild(li);
                });

                listElement.appendChild(windowDiv);
            });
            filterTabs(searchInput.value.toLowerCase());
        });
    }
    
    // Function to calculate time difference between current time and last accessed time
    function calculateTimeDifference(tab) {
        const tabId = tab.id;
        const currentTime = new Date();
        if (tab.active) {
            lastActiveTimes[tabId] = currentTime;
        }
        // If no last active time recorded, use lassed accessed time
        const lastActiveTime = lastActiveTimes[tabId] || new Date(tab.lastAccessed);
        const timeDiff = currentTime.getTime() - lastActiveTime.getTime();
        return Math.floor(timeDiff / (1000 * 60));
    }

    function getCheck() {
        const listElement = document.getElementById('tabsList');
        // Loop through existing checkboxes to store their states
        listElement.querySelectorAll('.tab-select').forEach(function(checkbox) {
            const tabId = checkbox.closest('.session').querySelector('.tab-id').textContent;
            checkboxStates[tabId] = checkbox.checked;
        });
    }

    function continouslyUpdate() {
        updateTabList();
        setTimeout(continouslyUpdate, 1000);
    }
     
    continouslyUpdate();

    chrome.tabs.onActivated.addListener(function(activeInfo) {
        const tabId = activeInfo.tabId;
        lastActiveTimes[tabId] = new Date();
    });

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
